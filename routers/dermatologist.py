"""Dermatologist-only routes."""

import uuid

from fastapi import APIRouter, Depends
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import booking_controller, dermatologist_controller
from core.database import get_db
from core.dependencies import get_current_user, require_role
from core.mongodb import get_mongo_db
from models.user import User
from schemas.booking import AppointmentResponse, AppointmentStatusUpdate, ClientSnapshot
from utils.constants import ROLE_DERMATOLOGIST

router = APIRouter(
    prefix="/api/dermatologist",
    tags=["Dermatologist"],
    dependencies=[Depends(require_role(ROLE_DERMATOLOGIST))],
)


def _appointment_to_response(a) -> AppointmentResponse:
    resp = AppointmentResponse.model_validate(a)
    resp.dermatologist_name = a.dermatologist.full_name if a.dermatologist else None
    resp.patient_name = a.patient.full_name if a.patient else None
    return resp


@router.get("/dashboard")
def dermatologist_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return dermatologist_controller.get_dashboard_summary(db, current_user)


@router.get("/patients", response_model=list[AppointmentResponse])
def patients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Every patient who has booked an appointment with this dermatologist."""
    appointments = booking_controller.list_dermatologist_patients(db, current_user)
    return [_appointment_to_response(a) for a in appointments]


@router.get("/patients/{patient_id}", response_model=ClientSnapshot)
def patient_record(
    patient_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Full patient history: skin profile + photo, detected concerns, daily logs, progress photos, adherence."""
    return booking_controller.get_patient_record(db, current_user, patient_id, mongo_db)


@router.put("/appointments/{appointment_id}/status", response_model=AppointmentResponse)
def update_appointment_status(
    appointment_id: uuid.UUID,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = booking_controller.update_appointment_status(db, current_user, appointment_id, payload)
    return _appointment_to_response(appointment)


@router.get("/reports")
def reports():
    return {"reports": [], "message": "Coming soon"}


@router.get("/ai-diagnosis")
def ai_diagnosis():
    return {"status": "Coming Soon"}
