from app.db.redis import get_redis

_CACHE_PATTERN = "recommendation:cache:*"


async def invalidate_recommendation_cache_for_catalog_change() -> None:
    """AI_ML.md's recommendation pipeline: cache "INVALIDATED on any profile/
    preference/catalog change" (profile changes already invalidate their own single
    key directly, skin_profile/service.py). A catalog change (a product upsert/
    delete via the outbox) can affect any number of already-cached users' top-N
    sets, and nothing tracks which specific users had the changed product in their
    cache — a full flush of every cached recommendation set is the honest,
    correct invalidation here, not a surgical per-user diff this data doesn't
    support (M3-D)."""
    redis = get_redis()
    async for key in redis.scan_iter(match=_CACHE_PATTERN):
        await redis.delete(key)
