import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from backend.models import SkinProfile, RoutineLog

logger = logging.getLogger(__name__)

SEVERITY_KEYWORDS = {
    "High": ["severe", "active", "flare", "cystic", "painful", "excessive"],
    "Medium": ["moderate", "persistent", "occasional", "some"],
    "Low": ["mild", "rare", "slight", "few"],
}

def classify_severity(concern: str):
    concern_lower = concern.lower()
    for severity, keywords in SEVERITY_KEYWORDS.items():
        if any(keyword in concern_lower for keyword in keywords):
            return severity
    return "Low"

def calculate_skin_condition(concerns: str):
    if not concerns:
        return 100.0
    concerns_list = [c.strip().lower() for c in concerns.split(",") if c.strip()]
    if not concerns_list:
        return 100.0
    score = 100.0
    high_count = 0
    medium_count = 0
    for concern in concerns_list:
        severity = classify_severity(concern)
        if severity == "High":
            high_count += 1
        elif severity == "Medium":
            medium_count += 1
    score = score - (high_count * 15) - (medium_count * 7)
    return max(0.0, min(100.0, score))

def calculate_lifestyle_score(exposure: str):
    exposure_lower = exposure.lower() if exposure else ""
    if "high" in exposure_lower or "excessive" in exposure_lower:
        return 70.0
    elif "moderate" in exposure_lower:
        return 85.0
    elif "low" in exposure_lower:
        return 95.0
    else:
        return 90.0

def calculate_sleep_score(hours):
    if not hours or hours <= 0:
        return 0.0
    score = (hours / 8.0) * 100
    return min(100.0, score)

def calculate_consistency_score(db: Session, user_id: int):
    cutoff_date = datetime.utcnow().date() - timedelta(days=7)
    logs = db.query(RoutineLog).filter(
        RoutineLog.user_id == user_id,
        RoutineLog.log_date >= cutoff_date
    ).all()
    if not logs:
        return 0.0
    total_steps = len(logs)
    completed_steps = sum(1 for log in logs if log.completed_at is not None)
    return (completed_steps / total_steps) * 100

def calculate_hydration_score(water_intake):
    target = 2.5
    if not water_intake or water_intake <= 0:
        return 0.0
    score = (water_intake / target) * 100
    return min(100.0, score)

def calculate_skin_health_score(db: Session, user_id: int):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        return {
            "score": 0,
            "breakdown": {
                "skin_condition": 0,
                "lifestyle": 0,
                "sleep_quality": 0,
                "routine_consistency": 0,
                "hydration": 0,
                "overall": 0
            },
            "detected_concerns": []
        }

    skin_condition = calculate_skin_condition(profile.skin_concerns)
    lifestyle = calculate_lifestyle_score(profile.environmental_exposure)
    sleep_quality = calculate_sleep_score(profile.sleep_duration)
    routine_consistency = calculate_consistency_score(db, user_id)
    hydration = calculate_hydration_score(profile.water_intake)

    overall = (skin_condition * 0.35) + (lifestyle * 0.20) + (sleep_quality * 0.15) + (routine_consistency * 0.20) + (hydration * 0.10)

    detected_concerns = []
    if profile.skin_concerns:
        detected_concerns = [c.strip() for c in profile.skin_concerns.split(",") if c.strip()]

    return {
        "score": round(overall, 2),
        "breakdown": {
            "skin_condition": round(skin_condition, 2),
            "lifestyle": round(lifestyle, 2),
            "sleep_quality": round(sleep_quality, 2),
            "routine_consistency": round(routine_consistency, 2),
            "hydration": round(hydration, 2),
            "overall": round(overall, 2)
        },
        "detected_concerns": detected_concerns
    }