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
from sqlalchemy import delete, select

from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.admin.models import AuditLog
from app.services.clinical_review import router as clinical_review_router
from app.services.clinical_review import service as clinical_review_service
from app.services.clinical_review.models import ConsultantClient
from app.services.ingredients.models import Ingredient
from app.services.progress.models import ProgressImage
from app.services.progress.service import upload_progress_photo
from app.services.recommendations.models import Product, ProductIngredient
from app.services.routines import constants
from app.services.routines.service import get_or_generate_routines
from app.services.skin_profile.models import SkinType
from app.services.skin_profile.schemas import SkinProfileCreate
from app.services.skin_profile.service import create_profile

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


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


# --- Routine-overwrite (M3R Phase 5 Task 4) ---
# Real HTTP round trip, same shape as the analytics/photos tests above: a
# committed client skin profile + generated routines (real single-writer
# `routines_service.get_or_generate_routines`, not fixture rows), then the 4
# new assignment-gated mutation endpoints exercised over `client`.


async def test_client_routine_step_crud_over_http_is_assigned_and_audited(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """An assigned professional can search the client's product catalog, add a
    step, edit it, and delete it — each mutation reusing the exact same
    `routines_service.add_step/update_step/delete_step` the client's own editor
    calls, and each one leaves a real audit-log row behind."""
    professional_id, client_user_id = router_professional_and_client
    async with async_session_factory() as session:
        await create_profile(
            session,
            client_user_id,
            SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
        )
        routines = await get_or_generate_routines(session, client_user_id)
    pm_routine_id = next(r.routine_id for r in routines if r.routine_type == "PM")

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        search = await client.get(
            f"/api/v1/clients/{client_user_id}/routines/products/search",
            params={"category": "Sunscreen", "q": ""},
        )
        assert search.status_code == 200
        products = search.json()
        assert products, "seed catalog should have at least one Sunscreen product"

        added = await client.post(
            f"/api/v1/clients/{client_user_id}/routines/{pm_routine_id}/steps",
            json={"step_name": "Sunscreen", "product_id": products[0]["product_id"]},
        )
        assert added.status_code == 200
        added_body = added.json()
        new_step = next(s for s in added_body["steps"] if s["step_name"] == "Sunscreen")
        step_id = new_step["step_id"]
        assert new_step["products"][0]["product"]["product_id"] == products[0]["product_id"]

        updated = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/steps/{step_id}",
            json={"usage_notes": "Apply generously every morning."},
        )
        assert updated.status_code == 200
        updated_step = next(s for s in updated.json()["steps"] if s["step_id"] == step_id)
        assert updated_step["products"][0]["usage_notes"] == "Apply generously every morning."

        deleted = await client.delete(f"/api/v1/clients/{client_user_id}/routines/steps/{step_id}")
        assert deleted.status_code == 200
        assert step_id not in {s["step_id"] for s in deleted.json()["steps"]}
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    async with async_session_factory() as session:
        audit_rows = (
            (
                await session.execute(
                    select(AuditLog).where(
                        AuditLog.actor_user_id == professional_id,
                        AuditLog.action == "routine_step_overwrite",
                    )
                )
            )
            .scalars()
            .all()
        )
        # add_step + update_step + delete_step: one audited row each.
        assert len(audit_rows) == 3
        await session.execute(delete(AuditLog).where(AuditLog.actor_user_id == professional_id))
        await session.commit()


