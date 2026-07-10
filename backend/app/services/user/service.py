from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user.models import UserAppearancePreference, UserProfile
from app.services.user.schemas import AppearancePreferenceUpdate, UserProfileUpdate


async def get_or_create_profile(db: AsyncSession, user_id: str) -> UserProfile:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile is None:
        profile = UserProfile(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile


async def update_profile(
    db: AsyncSession, user_id: str, data: UserProfileUpdate
) -> UserProfile:
    profile = await get_or_create_profile(db, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_or_create_appearance(db: AsyncSession, user_id: str) -> UserAppearancePreference:
    result = await db.execute(
        select(UserAppearancePreference).where(UserAppearancePreference.user_id == user_id)
    )
    preference = result.scalar_one_or_none()
    if preference is None:
        preference = UserAppearancePreference(user_id=user_id)
        db.add(preference)
        await db.commit()
        await db.refresh(preference)
    return preference


async def update_appearance(
    db: AsyncSession, user_id: str, data: AppearancePreferenceUpdate
) -> UserAppearancePreference:
    preference = await get_or_create_appearance(db, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(preference, field, value)
    await db.commit()
    await db.refresh(preference)
    return preference


async def reset_appearance(db: AsyncSession, user_id: str) -> UserAppearancePreference:
    """Back to the schema's own defaults — "default" palette, "system" mode
    (a1e009276345's `server_default`s), not the row's original creation-time values."""
    preference = await get_or_create_appearance(db, user_id)
    preference.palette = "default"
    preference.theme_mode = "system"
    preference.accent_color = None
    preference.font_size = None
    preference.density = None
    preference.motion_preference = None
    await db.commit()
    await db.refresh(preference)
    return preference
