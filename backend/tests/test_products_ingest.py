"""backend/app/services/admin/ingest/products.py's normalize_rows() — the one part of
the Kaggle product pipeline that's fully testable without a live download. A small
fixture DataFrame matching the Sephora dataset's publicly-documented
product_info.csv columns, not a live download.
"""

import pandas as pd
import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.outbox import Outbox
from app.services.admin.ingest._shared import (
    load_into_database,
    load_product_associations,
)
from app.services.admin.ingest.products import (
    KaggleCredentialsError,
    _parse_ingredients,
    _parse_size_ml,
    download_dataset,
    map_tertiary_category,
    normalize_rows,
    parse_highlights,
)
from app.services.recommendations.models import Product, ProductSkinType


def _row(**overrides: object) -> dict[str, object]:
    base = {
        "brand_name": "Bare Basics",
        "product_name": "Cream Hydrating Cleanser",
        "price_usd": 24.0,
        "size": "150 mL",
        "primary_category": "Skincare",
        "product_url": "https://example.com/product",
        "image_url": "https://example.com/image.jpg",
        "ingredients": "['Water, Glycerin, Ceramide NP (a barrier lipid), Niacinamide']",
    }
    base.update(overrides)
    return base


def test_map_tertiary_category_maps_known_skincare_types() -> None:
    assert map_tertiary_category("Face Wash & Cleansers") == "Face Wash"
    assert map_tertiary_category("Moisturizers") == "Moisturizer"
    assert map_tertiary_category("Face Sunscreen") == "Sunscreen"
    assert map_tertiary_category("Body Sunscreen") == "Sunscreen"
    assert map_tertiary_category("Face Serums") == "Serum"
    assert map_tertiary_category("Toners") == "Toner"
    assert map_tertiary_category("Face Masks") == "Face Masks"
    assert map_tertiary_category("Sheet Masks") == "Face Masks"
    assert map_tertiary_category("Eye Masks") == "Face Masks"
    assert map_tertiary_category("Blemish & Acne Treatments") == "Treatment Products"
    assert map_tertiary_category("Anti-Aging") == "Treatment Products"
    assert map_tertiary_category("Facial Peels") == "Treatment Products"
    assert map_tertiary_category("Exfoliators") == "Treatment Products"
    assert map_tertiary_category("Eye Creams & Treatments") == "Treatment Products"
    assert map_tertiary_category("Night Creams") == "Moisturizer"


def test_map_tertiary_category_returns_uncategorized_for_unmapped_or_missing_types() -> None:
    # Real dataset values that don't cleanly map to any of the 7 rubric categories -
    # never guessed (AGENTS.md §0.2).
    assert map_tertiary_category("Face Oils") == "uncategorized"
    assert map_tertiary_category("Mists & Essences") == "uncategorized"
    assert map_tertiary_category("Beauty Supplements") == "uncategorized"
    assert map_tertiary_category(None) == "uncategorized"
    assert map_tertiary_category("Some Brand New Type Not In The Table") == "uncategorized"


def test_normalize_rows_rejects_non_skincare_rows() -> None:
    df = pd.DataFrame([_row(primary_category="Makeup", tertiary_category="Lipstick")])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "not a skincare product"


def test_normalize_rows_accepts_a_valid_row() -> None:
    df = pd.DataFrame([_row(tertiary_category="Face Wash & Cleansers")])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert not rejected
    product = products[0]
    assert product["brand_name"] == "Bare Basics"
    assert product["currency"] == "USD"
    assert product["volume_ml"] == 150
    assert product["category"] == "Face Wash"


def test_normalize_rows_extracts_real_rating_and_review_count() -> None:
    # M3-C: real Sephora product_info.csv columns (rating, reviews) — not invented.
    df = pd.DataFrame([_row(rating=4.3, reviews=812)])
    products, _rejected = normalize_rows(df)

    assert products[0]["rating"] == 4.3
    assert products[0]["review_count"] == 812


