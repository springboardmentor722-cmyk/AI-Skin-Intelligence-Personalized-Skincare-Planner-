"""
Assessment controller — Milestone 2.

Ties together the pieces built in services/utils into the two endpoints
the spec calls for:

  POST /api/v1/assessment/evaluate  -> evaluate_assessment()
  GET  /api/v1/assessment/score     -> get_latest_score()
"""

from fastapi import HTTPException, status
from pymongo.database import Database
from sqlalchemy.orm import Session

from models.user import User
from schemas.assessment import AssessmentEvaluateRequest
from services import assessment_service, lifestyle_service, mongo_service, routine_service
from services.concern_analysis import identify_skin_concerns
from services.scoring_engine import (
    calculate_skin_health_score,
    compute_consistency_score,
    compute_hydration_score,
    compute_lifestyle_score,
    compute_skin_condition_score,
    compute_sleep_score,
)


def _score_and_persist(
    db: Session,
    mongo_db: Database,
    user: User,
    *,
    concerns: list[dict],
    primary_concern: str | None,
    skin_type: str | None,
    is_highly_sensitive: bool,
    sleep_hours: float | None,
    water_intake_ml: float | None,
    uv_exposure: str | None,
    sun_protection_used: bool,
    smoking: bool,
    alcohol: bool,
    screen_time_hours: float | None,
    exercise_minutes: float | None,
):
    """Shared math + persistence path used by both /evaluate and /score."""
    s_cond = compute_skin_condition_score(concerns)
    l_habits = compute_lifestyle_score(
        uv_exposure, sun_protection_used, smoking, alcohol, screen_time_hours, exercise_minutes
    )
    s_sleep = compute_sleep_score(sleep_hours)
    h_hydro = compute_hydration_score(water_intake_ml)

    expected_daily_steps = routine_service.count_active_daily_steps(db, user.id)
    completed_count, expected_count = mongo_service.compute_consistency_counts(
        mongo_db, user.id, expected_daily_steps
    )
    r_consist = compute_consistency_score(completed_count, expected_count)

    overall = calculate_skin_health_score(s_cond, l_habits, s_sleep, r_consist, h_hydro)

    assessment = assessment_service.create_assessment(
        db,
        user_id=user.id,
        overall_score=overall,
        detected_concerns=concerns,
        primary_concern=primary_concern,
        skin_type=skin_type,
        is_highly_sensitive=is_highly_sensitive,
        skin_condition_score=s_cond,
        lifestyle_score=l_habits,
        sleep_score=s_sleep,
        consistency_score=r_consist,
        hydration_score=h_hydro,
    )
    return assessment


def evaluate_assessment(db: Session, mongo_db: Database, user: User, payload: AssessmentEvaluateRequest):
    """
    POST /api/v1/assessment/evaluate

    Full flow from the Step 5.1 wizard: prioritize the submitted concerns,
    compute the weighted score, persist the snapshot, and immediately
    generate a fresh routine from the result (so the Daily Planner has
    something to show the moment the wizard finishes).
    """
    concerns, primary_concern = identify_skin_concerns(
        [c.model_dump() for c in payload.concerns]
    )

    assessment = _score_and_persist(
        db,
        mongo_db,
        user,
        concerns=concerns,
        primary_concern=primary_concern,
        skin_type=payload.skin_type,
        is_highly_sensitive=payload.is_highly_sensitive,
        sleep_hours=payload.sleep_hours,
        water_intake_ml=payload.water_intake_ml,
        uv_exposure=payload.uv_exposure,
        sun_protection_used=payload.sun_protection_used,
        smoking=payload.smoking,
        alcohol=payload.alcohol,
        screen_time_hours=payload.screen_time_hours,
        exercise_minutes=payload.exercise_minutes,
    )

    routine_service.generate_routine(
        db,
        user_id=user.id,
        assessment_id=assessment.id,
        skin_type=payload.skin_type,
        is_highly_sensitive=payload.is_highly_sensitive,
    )

    return assessment


def get_latest_score(db: Session, mongo_db: Database, user: User):
    """
    GET /api/v1/assessment/score

    Recomputes the score using: the concerns from the user's most recent
    evaluation (there's no form body on a GET request to supply new
    ones), their most recent Milestone-1 lifestyle log for sleep/hydration/
    habits, and up-to-the-minute routine consistency from MongoDB. This is
    what lets the score dashboard reflect newly checked-off routine steps
    without the user re-running the full wizard.
    """
    previous = assessment_service.get_latest_assessment(db, user.id)
    if previous is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your skin assessment first.",
        )

    latest_logs = lifestyle_service.list_lifestyle_logs(db, user.id)
    latest_log = latest_logs[0] if latest_logs else None

    sleep_hours = latest_log.sleep_hours if latest_log else None
    water_intake_ml = (
        latest_log.water_intake_liters * 1000 if latest_log and latest_log.water_intake_liters else None
    )
    smoking = latest_log.smoking if latest_log else False
    alcohol = latest_log.alcohol if latest_log else False
    screen_time_hours = latest_log.screen_time_hours if latest_log else None
    exercise_minutes = latest_log.exercise_minutes if latest_log else None

    assessment = _score_and_persist(
        db,
        mongo_db,
        user,
        concerns=previous.detected_concerns or [],
        primary_concern=previous.primary_concern,
        skin_type=previous.skin_type,
        is_highly_sensitive=previous.is_highly_sensitive,
        sleep_hours=sleep_hours,
        water_intake_ml=water_intake_ml,
        uv_exposure=None,  # not re-asked outside the wizard; neutral (no UV deduction)
        sun_protection_used=True,
        smoking=smoking,
        alcohol=alcohol,
        screen_time_hours=screen_time_hours,
        exercise_minutes=exercise_minutes,
    )
    return assessment


def get_assessment_history(db: Session, user: User):
    return assessment_service.get_assessment_history(db, user.id)
