# app/routes/appointments.py
"""
Full appointment management API:
  - GET  /appointments/availability/{professional_id}  – available slots for a given date
  - POST /appointments/book                            – create appointment, mark slot booked, notify both parties
  - GET  /appointments/my                              – user's own appointments (rich payload)
  - GET  /appointments/professional/incoming           – professional sees pending/upcoming requests
  - PATCH /appointments/{appointment_id}/status        – accept | reject | reschedule
"""
from __future__ import annotations

import uuid
from datetime import date, datetime, time, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.core.security import get_current_user
from app.models.user import User, UserRole
from app.models.engagement import Appointment, Notification
from app.models.availability import ProfessionalAvailability
from app.models.consultant_profile import ConsultantProfile
from app.models.dermatologist_profile import DermatologistProfile
router = APIRouter(prefix="/appointments", tags=["appointments"])

API_BASE = "http://localhost:8000"


# ── helpers ──────────────────────────────────────────────────────────────────

def _notify(db: Session, user_id, title: str, message: str, ntype: str = "appointment"):
    db.add(Notification(user_id=user_id, title=title, message=message, type=ntype))


def _profile_photo_url(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if path.startswith("http"):
        return path
    return f"{API_BASE}{path}"


def _fmt_time(t: time) -> str:
    """Format time object as 'HH:MM AM/PM'"""
    hour = t.hour
    minute = t.minute
    period = "AM" if hour < 12 else "PM"
    display_hour = hour % 12 or 12
    return f"{display_hour}:{minute:02d} {period}"


# ── slots seeding ─────────────────────────────────────────────────────────────

WORKING_SLOTS = [
    (time(9, 0), time(9, 30)),
    (time(9, 30), time(10, 0)),
    (time(10, 0), time(10, 30)),
    (time(10, 30), time(11, 0)),
    (time(11, 0), time(11, 30)),
    (time(11, 30), time(12, 0)),
    (time(14, 0), time(14, 30)),
    (time(14, 30), time(15, 0)),
    (time(15, 0), time(15, 30)),
    (time(15, 30), time(16, 0)),
    (time(16, 0), time(16, 30)),
    (time(16, 30), time(17, 0)),
]


def seed_slots_for_professional(db: Session, professional_id, professional_type: str):
    """
    Create availability slots for the next 14 days (Mon–Sat) for a professional
    if they don't already have any future slots.
    """
    today = date.today()
    # Check if slots already exist for the next 7 days
    existing = (
        db.query(ProfessionalAvailability)
        .filter(
            ProfessionalAvailability.professional_id == professional_id,
            ProfessionalAvailability.slot_date >= today,
        )
        .count()
    )
    if existing >= 10:
        return  # already seeded

    for day_offset in range(1, 15):  # next 14 days
        slot_date = today + timedelta(days=day_offset)
        if slot_date.weekday() == 6:  # skip Sundays
            continue
        for start_t, end_t in WORKING_SLOTS:
            already = (
                db.query(ProfessionalAvailability)
                .filter(
                    ProfessionalAvailability.professional_id == professional_id,
                    ProfessionalAvailability.slot_date == slot_date,
                    ProfessionalAvailability.start_time == start_t,
                )
                .first()
            )
            if not already:
                db.add(
                    ProfessionalAvailability(
                        professional_id=professional_id,
                        professional_type=professional_type,
                        slot_date=slot_date,
                        start_time=start_t,
                        end_time=end_t,
                        is_booked=False,
                    )
                )
    db.commit()


# ── schemas ───────────────────────────────────────────────────────────────────

class BookAppointmentRequest(BaseModel):
    professional_id: str
    professional_type: str  # "consultant" | "dermatologist"
    slot_date: str          # "YYYY-MM-DD"
    slot_start_time: str    # "HH:MM"   (24-hr)
    reason: str
    skin_concern: Optional[str] = None
    message: Optional[str] = None


class AppointmentStatusUpdate(BaseModel):
    status: str  # accepted | rejected | completed | cancelled


# ── routes ───────────────────────────────────────────────────────────────────

@router.get("/consultants")
def get_verified_consultants(db: Session = Depends(get_db)):
    """Return list of verified consultants from PostgreSQL."""
    users = db.query(User).filter(User.role == UserRole.CONSULTANT).all()
    results = []
    for u in users:
        cp = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == u.id).first()
        results.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": "consultant",
            "specialization": cp.specialization if cp else "Aesthetic Skincare Consultant",
            "qualification": cp.certification if cp else "Certified Skincare Specialist",
            "experience": cp.years_of_experience if cp else 5,
            "languages": ["English", "Hindi"],
            "clinic": "SkinAI Skincare Center",
            "rating": 4.9,
            "reviews": 128,
            "fee": "₹500",
            "profile_photo": _profile_photo_url(cp.certificate_url if cp else None),
            "is_verified": True,
            "has_availability": True
        })
    return results


