"""Product Recommendation Engine routes — Milestone 3, Step 2."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from controllers import recommendation_controller
from core.database import get_db
from core.dependencies import get_current_user
from models.user import User
from schemas.recommendation import RecommendationResponse

router = APIRouter(prefix="/api/v1/recommendations", tags=["Product Recommendations"])


@router.get("", response_model=RecommendationResponse)
def get_recommendations(
    max_price: Optional[float] = Query(None, ge=0, description="Budget cap in the store's currency (INR)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Personalized, categorized product recommendations with match
    percentages, hard-filtered against the user's allergy profile.
    """
    return recommendation_controller.get_recommendations_for_user(db, current_user, max_price)
