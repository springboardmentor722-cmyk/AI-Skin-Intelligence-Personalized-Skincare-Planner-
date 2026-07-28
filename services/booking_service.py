"""Database logic for the two booking flows — Milestone 3."""

import uuid

from sqlalchemy.orm import Session

from models.booking import ConsultantAssignment, DermatologistAppointment
from models.role import Role
from models.user import User
from schemas.booking import AppointmentBookingRequest, ConsultantBookingRequest


def list_providers(db: Session, role_name: str) -> list[User]:
    """Active consultants or dermatologists a user can pick from."""
    return (
        db.query(User)
        .join(User.role)
        .filter(Role.name == role_name, User.is_active.is_(True), User.is_deleted.is_(False))
        .order_by(User.full_name)
        .all()
    )


# --- Consultant assignments ---


def get_active_assignment_for_client(db: Session, client_id: uuid.UUID) -> ConsultantAssignment | None:
    return (
        db.query(ConsultantAssignment)
        .filter(ConsultantAssignment.client_id == client_id, ConsultantAssignment.status == "Active")
        .first()
    )


def create_consultant_assignment(
    db: Session, client_id: uuid.UUID, payload: ConsultantBookingRequest
) -> ConsultantAssignment:
    assignment = ConsultantAssignment(
        consultant_id=payload.consultant_id,
        client_id=client_id,
        message=payload.message,
        status="Active",
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


def list_assignments_for_client(db: Session, client_id: uuid.UUID) -> list[ConsultantAssignment]:
    return (
        db.query(ConsultantAssignment)
        .filter(ConsultantAssignment.client_id == client_id)
        .order_by(ConsultantAssignment.created_at.desc())
        .all()
    )


def list_assignments_for_consultant(db: Session, consultant_id: uuid.UUID) -> list[ConsultantAssignment]:
    return (
        db.query(ConsultantAssignment)
        .filter(ConsultantAssignment.consultant_id == consultant_id)
        .order_by(ConsultantAssignment.created_at.desc())
        .all()
    )


def get_assignment(db: Session, assignment_id: uuid.UUID) -> ConsultantAssignment | None:
    return db.query(ConsultantAssignment).filter(ConsultantAssignment.id == assignment_id).first()


def is_client_assigned_to_consultant(db: Session, consultant_id: uuid.UUID, client_id: uuid.UUID) -> bool:
    return (
        db.query(ConsultantAssignment)
        .filter(
            ConsultantAssignment.consultant_id == consultant_id,
            ConsultantAssignment.client_id == client_id,
        )
        .first()
        is not None
    )


def update_assignment_status(db: Session, assignment: ConsultantAssignment, status: str) -> ConsultantAssignment:
    assignment.status = status
    db.commit()
    db.refresh(assignment)
    return assignment


# --- Dermatologist appointments ---


def create_appointment(
    db: Session, patient_id: uuid.UUID, payload: AppointmentBookingRequest
) -> DermatologistAppointment:
    appointment = DermatologistAppointment(
        dermatologist_id=payload.dermatologist_id,
        patient_id=patient_id,
        appointment_date=payload.appointment_date,
        appointment_time=payload.appointment_time,
        reason=payload.reason,
        status="Pending",
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)
    return appointment


def list_appointments_for_patient(db: Session, patient_id: uuid.UUID) -> list[DermatologistAppointment]:
    return (
        db.query(DermatologistAppointment)
        .filter(DermatologistAppointment.patient_id == patient_id)
        .order_by(DermatologistAppointment.appointment_date.desc())
        .all()
    )


def list_appointments_for_dermatologist(db: Session, dermatologist_id: uuid.UUID) -> list[DermatologistAppointment]:
    return (
        db.query(DermatologistAppointment)
        .filter(DermatologistAppointment.dermatologist_id == dermatologist_id)
        .order_by(DermatologistAppointment.appointment_date.desc())
        .all()
    )


def get_appointment(db: Session, appointment_id: uuid.UUID) -> DermatologistAppointment | None:
    return (
        db.query(DermatologistAppointment)
        .filter(DermatologistAppointment.id == appointment_id)
        .first()
    )


def has_patient_booked_with_dermatologist(db: Session, dermatologist_id: uuid.UUID, patient_id: uuid.UUID) -> bool:
    return (
        db.query(DermatologistAppointment)
        .filter(
            DermatologistAppointment.dermatologist_id == dermatologist_id,
            DermatologistAppointment.patient_id == patient_id,
        )
        .first()
        is not None
    )


def update_appointment_status(
    db: Session, appointment: DermatologistAppointment, status: str
) -> DermatologistAppointment:
    appointment.status = status
    db.commit()
    db.refresh(appointment)
    return appointment
