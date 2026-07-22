"""backend/app/services/admin/ingest/products.py's normalize_rows() — the one part of
the Kaggle product pipeline that's fully testable without a live download. A small
fixture DataFrame matching the Sephora dataset's publicly-documented
product_info.csv columns, not a live download.
"""

import pandas as pd
import pytest

from app.core.config import settings
from app.services.admin.ingest.products import (
    KaggleCredentialsError,
    _parse_ingredients,
    _parse_size_ml,
    download_dataset,
    normalize_rows,
)


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


def test_normalize_rows_accepts_a_valid_row() -> None:
    df = pd.DataFrame([_row()])
    products, rejected = normalize_rows(df)

    assert len(products) == 1
    assert not rejected
    product = products[0]
    assert product["brand_name"] == "Bare Basics"
    assert product["currency"] == "USD"
    assert product["volume_ml"] == 150


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


def test_parse_size_ml_extracts_explicit_ml_values() -> None:
    assert _parse_size_ml("150 mL") == 150
    assert _parse_size_ml("50ml") == 50


def test_parse_size_ml_returns_none_for_non_ml_units() -> None:
    # Real, honest behavior: an oz/g size is left unconverted rather than guessed —
    # no invented oz->mL ratio.
    assert _parse_size_ml("1.7 oz") is None
    assert _parse_size_ml(None) is None


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
