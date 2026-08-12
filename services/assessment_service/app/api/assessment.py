from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.assessment_service.app.schemas.assessment import AssessmentSubmit
from services.assessment_service.app.db.dependencies import get_db
from services.assessment_service.app.db.mongo import get_mongo_db
from services.assessment_service.app.business.assessment_service import (
    evaluate_assessment, get_latest_score, get_score_history, get_consistency_history,
    get_client_score, get_client_history, get_admin_score_overview,
)
from services.auth_service.app.utils.dependencies import get_current_user
from services.auth_service.app.utils.roles import require_role

router = APIRouter(prefix="/api/v1/assessment", tags=["Assessment"])


def _serialize(assessment):
    return {
        "id": assessment.id,
        "overall_score": assessment.overall_score,
        "condition_score": assessment.condition_score,
        "lifestyle_score": assessment.lifestyle_score,
        "sleep_score": assessment.sleep_score,
        "consistency_score": assessment.consistency_score,
        "hydration_score": assessment.hydration_score,
        "primary_concern": assessment.primary_concern,
        "detected_concerns": assessment.detected_concerns,
        "skin_type": assessment.skin_type,
        "created_at": assessment.created_at.isoformat() if assessment.created_at else None,
    }


@router.post("/evaluate")
def evaluate(
    data: AssessmentSubmit,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db=Depends(get_mongo_db),
):
    assessment = evaluate_assessment(data, current_user, db, mongo_db)
    return _serialize(assessment)


@router.get("/score")
def score(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    assessment = get_latest_score(current_user, db)
    return _serialize(assessment)


@router.get("/history")
def history(
    limit: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = get_score_history(current_user, db, limit=limit)
    return [
        {
            "overall_score": r.overall_score,
            "detected_concerns": r.detected_concerns,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.get("/consistency-history")
def consistency_history(
    days: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    mongo_db=Depends(get_mongo_db),
):
    return get_consistency_history(current_user, db, mongo_db, days=days)


@router.get("/client-score/{user_id}")
def client_score(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Real skin health score for a specific client — used by the
    consultant/dermatologist/admin dashboards. Access is gated to the
    client themself, their assigned consultant/dermatologist, or admin.
    """
    return get_client_score(current_user, user_id, db)


@router.get("/client-history/{user_id}")
def client_history(
    user_id: int,
    limit: int = 30,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Score history for a specific client — powers dermatologist progress analytics."""
    return get_client_history(current_user, user_id, db, limit=limit)


@router.get("/admin/overview")
def admin_overview(
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    """Platform-wide skin health stats for the Admin Analytics/Reports pages."""
    return get_admin_score_overview(db)
