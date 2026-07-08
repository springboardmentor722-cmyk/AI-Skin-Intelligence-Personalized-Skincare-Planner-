from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import get_db
from app.services.user import service
from app.services.user.schemas import UserMeResponse, UserProfileRead, UserProfileUpdate

router = APIRouter()


@router.get("/me")
async def get_me(
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> UserMeResponse:
    """Round-trips the Better Auth JWT through FastAPI's JWKS validation — id/role
    come straight from the validated claims, no DB read yet (User Profile module owns
    the domain profile; this just proves the auth pipeline works end to end)."""
    return UserMeResponse(id=user["id"], role=user["role"])


@router.get("/me/profile")
async def get_my_profile(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileRead:
    profile = await service.get_or_create_profile(db, user["id"])
    return UserProfileRead.model_validate(profile)


@router.put("/me/profile")
async def update_my_profile(
    data: UserProfileUpdate,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileRead:
    profile = await service.update_profile(db, user["id"], data)
    return UserProfileRead.model_validate(profile)
