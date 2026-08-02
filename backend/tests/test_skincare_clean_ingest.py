"""backend/app/services/admin/ingest/ingest_skincare_clean.py's normalize_rows() —
fixture rows drawn from the real skincare_products_clean.csv (verified 2026-08-03:
1,138 rows, zero nulls in any column, 14 real product_type values, always £ pricing,
no brand_name column - brand is embedded in product_name)."""

import pandas as pd

from app.services.admin.ingest.ingest_skincare_clean import (
    _extract_brand_and_name,
    _parse_gbp_price,
    map_product_type,
    normalize_rows,
)


def _row(**overrides: object) -> dict[str, object]:
    base = {
        "product_name": "CeraVe Facial Moisturising Lotion SPF 25 52ml",
        "product_url": "https://www.lookfantastic.com/cerave-facial-moisturising-lotion-spf-25-52ml/11798689.html",
        "product_type": "Moisturiser",
        "clean_ingreds": "['glycerin', 'niacinamide', 'ceramide np']",
        "price": "£13.00",
    }
    base.update(overrides)
    return base


def test_map_product_type_maps_known_values() -> None:
    assert map_product_type("Moisturiser") == "Moisturizer"
    assert map_product_type("Serum") == "Serum"
    assert map_product_type("Toner") == "Toner"
    assert map_product_type("Cleanser") == "Face Wash"
    assert map_product_type("Mask") == "Face Masks"
    assert map_product_type("Eye Care") == "Treatment Products"
    assert map_product_type("Exfoliator") == "Treatment Products"
    assert map_product_type("Peel") == "Treatment Products"


def test_map_product_type_returns_uncategorized_for_unmapped_or_missing() -> None:
    # Real observed values with no confident match to the 7-value catalog.
    assert map_product_type("Body Wash") == "uncategorized"
    assert map_product_type("Mist") == "uncategorized"
    assert map_product_type("Oil") == "uncategorized"
    assert map_product_type("Balm") == "uncategorized"
    assert map_product_type("Bath Salts") == "uncategorized"
    assert map_product_type("Bath Oil") == "uncategorized"
    assert map_product_type(None) == "uncategorized"


def test_extract_brand_and_name_splits_known_leading_brand() -> None:
    assert _extract_brand_and_name("CeraVe Facial Moisturising Lotion SPF 25 52ml") == (
        "CeraVe",
        "CeraVe Facial Moisturising Lotion SPF 25 52ml",
    )
    assert _extract_brand_and_name("The Ordinary Natural Moisturising Factors + HA 30ml") == (
        "The Ordinary",
        "The Ordinary Natural Moisturising Factors + HA 30ml",
    )


def test_extract_brand_and_name_falls_back_to_first_word() -> None:
    assert _extract_brand_and_name("Weleda Skin Food (75ml)") == (
        "Weleda",
        "Weleda Skin Food (75ml)",
    )


def test_extract_brand_and_name_matches_two_word_brands() -> None:
    assert _extract_brand_and_name("La Roche-Posay Effaclar H Moisturiser 40ml") == (
        "La Roche-Posay",
        "La Roche-Posay Effaclar H Moisturiser 40ml",
    )
    assert _extract_brand_and_name("Elizabeth Arden Advanced Ceramide Capsules") == (
        "Elizabeth Arden",
        "Elizabeth Arden Advanced Ceramide Capsules",
    )


def test_extract_brand_and_name_matches_three_word_brands() -> None:
    assert _extract_brand_and_name(
        "First Aid Beauty Ultra Repair Cream (56.7g)"
    ) == (
        "First Aid Beauty",
        "First Aid Beauty Ultra Repair Cream (56.7g)",
    )
    assert _extract_brand_and_name("Peter Thomas Roth Moisturizer 30ml") == (
        "Peter Thomas Roth",
        "Peter Thomas Roth Moisturizer 30ml",
    )


def test_parse_gbp_price_strips_currency_symbol() -> None:
    assert _parse_gbp_price("£13.00") == 13.00
    assert _parse_gbp_price("£4.50") == 4.50


def test_normalize_rows_accepts_a_valid_row() -> None:
    df = pd.DataFrame([_row()])
    products, rejected = normalize_rows(df)

    assert not rejected
    assert len(products) == 1
    product = products[0]
    assert product["brand_name"] == "CeraVe"
    assert product["product_name"] == "CeraVe Facial Moisturising Lotion SPF 25 52ml"
    assert product["category"] == "Moisturizer"
    assert product["price"] == 13.00
    assert product["currency"] == "GBP"
    assert product["ingredients"] == ["Glycerin", "Niacinamide", "Ceramide Np"]
    assert product["volume_ml"] is None
    assert product["rating"] is None
    assert product["skin_type_names"] == []
    assert product["concern_names"] == []


def test_normalize_rows_rejects_missing_mandatory_fields() -> None:
    df = pd.DataFrame([_row(product_name=""), _row(price=None)])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 2
    assert all(r["reason"] == "missing mandatory field" for r in rejected)


def test_normalize_rows_dedupes_by_brand_name_and_product_name() -> None:
    df = pd.DataFrame([_row(), _row()])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "duplicate brand+name"
