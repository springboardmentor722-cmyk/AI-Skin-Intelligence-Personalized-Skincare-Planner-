"""app/core/metrics.py — a rolling Redis-backed latency sample store
(ARCHITECTURE.md §9: "API response time, rec latency, dashboard load ... exposed
as real dashboards ... surfaced in the Admin monitoring screen"). Real Redis
round trip, this repo's established testing philosophy — no mocks."""

import pytest

from app.core.config import settings
from app.core.metrics import get_latency_stats, record_latency
from app.db.redis import get_redis

_TEST_BUCKET = "test-bucket"


async def _clear() -> None:
    await get_redis().delete(f"metrics:latency:{_TEST_BUCKET}")


async def test_get_latency_stats_is_empty_before_any_sample_recorded() -> None:
    await _clear()
    stats = await get_latency_stats(_TEST_BUCKET)
    assert stats.sample_count == 0
    assert stats.p50_ms is None
    assert stats.p95_ms is None


async def test_record_latency_and_get_latency_stats_round_trip() -> None:
    await _clear()
    try:
        for duration_ms in [10.0, 20.0, 30.0, 40.0, 50.0]:
            await record_latency(_TEST_BUCKET, duration_ms)

        stats = await get_latency_stats(_TEST_BUCKET)

        assert stats.sample_count == 5
        assert stats.p50_ms == 30.0
        assert stats.p95_ms == 50.0
    finally:
        await _clear()


async def test_record_latency_caps_the_rolling_window() -> None:
    await _clear()
    try:
        from app.core.metrics import _MAX_SAMPLES

        for i in range(_MAX_SAMPLES + 50):
            await record_latency(_TEST_BUCKET, float(i))

        stats = await get_latency_stats(_TEST_BUCKET)

        assert stats.sample_count == _MAX_SAMPLES
    finally:
        await _clear()


async def test_record_latency_and_get_latency_stats_degrade_when_redis_is_unreachable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Same real-outage reproduction as test_rate_limit.py's own fails-open test —
    a genuinely unreachable port, not a mock. Neither function may raise: a
    metrics-store outage must never crash the request that triggered it."""
    monkeypatch.setattr(settings, "redis_url", "redis://localhost:1/0")
    get_redis.cache_clear()
    try:
        await record_latency(_TEST_BUCKET, 42.0)  # must not raise
        stats = await get_latency_stats(_TEST_BUCKET)
    finally:
        monkeypatch.setattr(settings, "redis_url", "redis://localhost:6379/0")
        get_redis.cache_clear()

    assert stats.sample_count == 0
    assert stats.p50_ms is None
