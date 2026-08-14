"""
Redis cache layer, matching the "Redis Cache (In-Memory)" box in the
architecture spec: Session Store, Cache Data, User State, Quick Lookup,
Temporary Data.

Used here for:
- Caching the latest computed skin health score per user (avoid recomputation
  on every dashboard load)
- Caching product recommendation results per user for a short TTL
- A simple "user is online / last seen" quick-lookup key

Falls back gracefully to "no caching" if Redis isn't running, so local dev
without Redis still works -- everything just recomputes every time instead
of being served from cache.
"""
import os
import json
import logging

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

_client = None
_redis_available = False

try:
    import redis

    _client = redis.from_url(REDIS_URL, decode_responses=True, socket_connect_timeout=2)
    _client.ping()
    _redis_available = True
    logger.info("Connected to Redis at %s", REDIS_URL)
except Exception as e:  # noqa: BLE001
    logger.warning("Redis not available (%s). Caching disabled; app will recompute on every request.", e)
    _redis_available = False


def is_redis_available() -> bool:
    return _redis_available


def cache_set(key: str, value: dict, ttl_seconds: int = 300):
    if not _redis_available:
        return
    try:
        _client.set(key, json.dumps(value), ex=ttl_seconds)
    except Exception as e:  # noqa: BLE001
        logger.warning("Redis cache_set failed: %s", e)


def cache_get(key: str):
    if not _redis_available:
        return None
    try:
        raw = _client.get(key)
        return json.loads(raw) if raw else None
    except Exception as e:  # noqa: BLE001
        logger.warning("Redis cache_get failed: %s", e)
        return None


def cache_delete(key: str):
    if not _redis_available:
        return
    try:
        _client.delete(key)
    except Exception as e:  # noqa: BLE001
        logger.warning("Redis cache_delete failed: %s", e)


def mark_user_active(user_id: int):
    """Quick-lookup 'last seen' key, TTL-based so it naturally expires."""
    if not _redis_available:
        return
    try:
        _client.set(f"user_active:{user_id}", "1", ex=300)
    except Exception:  # noqa: BLE001
        pass


def is_user_active(user_id: int) -> bool:
    if not _redis_available:
        return False
    try:
        return _client.exists(f"user_active:{user_id}") == 1
    except Exception:  # noqa: BLE001
        return False
