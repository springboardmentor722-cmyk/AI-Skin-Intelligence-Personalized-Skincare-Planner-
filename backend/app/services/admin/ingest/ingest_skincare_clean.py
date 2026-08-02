"""source: real inspection 2026-08-03 (training_dataset/raw/skincare-clean/,
Kaggle slug eward96/skincare-products-clean-dataset). Same pipeline shape as
products.py: download (Kaggle) -> normalize -> idempotent upsert via
app.services.admin.ingest._shared, using the same natural-key dedupe -
no fuzzy matching."""

import ast
import re
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.admin.ingest._shared import (
    MAX_INGREDIENT_NAME_LENGTH,
    load_into_database,
    load_product_associations,
    write_ingest_report,
)
from app.services.admin.ingest.products import KaggleCredentialsError

_DATASET_SLUG = "eward96/skincare-products-clean-dataset"
_PRIMARY_CSV = "skincare_products_clean.csv"
_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "skincare-clean"
_REPORT_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "processed"
_LICENSE_NOTE = (
    "Kaggle dataset — license listed as 'Unknown' on the dataset page; verify "
    "before any commercial use. Stored here as a run manifest, not a DB column."
)

# Real observed product_type values (14, verified 2026-08-03) mapped onto the 7-value
# catalog products.py._TERTIARY_CATEGORY_MAP targets. Values with no confident real
# match map to "uncategorized" rather than a guessed category (AGENTS.md §0.2).
_PRODUCT_TYPE_MAP: dict[str, str] = {
    "Moisturiser": "Moisturizer",
    "Serum": "Serum",
    "Toner": "Toner",
    "Cleanser": "Face Wash",
    "Mask": "Face Masks",
    "Eye Care": "Treatment Products",
    "Exfoliator": "Treatment Products",
    "Peel": "Treatment Products",
}

# Real multi-word brands found in the dataset (verified 2026-08-03, longest-match-first).
# Handles the common case where brand_name is multiple leading words in product_name.
_KNOWN_MULTI_WORD_BRANDS = [
    # 3-word, checked first (longest match wins)
    "First Aid Beauty",
    "Peter Thomas Roth",
    "Jo Malone London",
    "Neal's Yard Remedies",
    "REN Clean Skincare",
    "The INKEY List",
    "The Organic Pharmacy",
    "The Chemistry Brand",
    "Spa Magik Organiks",
    # 2-word
    "La Roche-Posay",
    "L'Oréal Paris",
    "Estée Lauder",
    "Holika Holika",
    "Elizabeth Arden",
    "Sanctuary Spa",
    "Molton Brown",
    "Aromatherapy Associates",
    "Bubble T",
    "Liz Earle",
    "Frank Body",
    "Bondi Sands",
    "Burt's Bees",
    "Mama Mio",
    "Erno Laszlo",
    "Bobbi Brown",
    "Indeed Labs",
    "Manuka Doctor",
    "Revolution Skincare",
    "Eve Lom",
    "Fade Out",
    "By Terry",
    "Sarah Chapman",
    "Balance Me",
    "Natura Bissé",
    "Laura Mercier",
    "Shea Moisture",
    "Emma Hardie",
    "Avant Skincare",
    "Pai Skincare",
    "Dr. PAWPAW",
    "Sea Magik",
    "Oh K!",
    "L:A BRUKET",
]


def map_product_type(product_type: str | None) -> str:
    if product_type is None:
        return "uncategorized"
    return _PRODUCT_TYPE_MAP.get(product_type, "uncategorized")


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


def _extract_brand_and_name(product_name: str) -> tuple[str, str]:
    """No brand_name column exists in this dataset - brand is always the leading
    word(s) of product_name. Longest-match-first against known multi-word brands,
    then falls back to "The X" pattern, then single leading word."""
    # Try known multi-word brands (longest first, already sorted in the list)
    for brand in _KNOWN_MULTI_WORD_BRANDS:
        if product_name.startswith(brand + " ") or product_name == brand:
            return brand, product_name

    # Fall back to "The X" pattern (two-word leading-article brand)
    words = product_name.split()
    if words and words[0] == "The" and len(words) > 1:
        return f"{words[0]} {words[1]}", product_name

    # Fall back to single leading word
    return words[0] if words else "", product_name


def _parse_gbp_price(raw: str | None) -> float | None:
    if not isinstance(raw, str):
        return None
    match = re.search(r"(\d+(?:\.\d+)?)", raw)
    return float(match.group(1)) if match else None


def _parse_clean_ingreds(raw: Any) -> list[str]:
    if not isinstance(raw, str) or not raw.strip():
        return []
    try:
        items = ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return []
    if not isinstance(items, list):
        return []
    return [
        item.strip().title()
        for item in items
        if (
            isinstance(item, str)
            and item.strip()
            and len(item.strip()) <= MAX_INGREDIENT_NAME_LENGTH
        )
    ]


def normalize_rows(df: pd.DataFrame) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Pure transform, no I/O - DataFrame in, (products, rejected) out."""
    seen: set[tuple[str, str]] = set()
    products: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        product_name_raw = row.get("product_name")
        product_name = str(product_name_raw).strip() if pd.notna(product_name_raw) else ""
        price = _parse_gbp_price(row.get("price") if pd.notna(row.get("price")) else None)

        if not product_name or price is None:
            rejected.append({"row": row.to_dict(), "reason": "missing mandatory field"})
            continue

        brand_name, product_name = _extract_brand_and_name(product_name)
        dedupe_key = (brand_name.lower(), product_name.lower())
        if dedupe_key in seen:
            rejected.append({"row": row.to_dict(), "reason": "duplicate brand+name"})
            continue
        seen.add(dedupe_key)

        product_url = None
        if pd.notna(row.get("product_url")):
            product_url = str(row["product_url"]).strip()

        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": map_product_type(row.get("product_type")),
                "product_url": product_url,
                "image_url": None,
                "price": price,
                "currency": "GBP",
                "volume_ml": None,
                "ingredients": _parse_clean_ingreds(row.get("clean_ingreds")),
                "rating": None,
                "review_count": None,
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
        report_name="skincare_clean",
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
