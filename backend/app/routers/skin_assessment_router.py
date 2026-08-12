import json
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.models.lifestyle import Lifestyle
from app.models.progress import Progress
from app.models.skin_assessment import SkinAssessment
from app.models.skin_profile import SkinProfile
from app.models.user import User
from app.database.database import get_db
from app.schemas.skin_assessment_schema import GeminiConditionAnalysis, SkinAssessmentResponse
from app.services.gemini_service import GeminiServiceError, analyze_skin_condition
from app.utils.auth import role_required

router = APIRouter(prefix="/skin-assessment", tags=["Skin Assessment"])

RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "condition_score": {"type": "NUMBER"},
        "severity": {"type": "STRING", "enum": ["Low", "Moderate", "High"]},
        "risk_level": {"type": "STRING", "enum": ["Low", "Moderate", "High"]},
        "primary_concerns": {"type": "ARRAY", "items": {"type": "STRING"}},
        "condition_summary": {"type": "STRING"},
        "observations": {"type": "ARRAY", "items": {"type": "STRING"}},
        "recommendations": {"type": "ARRAY", "items": {"type": "STRING"}},
        "morning_routine": {"type": "ARRAY", "items": {"type": "STRING"}},
        "night_routine": {"type": "ARRAY", "items": {"type": "STRING"}},
        "ingredients_to_look_for": {"type": "ARRAY", "items": {"type": "STRING"}},
        "ingredients_to_avoid": {"type": "ARRAY", "items": {"type": "STRING"}},
        "disclaimer": {"type": "STRING"},
    },
    "required": ["condition_score", "severity", "risk_level", "primary_concerns", "condition_summary", "observations", "recommendations", "morning_routine", "night_routine", "ingredients_to_look_for", "ingredients_to_avoid", "disclaimer"],
}


def score_sleep(hours) -> float:
    if hours is None: return 0.0
    hours = float(hours)
    if hours >= 8: return 100.0
    if hours >= 7: return 85.0
    if hours >= 6: return 65.0
    return 40.0


def score_hydration(litres) -> float:
    if litres is None: return 0.0
    litres = float(litres)
    if litres >= 3: return 100.0
    if litres >= 2: return 75.0
    if litres >= 1: return 50.0
    return 25.0


def score_lifestyle(lifestyle: Lifestyle | None) -> float:
    if lifestyle is None: return 0.0
    score = 50.0 if (lifestyle.exercise or "").strip() else 0.0
    stress_scores = {"low": 50.0, "moderate": 25.0, "high": 0.0}
    return score + stress_scores.get((lifestyle.stress_level or "").strip().lower(), 0.0)


def build_prompt(profile: SkinProfile, lifestyle: Lifestyle | None) -> str:
    details = {"age": profile.age, "gender": profile.gender, "skin_type": profile.skin_type, "skin_concerns": profile.skin_concerns, "allergies": profile.allergies, "sensitivities": profile.sensitivities}
    if lifestyle:
        details["lifestyle"] = {"sleep_duration": float(lifestyle.sleep_duration) if lifestyle.sleep_duration is not None else None, "water_intake": float(lifestyle.water_intake) if lifestyle.water_intake is not None else None, "exercise": lifestyle.exercise, "stress_level": lifestyle.stress_level, "environmental_exposure": lifestyle.environmental_exposure}
    return """You are a skincare support assistant. Analyze ONLY the supplied profile data and return the requested JSON. Do not diagnose diseases, prescribe medicines, recommend prescription medication, claim medical certainty, invent symptoms, invent medical history, or assume missing information. Provide general skincare guidance only. Recommend consulting a dermatologist when symptoms appear severe, persistent, or concerning. condition_score must represent only general skin-condition support assessment, from 0 to 100; do not calculate a weighted final score. Routines and ingredient lists must remain general, non-prescription guidance. The disclaimer must state that this is informational only and not a medical diagnosis.\n\nUser data:\n""" + json.dumps(details, ensure_ascii=False)