async def test_client_routine_step_endpoints_unassigned_returns_404_and_no_mutation(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """A professional with no real assignment to this client gets the same
    404-on-unassigned behavior as every other `/clients/{user_id}/*` route, and
    the client's routine is left completely untouched."""
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"
    async with async_session_factory() as session:
        await session.execute(
            external_user_table.insert().values(
                id=other_professional_id,
                email=f"{other_professional_id}@test.invalid",
                name="Other Professional",
                emailVerified=False,
            )
        )
        await session.commit()
        await create_profile(
            session,
            client_user_id,
            SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS),
        )
        routines = await get_or_generate_routines(session, client_user_id)
    am_routine = next(r for r in routines if r.routine_type == "AM")
    existing_step_id = am_routine.steps[0].step_id

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        search = await client.get(
            f"/api/v1/clients/{client_user_id}/routines/products/search",
            params={"category": "Sunscreen", "q": ""},
        )
        added = await client.post(
            f"/api/v1/clients/{client_user_id}/routines/{am_routine.routine_id}/steps",
            json={"step_name": "Sunscreen", "product_id": 1},
        )
        updated = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/steps/{existing_step_id}",
            json={"usage_notes": "should not persist"},
        )
        deleted = await client.delete(
            f"/api/v1/clients/{client_user_id}/routines/steps/{existing_step_id}"
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)
        async with async_session_factory() as session:
            await session.execute(
                delete(external_user_table).where(external_user_table.c.id == other_professional_id)
            )
            await session.commit()

    assert search.status_code == 404
    assert added.status_code == 404
    assert updated.status_code == 404
    assert deleted.status_code == 404

    async with async_session_factory() as session:
        audit_rows = (
            (
                await session.execute(
                    select(AuditLog).where(AuditLog.actor_user_id == other_professional_id)
                )
            )
            .scalars()
            .all()
        )
        assert audit_rows == []
        # Confirm the mutation attempts never touched the real step.
        current = await get_or_generate_routines(session, client_user_id)
        current_am = next(r for r in current if r.routine_type == "AM")
        assert existing_step_id in {s.step_id for s in current_am.steps}


async def test_add_and_swap_client_routine_step_rejects_unsafe_product(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """Same allergy/avoid-gate safety net a user's own edit gets
    (test_routines_service.py's `test_add_step_rejects_an_avoid_flagged_product` /
    `test_update_step_rejects_an_avoid_flagged_product_swap`) must hold for a
    professional's edit too — reusing `_assert_product_is_safe` through
    `routines_service.add_step`/`update_step`, not a separate check."""
    professional_id, client_user_id = router_professional_and_client
    async with async_session_factory() as session:
        sensitive_id = (
            (await session.execute(select(SkinType).where(SkinType.skin_type_name == "Sensitive")))
            .scalar_one()
            .skin_type_id
        )
        salicylic_acid = (
            await session.execute(
                select(Ingredient).where(Ingredient.ingredient_name == "Salicylic Acid")
            )
        ).scalar_one()
        unsafe_product = Product(
            brand_name="Test Only",
            product_name="Clinical Portal Unsafe Treatment",
            category="Treatment Products",
        )
        session.add(unsafe_product)
        await session.flush()
        session.add(
            ProductIngredient(
                product_id=unsafe_product.product_id,
                ingredient_id=salicylic_acid.ingredient_id,
            )
        )
        await session.commit()
        unsafe_product_id = unsafe_product.product_id

        await create_profile(session, client_user_id, SkinProfileCreate(skin_type_id=sensitive_id))
        routines = await get_or_generate_routines(session, client_user_id)
    am = next(r for r in routines if r.routine_type == "AM")
    treatment_step = next(s for s in am.steps if s.category == constants.TREATMENT)

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        added = await client.post(
            f"/api/v1/clients/{client_user_id}/routines/{am.routine_id}/steps",
            json={"step_name": "Treatment", "product_id": unsafe_product_id},
        )
        updated = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/steps/{treatment_step.step_id}",
            json={"product_id": unsafe_product_id},
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert added.status_code == 400
    assert updated.status_code == 400

    async with async_session_factory() as session:
        audit_rows = (
            (
                await session.execute(
                    select(AuditLog).where(AuditLog.actor_user_id == professional_id)
                )
            )
            .scalars()
            .all()
        )
        # A 400 from the safety gate happens before write_audit_log is ever called.
        assert audit_rows == []
        await session.execute(
            delete(ProductIngredient).where(ProductIngredient.product_id == unsafe_product_id)
        )
        await session.execute(delete(Product).where(Product.product_id == unsafe_product_id))
        await session.commit()
