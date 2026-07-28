# app/routes/assessment_engine.py
"""
Milestone 2 core routes. All protected by JWT (get_current_user).
Every value returned is computed live — nothing hardcoded.
"""
from datetime import datetime, timedelta, date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.mongo import mongo_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.assessment import SkinAssessment, SkincareRoutine
from app.models.skin_profile import SkinProfile, SkinType, Gender
from app.models.lifestyle_log import LifestyleLog, StressLevel
from app.schemas.assessment import (
    AssessmentEvaluateRequest,
    AssessmentEvaluateResponse,
    AssessmentSubmitRequest,
    AssessmentSubmitResponse,
    AssessmentReportResponse,
    RoutineGenerateRequest,
    RoutineGenerateResponse,
    RoutineStepOut,
    RoutineStepLogRequest,
)
from app.services.scoring_engine import (
    identify_skin_concerns,
    get_primary_concern,
    calculate_skin_health_score,
    score_consistency_from_logs,
    generate_routine_steps,
)
from app.services.safety_rules import apply_safety_rules

router = APIRouter(prefix="/api/v1", tags=["assessment-engine"])


# ============================================================
# HELPERS
# ============================================================

def _get_real_consistency_score(db: Session, user_id) -> float:
    """
    Pulls the last 7 days of routine_logs for this user from MongoDB and
    the user's currently active routine step count from PostgreSQL, then
    computes a real completion percentage.
    """
    active_steps_count = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == user_id, SkincareRoutine.is_active == True)  # noqa: E712
        .count()
    )

    seven_days_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    logs_cursor = mongo_db.routine_logs.find({
        "user_id": str(user_id),
        "log_date": {"$gte": seven_days_ago},
    })
    logs = list(logs_cursor)
    return score_consistency_from_logs(logs, active_steps_count)


