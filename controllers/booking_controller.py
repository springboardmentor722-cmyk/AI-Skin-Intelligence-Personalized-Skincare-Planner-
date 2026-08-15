"""Booking controller — Milestone 3."""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.booking import APPOINTMENT_STATUSES
from models.user import User
from schemas.booking import AppointmentBookingRequest, AppointmentStatusUpdate, ConsultantBookingRequest
from services import booking_service, client_snapshot_service, notification_service
from utils.constants import ROLE_CONSULTANT, ROLE_DERMATOLOGIST


# --- Provider pickers (what the user sees when choosing who to book) ---


def list_consultants(db: Session):
    return booking_service.list_providers(db, ROLE_CONSULTANT)


def list_dermatologists(db: Session):
    return booking_service.list_providers(db, ROLE_DERMATOLOGIST)


# --- Consultant assignment (ongoing, no schedule) ---


def book_consultant(db: Session, user: User, payload: ConsultantBookingRequest):
    existing = booking_service.get_active_assignment_for_client(db, user.id)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have an active consultant. Cancel that relationship before booking a new one.",
        )
    assignment = booking_service.create_consultant_assignment(db, user.id, payload)

    notification_service.create_notification(
        db,
        payload.consultant_id,
        "referral",
        "New client assigned",
        f"{user.full_name} has booked you as their consultant.",
        link_to="/consultant/clients",
    )

    return assignment


def get_my_consultant_assignments(db: Session, user: User):
    return booking_service.list_assignments_for_client(db, user.id)


def cancel_my_assignment(db: Session, user: User, assignment_id):
    assignment = booking_service.get_assignment(db, assignment_id)
    if assignment is None or assignment.client_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")
    return booking_service.update_assignment_status(db, assignment, "Cancelled")


# --- Consultant's own view: assigned clients + client profile ---


def list_assigned_clients(db: Session, consultant: User):
    assignments = booking_service.list_assignments_for_consultant(db, consultant.id)
    return assignments


def get_client_profile(db: Session, consultant: User, client_id, mongo_db=None):
    if not booking_service.is_client_assigned_to_consultant(db, consultant.id, client_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This client isn't assigned to you.",
        )
    snapshot = client_snapshot_service.get_client_snapshot(db, client_id, mongo_db)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    snapshot["appointments"] = [
        {
            "id": a.id,
            "dermatologist_id": a.dermatologist_id,
            "patient_id": a.patient_id,
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
            "reason": a.reason,
            "status": a.status,
            "dermatologist_name": a.dermatologist.full_name if a.dermatologist else None,
            "patient_name": a.patient.full_name if a.patient else None,
            "created_at": a.created_at,
        }
        for a in booking_service.list_appointments_for_patient(db, client_id)
    ]
    return snapshot


# --- Dermatologist appointment (scheduled, status workflow) ---
# Users can no longer book a dermatologist directly — the Consultant is
# the bridge: only a consultant can refer their assigned client to a
# dermatologist. The user can still view (read-only) any appointments
# booked on their behalf.


def refer_client_to_dermatologist(db: Session, consultant: User, client_id, payload: AppointmentBookingRequest):
    if not booking_service.is_client_assigned_to_consultant(db, consultant.id, client_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This client isn't assigned to you.",
        )
    appointment = booking_service.create_appointment(db, client_id, payload)

    dermatologist_name = appointment.dermatologist.full_name if appointment.dermatologist else "a dermatologist"
    notification_service.create_notification(
        db,
        client_id,
        "referral",
        "Dermatologist appointment scheduled",
        f"Your consultant referred you to Dr. {dermatologist_name} on {appointment.appointment_date} at {appointment.appointment_time}.",
        link_to="/bookings",
    )

    return appointment


def get_my_appointments(db: Session, user: User):
    return booking_service.list_appointments_for_patient(db, user.id)


# --- Dermatologist's own view: patients + patient record ---


def list_dermatologist_patients(db: Session, dermatologist: User):
    return booking_service.list_appointments_for_dermatologist(db, dermatologist.id)


def get_patient_record(db: Session, dermatologist: User, patient_id, mongo_db=None):
    if not booking_service.has_patient_booked_with_dermatologist(db, dermatologist.id, patient_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This patient hasn't booked an appointment with you.",
        )
    snapshot = client_snapshot_service.get_client_snapshot(db, patient_id, mongo_db)
    if snapshot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found")

    snapshot["appointments"] = [
        {
            "id": a.id,
            "dermatologist_id": a.dermatologist_id,
            "patient_id": a.patient_id,
            "appointment_date": a.appointment_date,
            "appointment_time": a.appointment_time,
            "reason": a.reason,
            "status": a.status,
            "dermatologist_name": a.dermatologist.full_name if a.dermatologist else None,
            "patient_name": a.patient.full_name if a.patient else None,
            "created_at": a.created_at,
        }
        for a in booking_service.list_appointments_for_dermatologist(db, dermatologist.id)
        if a.patient_id == patient_id
    ]
    return snapshot


def update_appointment_status(db: Session, dermatologist: User, appointment_id, payload: AppointmentStatusUpdate):
    if payload.status not in APPOINTMENT_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status")

    appointment = booking_service.get_appointment(db, appointment_id)
    if appointment is None or appointment.dermatologist_id != dermatologist.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Appointment not found")

    updated = booking_service.update_appointment_status(db, appointment, payload.status)

    notification_service.create_notification(
        db,
        appointment.patient_id,
        "appointment_update",
        f"Appointment {payload.status.lower()}",
        f"Your appointment with Dr. {dermatologist.full_name} on {appointment.appointment_date} is now {payload.status}.",
        link_to="/bookings",
    )

    return updated
