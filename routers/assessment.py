"""Skin Assessment Engine routes — Milestone 2, Steps 2 and 3."""

from fastapi import APIRouter, Depends
from pymongo.database import Database
from sqlalchemy.orm import Session

from controllers import assessment_controller
from core.database import get_db
from core.dependencies import get_current_user
from core.mongodb import get_mongo_db
from models.assessment import SkinAssessment
from models.user import User
from schemas.assessment import AssessmentEvaluateRequest, AssessmentResponse

router = APIRouter(prefix="/api/v1/assessment", tags=["Skin Assessment"])


def _to_response(assessment: SkinAssessment) -> AssessmentResponse:
    """Map the flat SkinAssessment row into the nested breakdown shape the frontend expects."""
    return AssessmentResponse(
        id=assessment.id,
        user_id=assessment.user_id,
        overall_score=assessment.overall_score,
        detected_concerns=assessment.detected_concerns or [],
        primary_concern=assessment.primary_concern,
        skin_type=assessment.skin_type,
        is_highly_sensitive=assessment.is_highly_sensitive,
        breakdown={
            "skin_condition_score": assessment.skin_condition_score,
            "lifestyle_score": assessment.lifestyle_score,
            "sleep_score": assessment.sleep_score,
            "consistency_score": assessment.consistency_score,
            "hydration_score": assessment.hydration_score,
            "overall_score": assessment.overall_score,
        },
        created_at=assessment.created_at,
    )


@router.post("/evaluate", response_model=AssessmentResponse)
def evaluate(
    payload: AssessmentEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Submit the multi-step wizard's answers, get back the scored breakdown, and auto-generate a routine."""
    assessment = assessment_controller.evaluate_assessment(db, mongo_db, current_user, payload)
    return _to_response(assessment)


@router.get("/score", response_model=AssessmentResponse)
def score(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db: Database = Depends(get_mongo_db),
):
    """Recompute and return the latest Skin Health Score breakdown."""
    assessment = assessment_controller.get_latest_score(db, mongo_db, current_user)
    return _to_response(assessment)


@router.get("/history", response_model=list[AssessmentResponse])
def history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Chronological score history — powers future progress-tracking charts (Milestone 3)."""
    assessments = assessment_controller.get_assessment_history(db, current_user)
    return [_to_response(a) for a in assessments]
