"""app/services/ingredients/router.py (M3-B) — HTTP-layer contract: interactions
arity validation, 404s for missing ingredients. Role/auth matrix lives in
test_rbac.py alongside every other service's."""

import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from sqlalchemy import delete

from app.core.security import require_user
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.clinical_review import service as clinical_review_service
from app.services.clinical_review.models import ConsultantClient
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.models import SkinProfile
from app.services.skin_profile.schemas import SkinProfileCreate


async def _as(role: str, client: AsyncClient):  # type: ignore[no-untyped-def]
    app.dependency_overrides[require_user] = lambda: {
        "id": f"{role}_1",
        "role": role,
        "claims": {},
    }
    return client


@pytest.fixture
async def assigned_consultant_and_client() -> AsyncGenerator[tuple[str, str], None]:
    # The `client` fixture hits the real `get_db` (no rollback wrapper, unlike
    # `db_session`) — exercising `verify_assignment`'s allow-path for real needs a
    # real, committed consultant + client user, a real skin profile, and a real
    # `consultant_clients` row, cleaned up after (same pattern as
    # test_progress_router.py's `router_test_user` fixture).
    consultant_id = f"test-safety-consultant-{uuid.uuid4().hex[:16]}"
    client_user_id = f"test-safety-client-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=consultant_id,
                email=f"{consultant_id}@test.invalid",
                name="Test Consultant",
                emailVerified=False,
            )
        )
        await session.execute(
            external_user_table.insert().values(
                id=client_user_id,
                email=f"{client_user_id}@test.invalid",
                name="Test Client",
                emailVerified=False,
            )
        )
        await session.commit()
        await skin_profile_service.create_profile(
            session, client_user_id, SkinProfileCreate(skin_type_id=1, concerns=[])
        )
        await clinical_review_service.create_assignment(session, consultant_id, client_user_id)
    try:
        yield consultant_id, client_user_id
    finally:
        async with async_session_factory() as session:
            await session.execute(
                delete(ConsultantClient).where(ConsultantClient.user_id == client_user_id)
            )
            await session.execute(
                delete(SkinProfile).where(SkinProfile.user_id == client_user_id)
            )
            await session.execute(
                delete(external_user_table).where(
                    external_user_table.c.id.in_([consultant_id, client_user_id])
                )
            )
            await session.commit()


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


async def test_safety_score_works_for_a_consultant_with_a_real_assignment(
    client: AsyncClient, assigned_consultant_and_client: tuple[str, str]
) -> None:
    # Exercises `verify_assignment`'s allow-path for real (a genuine, committed
    # consultant_clients row), unlike the vacuous service-level test this replaces
    # (test_ingredients_service.py never had assignment-checking logic to exercise —
    # that check lives only in this router).
    consultant_id, client_user_id = assigned_consultant_and_client
    app.dependency_overrides[require_user] = lambda: {
        "id": consultant_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.post(
            "/api/v1/ingredients/safety-score",
            params={"client_user_id": client_user_id},
            json={"ingredient_ids": [2], "routine_time": "AM"},
        )
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
