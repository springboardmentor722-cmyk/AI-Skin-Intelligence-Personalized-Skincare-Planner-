"""Branch 6 (feature/admin-panel) — `list_all_ingredients` (Admin's read-only
Ingredient Management view). M3-B adds the real Ingredient Intelligence surface
below: list/detail/suitability/interactions, real Postgres/ES/Mongo round trips
against the live seeded catalog (repo pattern, no mocks). Retinol (ingredient_id=1)
has a real seeded avoid_for Sensitive-skin record, used throughout."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.mongo import get_mongo_db
from app.db.postgres import external_user_table
from app.services.clinical_review import service as clinical_review_service
from app.services.ingredients import service
from app.services.ingredients.service import list_all_ingredients
from app.services.skin_profile.schemas import SkinProfileCreate
from app.services.skin_profile.service import create_profile


async def test_list_all_ingredients_paginates_over_real_seeded_data(
    db_session: AsyncSession,
) -> None:
    page_one, total = await list_all_ingredients(db_session, page=1, page_size=2)

    assert total >= len(page_one)
    assert len(page_one) <= 2
    if total > 2:
        page_two, _total = await list_all_ingredients(db_session, page=2, page_size=2)
        assert {i.ingredient_id for i in page_one}.isdisjoint({i.ingredient_id for i in page_two})


# --- M3-B: real Ingredient Intelligence surface -------------------------------------

_RETINOL_ID = 1
_NIACINAMIDE_ID = 2
_HYALURONIC_ACID_ID = 4
_GLYCOLIC_ACID_ID = 9
_SENSITIVE_SKIN_TYPE_ID = 5  # skin_types seed order: Normal/Dry/Oily/Combination/Sensitive


async def _create_test_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Test User", emailVerified=False
        )
    )
    await db.flush()


async def _create_profile(
    db: AsyncSession,
    user_id: str,
    *,
    skin_type_id: int = 1,
    allergies: str | None = None,
    sensitivities: str | None = None,
) -> None:
    await create_profile(
        db,
        user_id,
        SkinProfileCreate(
            skin_type_id=skin_type_id,
            allergies=allergies,
            sensitivities=sensitivities,
            concerns=[],
        ),
    )


async def test_list_ingredients_via_es_finds_a_real_seeded_ingredient(
    db_session: AsyncSession,
) -> None:
    page = await service.list_ingredients(
        db_session, page=1, page_size=20, category=None, q="Retinol"
    )

    assert page.meta.source == "elasticsearch"
    assert any(item.ingredient_name == "Retinol" for item in page.items)


async def test_list_ingredients_pg_fallback_when_es_is_reported_down(
    db_session: AsyncSession, monkeypatch: object
) -> None:
    async def _unavailable() -> bool:
        return False

    monkeypatch.setattr(  # type: ignore[attr-defined]
        "app.services.ingredients.service.is_elasticsearch_available", _unavailable
    )

    page = await service.list_ingredients(
        db_session, page=1, page_size=20, category=None, q="Retinol"
    )

    assert page.meta.source == "fallback"
    assert any(item.ingredient_name == "Retinol" for item in page.items)


async def test_list_ingredients_filters_by_category(db_session: AsyncSession) -> None:
    page = await service.list_ingredients(
        db_session, page=1, page_size=20, category="Retinoids", q=None
    )

    assert all(item.category == "Retinoids" for item in page.items)
    assert any(item.ingredient_name == "Retinol" for item in page.items)


async def test_get_ingredient_detail_returns_none_for_a_missing_id(
    db_session: AsyncSession,
) -> None:
    detail = await service.get_ingredient_detail(db_session, get_mongo_db(), 999_999)

    assert detail is None


async def test_get_ingredient_detail_includes_real_treats_and_avoid_data(
    db_session: AsyncSession,
) -> None:
    detail = await service.get_ingredient_detail(db_session, get_mongo_db(), _RETINOL_ID)

    assert detail is not None
    assert detail.ingredient_name == "Retinol"
    assert any(c.concern_name == "Wrinkles" for c in detail.treats_concerns)
    assert any(a.skin_type_name == "Sensitive" for a in detail.avoid_for_skin_types)


async def test_get_suitability_flags_a_real_recorded_allergy(db_session: AsyncSession) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="retinol")

    result = await service.get_suitability_for_user(db_session, _RETINOL_ID, user_id)

    assert result is not None
    assert result.allergy_flag is True
    assert result.suitable is False


async def test_get_suitability_flags_a_real_avoid_for_skin_type(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, skin_type_id=_SENSITIVE_SKIN_TYPE_ID)

    result = await service.get_suitability_for_user(db_session, _RETINOL_ID, user_id)

    assert result is not None
    assert result.avoid_flag is True
    assert result.suitable is False


async def test_get_suitability_returns_none_for_a_missing_ingredient(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)

    result = await service.get_suitability_for_user(db_session, 999_999, user_id)

    assert result is None


async def test_get_interactions_returns_curated_verdicts_for_real_ingredients(
    db_session: AsyncSession,
) -> None:
    result = await service.get_interactions_for_ids(
        db_session, [_RETINOL_ID, _GLYCOLIC_ACID_ID, _HYALURONIC_ACID_ID]
    )

    pairs_by_ids = {frozenset({p.ingredient_id_a, p.ingredient_id_b}): p for p in result.pairs}
    assert pairs_by_ids[frozenset({_RETINOL_ID, _GLYCOLIC_ACID_ID})].verdict == "avoid"
    assert pairs_by_ids[frozenset({_RETINOL_ID, _HYALURONIC_ACID_ID})].verdict == "synergy"


async def test_get_interactions_reports_unknown_for_an_uncurated_pair(
    db_session: AsyncSession,
) -> None:
    result = await service.get_interactions_for_ids(
        db_session, [_NIACINAMIDE_ID, _GLYCOLIC_ACID_ID]
    )

    assert result.pairs[0].verdict == "unknown"
    assert result.pairs[0].reason is None


# --- Milestone 2 P12: structured allergy list + synonym matching (ADR-030) -----------
# _NIACINAMIDE_ID's real ingredient_name is "Niacinamide"; _GLYCOLIC_ACID_ID's is
# "Glycolic Acid" (backend/app/db/seed.py). Ascorbic Acid (Vitamin C) is id 3.
_ASCORBIC_ACID_ID = 3


async def test_get_suitability_flags_a_real_structured_allergy_by_exact_id(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await create_profile(
        db_session,
        user_id,
        SkinProfileCreate(skin_type_id=1, allergy_ingredient_ids=[_NIACINAMIDE_ID], concerns=[]),
    )

    result = await service.get_suitability_for_user(db_session, _NIACINAMIDE_ID, user_id)

    assert result is not None
    assert result.allergy_flag is True
    assert result.suitable is False


async def test_get_suitability_does_not_flag_an_unrelated_structured_allergy(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await create_profile(
        db_session,
        user_id,
        SkinProfileCreate(skin_type_id=1, allergy_ingredient_ids=[_NIACINAMIDE_ID], concerns=[]),
    )

    result = await service.get_suitability_for_user(db_session, _GLYCOLIC_ACID_ID, user_id)

    assert result is not None
    assert result.allergy_flag is False


async def test_get_suitability_flags_a_free_text_allergy_via_a_known_synonym(
    db_session: AsyncSession,
) -> None:
    """ "Vitamin C" is not a substring of "Ascorbic Acid" in either direction —
    this only flags through the curated synonym group, proving an ambiguous
    synonym still raises a flag rather than being silently missed."""
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="Vitamin C")

    result = await service.get_suitability_for_user(db_session, _ASCORBIC_ACID_ID, user_id)

    assert result is not None
    assert result.allergy_flag is True
    assert result.suitable is False


async def test_get_suitability_allergy_match_is_case_insensitive(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="RETINOL")

    result = await service.get_suitability_for_user(db_session, _RETINOL_ID, user_id)

    assert result is not None
    assert result.allergy_flag is True


# --- Milestone 3 Phase 1: Safety Score Endpoint (config-driven thresholds) -------


async def test_get_active_safety_config_returns_the_seeded_active_row(
    db_session: AsyncSession,
) -> None:
    config = await service.get_active_safety_config(db_session)

    assert config.is_active is True
    assert 0 < float(config.warning_threshold) < float(config.safe_threshold) <= 100
    assert float(config.avoid_deduction) > 0
    assert float(config.caution_deduction) > 0
    assert float(config.allergy_deduction) > 0


async def test_compute_safety_score_flags_a_known_unsafe_pairing(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    result = await service.compute_safety_score(
        db_session, [_RETINOL_ID, _GLYCOLIC_ACID_ID], "PM", user_id
    )

    assert result.label in ("Warning", "Unsafe")
    assert result.score < 100
    assert len(result.interaction_warnings) == 1
    warning = result.interaction_warnings[0]
    assert warning.verdict == "avoid"
    assert {warning.ingredient_id_a, warning.ingredient_id_b} == {
        _RETINOL_ID,
        _GLYCOLIC_ACID_ID,
    }


async def test_compute_safety_score_flags_allergy_via_free_text_synonym(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="Vitamin C")

    result = await service.compute_safety_score(db_session, [_ASCORBIC_ACID_ID], "AM", user_id)

    assert len(result.allergy_alerts) == 1
    assert result.allergy_alerts[0].ingredient_id == _ASCORBIC_ACID_ID
    assert result.score < 100


async def test_compute_safety_score_clean_list_scores_safe(db_session: AsyncSession) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    result = await service.compute_safety_score(db_session, [_NIACINAMIDE_ID], "AM", user_id)

    assert result.score == 100
    assert result.label == "Safe"
    assert result.allergy_alerts == []
    assert result.interaction_warnings == []


async def test_compute_safety_score_rejects_unknown_ingredient_id(
    db_session: AsyncSession,
) -> None:
    user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    try:
        await service.compute_safety_score(db_session, [999_999], "AM", user_id)
        raise AssertionError("expected ValueError for unknown ingredient id")
    except ValueError:
        pass


async def test_compute_safety_score_works_for_a_consultant_with_a_real_assignment(
    db_session: AsyncSession,
) -> None:
    consultant_id = f"consultant-{uuid.uuid4()}"
    client_user_id = f"safety-{uuid.uuid4()}"
    await _create_test_user(db_session, consultant_id)
    await _create_test_user(db_session, client_user_id)
    await _create_profile(db_session, client_user_id)
    await clinical_review_service.create_assignment(db_session, consultant_id, client_user_id)

    result = await service.compute_safety_score(
        db_session, [_NIACINAMIDE_ID], "AM", client_user_id
    )

    assert result.score == 100
    assert result.label == "Safe"
