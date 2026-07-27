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


async def test_safety_score_flags_a_known_unsafe_pairing(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            json={"ingredient_ids": [1, 9], "routine_time": "PM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    body = response.json()
    assert body["label"] in ("Warning", "Unsafe")
    assert len(body["interaction_warnings"]) == 1


async def test_safety_score_rejects_empty_ingredient_list(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            json={"ingredient_ids": [], "routine_time": "AM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_safety_score_professional_without_assignment_gets_404(
    client: AsyncClient,
) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": "consultant_1",
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            params={"client_user_id": "some-unassigned-user"},
            json={"ingredient_ids": [2], "routine_time": "AM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 404
