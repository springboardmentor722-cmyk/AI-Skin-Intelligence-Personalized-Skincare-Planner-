from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.user.models import UserProfile
from app.services.user.schemas import UserProfileUpdate


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
