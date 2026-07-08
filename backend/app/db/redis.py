from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import settings


@lru_cache(maxsize=1)
def get_redis() -> Redis:
    """Key patterns per database_schemas/skinlytics_infrastructure_layer_v2.txt —
    every key here must carry a TTL (volatile-lru eviction, see docker-compose.yml)."""
    return Redis.from_url(settings.redis_url, decode_responses=True)
