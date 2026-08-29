from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from fastapi import HTTPException

from services.assessment_service.app.models.assessment import SkinAssessment
from services.assessment_service.app.models.routine import SkincareRoutine
from services.assessment_service.app.schemas.assessment import AssessmentSubmit
from services.assessment_service.app.business.scoring_engine import calculate_skin_health_score
from services.assessment_service.app.business.concern_engine import identify_skin_concerns, get_primary_concern
from services.assessment_service.app.business.routine_engine import generate_routine_steps
from services.profile_service.app.models.profile import Profile


def _get_consistency_stats(user_id: int, mongo_db, db: Session):
    """
    % of scheduled AM/PM steps actually completed over the last 7 days.
    No active routine yet (brand-new user) -> spec says default to 100.
    """
    active_steps = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id,
        SkincareRoutine.is_active == True,  # noqa: E712
        SkincareRoutine.time_of_day.in_(["AM", "PM"]),
    ).count()

    if active_steps == 0:
        return 0, 0  # -> scoring_engine defaults this to 100

    week_ago = (datetime.utcnow() - timedelta(days=7)).strftime("%Y-%m-%d")
    logs = list(mongo_db.routine_logs.find({
        "user_id": user_id,
        "log_date": {"$gte": week_ago},
    }))

    completed = sum(len(log.get("completed_steps", [])) for log in logs)
    expected = active_steps * 7
    return completed, expected


def get_consistency_history(current_user, db: Session, mongo_db, days: int = 30):
    """
    Day-by-day AM/PM completion % for the last `days` days, plus the
    current streak (consecutive days from today with >=1 step completed).
    Reuses the routine_logs collection already written by toggle_routine_log —
    no new Mongo schema needed.
    """
    user_id = current_user["id"]
    active_steps = db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == user_id,
        SkincareRoutine.is_active == True,  # noqa: E712
        SkincareRoutine.time_of_day.in_(["AM", "PM"]),
    ).count()

    start_date = datetime.utcnow().date() - timedelta(days=days - 1)
    logs = list(mongo_db.routine_logs.find({
        "user_id": user_id,
        "log_date": {"$gte": start_date.strftime("%Y-%m-%d")},
    }))
    logs_by_date = {log["log_date"]: len(log.get("completed_steps", [])) for log in logs}

    daily = []
    for i in range(days):
        day = start_date + timedelta(days=i)
        date_str = day.strftime("%Y-%m-%d")
        completed_count = logs_by_date.get(date_str, 0)
        pct = round((completed_count / active_steps) * 100) if active_steps else 0
        daily.append({
            "date": date_str,
            "completed_count": completed_count,
            "total_steps": active_steps,
            "pct_complete": min(pct, 100),
        })

    # Current streak: walk backwards from today while a day has >=1 completed step.
    streak = 0
    for day_entry in reversed(daily):
        if day_entry["completed_count"] > 0:
            streak += 1
        else:
            break

    return {"daily": daily, "current_streak": streak}


def evaluate_assessment(data: AssessmentSubmit, current_user, db: Session, mongo_db):
    severities = {
        "acne_severity": data.acne_severity,
        "hyperpigmentation_severity": data.hyperpigmentation_severity,
        "redness_severity": data.redness_severity,
        "wrinkles_severity": data.wrinkles_severity,
    }

    concerns = identify_skin_concerns(severities)
    primary_concern = get_primary_concern(concerns)

    completed, expected = _get_consistency_stats(current_user["id"], mongo_db, db)

    scores = calculate_skin_health_score(
        severities=severities,
        sun_exposure=data.sun_exposure,
        sleep_hours=data.sleep_hours,
        water_intake_liters=data.water_intake_liters,
        completed_logs=completed,
        total_logs=expected,
    )

    assessment = SkinAssessment(
        user_id=current_user["id"],
        skin_type=data.skin_type,
        severities=severities,
        detected_concerns=concerns,
        primary_concern=primary_concern,
        sleep_hours=data.sleep_hours,
        water_intake_liters=data.water_intake_liters,
        sun_exposure=data.sun_exposure,
        **scores,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


def authorize_client_access(current_user, target_user_id: int, db: Session):
    """
    Shared gate for care-team endpoints: a user can always see their own
    data; a consultant/dermatologist can only see clients explicitly
    assigned to them (via Profile.consultant_id / dermatologist_id);
    admins can see everyone.
    """
    if current_user["id"] == target_user_id:
        return
    if current_user["role"] == "admin":
        return

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Client profile not found")

    is_assigned = (
        (current_user["role"] == "consultant" and profile.consultant_id == current_user["id"])
        or (current_user["role"] == "dermatologist" and profile.dermatologist_id == current_user["id"])
    )
    if not is_assigned:
        raise HTTPException(status_code=403, detail="This client is not assigned to you")


def get_client_score(current_user, target_user_id: int, db: Session):
    authorize_client_access(current_user, target_user_id, db)

    rows = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == target_user_id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(2)
        .all()
    )
    if not rows:
        raise HTTPException(status_code=404, detail="This client hasn't completed an assessment yet")

    latest = rows[0]
    previous = rows[1] if len(rows) > 1 else None
    return {
        "overall_score": latest.overall_score,
        "condition_score": latest.condition_score,
        "lifestyle_score": latest.lifestyle_score,
        "sleep_score": latest.sleep_score,
        "consistency_score": latest.consistency_score,
        "hydration_score": latest.hydration_score,
        "detected_concerns": latest.detected_concerns,
        "primary_concern": latest.primary_concern,
        "created_at": latest.created_at.isoformat() if latest.created_at else None,
        "previous_score": previous.overall_score if previous else None,
    }


