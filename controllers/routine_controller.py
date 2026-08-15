"""Routine controller — Milestone 2, Steps 4 and 5.2 (+ Milestone 3 provider overwrite)."""

import uuid

from fastapi import HTTPException, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from schemas.routine import RoutineGenerateRequest, RoutineLogRequest, RoutineOverwriteRequest
from services import assessment_service, booking_service, mongo_service, notification_service, routine_service
from utils.constants import ROLE_CONSULTANT, ROLE_DERMATOLOGIST
from utils.decision_matrix import get_seasonal_tip


def generate_routine(db: Session, user: User, payload: RoutineGenerateRequest):
    """
    POST /api/v1/routine/generate

    Normally called automatically right after an assessment (see
    assessment_controller.evaluate_assessment). This endpoint exists so a
    routine can also be regenerated on demand — e.g. the user retakes the
    wizard — using either the payload overrides or the user's latest assessment.
    """
    skin_type = payload.skin_type
    primary_concern = payload.primary_concern
    is_highly_sensitive = payload.is_highly_sensitive
    assessment_id = None

    latest = assessment_service.get_latest_assessment(db, user.id)
    if latest is not None:
        assessment_id = latest.id
        skin_type = skin_type or latest.skin_type
        primary_concern = primary_concern or latest.primary_concern
        if is_highly_sensitive is None:
            is_highly_sensitive = latest.is_highly_sensitive

    if not skin_type or assessment_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your skin assessment before generating a routine.",
        )

    routine_service.generate_routine(
        db,
        user_id=user.id,
        assessment_id=assessment_id,
        skin_type=skin_type,
        is_highly_sensitive=bool(is_highly_sensitive),
    )
    return get_routine(db, user.id, mongo_db=None)


def get_routine(db: Session, user_id: uuid.UUID, mongo_db: Database | None):
    """
    GET /api/v1/routine

    Returns the active routine grouped into AM / PM / Weekly, each step
    annotated with whether it's already been checked off today (from
    MongoDB) and, if a provider overwrote it, who set it and any note —
    so the Daily Planner can show a "Set by Dr. X" badge.
    """
    steps = routine_service.get_active_routine(db, user_id)
    latest = assessment_service.get_latest_assessment(db, user_id)

    completed_ids: set[str] = set()
    if mongo_db is not None:
        today_log = mongo_service.get_log(mongo_db, user_id)
        if today_log:
            completed_ids = {
                str(entry["routine_step_id"]) for entry in today_log.get("completed_steps", [])
            }

    grouped = {"AM": [], "PM": [], "Weekly": []}
    for step in steps:
        grouped.setdefault(step.time_of_day, []).append(
            {
                "id": step.id,
                "step_number": step.step_number,
                "step_category": step.step_category,
                "time_of_day": step.time_of_day,
                "is_active": step.is_active,
                "completed_today": str(step.id) in completed_ids,
                "source": step.source,
                "set_by_name": step.set_by.full_name if step.set_by else None,
                "note": step.note,
            }
        )

    return {
        "assessment_id": latest.id if latest else None,
        "skin_type": latest.skin_type if latest else None,
        "seasonal_tip": get_seasonal_tip(latest.skin_type) if latest and latest.skin_type else None,
        "am": grouped["AM"],
        "pm": grouped["PM"],
        "weekly": grouped["Weekly"],
        "generated_at": steps[0].created_at if steps else None,
    }


def log_routine_step(db: Session, mongo_db: Database, user: User, payload: RoutineLogRequest):
    """
    POST /api/v1/routine/log

    Fired by the Daily Planner's checkbox onChange handler (Step 5.2.4).
    Writes straight to MongoDB's routine_logs collection.
    """
    owned_step_ids = {str(step.id) for step in routine_service.get_active_routine(db, user.id)}
    if payload.routine_step_id not in owned_step_ids:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine step not found")

    log = mongo_service.upsert_step_completion(
        mongo_db,
        user_id=user.id,
        routine_step_id=payload.routine_step_id,
        completed=payload.completed,
        log_date=payload.log_date,
    )
    return {
        "log_date": log["log_date"],
        "completed_steps": [entry["routine_step_id"] for entry in log.get("completed_steps", [])],
        "water_intake_ml": log.get("water_intake_ml"),
        "sleep_hours": log.get("sleep_hours"),
    }


def overwrite_routine_for_client(
    db: Session, provider: User, client_id: uuid.UUID, payload: RoutineOverwriteRequest
):
    """
    PUT /api/v1/routine/overwrite/{client_id}

    Milestone 3, Step 4: the "Prescription/Routine Overwrite Form." Either
    a consultant or a dermatologist can replace their own assigned
    client/patient's routine — ownership is checked against whichever
    relationship applies to the provider's role.
    """
    is_owner = False
    if provider.role.name == ROLE_CONSULTANT:
        is_owner = booking_service.is_client_assigned_to_consultant(db, provider.id, client_id)
    elif provider.role.name == ROLE_DERMATOLOGIST:
        is_owner = booking_service.has_patient_booked_with_dermatologist(db, provider.id, client_id)

    if not is_owner:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This client/patient isn't assigned to you.",
        )

    latest = assessment_service.get_latest_assessment(db, client_id)
    if latest is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="This client must complete a skin assessment before their routine can be edited.",
        )

    routine_service.overwrite_routine(
        db,
        user_id=client_id,
        assessment_id=latest.id,
        set_by_id=provider.id,
        steps=[s.model_dump() for s in payload.steps],
        note=payload.note,
    )

    notification_service.create_notification(
        db,
        client_id,
        "routine_updated",
        "Your routine was updated",
        f"{provider.full_name} updated your skincare routine."
        + (f' Note: "{payload.note}"' if payload.note else ""),
        link_to="/planner",
    )

    return get_routine(db, client_id, mongo_db=None)
