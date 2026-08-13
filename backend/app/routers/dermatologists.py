from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, require
from ..models import Appointment, AvailabilitySlot, DermatologistProfile, User
from ..schemas import DermOut, DermProfileIn, SlotIn, SlotOut

router = APIRouter(prefix="/dermatologists", tags=["dermatologists"])


def _to_out(p: DermatologistProfile) -> DermOut:
    out = DermOut.model_validate(p)
    out.full_name = p.user.full_name if p.user else ""
    return out


@router.get("", response_model=list[DermOut])
def directory(
    q: str | None = None,
    location: str | None = None,
    specialization: str | None = None,
    language: str | None = None,
    max_fee: float | None = Query(default=None, ge=0),
    min_experience: int | None = Query(default=None, ge=0),
    _: User = Depends(require("dermatologists.read")),
    db: Session = Depends(get_db),
):
    stmt = select(DermatologistProfile).join(User).where(
        DermatologistProfile.is_approved.is_(True),
        DermatologistProfile.vacation_mode.is_(False),
        User.is_active.is_(True),
    )
    rows = db.scalars(stmt).all()

    def matches(p: DermatologistProfile) -> bool:
        if q and q.lower() not in f"{p.user.full_name} {p.specialization or ''} {p.clinic_name or ''}".lower():
            return False
        if location and location.lower() not in (p.location or "").lower():
            return False
        if specialization and specialization.lower() not in (p.specialization or "").lower():
            return False
        if language and language.lower() not in (p.languages or "").lower():
            return False
        if max_fee is not None and (p.consultation_fee or 0) > max_fee:
            return False
        if min_experience is not None and (p.experience_years or 0) < min_experience:
            return False
        return True

    return [_to_out(p) for p in rows if matches(p)]


@router.get("/{derm_user_id}", response_model=DermOut)
def detail(derm_user_id: int,
           _: User = Depends(require("dermatologists.read")),
           db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == derm_user_id))
    if not p or not p.is_approved:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dermatologist not found")
    return _to_out(p)


@router.get("/{derm_user_id}/slots")
def available_slots(derm_user_id: int,
                    on: date = Query(..., description="Date to check, YYYY-MM-DD"),
                    now: str | None = Query(
                        default=None,
                        description="Caller's current local time as YYYY-MM-DDTHH:MM. "
                                    "Used to hide slots that have already passed for them. "
                                    "Falls back to server time when omitted.",
                    ),
                    _: User = Depends(require("dermatologist_slots.read")),
                    db: Session = Depends(get_db)):
    """Concrete bookable time slots for one dermatologist on one date.

    Expands the doctor's recurring weekly availability into slot times, then
    removes anything already taken by a pending or confirmed appointment.
    """
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == derm_user_id))
    if not p or not p.is_approved:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dermatologist not found")
    if p.vacation_mode:
        return {"date": on.isoformat(), "slots": [], "reason": "Dermatologist is on vacation"}

    weekly = [s for s in p.slots if s.day_of_week == on.weekday()]
    taken = {
        a.appt_time.strftime("%H:%M")
        for a in db.scalars(select(Appointment).where(
            Appointment.dermatologist_id == derm_user_id,
            Appointment.appt_date == on,
            Appointment.status.in_(["pending", "confirmed"]),
        )).all()
    }

    # Decide "already passed" against the caller's own clock when they send it,
    # so a user in another timezone never sees a slot that is in their past
    # (nor loses a slot that is still valid for them).
    local_now: datetime | None = None
    if now:
        try:
            local_now = datetime.fromisoformat(now)
        except ValueError:
            local_now = None
    if local_now is None:
        local_now = datetime.now()

    # A booking must also start at least this far ahead — no "book it in 2 minutes".
    earliest = local_now + timedelta(minutes=30)

    slots: list[str] = []
    for s in weekly:
        cursor = datetime.combine(on, s.start_time)
        end = datetime.combine(on, s.end_time)
        while cursor + timedelta(minutes=s.slot_minutes) <= end:
            label = cursor.strftime("%H:%M")
            if label not in taken and cursor >= earliest:
                slots.append(label)
            cursor += timedelta(minutes=s.slot_minutes)
    return {"date": on.isoformat(), "slots": sorted(set(slots))}


# ----- Dermatologist self-service ------------------------------------------------
@router.get("/me/profile", response_model=DermOut)
def my_profile(user: User = Depends(require("derm_profile.update_own")),
               db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    if not p:
        p = DermatologistProfile(user_id=user.id)
        db.add(p)
        db.commit()
        db.refresh(p)
    return _to_out(p)


@router.put("/me/profile", response_model=DermOut)
def update_my_profile(body: DermProfileIn, request: Request,
                      user: User = Depends(require("derm_profile.update_own")),
                      db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    if not p:
        p = DermatologistProfile(user_id=user.id)
        db.add(p)
        db.flush()
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(p, key, value)
    audit(db, request, user, "derm_profile.update", "dermatologist_profile", p.id,
          new_value=body.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(p)
    return _to_out(p)


@router.get("/me/availability", response_model=list[SlotOut])
def my_availability(user: User = Depends(require("availability.manage")),
                    db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    return p.slots if p else []


@router.post("/me/availability", response_model=SlotOut, status_code=201)
def add_availability(body: SlotIn, request: Request,
                     user: User = Depends(require("availability.manage")),
                     db: Session = Depends(get_db)):
    if body.end_time <= body.start_time:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "End time must be after start time")
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    if not p:
        p = DermatologistProfile(user_id=user.id)
        db.add(p)
        db.flush()
    slot = AvailabilitySlot(dermatologist_id=p.id, **body.model_dump())
    db.add(slot)
    audit(db, request, user, "availability.add", "availability_slot", None, new_value=body.model_dump())
    db.commit()
    db.refresh(slot)
    return slot


@router.delete("/me/availability/{slot_id}", status_code=204)
def remove_availability(slot_id: int, request: Request,
                        user: User = Depends(require("availability.manage")),
                        db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    slot = db.get(AvailabilitySlot, slot_id)
    if not slot or not p or slot.dermatologist_id != p.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot not found")
    audit(db, request, user, "availability.remove", "availability_slot", slot_id)
    db.delete(slot)
    db.commit()


@router.post("/me/vacation-mode")
def toggle_vacation(request: Request,
                    user: User = Depends(require("availability.manage")),
                    db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user.id))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found")
    p.vacation_mode = not p.vacation_mode
    audit(db, request, user, "availability.vacation_mode", "dermatologist_profile", p.id,
          new_value={"vacation_mode": p.vacation_mode})
    db.commit()
    return {"vacation_mode": p.vacation_mode}