@router.post("/analyze", response_model=SkinAssessmentResponse)
def analyze_skin_profile(db: Session = Depends(get_db), current_user: User = Depends(role_required(["USER"]))):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    if profile is None:
        raise HTTPException(status_code=400, detail="Please save your Skin Profile before requesting an assessment.")
    lifestyle = db.query(Lifestyle).filter(Lifestyle.user_id == current_user.id).first()
    try:
        analysis = GeminiConditionAnalysis.model_validate(analyze_skin_condition(build_prompt(profile, lifestyle), RESPONSE_SCHEMA))
    except (RuntimeError, GeminiServiceError, ValidationError):
        raise HTTPException(status_code=503, detail="AI analysis is temporarily unavailable. Please try again later.")
    lifestyle_score = score_lifestyle(lifestyle)
    routine_score = 0.0  # No user skincare-routine data is currently stored in this project.
    sleep_score = score_sleep(lifestyle.sleep_duration if lifestyle else None)
    hydration_score = score_hydration(lifestyle.water_intake if lifestyle else None)
    final_score = round(max(0.0, min(100.0, analysis.condition_score * .35 + lifestyle_score * .20 + routine_score * .20 + sleep_score * .15 + hydration_score * .10)), 2)
    today = date.today()
    assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id, SkinAssessment.assessment_date == today).first()
    values = {"condition_score": analysis.condition_score, "lifestyle_score": lifestyle_score, "routine_score": routine_score, "sleep_score": sleep_score, "hydration_score": hydration_score, "final_score": final_score, "severity": analysis.severity, "risk_level": analysis.risk_level, "primary_concerns": json.dumps(analysis.primary_concerns), "condition_summary": analysis.condition_summary, "observations": json.dumps(analysis.observations), "recommendations": json.dumps(analysis.recommendations), "morning_routine": json.dumps(analysis.morning_routine), "night_routine": json.dumps(analysis.night_routine), "ingredients_to_look_for": json.dumps(analysis.ingredients_to_look_for), "ingredients_to_avoid": json.dumps(analysis.ingredients_to_avoid), "disclaimer": analysis.disclaimer}
    if assessment is None:
        assessment = SkinAssessment(user_id=current_user.id, assessment_date=today, **values)
        db.add(assessment)
    else:
        for field, value in values.items(): setattr(assessment, field, value)
    profile.skin_score = round(final_score)
    profile.recommendations = "\n".join(analysis.recommendations)
    progress = db.query(Progress).filter(Progress.user_id == current_user.id, Progress.assessment_date == today).first()
    if progress is None:
        progress = Progress(user_id=current_user.id, assessment_date=today)
        db.add(progress)
    progress.skin_score = final_score
    progress.hydration_score = hydration_score
    progress.notes = analysis.condition_summary
    db.commit()
    return SkinAssessmentResponse(assessment_date=today, **analysis.model_dump(), lifestyle_score=lifestyle_score, routine_score=routine_score, sleep_score=sleep_score, hydration_score=hydration_score, final_score=final_score)


@router.get("/latest", response_model=SkinAssessmentResponse | None)
def get_latest_assessment(db: Session = Depends(get_db), current_user: User = Depends(role_required(["USER"]))):
    assessment = db.query(SkinAssessment).filter(SkinAssessment.user_id == current_user.id).order_by(SkinAssessment.assessment_date.desc(), SkinAssessment.assessment_id.desc()).first()
    if assessment is None:
        return None
    return SkinAssessmentResponse(
        assessment_date=assessment.assessment_date,
        condition_score=assessment.condition_score,
        lifestyle_score=assessment.lifestyle_score,
        routine_score=assessment.routine_score,
        sleep_score=assessment.sleep_score,
        hydration_score=assessment.hydration_score,
        final_score=assessment.final_score,
        severity=assessment.severity,
        risk_level=assessment.risk_level,
        primary_concerns=json.loads(assessment.primary_concerns or "[]"),
        condition_summary=assessment.condition_summary or "",
        observations=json.loads(assessment.observations or "[]"),
        recommendations=json.loads(assessment.recommendations or "[]"),
        morning_routine=json.loads(assessment.morning_routine or "[]"),
        night_routine=json.loads(assessment.night_routine or "[]"),
        ingredients_to_look_for=json.loads(assessment.ingredients_to_look_for or "[]"),
        ingredients_to_avoid=json.loads(assessment.ingredients_to_avoid or "[]"),
        disclaimer=assessment.disclaimer or "This AI-generated assessment is for informational purposes only and is not a medical diagnosis.",
    )
