"""Skincare Consultant-only routes."""

import uuid

from fastapi import APIRouter, Depends
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import booking_controller, consultant_controller
from core.database import get_db
from core.dependencies import get_current_user, require_role
from core.mongodb import get_mongo_db
from models.user import User
from schemas.booking import AppointmentBookingRequest, AppointmentResponse, ClientSnapshot, ConsultantAssignmentResponse
from utils.constants import ROLE_CONSULTANT

router = APIRouter(
    prefix="/api/consultant",
    tags=["Skincare Consultant"],
    dependencies=[Depends(require_role(ROLE_CONSULTANT))],
)


@router.get("/dashboard")
def consultant_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return consultant_controller.get_dashboard_summary(db, current_user)


@router.get("/clients", response_model=list[ConsultantAssignmentResponse])
def assigned_clients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Every client ever assigned to this consultant, with their current status."""
    assignments = booking_controller.list_assigned_clients(db, current_user)
    results = []
    for a in assignments:
        resp = ConsultantAssignmentResponse.model_validate(a)
        resp.consultant_name = a.consultant.full_name if a.consultant else None
        resp.client_name = a.client.full_name if a.client else None
        results.append(resp)
    return results


@router.get("/clients/{client_id}", response_model=ClientSnapshot)
def client_profile(
    client_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Read-only snapshot of an assigned client: skin profile, concerns, activity log, photos, adherence."""
    return booking_controller.get_client_profile(db, current_user, client_id, mongo_db)


@router.post("/clients/{client_id}/refer-dermatologist", response_model=AppointmentResponse)
def refer_dermatologist(
    client_id: uuid.UUID,
    payload: AppointmentBookingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    The consultant is the bridge to a dermatologist: users can't book a
    dermatologist directly. A consultant refers one of their own assigned
    clients to a dermatologist here, which creates the same Pending ->
    Confirmed -> Completed appointment the dermatologist manages, just
    initiated on the client's behalf.
    """
    appointment = booking_controller.refer_client_to_dermatologist(db, current_user, client_id, payload)
    return AppointmentResponse(
        id=appointment.id,
        dermatologist_id=appointment.dermatologist_id,
        patient_id=appointment.patient_id,
        appointment_date=appointment.appointment_date,
        appointment_time=appointment.appointment_time,
        reason=appointment.reason,
        status=appointment.status,
        dermatologist_name=appointment.dermatologist.full_name if appointment.dermatologist else None,
        patient_name=appointment.patient.full_name if appointment.patient else None,
        created_at=appointment.created_at,
    )


@router.get("/recommendations")
def recommendations():
    """Kept for backward compatibility — see GET /api/products/recommendations/given instead."""
    return {"message": "Use /api/products/recommendations/given"}


@router.get("/analytics")
def analytics():
    return {"status": "Coming Soon"}
