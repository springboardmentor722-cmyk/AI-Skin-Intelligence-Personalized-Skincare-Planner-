"""source: real inspection 2026-08-03 (training_dataset/raw/ecommerce/, Kaggle
slug devi5723/e-commerce-cosmetics-dataset). Only category=="skincare" rows are
accepted - the other 5 real categories (body/lips/eyes/face/hair) are rejected,
never guessed into skincare."""

import re
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.admin.ingest._shared import (
    load_into_database,
    load_product_associations,
    write_ingest_report,
)
from app.services.admin.ingest.products import KaggleCredentialsError

_DATASET_SLUG = "devi5723/e-commerce-cosmetics-dataset"
_PRIMARY_CSV = "E-commerce  cosmetic dataset.csv"  # real filename has a double space
_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "ecommerce"
_REPORT_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "processed"
_LICENSE_NOTE = "Kaggle dataset — MIT license, verified on the dataset page."

# Real observed subcategory values within category=="skincare" (8, verified
# 2026-08-03) mapped onto the 7-value catalog. "spray" has no confident real
# match - stays "uncategorized" rather than guessed (AGENTS.md §0.2).
_SUBCATEGORY_MAP: dict[str, str] = {
    "serum": "Serum",
    "moisturizer": "Moisturizer",
    "cleanser": "Face Wash",
    "face wash": "Face Wash",
    "mask": "Face Masks",
    "toner": "Toner",
    "eye treatment": "Treatment Products",
}


def map_subcategory(subcategory: str | None) -> str:
    if subcategory is None:
        return "uncategorized"
    return _SUBCATEGORY_MAP.get(subcategory, "uncategorized")


def download_dataset() -> Path:
    if not settings.kaggle_username or not settings.kaggle_key:
        raise KaggleCredentialsError(
            "KAGGLE_USERNAME/KAGGLE_KEY are blank in .env — see training_dataset/README.md."
        )
    import os

    os.environ["KAGGLE_USERNAME"] = settings.kaggle_username
    os.environ["KAGGLE_KEY"] = settings.kaggle_key
    from kaggle.api.kaggle_api_extended import KaggleApi

    _RAW_DIR.mkdir(parents=True, exist_ok=True)
    api = KaggleApi()
    api.authenticate()
    api.dataset_download_files(_DATASET_SLUG, path=str(_RAW_DIR), unzip=True)
    return _RAW_DIR / _PRIMARY_CSV


def _safe_str(value: Any) -> str:
    if pd.isna(value):
        return ""
    return str(value).strip()


def _safe_number(value: Any) -> float | None:
    if pd.isna(value):
        return None
    try:
        # Strip commas before parsing (182/2046 noofratings values are comma-formatted)
        text = str(value).replace(",", "")
        return float(text)
    except (TypeError, ValueError):
        return None


def _parse_size_ml(raw: Any) -> int | None:
    text = _safe_str(raw)
    return int(text) if re.fullmatch(r"\d+", text) else None


def _parse_ingredients(raw: Any) -> list[str]:
    text = _safe_str(raw)
    if not text:
        return []
    return [part.strip() for part in text.split(",") if part.strip() and len(part.strip()) <= 150]


def normalize_rows(df: pd.DataFrame) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Pure transform, no I/O - DataFrame in, (products, rejected) out."""
    seen: set[tuple[str, str]] = set()
    products: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        if _safe_str(row.get("category")) != "skincare":
            rejected.append({"row": row.to_dict(), "reason": "not a skincare product"})
            continue

        brand_name = _safe_str(row.get("brand"))
        product_name = _safe_str(row.get("product_name"))
        price = _safe_number(row.get("price"))

        if not brand_name or not product_name or price is None:
            rejected.append({"row": row.to_dict(), "reason": "missing mandatory field"})
            continue

        dedupe_key = (brand_name.lower(), product_name.lower())
        if dedupe_key in seen:
            rejected.append({"row": row.to_dict(), "reason": "duplicate brand+name"})
            continue
        seen.add(dedupe_key)

        rating = _safe_number(row.get("rating"))
        review_count = _safe_number(row.get("noofratings"))
        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": map_subcategory(_safe_str(row.get("subcategory")) or None),
                "product_url": _safe_str(row.get("title-href")) or None,
                "image_url": None,
                "price": price,
                "currency": "INR",
                "volume_ml": _parse_size_ml(row.get("size")),
                "ingredients": _parse_ingredients(row.get("ingredients")),
                "rating": rating,
                "review_count": int(review_count) if review_count is not None else None,
                "skin_type_names": [],
                "concern_names": [],
            }
        )

    return products, rejected


async def run(db: AsyncSession) -> None:
    csv_path = download_dataset()
    df = pd.read_csv(csv_path, encoding="latin-1")
    products, rejected = normalize_rows(df)
    created = await load_into_database(db, products)
    skin_type_created, concern_created = await load_product_associations(db, products)
    report_path = write_ingest_report(
        products,
        rejected,
        report_dir=_REPORT_DIR,
        report_name="ecommerce_cosmetics",
        source=f"kaggle:{_DATASET_SLUG}",
        source_url=f"https://www.kaggle.com/datasets/{_DATASET_SLUG}",
        license_note=_LICENSE_NOTE,
    )
    print(
        f"Ingested {created} new product(s) ({len(products) - created} already present, "
        f"{len(rejected)} rejected). Associations: {skin_type_created} skin-type link(s), "
        f"{concern_created} concern link(s). Report: {report_path}"
    )


async def main() -> None:
    from app.db.postgres import async_session_factory

    async with async_session_factory() as db:
        await run(db)


if __name__ == "__main__":
    import asyncio

    try:
        asyncio.run(main())
    except KaggleCredentialsError as exc:
        print(f"Blocked: {exc}")
