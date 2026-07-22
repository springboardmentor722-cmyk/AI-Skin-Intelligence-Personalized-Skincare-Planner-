import datetime
from typing import Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.db.outbox import append_outbox
from app.db.redis import get_redis
from app.services.skin_profile.models import (
    SkinConcern,
    SkinProfile,
    SkinProfileConcern,
    SkinType,
)
from app.services.skin_profile.schemas import (
    LifestyleLogCreate,
    LifestyleLogRead,
    SkinProfileConcernRead,
    SkinProfileCreate,
    SkinProfileRead,
)


async def list_skin_types(db: AsyncSession) -> list[SkinType]:
    result = await db.execute(select(SkinType))
    return list(result.scalars().all())


async def list_skin_concerns(db: AsyncSession) -> list[SkinConcern]:
    result = await db.execute(select(SkinConcern))
    return list(result.scalars().all())


async def _read_with_concerns(db: AsyncSession, profile: SkinProfile) -> SkinProfileRead:
    result = await db.execute(
        select(SkinProfileConcern).where(
            SkinProfileConcern.skin_profile_id == profile.skin_profile_id
        )
    )
    concerns = list(result.scalars().all())
    return SkinProfileRead(
        skin_profile_id=profile.skin_profile_id,
        skin_type_id=profile.skin_type_id,
        age_group=profile.age_group,
        allergies=profile.allergies,
        sensitivities=profile.sensitivities,
        concerns=[
            SkinProfileConcernRead(
                concern_id=c.concern_id,
                severity_rating=c.severity_rating,
                priority_level=c.priority_level,
            )
            for c in concerns
        ],
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


async def list_profile_history(db: AsyncSession, user_id: str) -> list[SkinProfileRead]:
    """Interface function (ADR-005) — Progress Tracking's weekly `concern_changes`
    (M3-E) reads every saved profile version (oldest first) through this, never
    `skin_profiles` directly. Every prior version is kept, never overwritten
    (create_profile's own docstring), so this is a real history, not a
    reconstruction."""
    result = await db.execute(
        select(SkinProfile)
        .where(SkinProfile.user_id == user_id, SkinProfile.is_deleted.is_(False))
        .order_by(SkinProfile.created_at.asc())
    )
    return [await _read_with_concerns(db, profile) for profile in result.scalars().all()]


async def get_current_profile(db: AsyncSession, user_id: str) -> SkinProfileRead | None:
    result = await db.execute(
        select(SkinProfile).where(
            SkinProfile.user_id == user_id,
            SkinProfile.is_current.is_(True),
            SkinProfile.is_deleted.is_(False),
        )
    )
    profile = result.scalar_one_or_none()
    if profile is None:
        return None
    return await _read_with_concerns(db, profile)


async def create_profile(
    db: AsyncSession, user_id: str, data: SkinProfileCreate
) -> SkinProfileRead:
    # Prior versions are kept (is_current=False), never overwritten — SkinProfile's own
    # docstring in models.py. Saving invalidates the recommendation cache, docs/WIREFRAMES.md
    # "4. Skin profile & lifestyle": "saving a profile invalidates recommendation:cache:{user_id}".
    await db.execute(
        update(SkinProfile)
        .where(SkinProfile.user_id == user_id, SkinProfile.is_current.is_(True))
        .values(is_current=False)
    )

    profile = SkinProfile(
        user_id=user_id,
        skin_type_id=data.skin_type_id,
        age_group=data.age_group,
        allergies=data.allergies,
        sensitivities=data.sensitivities,
    )
    db.add(profile)
    await db.flush()  # assigns profile.skin_profile_id without committing yet

    for concern in data.concerns:
        db.add(
            SkinProfileConcern(
                skin_profile_id=profile.skin_profile_id,
                concern_id=concern.concern_id,
                severity_rating=concern.severity_rating,
                priority_level=concern.priority_level,
            )
        )

    # M3-A: outbox row now, even though the worker's user_profiles_namespace consumer
    # doesn't land until M3-D's recommender — appending here means no re-derivation of
    # "what changed since" once that consumer exists (ADR-010).
    await append_outbox(db, "profile", user_id, "upsert")

    await db.commit()
    await db.refresh(profile)

    await get_redis().delete(f"recommendation:cache:{user_id}")

    return await _read_with_concerns(db, profile)


# --- Lifestyle logs (Mongo) ---

_LIFESTYLE_COLLECTION = "lifestyle_logs"


async def upsert_lifestyle_log(user_id: str, data: LifestyleLogCreate) -> LifestyleLogRead:
    collection = get_mongo_db()[_LIFESTYLE_COLLECTION]
    log_datetime = datetime.datetime.combine(data.log_date, datetime.time.min)
    logged_at = datetime.datetime.now(datetime.UTC)

    document = data.model_dump(mode="json")
    document["user_id"] = user_id
    document["log_date"] = log_datetime
    document["logged_at"] = logged_at

    # One doc per user per day — mongodb schema v3's documented unique index.
    await collection.update_one(
        {"user_id": user_id, "log_date": log_datetime},
        {"$set": document},
        upsert=True,
    )
    return LifestyleLogRead(**data.model_dump(), logged_at=logged_at)


async def list_recent_lifestyle_logs(user_id: str, limit: int = 30) -> list[dict[str, Any]]:
    collection = get_mongo_db()[_LIFESTYLE_COLLECTION]
    cursor = collection.find({"user_id": user_id}).sort("log_date", -1).limit(limit)
    return [doc async for doc in cursor]
