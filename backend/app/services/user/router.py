from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role, require_user
from app.db.postgres import get_db
from app.services.user import service
from app.services.user.schemas import (
    AppearancePreferenceRead,
    AppearancePreferenceUpdate,
    UserMeResponse,
    UserProfileRead,
    UserProfileUpdate,
)

router = APIRouter()


@router.get("/me")
async def get_me(
    # Deliberately role-agnostic (all 4 roles call this to learn which dashboard to
    # land on after login) — never restrict this one to require_role("user").
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> UserMeResponse:
    """Round-trips the Better Auth JWT through FastAPI's JWKS validation — id/role
    come straight from the validated claims, no DB read yet (User Profile module owns
    the domain profile; this just proves the auth pipeline works end to end)."""
    return UserMeResponse(id=user["id"], role=user["role"])


@router.get("/me/profile")
async def get_my_profile(
    # The domain user profile (age/gender/skin type/etc.) is a `user`-role feature
    # (ARCHITECTURE.md §2) — consultant/dermatologist/admin accounts don't have one.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileRead:
    profile = await service.get_or_create_profile(db, user["id"])
    return UserProfileRead.model_validate(profile)


@router.put("/me/profile")
async def update_my_profile(
    data: UserProfileUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> UserProfileRead:
    profile = await service.update_profile(db, user["id"], data)
    return UserProfileRead.model_validate(profile)


@router.get("/me/appearance")
async def get_my_appearance(
    # Role-agnostic like /me — every role has its own theme (Settings > Appearance is
    # in all four roles' nav, AGENTS.md §3), never require_role("user").
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppearancePreferenceRead:
    preference = await service.get_or_create_appearance(db, user["id"])
    return AppearancePreferenceRead.model_validate(preference)


@router.put("/me/appearance")
async def update_my_appearance(
    data: AppearancePreferenceUpdate,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppearancePreferenceRead:
    preference = await service.update_appearance(db, user["id"], data)
    return AppearancePreferenceRead.model_validate(preference)


@router.post("/me/appearance/reset")
async def reset_my_appearance(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppearancePreferenceRead:
    preference = await service.reset_appearance(db, user["id"])
    return AppearancePreferenceRead.model_validate(preference)
