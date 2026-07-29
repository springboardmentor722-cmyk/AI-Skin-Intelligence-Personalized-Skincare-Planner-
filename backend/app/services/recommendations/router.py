from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.recommendations import service
from app.services.recommendations.schemas import RecommendationFeedbackCreate, RecommendationRead

router = APIRouter()


@router.get("/recommendations/me")
async def get_my_recommendations(
    # Product Recommendation is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    max_price: Annotated[float | None, Query(gt=0)] = None,
) -> list[RecommendationRead]:
    return await service.get_recommendations(db, user["id"], max_price=max_price)


@router.post("/recommendations/feedback", status_code=status.HTTP_204_NO_CONTENT)
async def submit_recommendation_feedback(
    feedback: RecommendationFeedbackCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
) -> None:
    await service.submit_feedback(user["id"], feedback)
