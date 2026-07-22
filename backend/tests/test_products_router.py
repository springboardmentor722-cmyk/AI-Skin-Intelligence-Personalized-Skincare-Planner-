"""app/services/recommendations/products_router.py (M3-C) — HTTP-layer contract:
compare arity validation, 404s for missing products. Role/auth matrix lives in
test_rbac.py alongside every other service's."""

from httpx import AsyncClient

from app.core.security import require_user
from app.main import app


async def _as(role: str, client: AsyncClient) -> AsyncClient:
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_1",
        "role": role,
        "claims": {},
    }
    return client


async def test_get_product_404s_for_a_missing_id(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/999999")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404


async def test_alternatives_returns_200_with_an_empty_list_for_a_missing_product(
    client: AsyncClient,
) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/999999/alternatives")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    assert response.json()["alternatives"] == []


async def test_compare_rejects_a_single_id(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/compare", params={"ids": "1"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_compare_rejects_more_than_three_ids(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/compare", params={"ids": "1,2,3,4"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_compare_404s_when_any_id_is_missing(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/compare", params={"ids": "1,999999"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404


async def test_compare_accepts_a_valid_pair(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/products/compare", params={"ids": "1,2"})
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    assert len(response.json()["items"]) == 2
