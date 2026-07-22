"""app/core/logging.py's RequestIdMiddleware — now also records real request
duration into app/core/metrics.py's rolling latency store (M3-G,
ARCHITECTURE.md §9). Real HTTP round trip through the actual app + real Redis,
not a mocked ASGI scope."""

from httpx import AsyncClient

from app.core.metrics import get_latency_stats
from app.db.redis import get_redis


async def _clear(bucket: str) -> None:
    await get_redis().delete(f"metrics:latency:{bucket}")


async def test_a_request_records_a_real_sample_in_the_api_bucket(client: AsyncClient) -> None:
    await _clear("api")

    response = await client.get("/health")

    assert response.status_code == 200
    stats = await get_latency_stats("api")
    assert stats.sample_count >= 1


async def test_a_recommendations_request_also_records_into_its_own_bucket(
    client: AsyncClient,
) -> None:
    await _clear("recommendations")

    # 401 (no auth) is fine — the middleware times every request regardless of
    # what the route handler decides, same as any real reverse-proxy latency log.
    await client.get("/api/v1/recommendations/me")

    stats = await get_latency_stats("recommendations")
    assert stats.sample_count >= 1
