"""Product catalog/detail/compare/alternatives (M3-C, PDF Module 6 surface). Real
Postgres/ES round trips against the live seeded catalog (repo pattern, no mocks).
Vitamin C Brightening Serum (product_id=9) really contains Ascorbic Acid
(ingredient_id=3), used for the suitability/allergy tests below."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.recommendations import products_service
from app.services.recommendations.models import Product, ProductIngredient
from app.services.skin_profile.schemas import SkinProfileCreate
from app.services.skin_profile.service import create_profile

_VITAMIN_C_SERUM_ID = 9
_ASCORBIC_ACID_ID = 3


async def _create_test_user(db: AsyncSession, user_id: str) -> None:
    await db.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Test User", emailVerified=False
        )
    )
    await db.flush()


async def _create_profile(
    db: AsyncSession, user_id: str, *, skin_type_id: int = 1, allergies: str | None = None
) -> None:
    await create_profile(
        db,
        user_id,
        SkinProfileCreate(skin_type_id=skin_type_id, allergies=allergies, concerns=[]),
    )


# --- list ----------------------------------------------------------------------------


async def test_list_products_via_es_filters_by_category(db_session: AsyncSession) -> None:
    page = await products_service.list_products(
        db_session,
        page=1,
        page_size=50,
        q="Vitamin C",
        category="Treatment Products",
        brand=None,
        budget_min=None,
        budget_max=None,
        skin_type=None,
    )

    assert page.meta.source == "elasticsearch"
    assert all(item.category == "Treatment Products" for item in page.items)
    assert any(item.product_id == _VITAMIN_C_SERUM_ID for item in page.items)


async def test_list_products_pg_fallback_when_es_is_reported_down(
    db_session: AsyncSession, monkeypatch: object
) -> None:
    async def _unavailable() -> bool:
        return False

    monkeypatch.setattr(  # type: ignore[attr-defined]
        "app.services.recommendations.products_service.is_elasticsearch_available", _unavailable
    )

    page = await products_service.list_products(
        db_session,
        page=1,
        page_size=50,
        q=None,
        category="Treatment Products",
        brand=None,
        budget_min=None,
        budget_max=None,
        skin_type=None,
    )

    assert page.meta.source == "fallback"
    assert all(item.category == "Treatment Products" for item in page.items)


async def test_list_products_budget_filter_excludes_out_of_range_items(
    db_session: AsyncSession,
) -> None:
    page = await products_service.list_products(
        db_session,
        page=1,
        page_size=50,
        q=None,
        category=None,
        brand=None,
        budget_min=800,
        budget_max=900,
        skin_type=None,
    )

    assert all(item.price is not None and 800 <= item.price <= 900 for item in page.items)


# --- detail ----------------------------------------------------------------------------


async def test_get_product_detail_returns_none_for_a_missing_id(db_session: AsyncSession) -> None:
    detail = await products_service.get_product_detail(db_session, 999_999, "irrelevant-user")

    assert detail is None


async def test_get_product_detail_includes_real_ingredient_annotations(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id)

    detail = await products_service.get_product_detail(db_session, _VITAMIN_C_SERUM_ID, user_id)

    assert detail is not None
    assert detail.product_id == _VITAMIN_C_SERUM_ID
    assert any(a.ingredient_id == _ASCORBIC_ACID_ID for a in detail.ingredients)


async def test_get_product_detail_flags_a_real_recorded_allergy(db_session: AsyncSession) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, allergies="ascorbic acid")

    detail = await products_service.get_product_detail(db_session, _VITAMIN_C_SERUM_ID, user_id)

    assert detail is not None
    assert detail.suitable is False
    ascorbic = next(a for a in detail.ingredients if a.ingredient_id == _ASCORBIC_ACID_ID)
    assert ascorbic.allergy_flag is True


async def test_get_product_detail_suitability_is_none_without_a_profile(
    db_session: AsyncSession,
) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)

    detail = await products_service.get_product_detail(db_session, _VITAMIN_C_SERUM_ID, user_id)

    assert detail is not None
    assert detail.suitable is None
    assert detail.suitability_confidence is None


# --- compare ----------------------------------------------------------------------------


async def test_compare_products_returns_aligned_attribute_matrix(db_session: AsyncSession) -> None:
    compare = await products_service.compare_products(
        db_session,
        [_VITAMIN_C_SERUM_ID, 4],  # Vitamin C Serum + Salicylic Acid Treatment
    )

    assert len(compare.items) == 2
    assert compare.items[0].product.product_id == _VITAMIN_C_SERUM_ID
    assert any(name == "Ascorbic Acid" for name in compare.items[0].ingredient_names)


async def test_compare_products_skips_a_missing_id_rather_than_erroring(
    db_session: AsyncSession,
) -> None:
    compare = await products_service.compare_products(db_session, [_VITAMIN_C_SERUM_ID, 999_999])

    assert len(compare.items) == 1
    assert compare.items[0].product.product_id == _VITAMIN_C_SERUM_ID


# --- alternatives ------------------------------------------------------------------------


async def _create_temp_product(
    db: AsyncSession, *, category: str, price: float, ingredient_id: int | None = None
) -> int:
    product = Product(
        brand_name="Test Brand",
        product_name=f"Test Product {uuid.uuid4().hex[:8]}",
        category=category,
        price=price,
        currency="INR",
        is_active=True,
    )
    db.add(product)
    await db.flush()
    if ingredient_id is not None:
        db.add(ProductIngredient(product_id=product.product_id, ingredient_id=ingredient_id))
    return product.product_id


async def test_alternatives_only_include_the_same_category(db_session: AsyncSession) -> None:
    target_id = await _create_temp_product(db_session, category="Serum", price=1000)
    same_category_id = await _create_temp_product(db_session, category="Serum", price=1000)
    other_category_id = await _create_temp_product(db_session, category="Face Wash", price=1000)
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)

    result = await products_service.get_alternatives(db_session, target_id, user_id)

    ids = {a.product_id for a in result.alternatives}
    assert same_category_id in ids
    assert other_category_id not in ids


async def test_alternatives_respect_the_budget_band(db_session: AsyncSession) -> None:
    target_id = await _create_temp_product(db_session, category="Serum", price=1000)
    in_band_id = await _create_temp_product(db_session, category="Serum", price=1200)  # +20%
    out_of_band_id = await _create_temp_product(db_session, category="Serum", price=2000)  # +100%
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)

    result = await products_service.get_alternatives(db_session, target_id, user_id)

    ids = {a.product_id for a in result.alternatives}
    assert in_band_id in ids
    assert out_of_band_id not in ids


async def test_alternatives_hard_exclude_an_avoid_flagged_product(
    db_session: AsyncSession,
) -> None:
    # Retinol (ingredient_id=1) is really avoid-flagged for Sensitive skin (seed.py).
    target_id = await _create_temp_product(db_session, category="Serum", price=1000)
    unsafe_id = await _create_temp_product(
        db_session, category="Serum", price=1000, ingredient_id=1
    )
    safe_id = await _create_temp_product(db_session, category="Serum", price=1000)
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)
    await _create_profile(db_session, user_id, skin_type_id=5)  # Sensitive

    result = await products_service.get_alternatives(db_session, target_id, user_id)

    ids = {a.product_id for a in result.alternatives}
    assert unsafe_id not in ids
    assert safe_id in ids


async def test_alternatives_returns_empty_for_a_missing_product(db_session: AsyncSession) -> None:
    user_id = f"test-{uuid.uuid4().hex[:16]}"
    await _create_test_user(db_session, user_id)

    result = await products_service.get_alternatives(db_session, 999_999, user_id)

    assert result.alternatives == []
