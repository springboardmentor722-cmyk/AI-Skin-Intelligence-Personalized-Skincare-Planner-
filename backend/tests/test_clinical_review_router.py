"""app/services/clinical_review/router.py — HTTP-layer contract for `GET
/clients/me`: confirms the `?q=` search param and the response's compliance
fields really reach an assigned client over a real HTTP round trip, not just at
the service-function level (test_clinical_review_service.py, which uses the
`db_session` rollback fixture the real router's `get_db` doesn't get). Role/
verification-gating matrix lives in test_rbac.py — this file only exercises the
already-approved-professional path via a direct dependency override, same
shape as test_progress_router.py/test_ingredients_router.py's `router_test_user`/
`assigned_consultant_and_client` fixtures.
"""

import io
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from PIL import Image
from sqlalchemy import delete

from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.clinical_review import router as clinical_review_router
from app.services.clinical_review import service as clinical_review_service
from app.services.clinical_review.models import ConsultantClient
from app.services.progress.models import ProgressImage
from app.services.progress.service import upload_progress_photo


def _real_jpeg_bytes() -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4), color="blue").save(buffer, format="JPEG")
    return buffer.getvalue()


@pytest.fixture
async def router_professional_and_client() -> AsyncGenerator[tuple[str, str], None]:
    # The `client` fixture hits the real `get_db` (no rollback wrapper, unlike
    # `db_session`) — a real assignment + search round trip needs a real, committed
    # professional + client user row, cleaned up after.
    professional_id = f"test-roster-professional-{uuid.uuid4().hex[:16]}"
    client_user_id = f"test-roster-client-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=professional_id,
                email=f"{professional_id}@test.invalid",
                name="Test Professional",
                emailVerified=False,
            )
        )
        await session.execute(
            external_user_table.insert().values(
                id=client_user_id,
                email=f"{client_user_id}@test.invalid",
                name="Searchable Roster Client",
                emailVerified=False,
            )
        )
        await session.commit()
        # create_assignment commits internally.
        await clinical_review_service.create_assignment(session, professional_id, client_user_id)
    try:
        yield professional_id, client_user_id
    finally:
        async with async_session_factory() as session:
            await session.execute(
                delete(ConsultantClient).where(ConsultantClient.user_id == client_user_id)
            )
            await session.execute(
                delete(ProgressImage).where(ProgressImage.user_id == client_user_id)
            )
            await session.execute(
                delete(external_user_table).where(
                    external_user_table.c.id.in_([professional_id, client_user_id])
                )
            )
            await session.commit()


async def test_get_my_clients_q_param_filters_over_http(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """`_professional` (require_verified_professional's composed dependency, not
    the raw `require_user`) is the exact object this router's routes declare via
    `Depends(_professional)` — overriding it directly skips both role-checking and
    the DB verification-status lookup, the same "fake the top of this router's own
    dependency chain" shape test_progress_router.py uses for `require_user`."""
    professional_id, client_user_id = router_professional_and_client
    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        match = await client.get("/api/v1/clients/me", params={"q": "Searchable Roster"})
        miss = await client.get("/api/v1/clients/me", params={"q": "no-such-name-at-all"})
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert match.status_code == 200
    match_body = match.json()
    assert match_body["meta"]["total"] == 1
    assert [item["user_id"] for item in match_body["items"]] == [client_user_id]
    # The response also carries the new compliance fields end to end (a brand-new
    # assignment has no routine_logs history yet, so the honest-None case).
    assert match_body["items"][0]["compliance_seven_day"] is None
    assert match_body["items"][0]["compliance_thirty_day"] is None

    assert miss.status_code == 200
    miss_body = miss.json()
    assert miss_body["meta"]["total"] == 0
    assert miss_body["items"] == []


async def test_get_client_analytics_assigned_ok_unassigned_404(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """`GET /clients/{user_id}/analytics` — thin assignment-gated wrapper around
    `analytics_service.get_my_analytics` (M3R Phase 5 patient inspection timeline).
    An assigned professional gets the real `AnalyticsMeRead` shape back; a
    professional with no assignment to this user gets the same 404-on-unassigned
    behavior as every other `/clients/{user_id}/*` route."""
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"
    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        ok = await client.get(f"/api/v1/clients/{client_user_id}/analytics")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert ok.status_code == 200
    ok_body = ok.json()
    assert "score_vs_adherence" in ok_body
    assert "correlations" in ok_body
    assert "compliance" in ok_body

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden = await client.get(f"/api/v1/clients/{client_user_id}/analytics")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden.status_code == 404


async def test_get_client_photos_assigned_ok_unassigned_404(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """`GET /clients/{user_id}/photos` — thin assignment-gated wrapper around
    `progress_service.get_progress_photos` (M3R Phase 5 Baseline vs Current
    comparison). An assigned professional sees the real before/after pair over
    two seeded photos; a professional with no assignment gets the same
    404-on-unassigned behavior as every other `/clients/{user_id}/*` route."""
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    async with async_session_factory() as session:
        await upload_progress_photo(session, client_user_id, _real_jpeg_bytes(), "before.jpg")
        await upload_progress_photo(session, client_user_id, _real_jpeg_bytes(), "after.jpg")

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        ok = await client.get(f"/api/v1/clients/{client_user_id}/photos")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert ok.status_code == 200
    ok_body = ok.json()
    assert len(ok_body["photos"]) == 2
    assert ok_body["before"]["image_stage"] == "Baseline"
    assert ok_body["after"] is not None
    assert ok_body["after"]["url"]  # a real presigned URL, not blank

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden = await client.get(f"/api/v1/clients/{client_user_id}/photos")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden.status_code == 404