def test_normalize_rows_leaves_rating_and_review_count_none_when_absent() -> None:
    # Curated seed rows / rows missing these Kaggle columns entirely — never guessed.
    df = pd.DataFrame([_row()])
    products, _rejected = normalize_rows(df)

    assert products[0]["rating"] is None
    assert products[0]["review_count"] is None


def test_normalize_rows_rejects_missing_mandatory_fields() -> None:
    df = pd.DataFrame([_row(brand_name=""), _row(product_name=None), _row(price_usd=float("nan"))])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 3
    assert all(r["reason"] == "missing mandatory field" for r in rejected)


def test_normalize_rows_dedupes_by_brand_name_and_size() -> None:
    df = pd.DataFrame([_row(), _row()])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "duplicate brand+name+size"


def test_parse_ingredients_strips_parentheticals_and_splits_on_commas() -> None:
    raw = "['Water, Glycerin, Ceramide NP (a barrier lipid), Niacinamide']"
    assert _parse_ingredients(raw) == ["Water", "Glycerin", "Ceramide Np", "Niacinamide"]


def test_parse_ingredients_handles_missing_value() -> None:
    assert _parse_ingredients(None) == []
    assert _parse_ingredients(float("nan")) == []


def test_parse_ingredients_strips_trailing_space_after_a_quote() -> None:
    """Regression: the old `.strip().strip("'\\"")` two-call sequence could leave
    a stray space behind once the quote in between was removed — the first
    whitespace-only `.strip()` never got a second pass after the quote strip
    exposed a new outer character. A single `.strip(" '\\"")` call strips both
    character classes together in one continuous pass from both ends, so a
    fragment like "Acid' " (space, quote, space) comes out fully clean. This
    exact bug silently duplicated the curated "Salicylic Acid" ingredient as
    "Salicylic Acid " (trailing space) in the live ingested catalog, defeating
    that ingredient's avoid-junction safety entry for any product linked only to
    the malformed row."""
    assert _parse_ingredients("[\"Salicylic Acid' \", 'Water']") == ["Salicylic Acid", "Water"]


def test_parse_size_ml_extracts_explicit_ml_values() -> None:
    assert _parse_size_ml("150 mL") == 150
    assert _parse_size_ml("50ml") == 50


def test_parse_size_ml_returns_none_for_non_ml_units() -> None:
    # Real, honest behavior: an oz/g size is left unconverted rather than guessed —
    # no invented oz->mL ratio.
    assert _parse_size_ml("1.7 oz") is None
    assert _parse_size_ml(None) is None


def test_parse_highlights_maps_real_skin_type_and_concern_phrases() -> None:
    raw = "['Vegan', 'Best for Oily, Combo, Normal Skin', 'Good for: Acne/Blemishes']"

    skin_types, concerns = parse_highlights(raw)

    assert skin_types == ["Combination", "Normal", "Oily"]
    assert concerns == ["Acne"]


def test_parse_highlights_ignores_unmapped_phrases_and_none() -> None:
    assert parse_highlights(None) == ([], [])
    assert parse_highlights("['Vegan', 'Good for: Pores']") == ([], [])


def test_parse_highlights_handles_malformed_input_gracefully() -> None:
    assert parse_highlights("not a python list literal") == ([], [])


