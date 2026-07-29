"""app/services/recommendations/router.py's POST /recommendations/feedback (M3-D) —
HTTP-layer contract: 204 round-trip, action enum validation. Role/auth matrix lives in
test_rbac.py alongside every other service's."""

from httpx import AsyncClient

from app.core.security import require_user
from app.db.mongo import get_mongo_db
from app.main import app


async def _as(role: str, client: AsyncClient) -> AsyncClient:
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_1",
        "role": role,
        "claims": {},
    }
    return client


async def test_get_recommendations_accepts_a_valid_max_price_query_param(
    client: AsyncClient,
) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/recommendations/me", params={"max_price": 50})
    finally:
        app.dependency_overrides.pop(require_user, None)

    # "user_1" has no real skin profile in this live DB, so get_recommendations
    # short-circuits to [] — the point here is the query param round-trips through
    # routing/validation into a real 200, not the (already-covered-elsewhere)
    # ranking/budget-cap logic itself.
    assert response.status_code == 200
    assert response.json() == []


async def test_get_recommendations_rejects_a_non_positive_max_price(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.get("/api/v1/recommendations/me", params={"max_price": 0})
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 422


async def test_feedback_round_trips_into_mongo(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/recommendations/feedback",
            json={"product_id": 1, "action": "thumbs_up"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 204
    doc = await get_mongo_db()["recommendation_feedback"].find_one(
        {"user_id": "user_1", "product_id": 1, "action": "thumbs_up"}
    )
    try:
        assert doc is not None
        assert doc["created_at"] is not None
    finally:
        await get_mongo_db()["recommendation_feedback"].delete_many({"user_id": "user_1"})


async def test_feedback_rejects_an_unknown_action(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/recommendations/feedback",
            json={"product_id": 1, "action": "not_a_real_action"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 422


async def test_feedback_accepts_an_optional_recommendation_id(client: AsyncClient) -> None:
    await _as("user", client)
    try:
        response = await client.post(
            "/api/v1/recommendations/feedback",
            json={"product_id": 1, "action": "dismissed", "recommendation_id": 42},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)

    assert response.status_code == 204
    doc = await get_mongo_db()["recommendation_feedback"].find_one(
        {"user_id": "user_1", "product_id": 1, "action": "dismissed"}
    )
    try:
        assert doc is not None
        assert doc["recommendation_id"] == 42
    finally:
        await get_mongo_db()["recommendation_feedback"].delete_many({"user_id": "user_1"})
