"""User-facing booking routes — Milestone 3."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from controllers import booking_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.booking import (
    AppointmentResponse,
    ConsultantAssignmentResponse,
    ConsultantBookingRequest,
    ProviderSummary,
)

router = APIRouter(prefix="/api/booking", tags=["Booking"])


def _assignment_to_response(a) -> ConsultantAssignmentResponse:
    resp = ConsultantAssignmentResponse.model_validate(a)
    resp.consultant_name = a.consultant.full_name if a.consultant else None
    resp.client_name = a.client.full_name if a.client else None
    return resp


def _appointment_to_response(a) -> AppointmentResponse:
    resp = AppointmentResponse.model_validate(a)
    resp.dermatologist_name = a.dermatologist.full_name if a.dermatologist else None
    resp.patient_name = a.patient.full_name if a.patient else None
    return resp


# --- Consultant booking (ongoing assignment, no schedule) ---


@router.get("/consultants", response_model=list[ProviderSummary])
def list_consultants(db: Session = Depends(get_db)):
    return booking_controller.list_consultants(db)


@router.post("/consultants", response_model=ConsultantAssignmentResponse, status_code=status.HTTP_201_CREATED)
def book_consultant(
    payload: ConsultantBookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = booking_controller.book_consultant(db, current_user, payload)
    return _assignment_to_response(assignment)


@router.get("/consultants/my", response_model=list[ConsultantAssignmentResponse])
def my_consultant_assignments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignments = booking_controller.get_my_consultant_assignments(db, current_user)
    return [_assignment_to_response(a) for a in assignments]


@router.delete("/consultants/{assignment_id}", response_model=ConsultantAssignmentResponse)
def cancel_consultant_assignment(
    assignment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assignment = booking_controller.cancel_my_assignment(db, current_user, assignment_id)
    return _assignment_to_response(assignment)


# --- Dermatologist "booking" — read-only for users now ---
# Users can no longer create an appointment themselves; only their
# Consultant can refer them (see POST /api/consultant/clients/{id}/refer-dermatologist).
# Users can still browse the dermatologist directory and see their own
# appointment history.


@router.get("/dermatologists", response_model=list[ProviderSummary])
def list_dermatologists(db: Session = Depends(get_db)):
    return booking_controller.list_dermatologists(db)


@router.get("/dermatologists/my", response_model=list[AppointmentResponse])
def my_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointments = booking_controller.get_my_appointments(db, current_user)
    return [_appointment_to_response(a) for a in appointments]
