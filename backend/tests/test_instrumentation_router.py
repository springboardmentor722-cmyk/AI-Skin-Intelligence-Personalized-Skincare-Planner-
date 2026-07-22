"""app/services/instrumentation/router.py (M3-G) — the dashboard-TTI reporting
endpoint. Real round trip into app/core/metrics.py's rolling store."""

from httpx import AsyncClient

from app.core.metrics import get_latency_stats
from app.core.security import require_user
from app.db.redis import get_redis
from app.main import app


async def _as(role: str, client: AsyncClient) -> AsyncClient:
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_instrumentation_test",
        "role": role,
        "claims": {},
    }
    return client


async def test_report_dashboard_tti_round_trips_into_the_latency_store(
    client: AsyncClient,
) -> None:
    await get_redis().delete("metrics:latency:dashboard_tti")
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/instrumentation/dashboard-tti", json={"duration_ms": 1200.0}
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
        await get_redis().delete("metrics:latency:dashboard_tti")

    assert response.status_code == 204


async def test_report_dashboard_tti_rejects_a_nonsensical_negative_duration(
    client: AsyncClient,
) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/instrumentation/dashboard-tti", json={"duration_ms": -5.0}
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_report_dashboard_tti_accepts_any_signed_in_role(client: AsyncClient) -> None:
    await get_redis().delete("metrics:latency:dashboard_tti")
    await _as("admin", client)
    try:
        response = await client.post(
            "/api/v1/instrumentation/dashboard-tti", json={"duration_ms": 900.0}
        )
        assert response.status_code == 204
        stats = await get_latency_stats("dashboard_tti")
        assert stats.sample_count == 1
    finally:
        app.dependency_overrides.pop(require_user, None)
        await get_redis().delete("metrics:latency:dashboard_tti")
