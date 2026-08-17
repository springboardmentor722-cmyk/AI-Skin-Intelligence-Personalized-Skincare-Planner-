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

import datetime
import io
import uuid
from collections.abc import AsyncGenerator

import pytest
from httpx import AsyncClient
from PIL import Image
from sqlalchemy import delete, select

from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory, external_user_table
from app.main import app
from app.services.admin.models import AuditLog
from app.services.clinical_review import router as clinical_review_router
from app.services.clinical_review import service as clinical_review_service
from app.services.clinical_review.models import ConsultantClient
from app.services.ingredients.models import Ingredient
from app.services.progress.models import ProgressImage
from app.services.progress.service import upload_progress_photo
from app.services.recommendations.models import Product, ProductIngredient, ProductRecommendation
from app.services.reports.models import ProgressReport
from app.services.routines import constants
from app.services.routines.service import get_or_generate_routines
from app.services.scores.service import compute_and_store_score
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


async def test_get_client_assessments_and_detail_assigned_ok_unassigned_404(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """`GET /clients/{user_id}/assessments` + `/assessments/{score_id}` (Consultant
    Assessments page) — same assignment-gated shape as the analytics/photos routes
    above, over a real committed skin profile + computed score."""
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    async with async_session_factory() as session:
        await create_profile(
            session, client_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
        )
        computed = await compute_and_store_score(session, client_user_id)

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        history = await client.get(f"/api/v1/clients/{client_user_id}/assessments")
        detail = await client.get(
            f"/api/v1/clients/{client_user_id}/assessments/{computed.score_id}"
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert history.status_code == 200
    history_body = history.json()
    assert len(history_body) == 1
    assert history_body[0]["score_id"] == computed.score_id

    assert detail.status_code == 200
    detail_body = detail.json()
    assert detail_body["score_id"] == computed.score_id
    assert detail_body["weights"] is not None

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden_history = await client.get(f"/api/v1/clients/{client_user_id}/assessments")
        forbidden_detail = await client.get(
            f"/api/v1/clients/{client_user_id}/assessments/{computed.score_id}"
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden_history.status_code == 404
    assert forbidden_detail.status_code == 404


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


# --- Consultant-authored routines (ADR-050) ---


async def test_client_routine_lifecycle_over_http_is_assigned_and_audited(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    """Create -> list -> duplicate -> activate/deactivate -> reorder, all over the
    real HTTP round trip, each ownership-gated the same way as the step wrappers,
    and each leaving a real audit-log row (admin_service.write_audit_log)."""
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        created = await client.post(
            f"/api/v1/clients/{client_user_id}/routines",
            json={"routine_name": "Consultant Custom", "routine_type": "Custom"},
        )
        assert created.status_code == 200
        created_body = created.json()
        assert created_body["created_by_professional_id"] == professional_id
        routine_id = created_body["routine_id"]

        listed = await client.get(f"/api/v1/clients/{client_user_id}/routines")
        assert listed.status_code == 200
        assert any(r["routine_id"] == routine_id for r in listed.json())

        duplicated = await client.post(
            f"/api/v1/clients/{client_user_id}/routines/{routine_id}/duplicate"
        )
        assert duplicated.status_code == 200
        duplicate_id = duplicated.json()["routine_id"]
        assert duplicate_id != routine_id

        deactivated = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/{routine_id}",
            json={"is_active": False},
        )
        assert deactivated.status_code == 200
        assert deactivated.json()["is_active"] is False

        reordered = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/{duplicate_id}/steps/reorder",
            json={"step_ids": []},
        )
        assert reordered.status_code == 200
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    async with async_session_factory() as session:
        audit_actions = (
            (
                await session.execute(
                    select(AuditLog.action).where(AuditLog.actor_user_id == professional_id)
                )
            )
            .scalars()
            .all()
        )
    assert "routine_created" in audit_actions
    assert "routine_duplicated" in audit_actions
    assert "routine_activation_changed" in audit_actions
    assert "routine_step_reorder" in audit_actions

    async with async_session_factory() as session:
        # The shared `router_professional_and_client` fixture's teardown deletes
        # the professional's `user` row; audit_logs.actor_user_id has no cascade,
        # so leftover rows here would block that delete with a FK violation —
        # same cleanup precedent as test_client_routine_step_crud_over_http's own.
        await session.execute(delete(AuditLog).where(AuditLog.actor_user_id == professional_id))
        await session.commit()

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden_create = await client.post(
            f"/api/v1/clients/{client_user_id}/routines",
            json={"routine_name": "Should not persist", "routine_type": "Custom"},
        )
        forbidden_list = await client.get(f"/api/v1/clients/{client_user_id}/routines")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden_create.status_code == 404
    assert forbidden_list.status_code == 404


async def test_activate_an_ai_generated_routine_over_http_is_rejected(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    professional_id, client_user_id = router_professional_and_client
    async with async_session_factory() as session:
        await create_profile(
            session, client_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
        )
        routines = await get_or_generate_routines(session, client_user_id)
    am_routine_id = next(r.routine_id for r in routines if r.routine_type == "AM")

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.patch(
            f"/api/v1/clients/{client_user_id}/routines/{am_routine_id}",
            json={"is_active": False},
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert response.status_code == 400


# --- Consultant-assigned recommendations (ADR-051) ---


async def test_client_recommendation_lifecycle_over_http_is_assigned_and_audited(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        created = await client.post(
            f"/api/v1/clients/{client_user_id}/recommendations",
            json={"product_id": 1, "usage_instructions": "Apply nightly.", "frequency": "Daily"},
        )
        assert created.status_code == 200
        created_body = created.json()
        assert created_body["recommended_by_professional_id"] == professional_id
        recommendation_id = created_body["recommendation_id"]

        listed = await client.get(f"/api/v1/clients/{client_user_id}/recommendations")
        assert listed.status_code == 200
        assert listed.json()["meta"]["total"] == 1

        deactivated = await client.patch(
            f"/api/v1/clients/{client_user_id}/recommendations/{recommendation_id}",
            json={"is_active": False},
        )
        assert deactivated.status_code == 200
        assert deactivated.json()["is_active"] is False

        detail = await client.get(f"/api/v1/clients/{client_user_id}/products/1")
        assert detail.status_code == 200
        assert detail.json()["product_id"] == 1

        alternatives = await client.get(f"/api/v1/clients/{client_user_id}/products/1/alternatives")
        assert alternatives.status_code == 200
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    async with async_session_factory() as session:
        audit_actions = (
            (
                await session.execute(
                    select(AuditLog.action).where(AuditLog.actor_user_id == professional_id)
                )
            )
            .scalars()
            .all()
        )
        assert "recommendation_assigned" in audit_actions
        assert "recommendation_activation_changed" in audit_actions
        await session.execute(delete(AuditLog).where(AuditLog.actor_user_id == professional_id))
        await session.commit()

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden_create = await client.post(
            f"/api/v1/clients/{client_user_id}/recommendations",
            json={"product_id": 1},
        )
        forbidden_list = await client.get(f"/api/v1/clients/{client_user_id}/recommendations")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden_create.status_code == 404
    assert forbidden_list.status_code == 404


async def test_deactivate_a_system_served_recommendation_over_http_is_rejected(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    professional_id, client_user_id = router_professional_and_client
    async with async_session_factory() as session:
        row = ProductRecommendation(
            user_id=client_user_id,
            product_id=1,
            recommendation_score=80.0,
            recommendation_reason="System served",
        )
        session.add(row)
        await session.commit()
        await session.refresh(row)
        recommendation_id = row.recommendation_id

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        response = await client.patch(
            f"/api/v1/clients/{client_user_id}/recommendations/{recommendation_id}",
            json={"is_active": False},
        )
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert response.status_code == 400

    async with async_session_factory() as session:
        await session.execute(
            delete(ProductRecommendation).where(
                ProductRecommendation.recommendation_id == recommendation_id
            )
        )
        await session.commit()


# --- Progress tracking (M3R Progress Tracking module) ---


async def test_client_progress_summary_and_logs_assigned_ok_unassigned_404(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    async with async_session_factory() as session:
        await create_profile(
            session, client_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
        )
        await compute_and_store_score(session, client_user_id)

    await get_mongo_db()["progress_logs"].insert_one(
        {
            "user_id": client_user_id,
            "week_number": 1,
            "before_image": None,
            "after_image": None,
            "improvement_score": 5.0,
            "concern_changes": [],
            "trend_summary": "Improving",
            "notes": None,
            "created_at": datetime.datetime.now(datetime.UTC),
        }
    )

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        summary = await client.get(f"/api/v1/clients/{client_user_id}/progress/summary")
        logs = await client.get(f"/api/v1/clients/{client_user_id}/progress/logs")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)
        await get_mongo_db()["progress_logs"].delete_many({"user_id": client_user_id})

    assert summary.status_code == 200
    assert len(summary.json()["points"]) == 1

    assert logs.status_code == 200
    assert len(logs.json()) == 1
    assert logs.json()[0]["trend_summary"] == "Improving"

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "consultant",
        "claims": {},
    }
    try:
        forbidden_summary = await client.get(f"/api/v1/clients/{client_user_id}/progress/summary")
        forbidden_logs = await client.get(f"/api/v1/clients/{client_user_id}/progress/logs")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden_summary.status_code == 404
    assert forbidden_logs.status_code == 404


# --- Reports (Reports nav item, consultant + dermatologist) ---


async def test_client_report_generate_list_download_over_http(
    client: AsyncClient, router_professional_and_client: tuple[str, str]
) -> None:
    professional_id, client_user_id = router_professional_and_client
    other_professional_id = f"test-other-professional-{uuid.uuid4().hex[:16]}"

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": professional_id,
        "role": "dermatologist",
        "claims": {},
    }
    try:
        generated = await client.post(
            f"/api/v1/clients/{client_user_id}/reports/generate",
            json={"report_type": "assessment", "include_profile_header": False},
        )
        assert generated.status_code == 200
        report_id = generated.json()["report_id"]

        listed = await client.get(f"/api/v1/clients/{client_user_id}/reports")
        assert listed.status_code == 200
        assert any(r["report_id"] == report_id for r in listed.json())

        download = await client.get(
            f"/api/v1/clients/{client_user_id}/reports/{report_id}/download"
        )
        assert download.status_code == 200
        assert download.json()["url"].startswith("http")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    async with async_session_factory() as session:
        audit_rows = (
            (
                await session.execute(
                    select(AuditLog).where(
                        AuditLog.actor_user_id == professional_id,
                        AuditLog.action == "client_report_generated",
                    )
                )
            )
            .scalars()
            .all()
        )
        assert len(audit_rows) == 1
        await session.execute(delete(AuditLog).where(AuditLog.actor_user_id == professional_id))
        await session.execute(
            delete(ProgressReport).where(ProgressReport.user_id == client_user_id)
        )
        await session.commit()

    app.dependency_overrides[clinical_review_router._professional] = lambda: {
        "id": other_professional_id,
        "role": "dermatologist",
        "claims": {},
    }
    try:
        forbidden_generate = await client.post(
            f"/api/v1/clients/{client_user_id}/reports/generate",
            json={"report_type": "assessment", "include_profile_header": False},
        )
        forbidden_list = await client.get(f"/api/v1/clients/{client_user_id}/reports")
    finally:
        app.dependency_overrides.pop(clinical_review_router._professional, None)

    assert forbidden_generate.status_code == 404
    assert forbidden_list.status_code == 404