@router.get("/dermatologists")
def get_verified_dermatologists(db: Session = Depends(get_db)):
    """Return list of verified dermatologists from PostgreSQL."""
    users = db.query(User).filter(User.role == UserRole.DERMATOLOGIST).all()
    results = []
    for u in users:
        dp = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == u.id).first()
        results.append({
            "id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "role": "dermatologist",
            "specialization": dp.specialization if dp else "Clinical Dermatology",
            "qualification": dp.medical_license_number if dp else "MD Dermatology",
            "experience": dp.years_of_experience if dp else 8,
            "languages": ["English", "Hindi"],
            "clinic": dp.hospital_or_clinic_name if (dp and dp.hospital_or_clinic_name) else "Apollo Skincare Clinic",
            "rating": 4.9,
            "reviews": 210,
            "fee": "₹1,000",
            "profile_photo": _profile_photo_url(dp.profile_photo_url if dp else None),
            "is_verified": True,
            "has_availability": True
        })
    return results


@router.get("/availability/{professional_id}")
def get_availability(
    professional_id: str,
    slot_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """
    Return all available (not booked) slots for a professional on a given date.
    If slot_date is omitted, return grouped slots for the next 14 days.
    """
    try:
        prof_uuid = uuid.UUID(professional_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid professional_id")

    # Determine professional type
    prof_user = db.query(User).filter(User.id == prof_uuid).first()
    if not prof_user:
        raise HTTPException(status_code=404, detail="Professional not found")

    ptype = (
        "consultant" if prof_user.role == UserRole.CONSULTANT
        else "dermatologist" if prof_user.role == UserRole.DERMATOLOGIST
        else None
    )
    if ptype is None:
        raise HTTPException(status_code=400, detail="User is not a professional")

    # Seed slots if needed
    seed_slots_for_professional(db, prof_uuid, ptype)

    today = date.today()

    if slot_date:
        try:
            target = date.fromisoformat(slot_date)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid slot_date format")

        slots = (
            db.query(ProfessionalAvailability)
            .filter(
                ProfessionalAvailability.professional_id == prof_uuid,
                ProfessionalAvailability.slot_date == target,
                ProfessionalAvailability.is_booked == False,
            )
            .order_by(ProfessionalAvailability.start_time)
            .all()
        )
        return {
            "date": slot_date,
            "slots": [
                {
                    "id": str(s.id),
                    "start_time": _fmt_time(s.start_time),
                    "end_time": _fmt_time(s.end_time),
                    "start_time_raw": s.start_time.strftime("%H:%M"),
                    "is_booked": s.is_booked,
                }
                for s in slots
            ],
        }

    # Return grouped by date for next 14 days
    end_date = today + timedelta(days=14)
    all_slots = (
        db.query(ProfessionalAvailability)
        .filter(
            ProfessionalAvailability.professional_id == prof_uuid,
            ProfessionalAvailability.slot_date > today,
            ProfessionalAvailability.slot_date <= end_date,
        )
        .order_by(
            ProfessionalAvailability.slot_date,
            ProfessionalAvailability.start_time,
        )
        .all()
    )

    grouped: dict = {}
    for s in all_slots:
        key = s.slot_date.isoformat()
        if key not in grouped:
            grouped[key] = {"date": key, "available_count": 0, "slots": []}
        grouped[key]["slots"].append(
            {
                "id": str(s.id),
                "start_time": _fmt_time(s.start_time),
                "end_time": _fmt_time(s.end_time),
                "start_time_raw": s.start_time.strftime("%H:%M"),
                "is_booked": s.is_booked,
            }
        )
        if not s.is_booked:
            grouped[key]["available_count"] += 1

    return {"professional_id": professional_id, "availability": list(grouped.values())}


@router.post("/book", status_code=status.HTTP_201_CREATED)
def book_appointment_wizard(
    payload: BookAppointmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Book an appointment by tying it to a specific availability slot.
    Marks the slot as booked and sends notifications to both parties.
    """
    if payload.professional_type not in ("consultant", "dermatologist"):
        raise HTTPException(
            status_code=400,
            detail="professional_type must be 'consultant' or 'dermatologist'",
        )

    try:
        prof_uuid = uuid.UUID(payload.professional_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid professional_id")

    # Parse date and time
    try:
        slot_date_obj = date.fromisoformat(payload.slot_date)
        h, m = map(int, payload.slot_start_time.split(":"))
        slot_time_obj = time(h, m)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid slot_date or slot_start_time")

    # Find the slot
    slot = (
        db.query(ProfessionalAvailability)
        .filter(
            ProfessionalAvailability.professional_id == prof_uuid,
            ProfessionalAvailability.slot_date == slot_date_obj,
            ProfessionalAvailability.start_time == slot_time_obj,
        )
        .first()
    )

    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found. Please choose another time.")
    if slot.is_booked:
        raise HTTPException(status_code=409, detail="This slot is already taken. Please choose another time.")

    # Combine date + time → datetime
    scheduled_dt = datetime.combine(slot_date_obj, slot_time_obj)

    # Build reason string
    full_reason = payload.reason
    if payload.skin_concern:
        full_reason = f"[{payload.skin_concern}] {full_reason}"
    if payload.message:
        full_reason += f" | Note: {payload.message}"

    # Create appointment
    appt = Appointment(
        user_id=current_user.id,
        professional_id=prof_uuid,
        professional_type=payload.professional_type,
        scheduled_at=scheduled_dt,
        reason=full_reason,
        status="pending",
    )
    db.add(appt)

    # Mark slot as booked
    slot.is_booked = True

    # Look up professional name
    prof_user = db.query(User).filter(User.id == prof_uuid).first()
    prof_name = prof_user.full_name if prof_user else "Your professional"

    # Notify user
    _notify(
        db,
        current_user.id,
        "Appointment request submitted",
        f"Your request to consult {prof_name} on {payload.slot_date} at {_fmt_time(slot_time_obj)} has been sent.",
    )

    # Notify professional
    _notify(
        db,
        prof_uuid,
        "New appointment request",
        f"{current_user.full_name} has requested a consultation on {payload.slot_date} at {_fmt_time(slot_time_obj)}.",
    )

    db.commit()
    db.refresh(appt)

    return {
        "appointment_id": str(appt.id),
        "professional_name": prof_name,
        "professional_type": payload.professional_type,
        "scheduled_at": scheduled_dt.isoformat(),
        "slot_date": payload.slot_date,
        "slot_time": _fmt_time(slot_time_obj),
        "reason": full_reason,
        "status": "pending",
    }


@router.get("/my")
def my_appointments_rich(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return user's appointments with enriched professional details."""
    appts = (
        db.query(Appointment)
        .filter(Appointment.user_id == current_user.id)
        .order_by(Appointment.scheduled_at.desc())
        .all()
    )

    result = []
    for a in appts:
        prof = db.query(User).filter(User.id == a.professional_id).first()
        photo = None
        specialization = None
        clinic = None
        if prof:
            if prof.role == UserRole.CONSULTANT:
                cp = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == prof.id).first()
                specialization = cp.specialization if cp else "Skincare Specialist"
                photo = _profile_photo_url(cp.certificate_url if cp else None)
            elif prof.role == UserRole.DERMATOLOGIST:
                dp = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == prof.id).first()
                specialization = dp.specialization if dp else "Dermatologist"
                clinic = dp.hospital_or_clinic_name if dp else None
                photo = _profile_photo_url(dp.profile_photo_url if dp else None)

        result.append(
            {
                "id": str(a.id),
                "professional_id": str(a.professional_id),
                "professional_name": prof.full_name if prof else "Expert",
                "professional_type": a.professional_type,
                "specialization": specialization,
                "clinic": clinic,
                "profile_photo": photo,
                "scheduled_at": a.scheduled_at.isoformat(),
                "reason": a.reason,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
            }
        )
    return result


@router.get("/professional/incoming")
def professional_incoming_appointments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Professional sees appointments where they are the provider."""
    if current_user.role not in (
        UserRole.CONSULTANT,
        UserRole.DERMATOLOGIST,
        UserRole.ADMIN,
    ):
        raise HTTPException(status_code=403, detail="Only professionals can access this endpoint.")

    appts = (
        db.query(Appointment)
        .filter(Appointment.professional_id == current_user.id)
        .order_by(Appointment.scheduled_at.asc())
        .all()
    )

    result = []
    for a in appts:
        patient = db.query(User).filter(User.id == a.user_id).first()
        result.append(
            {
                "id": str(a.id),
                "patient_id": str(a.user_id),
                "patient_name": patient.full_name if patient else "Patient",
                "patient_email": patient.email if patient else "",
                "professional_type": a.professional_type,
                "scheduled_at": a.scheduled_at.isoformat(),
                "reason": a.reason,
                "status": a.status,
                "created_at": a.created_at.isoformat(),
            }
        )
    return result


@router.patch("/{appointment_id}/status")
def update_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Professional or user updates appointment status."""
    valid_statuses = ("pending", "accepted", "rejected", "completed", "cancelled", "confirmed")
    if payload.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {', '.join(valid_statuses)}",
        )

    try:
        appt_uuid = uuid.UUID(appointment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid appointment_id")

    appt = db.query(Appointment).filter(Appointment.id == appt_uuid).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    # Authorisation: patient or professional may update
    is_patient = str(appt.user_id) == str(current_user.id)
    is_professional = str(appt.professional_id) == str(current_user.id)
    if not (is_patient or is_professional or current_user.role == UserRole.ADMIN):
        raise HTTPException(status_code=403, detail="Not authorised to update this appointment.")

    appt.status = payload.status
    appt.updated_at = datetime.utcnow()

    # If slot exists, free it when rejected/cancelled
    if payload.status in ("rejected", "cancelled"):
        slot = (
            db.query(ProfessionalAvailability)
            .filter(
                ProfessionalAvailability.professional_id == appt.professional_id,
                ProfessionalAvailability.slot_date == appt.scheduled_at.date(),
                ProfessionalAvailability.start_time == appt.scheduled_at.time(),
            )
            .first()
        )
        if slot:
            slot.is_booked = False

    # Notification to the other party
    if is_professional:
        _notify(
            db,
            appt.user_id,
            "Appointment update",
            f"Your appointment status has been updated to '{payload.status}'.",
        )
    elif is_patient:
        _notify(
            db,
            appt.professional_id,
            "Appointment update",
            f"The patient has updated appointment status to '{payload.status}'.",
        )

    db.commit()
    db.refresh(appt)
    return {"id": str(appt.id), "status": appt.status, "updated_at": appt.updated_at.isoformat()}
