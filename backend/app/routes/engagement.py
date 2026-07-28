# app/routes/engagement.py
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.core.security import get_current_user
from app.core.rbac import require_role
from app.models.user import User, UserRole
from app.models.engagement import (
    Appointment,
    UserConsultantLink,
    UserDermatologistLink,
    Consultation,
    ConsultationMessage,
    Notification,
)
from app.schemas.engagement import (
    AppointmentCreate,
    AppointmentStatusUpdate,
    AssignmentRequest,
    AssignmentStatusUpdate,
    ConsultationMessageCreate,
    ConsultationComplete,
)

router = APIRouter(tags=["engagement"])


def _notify(db: Session, user_id, title: str, message: str, ntype: str):
    db.add(Notification(user_id=user_id, title=title, message=message, type=ntype))


# ============================================================
# APPOINTMENTS
# ============================================================

@router.post("/appointments", status_code=status.HTTP_201_CREATED)
def book_appointment(
    payload: AppointmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.professional_type not in ("consultant", "dermatologist"):
        raise HTTPException(status_code=400, detail="professional_type must be consultant or dermatologist")

    appt = Appointment(
        user_id=current_user.id,
        professional_id=payload.professional_id,
        professional_type=payload.professional_type,
        scheduled_at=payload.scheduled_at,
        reason=payload.reason,
        status="pending",
    )
    db.add(appt)
    _notify(db, payload.professional_id, "New appointment request", f"{current_user.full_name} requested an appointment.", "appointment")
    db.commit()
    db.refresh(appt)
    return appt


@router.get("/appointments/mine")
def my_appointments(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Returns appointments where the current user is either the patient or the professional."""
    as_patient = db.query(Appointment).filter(Appointment.user_id == current_user.id).all()
    as_professional = db.query(Appointment).filter(Appointment.professional_id == current_user.id).all()
    return {"as_patient": as_patient, "as_professional": as_professional}


@router.patch("/appointments/{appointment_id}/status")
def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
    if str(appt.professional_id) != str(current_user.id) and str(appt.user_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your appointment.")

    appt.status = payload.status
    appt.updated_at = datetime.utcnow()
    _notify(db, appt.user_id, "Appointment update", f"Your appointment status is now '{payload.status}'.", "appointment")
    db.commit()
    db.refresh(appt)
    return appt


# ============================================================
# USER <-> CONSULTANT ASSIGNMENTS
# ============================================================

@router.post("/consultant/request", status_code=status.HTTP_201_CREATED)
def request_consultant(
    payload: AssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.USER)),
):
    existing = (
        db.query(UserConsultantLink)
        .filter(UserConsultantLink.user_id == current_user.id, UserConsultantLink.consultant_id == payload.professional_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already requested this consultant.")

    link = UserConsultantLink(user_id=current_user.id, consultant_id=payload.professional_id, status="pending")
    db.add(link)
    _notify(db, payload.professional_id, "New client request", f"{current_user.full_name} requested you as their consultant.", "assignment")
    db.commit()
    db.refresh(link)
    return link


@router.get("/consultant/my-clients")
def my_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONSULTANT)),
):
    links = db.query(UserConsultantLink).filter(UserConsultantLink.consultant_id == current_user.id).all()
    result = []
    for link in links:
        u = db.query(User).filter(User.id == link.user_id).first()
        result.append({
            "link_id": str(link.id),
            "user_id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "status": link.status,
            "assigned_at": link.assigned_at,
        })
    return result


@router.patch("/consultant/clients/{link_id}/status")
def update_client_link_status(
    link_id: str,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONSULTANT)),
):
    link = db.query(UserConsultantLink).filter(UserConsultantLink.id == link_id, UserConsultantLink.consultant_id == current_user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Client link not found.")
    link.status = payload.status
    _notify(db, link.user_id, "Consultant response", f"Your consultant request is now '{payload.status}'.", "assignment")
    db.commit()
    db.refresh(link)
    return link


# ============================================================
# USER <-> DERMATOLOGIST ASSIGNMENTS
# ============================================================

@router.post("/dermatologist/request", status_code=status.HTTP_201_CREATED)
def request_dermatologist(
    payload: AssignmentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.USER)),
):
    existing = (
        db.query(UserDermatologistLink)
        .filter(UserDermatologistLink.user_id == current_user.id, UserDermatologistLink.dermatologist_id == payload.professional_id)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already requested this dermatologist.")

    link = UserDermatologistLink(user_id=current_user.id, dermatologist_id=payload.professional_id, status="pending")
    db.add(link)
    _notify(db, payload.professional_id, "New patient request", f"{current_user.full_name} requested you as their dermatologist.", "assignment")
    db.commit()
    db.refresh(link)
    return link


@router.get("/dermatologist/my-patients")
def my_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DERMATOLOGIST)),
):
    links = db.query(UserDermatologistLink).filter(UserDermatologistLink.dermatologist_id == current_user.id).all()
    result = []
    for link in links:
        u = db.query(User).filter(User.id == link.user_id).first()
        result.append({
            "link_id": str(link.id),
            "user_id": str(u.id),
            "full_name": u.full_name,
            "email": u.email,
            "status": link.status,
            "assigned_at": link.assigned_at,
        })
    return result


@router.patch("/dermatologist/patients/{link_id}/status")
def update_patient_link_status(
    link_id: str,
    payload: AssignmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.DERMATOLOGIST)),
):
    link = db.query(UserDermatologistLink).filter(UserDermatologistLink.id == link_id, UserDermatologistLink.dermatologist_id == current_user.id).first()
    if not link:
        raise HTTPException(status_code=404, detail="Patient link not found.")
    link.status = payload.status
    _notify(db, link.user_id, "Dermatologist response", f"Your dermatologist request is now '{payload.status}'.", "assignment")
    db.commit()
    db.refresh(link)
    return link


# ============================================================
# CONSULTATIONS + MESSAGES
# ============================================================

@router.post("/consultations/start/{appointment_id}", status_code=status.HTTP_201_CREATED)
def start_consultation(
    appointment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found.")

    consultation = Consultation(
        appointment_id=appt.id,
        user_id=appt.user_id,
        professional_id=appt.professional_id,
        professional_type=appt.professional_type,
        status="ongoing",
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)
    return consultation


@router.post("/consultations/{consultation_id}/complete")
def complete_consultation(
    consultation_id: str,
    payload: ConsultationComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    consultation = db.query(Consultation).filter(Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found.")
    consultation.status = "completed"
    consultation.summary = payload.summary
    consultation.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(consultation)
    return consultation


@router.get("/consultations/mine")
def my_consultations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    as_patient = db.query(Consultation).filter(Consultation.user_id == current_user.id).all()
    as_professional = db.query(Consultation).filter(Consultation.professional_id == current_user.id).all()
    return {"as_patient": as_patient, "as_professional": as_professional}


@router.post("/consultations/{consultation_id}/messages", status_code=status.HTTP_201_CREATED)
def send_message(
    consultation_id: str,
    payload: ConsultationMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    msg = ConsultationMessage(consultation_id=consultation_id, sender_id=current_user.id, message=payload.message)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


@router.get("/consultations/{consultation_id}/messages")
def get_messages(consultation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(ConsultationMessage)
        .filter(ConsultationMessage.consultation_id == consultation_id)
        .order_by(ConsultationMessage.created_at.asc())
        .all()
    )


# ============================================================
# NOTIFICATIONS
# ============================================================

@router.get("/notifications/mine")
def my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Notification)
        .filter(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found.")
    n.is_read = True
    db.commit()
    return {"id": str(n.id), "is_read": True}