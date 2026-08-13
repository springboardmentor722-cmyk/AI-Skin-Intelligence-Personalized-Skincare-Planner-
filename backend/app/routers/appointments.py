from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, notify, require
from ..models import Appointment, DermatologistProfile, Role, User
from ..schemas import AppointmentIn, AppointmentOut, AppointmentUpdateIn

router = APIRouter(prefix="/appointments", tags=["appointments"])


def _out(a: Appointment) -> AppointmentOut:
    o = AppointmentOut.model_validate(a)
    o.patient_name = a.patient.full_name if a.patient else ""
    o.dermatologist_name = a.dermatologist.full_name if a.dermatologist else ""
    return o


def _slot_is_free(db: Session, derm_id: int, d: date, t) -> bool:
    clash = db.scalar(select(Appointment).where(
        Appointment.dermatologist_id == derm_id,
        Appointment.appt_date == d,
        Appointment.appt_time == t,
        Appointment.status.in_(["pending", "confirmed"]),
    ))
    return clash is None


@router.post("", response_model=AppointmentOut, status_code=201)
def book(body: AppointmentIn, request: Request,
         user: User = Depends(require("appointments.create")),
         db: Session = Depends(get_db)):
    derm = db.get(User, body.dermatologist_user_id)
    profile = db.scalar(select(DermatologistProfile).where(
        DermatologistProfile.user_id == body.dermatologist_user_id))
    if not derm or derm.role != Role.DERMATOLOGIST or not profile or not profile.is_approved:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dermatologist not found")
    if body.appt_date < date.today():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Appointment date must be in the future")
    if not _slot_is_free(db, derm.id, body.appt_date, body.appt_time):
        raise HTTPException(status.HTTP_409_CONFLICT, "That time slot is no longer available")

    appt = Appointment(
        patient_id=user.id, dermatologist_id=derm.id,
        appt_date=body.appt_date, appt_time=body.appt_time,
        consultation_type=body.consultation_type, reason=body.reason,
    )
    db.add(appt)
    db.flush()
    notify(db, derm.id, "New appointment request",
           f"{user.full_name} requested {body.appt_date} at {body.appt_time.strftime('%H:%M')}", "appointment")
    audit(db, request, user, "appointment.book", "appointment", appt.id, new_value=body.model_dump())
    db.commit()
    db.refresh(appt)
    return _out(appt)


@router.get("/me", response_model=list[AppointmentOut])
def my_appointments(user: User = Depends(require("appointments.read_own")),
                    db: Session = Depends(get_db)):
    rows = db.scalars(select(Appointment).where(Appointment.patient_id == user.id)
                      .order_by(Appointment.appt_date.desc(), Appointment.appt_time.desc())).all()
    return [_out(a) for a in rows]


@router.get("/incoming", response_model=list[AppointmentOut])
def incoming(user: User = Depends(require("appointments.read_incoming")),
             db: Session = Depends(get_db)):
    rows = db.scalars(select(Appointment).where(Appointment.dermatologist_id == user.id)
                      .order_by(Appointment.appt_date.asc(), Appointment.appt_time.asc())).all()
    return [_out(a) for a in rows]


_PATIENT_ACTIONS = {"cancel", "reschedule"}
_DOCTOR_ACTIONS = {"accept", "reject", "complete", "add_notes", "cancel"}


@router.patch("/{appt_id}", response_model=AppointmentOut)
def update(appt_id: int, body: AppointmentUpdateIn, request: Request,
           user: User = Depends(require("profile.read_own")),  # fine-grained check below
           db: Session = Depends(get_db)):
    appt = db.get(Appointment, appt_id)
    if not appt:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Appointment not found")

    is_patient = appt.patient_id == user.id and user.role == Role.USER
    is_doctor = appt.dermatologist_id == user.id and user.role == Role.DERMATOLOGIST
    is_admin = user.role == Role.ADMIN
    if not (is_patient or is_doctor or is_admin):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You cannot modify this appointment")

    action = body.action
    if is_patient and action not in _PATIENT_ACTIONS:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Patients cannot perform '{action}'")
    if is_doctor and action not in _DOCTOR_ACTIONS:
        raise HTTPException(status.HTTP_403_FORBIDDEN, f"Dermatologists cannot perform '{action}'")

    old = {"status": appt.status, "date": str(appt.appt_date), "time": str(appt.appt_time)}

    if action == "cancel":
        if appt.status in ("completed", "cancelled", "rejected"):
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "This appointment can no longer be cancelled")
        appt.status = "cancelled"
        other = appt.dermatologist_id if is_patient else appt.patient_id
        notify(db, other, "Appointment cancelled",
               f"Appointment on {appt.appt_date} at {appt.appt_time.strftime('%H:%M')} was cancelled", "appointment")
    elif action == "reschedule":
        if not body.appt_date or not body.appt_time:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "New date and time are required to reschedule")
        if body.appt_date < date.today():
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "New date must be in the future")
        if not _slot_is_free(db, appt.dermatologist_id, body.appt_date, body.appt_time):
            raise HTTPException(status.HTTP_409_CONFLICT, "That time slot is no longer available")
        appt.appt_date, appt.appt_time = body.appt_date, body.appt_time
        appt.status = "pending"
        notify(db, appt.dermatologist_id, "Appointment rescheduled",
               f"{appt.patient.full_name} moved the appointment to {body.appt_date} {body.appt_time.strftime('%H:%M')}",
               "appointment")
    elif action == "accept":
        if appt.status != "pending":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending appointments can be accepted")
        appt.status = "confirmed"
        notify(db, appt.patient_id, "Appointment confirmed",
               f"Dr. {user.full_name} confirmed {appt.appt_date} at {appt.appt_time.strftime('%H:%M')}", "appointment")
    elif action == "reject":
        if appt.status != "pending":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only pending appointments can be rejected")
        appt.status = "rejected"
        notify(db, appt.patient_id, "Appointment declined",
               "Please pick another slot or another dermatologist.", "appointment")
    elif action == "complete":
        if appt.status != "confirmed":
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only confirmed appointments can be completed")
        appt.status = "completed"
        if body.doctor_notes:
            appt.doctor_notes = body.doctor_notes
        notify(db, appt.patient_id, "Consultation completed",
               "Your dermatologist added notes to your visit.", "appointment")
    elif action == "add_notes":
        appt.doctor_notes = body.doctor_notes or appt.doctor_notes
    else:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown action '{action}'")

    audit(db, request, user, f"appointment.{action}", "appointment", appt.id,
          old_value=old, new_value={"status": appt.status, "date": str(appt.appt_date), "time": str(appt.appt_time)})
    db.commit()
    db.refresh(appt)
    return _out(appt)
