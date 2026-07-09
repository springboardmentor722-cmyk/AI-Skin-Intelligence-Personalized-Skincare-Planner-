"""Milestone 1 audit: recommendations/service.py had 23% coverage. Uses the real
live-seeded product catalog (see test_routines_service.py's module docstring for why —
the interface functions this module owns are meant to be read through, not mocked
around). Redis is real too (tests/conftest.py disposes/clears cached clients per test)
— the cache-hit/miss and invalidation-on-profile-save behavior is real product
behavior worth covering, not incidental plumbing.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.redis import get_redis
from app.services.recommendations.service import (
    get_products_by_ids,
    get_recommendations,
    list_all_products,
    list_concern_ids_for_products,
    list_products_for_skin_type,
)
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
        db_session, _SKIN_TYPE_WITH_SEEDED_PRODUCTS, category="Cleanser"
    )
    assert len(cleansers) > 0
    assert all(p.category == "Cleanser" for p in cleansers)


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


async def test_list_all_products_paginates_over_real_seeded_data(
    db_session: AsyncSession,
) -> None:
    page_one, total = await list_all_products(db_session, page=1, page_size=2)

    assert total >= len(page_one)
    assert len(page_one) <= 2
    if total > 2:
        page_two, _total = await list_all_products(db_session, page=2, page_size=2)
        assert {p.product_id for p in page_one}.isdisjoint({p.product_id for p in page_two})
