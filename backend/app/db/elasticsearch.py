from functools import lru_cache

from elasticsearch import AsyncElasticsearch

from app.core.config import settings


@lru_cache(maxsize=1)
def get_elasticsearch() -> AsyncElasticsearch:
    """Lazy client — nothing connects until the first real call. Only
    app/worker/ ever writes through this (ADR-005 single-writer rule); services
    read via the owning service's interface functions, never this client directly."""
    return AsyncElasticsearch(settings.elasticsearch_url)


async def is_elasticsearch_available() -> bool:
    """Absent-safe health check — callers fall back to a documented degraded path
    (`"source": "fallback"` in the response envelope) rather than erroring."""
    try:
        return bool(await get_elasticsearch().ping())
    except Exception:
        return False
