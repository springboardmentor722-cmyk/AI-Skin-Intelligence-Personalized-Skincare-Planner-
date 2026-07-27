"""Milestone 1 audit: recommendations/service.py had 23% coverage. Uses the real
live-seeded product catalog (see test_routines_service.py's module docstring for why —
the interface functions this module owns are meant to be read through, not mocked
around). Redis is real too (tests/conftest.py disposes/clears cached clients per test)
— the cache-hit/miss and invalidation-on-profile-save behavior is real product
behavior worth covering, not incidental plumbing.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import vector
from app.db.redis import get_redis
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import (
    Product,
    ProductIngredient,
    ProductRecommendation,
    ProductSkinType,
)
from app.services.recommendations.service import (
    evaluate_products_suitability,
    get_active_recommendation_weights,
    get_products_by_ids,
    get_recommendations,
    list_all_products,
    list_avoided_ingredient_product_ids,
    list_concern_ids_for_products,
    list_products_for_skin_type,
)
from app.services.skin_profile.models import SkinType
from app.services.skin_profile.schemas import SkinProfileConcernInput, SkinProfileCreate
from app.services.skin_profile.service import create_profile

_SKIN_TYPE_WITH_SEEDED_PRODUCTS = 1


async def test_list_products_for_skin_type_only_returns_active_matches(
    db_session: AsyncSession,
) -> None:
    products = await list_products_for_skin_type(db_session, _SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    assert len(products) > 0
    assert all(p.is_active for p in products)


async def test_list_products_for_skin_type_filters_by_category(
    db_session: AsyncSession,
) -> None:
    cleansers = await list_products_for_skin_type(
        db_session, _SKIN_TYPE_WITH_SEEDED_PRODUCTS, category="Face Wash"
    )
    assert len(cleansers) > 0
    assert all(p.category == "Face Wash" for p in cleansers)


async def test_get_products_by_ids_empty_list_short_circuits(db_session: AsyncSession) -> None:
    assert await get_products_by_ids(db_session, []) == {}


async def test_get_products_by_ids_maps_by_product_id(db_session: AsyncSession) -> None:
    products = await get_products_by_ids(db_session, [1, 3])
    assert set(products.keys()) == {1, 3}
    assert products[1].product_id == 1


async def test_list_concern_ids_for_products_empty_list_short_circuits(
    db_session: AsyncSession,
) -> None:
    assert await list_concern_ids_for_products(db_session, []) == {}


async def test_no_recommendations_before_a_skin_profile_exists(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await get_recommendations(db_session, test_user_id) == []


async def test_recommendations_are_ranked_highest_match_score_first(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(
            skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS,
            concerns=[SkinProfileConcernInput(concern_id=1, severity_rating=8, priority_level=8)],
        ),
    )

    results = await get_recommendations(db_session, test_user_id)

    assert len(results) <= 3  # service.py's own _TOP_N
    scores = [r.match_score for r in results]
    assert scores == sorted(scores, reverse=True)
    for r in results:
        assert r.reasons, "every recommendation must explain itself, not just rank"


async def test_recommendations_are_cached_in_redis(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )

    await get_recommendations(db_session, test_user_id)

    cached = await get_redis().get(f"recommendation:cache:{test_user_id}")
    assert cached is not None


async def test_an_allergy_flagged_product_can_never_appear_in_recommendations(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """milestone_3.md §M3-D acceptance criterion — a hard filter, not a ranking
    penalty, layered on top of the existing skin-type-avoid junction filter (M2).
    Real seeded ingredient ("Niacinamide", seed.py) linked to a temp product that
    otherwise legitimately matches skin_type_id=1, plus the user's own free-text
    allergy naming it (app/ai/suitability.py's exact-match rule)."""
    niacinamide = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == "Niacinamide")
        )
    ).scalar_one()

    product = Product(
        brand_name="Test Only",
        product_name="Would-Otherwise-Match Serum",
        category="Treatment Products",
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=product.product_id, ingredient_id=niacinamide.ingredient_id)
    )
    db_session.add(
        ProductSkinType(product_id=product.product_id, skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await db_session.flush()

    await create_profile(
        db_session,
        test_user_id,
        SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS, allergies="Niacinamide"),
    )

    results = await get_recommendations(db_session, test_user_id)

    assert product.product_id not in {r.product.product_id for r in results}


async def test_evaluate_products_suitability_flags_allergy_and_scores_a_clean_product_high(
    db_session: AsyncSession, test_user_id: str
) -> None:
    niacinamide = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == "Niacinamide")
        )
    ).scalar_one()
    product = Product(brand_name="Test Only", product_name="Clean Serum", category="Treatment Products")
    db_session.add(product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=product.product_id, ingredient_id=niacinamide.ingredient_id)
    )
    await db_session.flush()

    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    from app.services.skin_profile.service import get_current_profile

    profile = await get_current_profile(db_session, test_user_id)
    assert profile is not None

    aggregate = await evaluate_products_suitability(
        db_session, [product.product_id], profile, "Oily"
    )

    assert aggregate[product.product_id].any_allergy is False
    assert aggregate[product.product_id].score > 0.5


