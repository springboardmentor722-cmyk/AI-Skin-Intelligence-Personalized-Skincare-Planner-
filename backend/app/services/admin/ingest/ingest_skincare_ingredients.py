"""source: real inspection 2026-08-03 (training_dataset/raw/skincare-ingredients/,
Kaggle slug autumndyer/skincare-products-and-ingredients, file Sephora_all_423.csv
only - the dataset's other 4 files (Paula_SUM_LIST.csv, Paula_embedding_
SUMLIST_before_422.csv, binary_cosmetic_ingredient.csv, pre_alternatives.csv) are
not product-catalog-shaped and have no ingest module, per owner decision
2026-08-03. Confirmed a genuinely independent Sephora scrape from the
already-ingested nadyinky dataset - different field set entirely."""

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

_DATASET_SLUG = "autumndyer/skincare-products-and-ingredients"
_PRIMARY_CSV = "Sephora_all_423.csv"
_RAW_DIR = (
    Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "skincare-ingredients"
)
_REPORT_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "processed"
_LICENSE_NOTE = "Kaggle dataset — MIT license, verified on the dataset page."

# Same real seeded skin-type names products.py.parse_highlights already targets -
# reused here rather than reinvented, since both datasets map onto the same
# skin_types table.
_KNOWN_SKIN_TYPES = ["Dry", "Oily", "Combination", "Normal", "Sensitive"]


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
    # Downloads the full dataset (all 5 files) - only Sephora_all_423.csv is
    # ingested by this module, the other 4 stay landed raw-only.
    api.dataset_download_files(_DATASET_SLUG, path=str(_RAW_DIR), unzip=True)
    return _RAW_DIR / _PRIMARY_CSV


def _parse_price(raw: Any) -> float | None:
    if not isinstance(raw, str):
        return None
    match = re.search(r"\$(\d+(?:\.\d+)?)", raw)
    return float(match.group(1)) if match else None


def _parse_skin_types(raw: Any) -> list[str]:
    if not isinstance(raw, str) or not raw.strip():
        return []
    text = raw.replace(" and ", ", ")
    fragments = [f.strip() for f in text.split(",")]
    return sorted({f for f in fragments if f in _KNOWN_SKIN_TYPES})


def normalize_rows(df: pd.DataFrame) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Pure transform, no I/O - DataFrame in, (products, rejected) out. No category
    column exists in this source at all - every accepted row is "uncategorized"
    rather than an invented category. ingredients is left [] - the source column
    is unparsed marketing prose, not a clean INCI list, with no reliable
    machine split point between prose and the real ingredient list."""
    seen: set[tuple[str, str]] = set()
    products: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        brand_raw = row.get("brand_name")
        name_raw = row.get("cosmetic_name")
        brand_name = str(brand_raw).strip() if pd.notna(brand_raw) else ""
        product_name = str(name_raw).strip() if pd.notna(name_raw) else ""
        price = _parse_price(row.get("price") if pd.notna(row.get("price")) else None)

        if not brand_name or not product_name or price is None:
            rejected.append({"row": row.to_dict(), "reason": "missing mandatory field"})
            continue

        dedupe_key = (brand_name.lower(), product_name.lower())
        if dedupe_key in seen:
            rejected.append({"row": row.to_dict(), "reason": "duplicate brand+name"})
            continue
        seen.add(dedupe_key)

        skin_type_raw = row.get("Skin Type")
        skin_type_arg = skin_type_raw if pd.notna(skin_type_raw) else None
        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": "uncategorized",
                "product_url": str(row["cosmetic_link"]).strip()
                if pd.notna(row.get("cosmetic_link"))
                else None,
                "image_url": None,
                "price": price,
                "currency": "USD",
                "volume_ml": None,
                "ingredients": [],
                "rating": None,
                "review_count": None,
                "skin_type_names": _parse_skin_types(skin_type_arg),
                "concern_names": [],
            }
        )

    return products, rejected


async def run(db: AsyncSession) -> None:
    csv_path = download_dataset()
    df = pd.read_csv(csv_path)
    products, rejected = normalize_rows(df)
    created = await load_into_database(db, products)
    skin_type_created, concern_created = await load_product_associations(db, products)
    report_path = write_ingest_report(
        products,
        rejected,
        report_dir=_REPORT_DIR,
        report_name="skincare_ingredients",
        source=f"kaggle:{_DATASET_SLUG}#Sephora_all_423.csv",
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
