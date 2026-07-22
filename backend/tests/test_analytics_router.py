"""app/services/analytics/router.py (M3-F) — HTTP-layer contract: real requests
return 200 with the documented shape. Role/auth matrix lives in test_rbac.py."""

from httpx import AsyncClient

from app.core.security import require_user
from app.main import app


async def _as(role: str, client: AsyncClient) -> AsyncClient:
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_analytics_router_test",
        "role": role,
        "claims": {},
    }
    return client


async def test_get_my_analytics_returns_the_documented_shape(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/analytics/me")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200
    body = response.json()
    assert "score_vs_adherence" in body
    assert "correlations" in body
    assert len(body["correlations"]) == 2


async def test_get_admin_analytics_returns_the_documented_shape(client: AsyncClient) -> None:
    await _as("admin", client)
    try:
        response = await client.get("/api/v1/analytics/admin")
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 200
    body = response.json()
    assert "total_assessments" in body
    assert "recommendation_acceptance" in body
    assert "adherence_distribution" in body