def _save_lifestyle_log(db: Session, user_id, payload: AssessmentSubmitRequest) -> LifestyleLog:
    """Upsert today's lifestyle log from a submit payload."""
    today = date.today()
    existing = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == user_id, LifestyleLog.log_date == today)
        .first()
    )
    lifestyle_fields = {
        "sleep_hours": payload.sleep_hours,
        "water_intake_liters": payload.water_intake_liters,
        "exercise_minutes": payload.exercise_minutes,
        "environmental_exposure": payload.environmental_exposure,
        "smoking": payload.smoking,
        "alcohol": payload.alcohol,
        "screen_time_hours": payload.screen_time_hours,
        "sun_protection_used": payload.sun_protection_used,
        "uv_index": payload.uv_index,
        "pollution_exposure": payload.pollution_exposure,
    }
    if payload.stress_level:
        try:
            lifestyle_fields["stress_level"] = StressLevel(payload.stress_level)
        except ValueError:
            pass

    if existing:
        for field, value in lifestyle_fields.items():
            if value is not None:
                setattr(existing, field, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        lifestyle_fields["log_date"] = today
        log = LifestyleLog(user_id=user_id, **{k: v for k, v in lifestyle_fields.items() if v is not None})
        db.add(log)
        db.commit()
        db.refresh(log)
        return log


def _save_or_update_profile(db: Session, user_id, payload: AssessmentSubmitRequest) -> SkinProfile:
    """Upsert the user's skin profile from a submit payload."""
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        profile = SkinProfile(user_id=user_id)
        db.add(profile)

    if payload.age is not None:
        profile.age = payload.age
    if payload.gender:
        try:
            profile.gender = Gender(payload.gender)
        except ValueError:
            pass
    if payload.skin_type:
        try:
            profile.skin_type = SkinType(payload.skin_type)
        except ValueError:
            pass
    if payload.skin_concerns is not None:
        profile.skin_concerns = payload.skin_concerns
    if payload.allergies is not None:
        profile.allergies = payload.allergies
    if payload.sensitivities is not None:
        profile.sensitivities = payload.sensitivities

    db.commit()
    db.refresh(profile)
    return profile


# ============================================================
# POST /api/v1/assessment/submit — ALL-IN-ONE ATOMIC WORKFLOW
# ============================================================

@router.post("/assessment/submit", response_model=AssessmentSubmitResponse, status_code=status.HTTP_201_CREATED)
def submit_assessment(
    payload: AssessmentSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    All-in-one atomic assessment workflow:
    1. Save / update skin profile
    2. Save lifestyle log (upsert today)
    3. Run safety rule engine
    4. Score assessment
    5. Generate skincare routine
    6. Persist assessment record
    Returns full result including risk_level, health_category, suggestions, routine_generated flag.
    """
    # Step 1 — Save profile
    _save_or_update_profile(db, current_user.id, payload)

    # Step 2 — Save lifestyle log
    _save_lifestyle_log(db, current_user.id, payload)

    # Step 3 — Safety rules
    concern_severities = {}
    if payload.severity_scores:
        from app.services.scoring_engine import SLIDER_TO_SEVERITY
        for concern, slider_val in payload.severity_scores.items():
            concern_severities[concern] = SLIDER_TO_SEVERITY.get(min(10, max(0, slider_val)), "medium")

    safety = apply_safety_rules(
        skin_type=payload.skin_type,
        concerns=payload.skin_concerns,
        concern_severities=concern_severities,
        allergies=payload.allergies or [],
        sensitivities=payload.sensitivities or [],
        is_pregnant=payload.is_pregnant or False,
        broken_skin=payload.broken_skin or False,
    )

    # Step 4 — Score
    prioritized = identify_skin_concerns({
        "skin_concerns": payload.skin_concerns,
        "flare_ups": [],
        "severity_scores": payload.severity_scores or {},
    })
    primary_concern = get_primary_concern(prioritized)
    consistency_score = _get_real_consistency_score(db, current_user.id)

    result = calculate_skin_health_score(
        prioritized_concerns=prioritized,
        sleep_hours=payload.sleep_hours,
        water_intake_liters=payload.water_intake_liters,
        uv_index=payload.uv_index,
        sun_protection_used=payload.sun_protection_used,
        pollution_exposure=payload.pollution_exposure,
        consistency_score=consistency_score,
        smoking=payload.smoking,
        alcohol=payload.alcohol,
        screen_time_hours=payload.screen_time_hours,
    )

    # Step 5 — Persist assessment
    is_highly_sensitive = (
        (payload.skin_type or "").lower() == "sensitive"
        or "sensitive_skin" in [c.lower().replace(" ", "_") for c in payload.skin_concerns]
    )
    assessment = SkinAssessment(
        user_id=current_user.id,
        overall_score=result["overall_score"],
        score_breakdown={
            **result["breakdown"],
            "risk_level": result["risk_level"],
            "health_category": result["health_category"],
            "improvement_suggestions": result["improvement_suggestions"],
            "safety_warnings": safety["warnings"],
            "blocked_ingredients": safety["blocked_ingredients"],
        },
        detected_concerns=prioritized,
        primary_concern=primary_concern,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    # Step 6 — Generate routine (deactivate old, create new)
    db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == current_user.id,
        SkincareRoutine.is_active == True,  # noqa: E712
    ).update({"is_active": False})

    generated = generate_routine_steps(payload.skin_type, is_highly_sensitive, primary_concern)
    routine_rows = []
    for time_of_day, steps in generated.items():
        for step in steps:
            row = SkincareRoutine(
                user_id=current_user.id,
                assessment_id=assessment.id,
                time_of_day=time_of_day,
                step_number=step["step_number"],
                step_category=step["step_category"],
                is_active=True,
            )
            db.add(row)
            routine_rows.append(row)
    db.commit()

    return AssessmentSubmitResponse(
        assessment_id=str(assessment.id),
        overall_score=result["overall_score"],
        breakdown=result["breakdown"],
        detected_concerns=prioritized,
        primary_concern=primary_concern,
        risk_level=result["risk_level"],
        health_category=result["health_category"],
        improvement_suggestions=result["improvement_suggestions"],
        routine_generated=len(routine_rows) > 0,
        safety_warnings=safety["warnings"],
        blocked_ingredients=safety["blocked_ingredients"],
    )


# ============================================================
# POST /api/v1/assessment/evaluate (existing — kept for compatibility)
# ============================================================

@router.post("/assessment/evaluate", response_model=AssessmentEvaluateResponse, status_code=status.HTTP_201_CREATED)
def evaluate_assessment(
    payload: AssessmentEvaluateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prioritized = identify_skin_concerns({
        "skin_concerns": payload.skin_concerns,
        "flare_ups": payload.flare_ups,
        "severity_overrides": payload.severity_overrides,
        "severity_scores": payload.severity_scores or {},
    })
    primary_concern = get_primary_concern(prioritized)
    consistency_score = _get_real_consistency_score(db, current_user.id)

    result = calculate_skin_health_score(
        prioritized_concerns=prioritized,
        sleep_hours=payload.sleep_hours,
        water_intake_liters=payload.water_intake_liters,
        uv_index=payload.uv_index,
        sun_protection_used=payload.sun_protection_used,
        pollution_exposure=payload.pollution_exposure,
        consistency_score=consistency_score,
        smoking=payload.smoking,
        alcohol=payload.alcohol,
        screen_time_hours=payload.screen_time_hours,
    )

    assessment = SkinAssessment(
        user_id=current_user.id,
        overall_score=result["overall_score"],
        score_breakdown=result["breakdown"],
        detected_concerns=prioritized,
        primary_concern=primary_concern,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return AssessmentEvaluateResponse(
        assessment_id=str(assessment.id),
        overall_score=result["overall_score"],
        breakdown=result["breakdown"],
        detected_concerns=prioritized,
        primary_concern=primary_concern,
        risk_level=result.get("risk_level"),
        health_category=result.get("health_category"),
        improvement_suggestions=result.get("improvement_suggestions"),
    )


# ============================================================
# GET /api/v1/assessment/{assessment_id}
# ============================================================

@router.get("/assessment/{assessment_id}", response_model=AssessmentEvaluateResponse)
def get_assessment_by_id(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch a specific assessment record by UUID."""
    import uuid as uuid_mod
    try:
        uid = uuid_mod.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format.")

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.id == uid, SkinAssessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    breakdown = assessment.score_breakdown or {}
    return AssessmentEvaluateResponse(
        assessment_id=str(assessment.id),
        overall_score=float(assessment.overall_score),
        breakdown=breakdown,
        detected_concerns=assessment.detected_concerns or [],
        primary_concern=assessment.primary_concern,
        risk_level=breakdown.get("risk_level"),
        health_category=breakdown.get("health_category"),
        improvement_suggestions=breakdown.get("improvement_suggestions"),
    )


# ============================================================
# GET /api/v1/assessment/score (latest)
# ============================================================

@router.get("/assessment/score", response_model=AssessmentEvaluateResponse)
def get_latest_score(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Re-runs the scoring algorithm fresh using the user's real stored
    SkinProfile + most recent LifestyleLog, then persists a new historical
    snapshot before returning it.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="No skin profile found. Complete the Skin Assessment first.")

    latest_lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )

    prioritized = identify_skin_concerns({"skin_concerns": profile.skin_concerns or []})
    primary_concern = get_primary_concern(prioritized)
    consistency_score = _get_real_consistency_score(db, current_user.id)

    result = calculate_skin_health_score(
        prioritized_concerns=prioritized,
        sleep_hours=latest_lifestyle.sleep_hours if latest_lifestyle else None,
        water_intake_liters=latest_lifestyle.water_intake_liters if latest_lifestyle else None,
        uv_index=latest_lifestyle.uv_index if latest_lifestyle else None,
        sun_protection_used=latest_lifestyle.sun_protection_used if latest_lifestyle else None,
        pollution_exposure=latest_lifestyle.pollution_exposure if latest_lifestyle else None,
        consistency_score=consistency_score,
        smoking=latest_lifestyle.smoking if latest_lifestyle else None,
        alcohol=latest_lifestyle.alcohol if latest_lifestyle else None,
        screen_time_hours=latest_lifestyle.screen_time_hours if latest_lifestyle else None,
    )

    assessment = SkinAssessment(
        user_id=current_user.id,
        overall_score=result["overall_score"],
        score_breakdown={
            **result["breakdown"],
            "risk_level": result["risk_level"],
            "health_category": result["health_category"],
            "improvement_suggestions": result["improvement_suggestions"],
        },
        detected_concerns=prioritized,
        primary_concern=primary_concern,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)

    return AssessmentEvaluateResponse(
        assessment_id=str(assessment.id),
        overall_score=result["overall_score"],
        breakdown=result["breakdown"],
        detected_concerns=prioritized,
        primary_concern=primary_concern,
        risk_level=result.get("risk_level"),
        health_category=result.get("health_category"),
        improvement_suggestions=result.get("improvement_suggestions"),
    )


# ============================================================
# GET /api/v1/assessment/score/{assessment_id} — re-score specific assessment
# ============================================================

@router.get("/assessment/score/{assessment_id}")
def get_score_by_assessment_id(
    assessment_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Re-runs scoring for a specific historical assessment."""
    import uuid as uuid_mod
    try:
        uid = uuid_mod.UUID(assessment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid assessment ID format.")

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.id == uid, SkinAssessment.user_id == current_user.id)
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    # Re-run scoring from stored concerns
    prioritized = assessment.detected_concerns or []
    if not prioritized:
        prioritized = identify_skin_concerns({"skin_concerns": []})

    latest_lifestyle = (
        db.query(LifestyleLog)
        .filter(LifestyleLog.user_id == current_user.id)
        .order_by(LifestyleLog.created_at.desc())
        .first()
    )
    consistency_score = _get_real_consistency_score(db, current_user.id)

    result = calculate_skin_health_score(
        prioritized_concerns=prioritized,
        sleep_hours=latest_lifestyle.sleep_hours if latest_lifestyle else None,
        water_intake_liters=latest_lifestyle.water_intake_liters if latest_lifestyle else None,
        uv_index=latest_lifestyle.uv_index if latest_lifestyle else None,
        sun_protection_used=latest_lifestyle.sun_protection_used if latest_lifestyle else None,
        pollution_exposure=latest_lifestyle.pollution_exposure if latest_lifestyle else None,
        consistency_score=consistency_score,
    )

    return {
        "assessment_id": str(assessment.id),
        "created_at": assessment.created_at.isoformat(),
        "overall_score": result["overall_score"],
        "breakdown": result["breakdown"],
        "risk_level": result["risk_level"],
        "health_category": result["health_category"],
        "improvement_suggestions": result["improvement_suggestions"],
        "detected_concerns": prioritized,
        "primary_concern": assessment.primary_concern,
    }


# ============================================================
# GET /api/v1/assessment/history
# ============================================================

@router.get("/assessment/history")
def get_assessment_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Real historical snapshots for trend charts — last 7, oldest first."""
    rows = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(7)
        .all()
    )
    rows.reverse()
    return {
        "history": [
            {
                "date": r.created_at.strftime("%Y-%m-%d"),
                "overall_score": float(r.overall_score),
                "risk_level": (r.score_breakdown or {}).get("risk_level"),
                "health_category": (r.score_breakdown or {}).get("health_category"),
            }
            for r in rows
        ]
    }


# ============================================================
# POST /api/v1/routine/generate
# ============================================================

@router.post("/routine/generate", response_model=RoutineGenerateResponse, status_code=status.HTTP_201_CREATED)
def generate_routine(
    payload: RoutineGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    primary_concern = None
    is_highly_sensitive = payload.is_highly_sensitive

    if payload.assessment_id:
        import uuid as uuid_mod
        try:
            uid = uuid_mod.UUID(payload.assessment_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid assessment_id format.")
        assessment = db.query(SkinAssessment).filter(
            SkinAssessment.id == uid, SkinAssessment.user_id == current_user.id
        ).first()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found.")

        primary_concern = assessment.primary_concern
        detected = assessment.detected_concerns or []
        has_high_sensitivity_concern = any(
            c.get("severity") == "high" and c.get("key") in ("redness", "sensitivity", "sensitive_skin")
            for c in detected
        )
        is_highly_sensitive = is_highly_sensitive or has_high_sensitivity_concern

    if (payload.skin_type or "").lower() == "sensitive":
        is_highly_sensitive = True

    db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == current_user.id,
        SkincareRoutine.is_active == True  # noqa: E712
    ).update({"is_active": False})

    generated = generate_routine_steps(payload.skin_type, is_highly_sensitive, primary_concern)

    created_rows = []
    assessment_uuid = None
    if payload.assessment_id:
        import uuid as uuid_mod
        try:
            assessment_uuid = uuid_mod.UUID(payload.assessment_id)
        except ValueError:
            pass

    for time_of_day, steps in generated.items():
        for step in steps:
            row = SkincareRoutine(
                user_id=current_user.id,
                assessment_id=assessment_uuid,
                time_of_day=time_of_day,
                step_number=step["step_number"],
                step_category=step["step_category"],
                is_active=True,
            )
            db.add(row)
            created_rows.append(row)

    db.commit()
    for row in created_rows:
        db.refresh(row)

    return RoutineGenerateResponse(
        routine=[
            RoutineStepOut(
                id=str(r.id), step_number=r.step_number, step_category=r.step_category,
                time_of_day=r.time_of_day, is_active=r.is_active,
            )
            for r in created_rows
        ]
    )


# ============================================================
# GET /api/v1/routine
# ============================================================

@router.get("/routine", response_model=RoutineGenerateResponse)
def get_active_routine(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user.id, SkincareRoutine.is_active == True)  # noqa: E712
        .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="No active routine yet. Complete the assessment first.")

    return RoutineGenerateResponse(
        routine=[
            RoutineStepOut(
                id=str(r.id), step_number=r.step_number, step_category=r.step_category,
                time_of_day=r.time_of_day, is_active=r.is_active,
            )
            for r in rows
        ]
    )


# ============================================================
# POST /api/v1/routine/log-step
# ============================================================

@router.post("/routine/log-step")
def log_routine_step(
    payload: RoutineStepLogRequest,
    current_user: User = Depends(get_current_user),
):
    """Toggles a routine step's completion for today in MongoDB routine_logs."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    user_id_str = str(current_user.id)

    existing_doc = mongo_db.routine_logs.find_one({"user_id": user_id_str, "log_date": today})

    if not existing_doc:
        mongo_db.routine_logs.insert_one({
            "user_id": user_id_str,
            "log_date": today,
            "completed_steps": [],
            "water_intake_ml": payload.water_intake_ml,
            "sleep_hours": payload.sleep_hours,
        })
        existing_doc = mongo_db.routine_logs.find_one({"user_id": user_id_str, "log_date": today})

    completed_steps = existing_doc.get("completed_steps", [])
    already_logged = any(s["routine_step_id"] == payload.routine_step_id for s in completed_steps)

    if payload.completed and not already_logged:
        completed_steps.append({
            "routine_step_id": payload.routine_step_id,
            "completed_at": datetime.utcnow().isoformat(),
        })
    elif not payload.completed and already_logged:
        completed_steps = [s for s in completed_steps if s["routine_step_id"] != payload.routine_step_id]

    update_fields = {"completed_steps": completed_steps}
    if payload.water_intake_ml is not None:
        update_fields["water_intake_ml"] = payload.water_intake_ml
    if payload.sleep_hours is not None:
        update_fields["sleep_hours"] = payload.sleep_hours

    mongo_db.routine_logs.update_one(
        {"user_id": user_id_str, "log_date": today},
        {"$set": update_fields},
    )

    return {"log_date": today, "completed_steps": completed_steps}


# ============================================================
# GET /api/v1/routine/log-today
# ============================================================

@router.get("/routine/log-today")
def get_today_log(current_user: User = Depends(get_current_user)):
    """Returns today's real MongoDB log doc."""
    today = datetime.utcnow().strftime("%Y-%m-%d")
    doc = mongo_db.routine_logs.find_one({"user_id": str(current_user.id), "log_date": today})
    if not doc:
        return {"log_date": today, "completed_steps": [], "water_intake_ml": None, "sleep_hours": None}
    doc["_id"] = str(doc["_id"])
    return doc


# ============================================================
# POST /api/v1/assessment/save — SAVE STEP DRAFT PROGRESS
# ============================================================

from pydantic import BaseModel
from typing import Optional, List

class AssessmentSaveRequest(BaseModel):
    current_step: Optional[int] = 1
    age: Optional[int] = None
    gender: Optional[str] = None
    skin_type: Optional[str] = None
    skin_concerns: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    sensitivities: Optional[List[str]] = None
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    exercise_minutes: Optional[int] = None
    stress_level: Optional[str] = None
    environmental_exposure: Optional[str] = None
    smoking: Optional[bool] = None
    alcohol: Optional[bool] = None
    screen_time_hours: Optional[float] = None


@router.post("/assessment/save")
def save_assessment_progress(
    payload: AssessmentSaveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves / updates assessment progress draft in real-time as user steps through the form.
    Persists profile parameters to PostgreSQL and MongoDB draft.
    """
    # 1. Update SkinProfile in PostgreSQL
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if not profile:
        profile = SkinProfile(user_id=current_user.id)
        db.add(profile)

    if payload.age is not None:
        profile.age = payload.age
    if payload.gender:
        try:
            profile.gender = Gender(payload.gender)
        except ValueError:
            pass
    if payload.skin_type:
        try:
            profile.skin_type = SkinType(payload.skin_type)
        except ValueError:
            pass
    if payload.skin_concerns is not None:
        profile.skin_concerns = payload.skin_concerns
    if payload.allergies is not None:
        profile.allergies = payload.allergies
    if payload.sensitivities is not None:
        profile.sensitivities = payload.sensitivities

    db.commit()
    db.refresh(profile)

    # 2. Save LifestyleLog in PostgreSQL if lifestyle fields exist
    if any([payload.sleep_hours, payload.water_intake_liters, payload.exercise_minutes]):
        today = date.today()
        log = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == today).first()
        if not log:
            log = LifestyleLog(user_id=current_user.id, log_date=today)
            db.add(log)
        if payload.sleep_hours is not None: log.sleep_hours = payload.sleep_hours
        if payload.water_intake_liters is not None: log.water_intake_liters = payload.water_intake_liters
        if payload.exercise_minutes is not None: log.exercise_minutes = payload.exercise_minutes
        db.commit()

    # 3. Save draft document in MongoDB
    draft_doc = {
        "user_id": str(current_user.id),
        "current_step": payload.current_step or 1,
        "age": profile.age,
        "gender": profile.gender.value if profile.gender else None,
        "skin_type": profile.skin_type.value if profile.skin_type else None,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "sensitivities": profile.sensitivities or [],
        "sleep_hours": payload.sleep_hours,
        "water_intake_liters": payload.water_intake_liters,
        "exercise_minutes": payload.exercise_minutes,
        "updated_at": datetime.utcnow().isoformat()
    }
    mongo_db.assessment_drafts.update_one(
        {"user_id": str(current_user.id)},
        {"$set": draft_doc},
        upsert=True
    )

    return {"status": "saved", "step": payload.current_step, "user_id": str(current_user.id)}


# ============================================================
# GET /api/v1/assessment/current — RESTORE SAVED ASSESSMENT
# ============================================================

@router.get("/assessment/current")
def get_current_saved_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the authenticated user's current saved assessment data from PostgreSQL & MongoDB.
    Restores skin type, concerns, age, gender, allergies, sensitivities, lifestyle, and draft step.
    """
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    latest_assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user.id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    today = date.today()
    lifestyle = db.query(LifestyleLog).filter(LifestyleLog.user_id == current_user.id, LifestyleLog.log_date == today).first()
    draft = mongo_db.assessment_drafts.find_one({"user_id": str(current_user.id)}) or {}

    age_val = (profile.age if profile and profile.age else None) or draft.get("age")
    gender_val = (profile.gender.value if profile and profile.gender else None) or draft.get("gender")
    skin_type_val = (profile.skin_type.value if profile and profile.skin_type else None) or (latest_assessment.skin_type if latest_assessment and hasattr(latest_assessment, 'skin_type') else None) or draft.get("skin_type")
    concerns_val = (profile.skin_concerns if profile and profile.skin_concerns else None) or (latest_assessment.detected_concerns if latest_assessment else None) or draft.get("skin_concerns") or []
    allergies_val = (profile.allergies if profile and profile.allergies else None) or draft.get("allergies") or []
    sensitivities_val = (profile.sensitivities if profile and profile.sensitivities else None) or draft.get("sensitivities") or []

    return {
        "user_id": str(current_user.id),
        "age": age_val,
        "gender": gender_val,
        "skin_type": skin_type_val,
        "skin_concerns": concerns_val,
        "allergies": allergies_val,
        "sensitivities": sensitivities_val,
        "lifestyle": {
            "sleep_hours": (lifestyle.sleep_hours if lifestyle else None) or draft.get("sleep_hours", 8.0),
            "water_intake_liters": (lifestyle.water_intake_liters if lifestyle else None) or draft.get("water_intake_liters", 2.0),
            "exercise_minutes": (lifestyle.exercise_minutes if lifestyle else None) or draft.get("exercise_minutes", 30)
        },
        "current_step": draft.get("current_step", 1),
        "latest_score": float(latest_assessment.overall_score) if latest_assessment else None,
        "updated_at": datetime.utcnow().isoformat()
    }