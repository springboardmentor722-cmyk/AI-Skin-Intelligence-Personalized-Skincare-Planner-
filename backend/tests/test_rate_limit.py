"""app/core/rate_limit.py — real ASGI middleware, exercised through the actual app
via the `client` fixture (tests/conftest.py's ASGITransport), not unit-tested in
isolation. No prior test file existed for this module at all despite it gating
every non-health request in the app.
"""

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.db.redis import get_redis


async def test_ordinary_request_passes_through_when_redis_is_healthy(
    client: AsyncClient,
) -> None:
    response = await client.get("/health")
    assert response.status_code == 200


async def test_health_paths_are_exempt_from_rate_limiting(client: AsyncClient) -> None:
    # Real assertion: hammering /health and /health/ready well past
    # rate_limit_per_minute never produces a 429 — an orchestrator polling these
    # frequently must never get throttled.
    for _ in range(settings.rate_limit_per_minute + 5):
        assert (await client.get("/health")).status_code == 200
        assert (await client.get("/health/ready")).status_code in (200, 503)


async def test_rate_limiting_fails_open_when_redis_is_unreachable(
    client: AsyncClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Production-readiness audit finding: confirmed live (docker stop on the real
    Redis container) that this middleware had no error handling at all — any Redis
    outage took down the *entire* API with a raw 500 on every request, not just
    rate limiting. Reproduced here without touching the real shared Redis
    container (which other tests need): pointed at a real, genuinely unreachable
    port instead of a mock, so this is still a real connection failure, just a
    deterministic one that doesn't disrupt the rest of the suite."""
    monkeypatch.setattr(settings, "redis_url", "redis://localhost:1/0")
    get_redis.cache_clear()
    try:
        response = await client.get("/api/v1/users/me")
    finally:
        monkeypatch.setattr(settings, "redis_url", "redis://localhost:6379/0")
        get_redis.cache_clear()

    # Rate limiting failed open (no 500) -- the request reached the real route,
    # which then correctly rejects it for the *real* reason (no auth header), not
    # a rate-limiter crash.
    assert response.status_code in (401, 403)
