from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.scores import service
from app.services.scores.schemas import ScoreRead

router = APIRouter()


@router.get("/scores/me")
async def get_my_score(
    # Skin Health Scoring is a `user`-role feature (ARCHITECTURE.md §2) — consultant/
    # dermatologist/admin accounts have no skin profile of their own to score.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ScoreRead:
    try:
        return await service.compute_and_store_score(db, user["id"])
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