async def test_load_product_associations_creates_real_skin_type_and_concern_rows(
    db_session: AsyncSession,
) -> None:
    products = [
        {
            "brand_name": "Test Brand",
            "product_name": "Test Highlight Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 25.0,
            "currency": "USD",
            "volume_ml": None,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": ["Oily", "Combination"],
            "concern_names": ["Acne"],
        }
    ]
    await load_into_database(db_session, products)

    skin_type_created, concern_created = await load_product_associations(db_session, products)

    assert skin_type_created == 2
    assert concern_created == 1

    product_id = (
        await db_session.execute(
            select(Product.product_id).where(Product.product_name == "Test Highlight Product")
        )
    ).scalar_one()
    linked_skin_types = (
        (
            await db_session.execute(
                select(ProductSkinType.skin_type_id).where(ProductSkinType.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )
    assert len(linked_skin_types) == 2


async def test_load_product_associations_is_idempotent(db_session: AsyncSession) -> None:
    products = [
        {
            "brand_name": "Test Brand 2",
            "product_name": "Test Idempotent Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 25.0,
            "currency": "USD",
            "volume_ml": None,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": ["Oily"],
            "concern_names": [],
        }
    ]
    await load_into_database(db_session, products)
    await load_product_associations(db_session, products)

    skin_type_created, concern_created = await load_product_associations(db_session, products)

    assert skin_type_created == 0
    assert concern_created == 0


async def test_load_product_associations_appends_an_outbox_event_when_associations_change(
    db_session: AsyncSession,
) -> None:
    """ADR-010: the ES product document (`build_product_document`) reads
    `skin_types_supported`/`concerns_supported` from these same junction rows —
    `load_into_database` already appends an outbox row on product creation, but
    `load_product_associations` wrote these rows in a later transaction with no
    outbox row of its own, so a fresh environment/re-run would index the product
    with permanently empty ES fields (the ES skin-type filter only falls back to
    PG on an exception, never on a wrong-but-successful empty result)."""
    products = [
        {
            "brand_name": "Test Brand 3",
            "product_name": "Test Outbox Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 25.0,
            "currency": "USD",
            "volume_ml": None,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": ["Oily"],
            "concern_names": ["Acne"],
        }
    ]
    await load_into_database(db_session, products)
    product_id = (
        await db_session.execute(
            select(Product.product_id).where(Product.product_name == "Test Outbox Product")
        )
    ).scalar_one()

    await load_product_associations(db_session, products)

    def _outbox_rows_for_product():
        return db_session.execute(
            select(Outbox).where(
                Outbox.aggregate_type == "product", Outbox.aggregate_id == str(product_id)
            )
        )

    rows = (await _outbox_rows_for_product()).scalars().all()
    # One row from load_into_database's own creation upsert, one more from
    # load_product_associations' real association change.
    assert len(rows) == 2

    # Idempotent re-run: no association actually changes the second time, so no
    # additional outbox row either.
    await load_product_associations(db_session, products)
    rows_after = (await _outbox_rows_for_product()).scalars().all()
    assert len(rows_after) == 2


async def test_load_into_database_dedupes_within_batch_by_natural_key(
    db_session: AsyncSession,
) -> None:
    # Two accepted rows that share (brand_name, product_name) but differ in a field
    # load_into_database's key doesn't cover (volume_ml) - normalize_rows' own
    # dedupe key includes volume_ml so it wouldn't catch this; load_into_database
    # must still only create one product for the shared natural key.
    products = [
        {
            "brand_name": "Test Brand 4",
            "product_name": "Test Batch Dup Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 10.0,
            "currency": "USD",
            "volume_ml": 30,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": [],
            "concern_names": [],
        },
        {
            "brand_name": "Test Brand 4",
            "product_name": "Test Batch Dup Product",
            "category": "Serum",
            "product_url": None,
            "image_url": None,
            "price": 10.0,
            "currency": "USD",
            "volume_ml": 50,
            "ingredients": [],
            "rating": None,
            "review_count": None,
            "skin_type_names": [],
            "concern_names": [],
        },
    ]
    created = await load_into_database(db_session, products)
    assert created == 1


def test_download_dataset_raises_clear_error_without_credentials(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    # Explicitly blanked here rather than relying on the ambient environment (real
    # KAGGLE_USERNAME/KAGGLE_KEY now exist in .env once the Kaggle pipeline was
    # actually unblocked — this test's job is the credential-check branch itself, not
    # whichever credentials happen to be configured this session). Confirms the
    # pipeline fails fast and legibly instead of the `kaggle` package erroring deep
    # inside a network call.
    monkeypatch.setattr(settings, "kaggle_username", "")
    monkeypatch.setattr(settings, "kaggle_key", "")
    with pytest.raises(KaggleCredentialsError):
        download_dataset()
