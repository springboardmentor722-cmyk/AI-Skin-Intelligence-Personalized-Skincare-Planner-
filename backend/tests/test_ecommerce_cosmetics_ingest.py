"""backend/app/services/admin/ingest/ingest_ecommerce_cosmetics.py's
normalize_rows() - fixture rows drawn from the real E-commerce cosmetic
dataset.csv (verified 2026-08-03: 12,615 rows total, 2,077 with real
category=="skincare", 8 real subcategory values, INR pricing throughout)."""

import pandas as pd

from app.services.admin.ingest.ingest_ecommerce_cosmetics import (
    map_subcategory,
    normalize_rows,
)


def _row(**overrides: object) -> dict[str, object]:
    base = {
        "product_name": "Brightening Day Cream",
        "website": "ulta",
        "country": "USA",
        "category": "skincare",
        "subcategory": "moisturizer",
        "title-href": "https://www.ulta.com/p/brightening-day-cream-pimprod2006232?sku=2548247",
        "price": 1633.38,
        "brand": "ACURE",
        "ingredients": "Water (Aqua), Glycerin, Tocopherol.",
        "form": "cream",
        "type": None,
        "color": None,
        "size": "75",
        "rating": "4.16",
        "noofratings": "14",
    }
    base.update(overrides)
    return base


def test_map_subcategory_maps_known_values() -> None:
    assert map_subcategory("serum") == "Serum"
    assert map_subcategory("moisturizer") == "Moisturizer"
    assert map_subcategory("cleanser") == "Face Wash"
    assert map_subcategory("face wash") == "Face Wash"
    assert map_subcategory("mask") == "Face Masks"
    assert map_subcategory("toner") == "Toner"
    assert map_subcategory("eye treatment") == "Treatment Products"


def test_map_subcategory_returns_uncategorized_for_unmapped_or_missing() -> None:
    assert map_subcategory("spray") == "uncategorized"
    assert map_subcategory(None) == "uncategorized"


def test_normalize_rows_rejects_non_skincare_category() -> None:
    df = pd.DataFrame([_row(category="lips", subcategory="lipstick")])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "not a skincare product"


def test_normalize_rows_accepts_a_valid_skincare_row() -> None:
    df = pd.DataFrame([_row()])
    products, rejected = normalize_rows(df)

    assert not rejected
    assert len(products) == 1
    product = products[0]
    assert product["brand_name"] == "ACURE"
    assert product["product_name"] == "Brightening Day Cream"
    assert product["category"] == "Moisturizer"
    assert product["price"] == 1633.38
    assert product["currency"] == "INR"
    assert product["volume_ml"] == 75
    assert product["rating"] == 4.16
    assert product["review_count"] == 14


def test_normalize_rows_rejects_missing_mandatory_fields() -> None:
    df = pd.DataFrame([_row(brand=""), _row(product_name=None), _row(price=float("nan"))])
    products, rejected = normalize_rows(df)

    assert products == []
    assert len(rejected) == 3
    assert all(r["reason"] == "missing mandatory field" for r in rejected)


def test_normalize_rows_leaves_optional_fields_none_when_absent() -> None:
    df = pd.DataFrame([_row(size=None, rating=None, noofratings=None, ingredients=None)])
    products, _rejected = normalize_rows(df)

    product = products[0]
    assert product["volume_ml"] is None
    assert product["rating"] is None
    assert product["review_count"] is None
    assert product["ingredients"] == []


def test_normalize_rows_dedupes_by_brand_and_name() -> None:
    df = pd.DataFrame([_row(), _row()])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert len(rejected) == 1
    assert rejected[0]["reason"] == "duplicate brand+name"


def test_normalize_rows_parses_comma_formatted_review_counts() -> None:
    # 182/2046 real noofratings values are comma-formatted (e.g., "4,031", "14,611")
    df = pd.DataFrame(
        [_row(noofratings="4,031"), _row(product_name="Another", noofratings="14,611")]
    )
    products, rejected = normalize_rows(df)

    assert not rejected
    assert len(products) == 2
    assert products[0]["review_count"] == 4031
    assert products[1]["review_count"] == 14611
