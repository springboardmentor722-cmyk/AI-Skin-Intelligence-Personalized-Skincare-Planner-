from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.recommendations import service
from app.services.recommendations.schemas import RecommendationRead

router = APIRouter()


@router.get("/recommendations/me")
async def get_my_recommendations(
    # Product Recommendation is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RecommendationRead]:
    return await service.get_recommendations(db, user["id"])
