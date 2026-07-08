from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import get_db
from app.services.skin_profile import service
from app.services.skin_profile.schemas import (
    LifestyleLogCreate,
    LifestyleLogRead,
    SkinConcernRead,
    SkinProfileCreate,
    SkinProfileRead,
    SkinTypeRead,
)

# This service owns two API prefixes (docs/ARCHITECTURE.md §4) — mounted separately in
# main.py, not because of two services, one Skin Profile service with two resource kinds.
router = APIRouter()
lifestyle_router = APIRouter()


@router.get("/skin-types")
async def get_skin_types(db: Annotated[AsyncSession, Depends(get_db)]) -> list[SkinTypeRead]:
    types = await service.list_skin_types(db)
    return [SkinTypeRead.model_validate(t) for t in types]


@router.get("/skin-concerns")
async def get_skin_concerns(
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[SkinConcernRead]:
    concerns = await service.list_skin_concerns(db)
    return [SkinConcernRead.model_validate(c) for c in concerns]


@router.get("/skin-profiles/me")
async def get_my_skin_profile(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SkinProfileRead:
    profile = await service.get_current_profile(db, user["id"])
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No skin profile yet")
    return profile


@router.post("/skin-profiles", status_code=status.HTTP_201_CREATED)
async def create_my_skin_profile(
    data: SkinProfileCreate,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SkinProfileRead:
    return await service.create_profile(db, user["id"], data)


@lifestyle_router.post("/lifestyle-logs")
async def upsert_my_lifestyle_log(
    data: LifestyleLogCreate,
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> LifestyleLogRead:
    return await service.upsert_lifestyle_log(user["id"], data)


@lifestyle_router.get("/lifestyle-logs/me")
async def get_my_lifestyle_logs(
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> list[dict[str, Any]]:
    logs = await service.list_recent_lifestyle_logs(user["id"])
    for log in logs:
        log["_id"] = str(log["_id"])
    return logs
