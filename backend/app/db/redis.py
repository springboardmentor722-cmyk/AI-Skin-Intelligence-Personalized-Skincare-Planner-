from functools import lru_cache

from redis.asyncio import Redis

from app.core.config import settings


@lru_cache(maxsize=1)
def get_redis() -> Redis:
    """Key patterns per database_schemas/skinlytics_infrastructure_layer_v2.txt —
    every key here must carry a TTL (volatile-lru eviction, see docker-compose.yml)."""
    # redis-py 5.x's own stubs type from_url as returning Any (fixed in later major
    # versions) — capped to <6 here for arq's dependency (M3-A, pyproject.toml).
    client: Redis = Redis.from_url(settings.redis_url, decode_responses=True)
    return client
