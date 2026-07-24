"""app/services/ingredients/router.py (M3-B) — HTTP-layer contract: interactions
arity validation, 404s for missing ingredients. Role/auth matrix lives in
test_rbac.py alongside every other service's."""

from httpx import AsyncClient

from app.core.security import require_user
from app.main import app


async def _as(role: str, client: AsyncClient):  # type: ignore[no-untyped-def]
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_1",
        "role": role,
        "claims": {},
    }
    return client


async def test_get_ingredient_404s_for_a_missing_id(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/ingredients/999999")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404


async def test_suitability_404s_for_a_missing_ingredient(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/ingredients/999999/suitability/me")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404


async def test_interactions_rejects_a_single_id(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/ingredients/interactions", params={"ids": "1"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_interactions_rejects_more_than_five_ids(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get(
            "/api/v1/ingredients/interactions", params={"ids": "1,2,3,4,5,6"}
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_interactions_rejects_non_integer_ids(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/ingredients/interactions", params={"ids": "abc,def"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_interactions_accepts_a_valid_id_range(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/ingredients/interactions", params={"ids": "1,4,9"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    assert len(response.json()["pairs"]) == 3  # 3 ids -> 3 pairwise combinations
