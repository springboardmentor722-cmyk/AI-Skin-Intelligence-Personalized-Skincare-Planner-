"""backend/app/services/admin/ingest/ingest_skincare_ingredients.py's
normalize_rows() - fixture rows drawn from the real Sephora_all_423.csv
(verified 2026-08-03: 2,179 rows, confirmed independent from the
already-ingested nadyinky Sephora dataset, no category column, ingredients
field is unparsed marketing prose not a clean INCI list)."""

import pandas as pd

from app.services.admin.ingest.ingest_skincare_ingredients import (
    _parse_price,
    _parse_skin_types,
    normalize_rows,
)


def _row(**overrides: object) -> dict[str, object]:
    base = {
        "brand_name": "Glow Recipe",
        "cosmetic_name": "Watermelon Glow PHA + BHA Pore-Tight Toner",
        "price": "$16.00 - $35.00",
        "ingredients": "-Watermelon Extract: Hydrates.\n\nOpuntia Ficus-Indica Extract, Glycerin.",
        "Skin Type": "Normal, Dry, Combination, and Oily",
    }
    base.update(overrides)
    return base


def test_parse_price_takes_low_end_of_a_range() -> None:
    assert _parse_price("$16.00 - $35.00") == 16.00


def test_parse_price_handles_a_single_value_with_trailing_space() -> None:
    assert _parse_price("$24.00 ") == 24.00


def test_parse_price_returns_none_for_missing_value() -> None:
    assert _parse_price(None) is None


def test_parse_skin_types_matches_real_seeded_names() -> None:
    assert _parse_skin_types("Normal, Dry, Combination, and Oily") == [
        "Combination",
        "Dry",
        "Normal",
        "Oily",
    ]


def test_parse_skin_types_returns_empty_for_missing_value() -> None:
    assert _parse_skin_types(None) == []
    assert _parse_skin_types(float("nan")) == []


def test_normalize_rows_accepts_a_valid_row() -> None:
    df = pd.DataFrame([_row()])
    products, rejected = normalize_rows(df)

    assert not rejected
    assert len(products) == 1
    product = products[0]
    assert product["brand_name"] == "Glow Recipe"
    assert product["product_name"] == "Watermelon Glow PHA + BHA Pore-Tight Toner"
    assert product["price"] == 16.00
    assert product["currency"] == "USD"
    assert product["category"] == "uncategorized"
    assert product["ingredients"] == []
    assert product["skin_type_names"] == ["Combination", "Dry", "Normal", "Oily"]
    assert product["concern_names"] == []


def test_normalize_rows_rejects_missing_mandatory_fields() -> None:
    df = pd.DataFrame([_row(brand_name=""), _row(cosmetic_name=None), _row(price="not a price")])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 3
    assert all(r["reason"] == "missing mandatory field" for r in rejected)


def test_normalize_rows_dedupes_by_brand_and_name() -> None:
    df = pd.DataFrame([_row(), _row()])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "duplicate brand+name"