def get_client_history(current_user, target_user_id: int, db: Session, limit: int = 30):
    authorize_client_access(current_user, target_user_id, db)

    rows = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == target_user_id)
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    rows = list(reversed(rows))
    return [
        {
            "overall_score": r.overall_score,
            "detected_concerns": r.detected_concerns,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


def get_admin_score_overview(db: Session):
    """
    Platform-wide skin health stats for the admin Analytics/Reports pages.
    Computed live from real skin_assessments rows — one row per user
    (their latest), no stored aggregate table needed.
    """
    all_rows = (
        db.query(SkinAssessment)
        .order_by(SkinAssessment.user_id, SkinAssessment.created_at.desc())
        .all()
    )
    latest_per_user = {}
    for row in all_rows:
        if row.user_id not in latest_per_user:
            latest_per_user[row.user_id] = row

    latest_rows = list(latest_per_user.values())
    if not latest_rows:
        return {
            "users_assessed": 0,
            "avg_overall_score": None,
            "avg_consistency_score": None,
            "concern_frequency": [],
            "per_user_scores": [],
        }

    avg_overall = sum(r.overall_score for r in latest_rows) / len(latest_rows)
    avg_consistency = sum(r.consistency_score for r in latest_rows) / len(latest_rows)

    concern_counts = {}
    for r in latest_rows:
        for c in (r.detected_concerns or []):
            concern_counts[c["name"]] = concern_counts.get(c["name"], 0) + 1
    concern_frequency = sorted(
        [{"name": name, "count": count} for name, count in concern_counts.items()],
        key=lambda x: x["count"], reverse=True,
    )

    per_user_scores = [
        {
            "user_id": r.user_id,
            "overall_score": r.overall_score,
            "consistency_score": r.consistency_score,
            "primary_concern": r.primary_concern,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in latest_rows
    ]

    return {
        "users_assessed": len(latest_rows),
        "avg_overall_score": round(avg_overall, 1),
        "avg_consistency_score": round(avg_consistency, 1),
        "concern_frequency": concern_frequency,
        "per_user_scores": per_user_scores,
    }


def get_latest_score(current_user, db: Session):
    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user["id"])
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(status_code=404, detail="No assessment found. Complete the assessment first.")
    return assessment


def get_score_history(current_user, db: Session, limit: int = 30):
    """
    Last `limit` assessments, oldest -> newest, for the Progress Tracking
    trend chart. Reuses the existing skin_assessments rows (one per
    evaluate() call) — no new table needed.
    """
    rows = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == current_user["id"])
        .order_by(SkinAssessment.created_at.desc())
        .limit(limit)
        .all()
    )
    return list(reversed(rows))


def generate_routine(current_user, db: Session):
    assessment = get_latest_score(current_user, db)

    redness = (assessment.severities or {}).get("redness_severity", 0)
    steps_by_time = generate_routine_steps(assessment.skin_type, redness)

    # Deactivate previous routine before writing the new one.
    db.query(SkincareRoutine).filter(
        SkincareRoutine.user_id == current_user["id"],
        SkincareRoutine.is_active == True,  # noqa: E712
    ).update({"is_active": False})

    created = []
    for time_of_day, steps in steps_by_time.items():
        for i, (category, name) in enumerate(steps, start=1):
            routine_step = SkincareRoutine(
                user_id=current_user["id"],
                assessment_id=assessment.id,
                time_of_day=time_of_day,
                step_number=i,
                step_category=category,
                step_name=name,
                is_active=True,
            )
            db.add(routine_step)
            created.append(routine_step)

    db.commit()
    for step in created:
        db.refresh(step)
    return created


def get_active_routine(current_user, db: Session, mongo_db):
    steps = (
        db.query(SkincareRoutine)
        .filter(SkincareRoutine.user_id == current_user["id"], SkincareRoutine.is_active == True)  # noqa: E712
        .order_by(SkincareRoutine.time_of_day, SkincareRoutine.step_number)
        .all()
    )

    today = datetime.utcnow().strftime("%Y-%m-%d")
    today_log = mongo_db.routine_logs.find_one({"user_id": current_user["id"], "log_date": today}) or {}
    completed_ids = {c["routine_step_id"] for c in today_log.get("completed_steps", [])}

    result = []
    for step in steps:
        result.append({
            "id": step.id,
            "time_of_day": step.time_of_day,
            "step_number": step.step_number,
            "step_category": step.step_category,
            "step_name": step.step_name,
            "is_active": step.is_active,
            "completed_today": step.id in completed_ids,
        })
    return result


def toggle_routine_log(user_id: int, routine_step_id: int, completed: bool, mongo_db):
    today = datetime.utcnow().strftime("%Y-%m-%d")

    if completed:
        mongo_db.routine_logs.update_one(
            {"user_id": user_id, "log_date": today},
            {
                "$pull": {"completed_steps": {"routine_step_id": routine_step_id}},
            },
        )
        mongo_db.routine_logs.update_one(
            {"user_id": user_id, "log_date": today},
            {
                "$push": {"completed_steps": {
                    "routine_step_id": routine_step_id,
                    "completed_at": datetime.utcnow().isoformat(),
                }},
                "$setOnInsert": {"water_intake_ml": 0, "sleep_hours": 0},
            },
            upsert=True,
        )
    else:
        mongo_db.routine_logs.update_one(
            {"user_id": user_id, "log_date": today},
            {"$pull": {"completed_steps": {"routine_step_id": routine_step_id}}},
        )

    return {"message": "Updated", "completed": completed}