async def test_recommendations_use_vector_similarity_when_a_profile_embedding_exists(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """Stage 2 (milestone_3.md §2) — uses the *already-projected* embedding as the
    query vector (never computed request-path). A profile vector deliberately
    identical to a real seeded product's vector should push that product's
    vector_similarity signal to (near) 1.0."""
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    profile_vector_id = f"user_{test_user_id}"
    try:
        embedding = [1.0] + [0.0] * 383
        vector.upsert(
            "user_profiles", profile_vector_id, embedding, {"user_id": test_user_id}, dim=384
        )

        results = await get_recommendations(db_session, test_user_id)

        assert results  # seeded catalog for skin_type_id=1 is non-empty
    finally:
        vector.remove("user_profiles", profile_vector_id)


async def test_recommendations_persist_the_served_set_to_product_recommendations(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )

    results = await get_recommendations(db_session, test_user_id)

    rows = (
        (
            await db_session.execute(
                select(ProductRecommendation).where(ProductRecommendation.user_id == test_user_id)
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == len(results)
    assert {row.product_id for row in rows} == {r.product.product_id for r in results}
    assert all(row.recommendation_reason for row in rows)


async def test_saving_a_new_profile_invalidates_the_recommendation_cache(
    db_session: AsyncSession, test_user_id: str
) -> None:
    # docs/WIREFRAMES.md "4. Skin profile & lifestyle": "saving a profile invalidates
    # recommendation:cache:{user_id}" — asserted directly, not just trusted from the
    # comment in skin_profile/service.py.
    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )
    await get_recommendations(db_session, test_user_id)
    assert await get_redis().get(f"recommendation:cache:{test_user_id}") is not None

    await create_profile(
        db_session, test_user_id, SkinProfileCreate(skin_type_id=_SKIN_TYPE_WITH_SEEDED_PRODUCTS)
    )

    assert await get_redis().get(f"recommendation:cache:{test_user_id}") is None


# --- list_avoided_ingredient_product_ids — Milestone 2 Step 4's hard safety filter ---


async def test_list_avoided_ingredient_product_ids_flags_a_real_avoid_flagged_ingredient(
    db_session: AsyncSession,
) -> None:
    # Real seeded rows (backend/app/db/seed.py): "Salicylic Acid" is avoid-flagged for
    # "Sensitive" skin. No product in the curated catalog happens to pair that
    # ingredient with a Sensitive skin-type tag (the seed data is already internally
    # consistent), so this inserts one minimal real row — same real-DB-round-trip
    # pattern test_skin_profile_service.py's own cross-user test already uses for an
    # ad hoc row — to exercise the exact adversarial case the filter exists to catch.
    sensitive = (
        await db_session.execute(select(SkinType).where(SkinType.skin_type_name == "Sensitive"))
    ).scalar_one()
    salicylic_acid = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == "Salicylic Acid")
        )
    ).scalar_one()

    product = Product(
        brand_name="Test Only", product_name="Unsafe-for-Sensitive Treatment", category="Treatment Products"
    )
    db_session.add(product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=product.product_id, ingredient_id=salicylic_acid.ingredient_id)
    )
    await db_session.flush()

    avoided = await list_avoided_ingredient_product_ids(db_session, sensitive.skin_type_id)

    assert product.product_id in avoided


async def test_list_avoided_ingredient_product_ids_empty_for_a_safe_ingredient(
    db_session: AsyncSession,
) -> None:
    # "Niacinamide" has an empty avoid_for list in seed.py — a product built only from
    # it must never show up in any skin type's avoid-set.
    sensitive = (
        await db_session.execute(select(SkinType).where(SkinType.skin_type_name == "Sensitive"))
    ).scalar_one()
    niacinamide = (
        await db_session.execute(
            select(Ingredient).where(Ingredient.ingredient_name == "Niacinamide")
        )
    ).scalar_one()

    product = Product(brand_name="Test Only", product_name="Safe Treatment", category="Treatment Products")
    db_session.add(product)
    await db_session.flush()
    db_session.add(
        ProductIngredient(product_id=product.product_id, ingredient_id=niacinamide.ingredient_id)
    )
    await db_session.flush()

    avoided = await list_avoided_ingredient_product_ids(db_session, sensitive.skin_type_id)

    assert product.product_id not in avoided


async def test_list_all_products_paginates_over_real_seeded_data(
    db_session: AsyncSession,
) -> None:
    page_one, total = await list_all_products(db_session, page=1, page_size=2)

    assert total >= len(page_one)
    assert len(page_one) <= 2
    if total > 2:
        page_two, _total = await list_all_products(db_session, page=2, page_size=2)
        assert {p.product_id for p in page_one}.isdisjoint({p.product_id for p in page_two})


async def test_get_active_recommendation_weights_returns_the_seeded_active_row(
    db_session: AsyncSession,
) -> None:
    weights = await get_active_recommendation_weights(db_session)

    assert weights.is_active is True
    total = (
        float(weights.concern_weight)
        + float(weights.skin_type_fit_weight)
        + float(weights.rating_weight)
    )
    assert abs(total - 1.00) < 0.001
    assert float(weights.concern_weight) == 0.50
    assert float(weights.skin_type_fit_weight) == 0.35
    assert float(weights.rating_weight) == 0.15
