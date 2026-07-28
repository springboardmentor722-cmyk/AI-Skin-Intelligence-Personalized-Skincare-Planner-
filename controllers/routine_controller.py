"""Routine controller — Milestone 2, Steps 4 and 5.2."""

from fastapi import HTTPException, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from schemas.routine import RoutineGenerateRequest, RoutineLogRequest
from services import assessment_service, mongo_service, routine_service
from utils.decision_matrix import get_seasonal_tip


def generate_routine(db: Session, user: User, payload: RoutineGenerateRequest):
    """
    POST /api/v1/routine/generate

    Normally called automatically right after an assessment (see
    assessment_controller.evaluate_assessment). This endpoint exists so a
    routine can also be regenerated on demand — e.g. the user retakes the
    wizard, or an admin/consultant tool wants to force a refresh — using
    either the payload overrides or the user's latest assessment.
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
    return get_routine(db, user, mongo_db=None)


def get_routine(db: Session, user: User, mongo_db: Database | None):
    """
    GET /api/v1/routine

    Returns the user's active routine grouped into AM / PM / Weekly, each
    step annotated with whether it's already been checked off today
    (from MongoDB), so the Daily Planner checkboxes render pre-filled.
    """
    steps = routine_service.get_active_routine(db, user.id)
    latest = assessment_service.get_latest_assessment(db, user.id)

    completed_ids: set[str] = set()
    if mongo_db is not None:
        today_log = mongo_service.get_log(mongo_db, user.id)
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
    Writes straight to MongoDB's routine_logs collection; PostgreSQL is
    untouched here since checklist completion is exactly the kind of
    high-write-frequency, loosely-structured data the spec assigns to
    MongoDB.
    """
    # Confirm the step actually belongs to this user before logging it,
    # so one user can't toggle another user's routine steps.
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
