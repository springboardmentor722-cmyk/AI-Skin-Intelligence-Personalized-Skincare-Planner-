from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from services.recommendation_service.app.db.dependencies import get_db
from services.recommendation_service.app.business.recommendation_engine import (
    get_recommendations, get_admin_recommendation_overview,
)
from services.auth_service.app.utils.dependencies import get_current_user
from services.auth_service.app.utils.roles import require_role

router = APIRouter(prefix="/api/v1/recommendations", tags=["recommendations"])


@router.get("")
def recommendations(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = get_recommendations(current_user, db)
    if results is None:
        raise HTTPException(
            status_code=404,
            detail="No assessment found. Complete the assessment first.",
        )
    return results


@router.get("/client/{user_id}")
def client_recommendations(
    user_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = get_recommendations(current_user, db, target_user_id=user_id)
    if results is None:
        raise HTTPException(
            status_code=404,
            detail="This client hasn't completed an assessment yet.",
        )
    return results


@router.get("/admin/overview")
def admin_overview(
    current_user=Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    return get_admin_recommendation_overview(current_user, db)
