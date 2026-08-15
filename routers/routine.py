"""Personalized Skincare Routine routes — Milestone 2, Steps 4 and 5.2 (+ Milestone 3 overwrite)."""

import uuid

from fastapi import APIRouter, Depends
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import routine_controller
from core.database import get_db
from core.dependencies import get_current_user, require_role
from core.mongodb import get_mongo_db
from models.user import User
from schemas.routine import (
    RoutineGenerateRequest,
    RoutineLogRequest,
    RoutineLogResponse,
    RoutineOverwriteRequest,
    RoutineResponse,
)
from utils.constants import ROLE_CONSULTANT, ROLE_DERMATOLOGIST

router = APIRouter(prefix="/api/v1/routine", tags=["Skincare Routine"])


@router.post("/generate", response_model=RoutineResponse)
def generate(
    payload: RoutineGenerateRequest = RoutineGenerateRequest(),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Regenerate the active routine on demand (normally done automatically after an assessment)."""
    return routine_controller.generate_routine(db, current_user, payload)


@router.get("", response_model=RoutineResponse)
def get_routine(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Fetch the active routine grouped into AM / PM / Weekly for the Daily Planner dashboard."""
    return routine_controller.get_routine(db, current_user.id, mongo_db)


@router.post("/log", response_model=RoutineLogResponse)
def log_step(
    payload: RoutineLogRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Fired on every checklist checkbox toggle — writes to MongoDB's routine_logs collection."""
    return routine_controller.log_routine_step(db, mongo_db, current_user, payload)


@router.put(
    "/overwrite/{client_id}",
    response_model=RoutineResponse,
    dependencies=[Depends(require_role(ROLE_CONSULTANT, ROLE_DERMATOLOGIST))],
)
def overwrite_routine(
    client_id: uuid.UUID,
    payload: RoutineOverwriteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """The Prescription/Routine Overwrite Form — a consultant or dermatologist replaces a client's routine."""
    return routine_controller.overwrite_routine_for_client(db, current_user, client_id, payload)
