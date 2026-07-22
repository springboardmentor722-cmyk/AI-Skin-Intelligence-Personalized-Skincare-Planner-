from typing import NamedTuple

import structlog
from redis.exceptions import RedisError

from app.db.redis import get_redis

_logger = structlog.get_logger()

# Rolling per-bucket latency sample store (ARCHITECTURE.md §9: "API response
# time, rec latency, dashboard load ... exposed as real dashboards ... surfaced
# in the Admin monitoring screen", M3-G). Redis, not Postgres — this is a
# rolling operational metric, not a business record, same tier as the existing
# rate-limit counters/caches. A fixed-size list (LPUSH + LTRIM), not a time
# window: the most recent _MAX_SAMPLES requests are always a real, live
# snapshot, and a busy bucket ages out old samples naturally without a
# separate cleanup job.
_KEY_PREFIX = "metrics:latency:"
_MAX_SAMPLES = 500
_TTL_SECONDS = 24 * 60 * 60


class LatencyStats(NamedTuple):
    sample_count: int
    p50_ms: float | None
    p95_ms: float | None


def _percentile(sorted_samples: list[float], fraction: float) -> float:
    index = min(len(sorted_samples) - 1, int(len(sorted_samples) * fraction))
    return round(sorted_samples[index], 1)


async def record_latency(bucket: str, duration_ms: float) -> None:
    """Best-effort — a Redis outage degrades this rolling metric, it must never
    take down the request that triggered it (the same "no dependency outage
    crashes the whole API" principle RateLimitMiddleware already established,
    production-readiness audit, test_rate_limit.py)."""
    try:
        redis = get_redis()
        key = f"{_KEY_PREFIX}{bucket}"
        # redis-py's stubs type these list-command return values as the sync
        # client's plain int/str rather than always-awaitable on this async
        # client — a stub imprecision, not a real type error (same category as
        # app/db/vector.py's documented FAISS stub gaps).
        await redis.lpush(key, duration_ms)  # type: ignore[misc]
        await redis.ltrim(key, 0, _MAX_SAMPLES - 1)  # type: ignore[misc]
        await redis.expire(key, _TTL_SECONDS)
    except RedisError as exc:
        _logger.warning("latency_metrics_unavailable", bucket=bucket, error=str(exc))


async def get_latency_stats(bucket: str) -> LatencyStats:
    """Degrades to an honest empty reading (never a guessed number) if Redis is
    unreachable — same best-effort contract as `record_latency`."""
    try:
        raw = await get_redis().lrange(f"{_KEY_PREFIX}{bucket}", 0, -1)  # type: ignore[misc]
    except RedisError as exc:
        _logger.warning("latency_metrics_unavailable", bucket=bucket, error=str(exc))
        return LatencyStats(sample_count=0, p50_ms=None, p95_ms=None)
    if not raw:
        return LatencyStats(sample_count=0, p50_ms=None, p95_ms=None)
    samples = sorted(float(value) for value in raw)
    return LatencyStats(
        sample_count=len(samples),
        p50_ms=_percentile(samples, 0.50),
        p95_ms=_percentile(samples, 0.95),
    )
