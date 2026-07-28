# source: docs/DATASETS_AND_APIS.md → "2. Product database — Kaggle (Sephora / cosmetics sets)"
"""Real Kaggle product/ingredient ingestion — `make ingest-products` /
`python -m app.services.admin.ingest.products`.

**Currently credential-blocked**, not code-blocked: `KAGGLE_USERNAME`/`KAGGLE_KEY` are
blank in `.env` (training_dataset/README.md tracks this). `download_dataset()` raises
`KaggleCredentialsError` immediately rather than letting the `kaggle` package fail
with an opaque error deep inside a network call. `normalize_rows()` — the actual
transform logic — takes a DataFrame directly and has no Kaggle/network dependency at
all, so it's fully unit-testable today against a small fixture CSV
(tests/test_products_ingest.py) even though a live download isn't possible yet.

Pipeline: download (Kaggle) -> normalize (this file's own data-quality gates,
docs/DATASETS_AND_APIS.md's own list: dedupe by brand+name+size, reject rows missing
mandatory fields, canonicalize ingredient text) -> idempotent upsert into the real
`products`/`ingredients`/`product_ingredients` tables (same tables/shape
backend/app/db/seed.py already seeds a small curated catalog into — this pipeline is
a real, larger replacement, swapped in rather than mixed in, per seed.py's own
docstring).

**No `source`/`source_url`/`license`/`ingested_at` columns exist on `products`** —
the doc's "license ledger" principle ("every ingested record stores source,
source_url, license, ingested_at") can't be satisfied as a per-row Postgres column
without inventing schema AGENTS.md says not to invent silently. Recorded instead as a
per-run JSON manifest in `training_dataset/processed/` — same information, no schema
change.
"""

import ast
import datetime
import json
import re
from pathlib import Path
from typing import Any

import pandas as pd
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.outbox import append_outbox
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.skin_profile.models import SkinConcern, SkinType

_DATASET_SLUG = "nadyinky/sephora-products-and-skincare-reviews"
_PRIMARY_CSV = "product_info.csv"
_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "sephora"
_REPORT_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "processed"

_LICENSE_NOTE = (
    "Kaggle dataset — verify the specific license on the dataset's Kaggle page "
    "before any commercial use; stored here as a run manifest, not a DB column "
    "(products has none — see this module's own docstring)."
)


class KaggleCredentialsError(Exception):
    """Raised immediately when KAGGLE_USERNAME/KAGGLE_KEY are blank — a clear,
    top-level failure instead of letting the `kaggle` package fail deep inside a
    network call with a less legible error."""


def download_dataset() -> Path:
    if not settings.kaggle_username or not settings.kaggle_key:
        raise KaggleCredentialsError(
            "KAGGLE_USERNAME/KAGGLE_KEY are blank in .env — see training_dataset/README.md "
            "for how to obtain and set a real Kaggle API token. Nothing else to fix in code."
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


# Real dataset values (training_dataset/raw/sephora/product_info.csv's
# `tertiary_category` column, Skincare-primary-category rows only) mapped to
# MILESTONE 3.pdf Step 2's 7 literal catalog categories. Anything not listed here
# gets "uncategorized" rather than a guessed category (AGENTS.md §0.2) - this table
# was built by inspecting the real column's actual value distribution, not invented.
_TERTIARY_CATEGORY_MAP: dict[str, str] = {
    "Face Wash & Cleansers": "Face Wash",
    "Moisturizers": "Moisturizer",
    "Night Creams": "Moisturizer",
    "Face Sunscreen": "Sunscreen",
    "Body Sunscreen": "Sunscreen",
    "Face Serums": "Serum",
    "Toners": "Toner",
    "Face Masks": "Face Masks",
    "Sheet Masks": "Face Masks",
    "Eye Masks": "Face Masks",
    "Blemish & Acne Treatments": "Treatment Products",
    "Anti-Aging": "Treatment Products",
    "Facial Peels": "Treatment Products",
    "Exfoliators": "Treatment Products",
    "Eye Creams & Treatments": "Treatment Products",
}


def map_tertiary_category(tertiary_category: str | None) -> str:
    if tertiary_category is None:
        return "uncategorized"
    return _TERTIARY_CATEGORY_MAP.get(tertiary_category, "uncategorized")


# Real dataset values (training_dataset/raw/sephora/product_info.csv's `highlights`
# column, Skincare-primary-category rows only) mapped onto this app's real seeded
# skin_types.skin_type_name / skin_concerns.concern_name values. Confirmed by
# inspecting the real column's actual value distribution (2,003 of 2,420 Skincare
# rows have a non-null highlights value) — phrases with no clean match (e.g. "Good
# for: Pores", no "Sensitive" phrase at all) are deliberately left unmapped, never
# guessed (AGENTS.md §0.2).
_SKIN_TYPE_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Best for Combination Skin": ["Combination"],
    "Best for Dry Skin": ["Dry"],
    "Best for Dry, Combo, Normal Skin": ["Dry", "Combination", "Normal"],
    "Best for Normal Skin": ["Normal"],
    "Best for Oily Skin": ["Oily"],
    "Best for Oily, Combo, Normal Skin": ["Oily", "Combination", "Normal"],
}

_CONCERN_HIGHLIGHT_MAP: dict[str, list[str]] = {
    "Good for: Acne/Blemishes": ["Acne"],
    "Good for: Anti-Aging": ["Wrinkles", "Fine Lines"],
    "Good for: Dark spots": ["Dark Spots"],
    "Good for: Dryness": ["Dry Skin"],
    "Good for: Dullness/Uneven Texture": ["Uneven Skin Tone"],
    "Good for: Redness": ["Redness"],
}


def parse_highlights(highlights_raw: str | None) -> tuple[list[str], list[str]]:
    """Real, non-fabricated mapping from the raw Sephora dataset's own
    `highlights` column (a Python-literal-repr'd list of strings) to this app's
    exact seeded skin_types.skin_type_name / skin_concerns.concern_name values.
    Any phrase not in the maps above contributes nothing - never guessed
    (AGENTS.md §0.2)."""
    if not highlights_raw:
        return [], []
    try:
        items = ast.literal_eval(highlights_raw)
    except (ValueError, SyntaxError):
        return [], []
    if not isinstance(items, list):
        return [], []

    skin_types: list[str] = []
    concerns: list[str] = []
    for item in items:
        if item in _SKIN_TYPE_HIGHLIGHT_MAP:
            skin_types.extend(_SKIN_TYPE_HIGHLIGHT_MAP[item])
        if item in _CONCERN_HIGHLIGHT_MAP:
            concerns.extend(_CONCERN_HIGHLIGHT_MAP[item])
    return sorted(set(skin_types)), sorted(set(concerns))


_MAX_INGREDIENT_NAME_LENGTH = 150  # ingredients.ingredient_name is VARCHAR(150)


def _parse_ingredients(raw: Any) -> list[str]:
    """docs/DATASETS_AND_APIS.md §2's own rule: "INCI lists are messy — strip
    parentheticals, split on commas, canonicalize casing". The real Sephora dataset
    also uses semicolons for some rows' sub-lists (a product's shade variants each
    carrying their own semicolon-separated INCI list, joined by commas at the top
    level) — comma-only splitting left those as one multi-hundred-char "ingredient",
    which then blew past ingredients.ingredient_name's real VARCHAR(150) column limit
    on the live database. Found live, not by inspection: no fixture ever exercised a
    semicolon-delimited row. Splitting on both never breaks a normal comma-only row
    (no semicolons present, `.split(";")`-then-flatten is a no-op there).

    A row can still legitimately contain a single, unsplittable fragment over 150
    chars (or one instance where an ingredient description just is that long) — that
    fragment is rejected here rather than silently truncated (a truncated INCI name is
    worse than a dropped one for a canonical, unique-constrained ingredient table)."""
    if not isinstance(raw, str) or not raw.strip():
        return []
    text = raw.strip()
    # The Kaggle column is usually a Python-list-literal string, e.g. "['Water, ...']"
    text = text.strip("[]'\"")
    without_parens = re.sub(r"\([^)]*\)", "", text)
    parts = [
        p.strip(" '\"").title()
        for chunk in without_parens.split(",")
        for p in chunk.split(";")
    ]
    return [p for p in parts if p and 1 < len(p) <= _MAX_INGREDIENT_NAME_LENGTH]


def _parse_size_ml(raw: Any) -> int | None:
    """Best-effort: only returns a value when the size text explicitly names mL/ml —
    other units (oz, g) are left as None rather than guessing a conversion."""
    if not isinstance(raw, str):
        return None
    match = re.search(r"(\d+(?:\.\d+)?)\s*m[lL]\b", raw)
    return int(float(match.group(1))) if match else None


def _safe_number(value: Any) -> float | None:
    """Same `pd.isna()` discipline as `_safe_str` — a missing rating/reviews cell
    stays None, never a guessed default (M3-C: real Sephora columns, not invented)."""
    if pd.isna(value):
        return None
    return float(value)


def _safe_str(value: Any) -> str:
    """`value or ""` doesn't catch a pandas-missing cell: `float("nan")` is truthy in
    Python, so a NaN brand_name/product_name silently passed through as the string
    "nan" before this existed — found live, not by inspection (a fixture row with
    product_name=None became `str(nan or "")` = "nan", a non-empty string that
    slipped past the mandatory-field check). `pd.isna()` catches None/NaN/NaT
    uniformly; plain truthiness doesn't."""
    if pd.isna(value):
        return ""
    return str(value).strip()


def normalize_rows(df: pd.DataFrame) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """Pure transform, no I/O — DataFrame in, (products, rejected) out. Real
    data-quality gates from docs/DATASETS_AND_APIS.md: dedupe by brand+name+size,
    reject rows missing mandatory fields (brand_name/product_name/price)."""
    seen: set[tuple[str, str, int | None]] = set()
    products: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        if _safe_str(row.get("primary_category")) != "Skincare":
            rejected.append({"row": row.to_dict(), "reason": "not a skincare product"})
            continue

        brand_name = _safe_str(row.get("brand_name"))
        product_name = _safe_str(row.get("product_name"))
        price_raw = row.get("price_usd")

        if not brand_name or not product_name or pd.isna(price_raw):
            rejected.append({"row": row.to_dict(), "reason": "missing mandatory field"})
            continue

        volume_ml = _parse_size_ml(row.get("size"))
        dedupe_key = (brand_name.lower(), product_name.lower(), volume_ml)
        if dedupe_key in seen:
            rejected.append({"row": row.to_dict(), "reason": "duplicate brand+name+size"})
            continue
        seen.add(dedupe_key)

        reviews = _safe_number(row.get("reviews"))
        skin_type_names, concern_names = parse_highlights(_safe_str(row.get("highlights")) or None)
        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": map_tertiary_category(_safe_str(row.get("tertiary_category")) or None),
                "product_url": _safe_str(row.get("product_url")) or None,
                "image_url": _safe_str(row.get("image_url")) or None,
                "price": float(price_raw),
                # real: Sephora is a US retailer (AGENTS.md's $ secondary currency)
                "currency": "USD",
                "volume_ml": volume_ml,
                "ingredients": _parse_ingredients(row.get("ingredients")),
                "rating": _safe_number(row.get("rating")),
                "review_count": int(reviews) if reviews is not None else None,
                "skin_type_names": skin_type_names,
                "concern_names": concern_names,
            }
        )

    return products, rejected


async def load_into_database(db: AsyncSession, products: list[dict[str, Any]]) -> int:
    """Idempotent upsert — same pattern as backend/app/db/seed.py: check-then-insert
    on the natural key (brand_name, product_name), never a blind re-insert."""
    existing_result = await db.execute(select(Product.brand_name, Product.product_name))
    existing_products = {(b, n) for b, n in existing_result.all()}

    existing_ingredients_result = await db.execute(select(Ingredient.ingredient_name))
    ingredient_ids: dict[str, int] = {}
    for name in existing_ingredients_result.scalars().all():
        result = await db.execute(
            select(Ingredient.ingredient_id).where(Ingredient.ingredient_name == name)
        )
        ingredient_ids[name] = result.scalar_one()

    created = 0
    for entry in products:
        key = (entry["brand_name"], entry["product_name"])
        if key in existing_products:
            continue

        product = Product(
            brand_name=entry["brand_name"],
            product_name=entry["product_name"],
            category=entry["category"],
            product_url=entry["product_url"],
            image_url=entry["image_url"],
            price=entry["price"],
            currency=entry["currency"],
            volume_ml=entry["volume_ml"],
            rating=entry["rating"],
            review_count=entry["review_count"],
        )
        db.add(product)
        await db.flush()
        await append_outbox(db, "product", str(product.product_id), "upsert")

        # dict.fromkeys dedupes while preserving order — a single product's own INCI
        # list can repeat the same canonicalized ingredient name (e.g. two entries
        # that both title-case to "Water"), which otherwise tries to insert the same
        # (product_id, ingredient_id) pair twice and hits product_ingredients' unique
        # constraint. Found live: the real Sephora dataset triggers this on its first
        # full run, no fixture ever exercised it.
        for ingredient_name in dict.fromkeys(entry["ingredients"]):
            if ingredient_name not in ingredient_ids:
                ingredient = Ingredient(ingredient_name=ingredient_name)
                db.add(ingredient)
                await db.flush()
                await append_outbox(db, "ingredient", str(ingredient.ingredient_id), "upsert")
                ingredient_ids[ingredient_name] = ingredient.ingredient_id
            db.add(
                ProductIngredient(
                    product_id=product.product_id,
                    ingredient_id=ingredient_ids[ingredient_name],
                )
            )

        created += 1

    await db.commit()
    return created


async def load_product_associations(
    db: AsyncSession, products: list[dict[str, Any]]
) -> tuple[int, int]:
    """Idempotent - populates product_skin_types/product_concerns for every
    accepted product from this ingest (whether just-created or already present
    from an earlier run), keyed by the same (brand_name, product_name) natural
    key load_into_database uses. Real data only: skin_type_names/concern_names
    come from parse_highlights' honest mapping, never fabricated here."""
    skin_type_id_by_name: dict[str, int] = dict(
        (await db.execute(select(SkinType.skin_type_name, SkinType.skin_type_id))).all()  # type: ignore[arg-type]
    )
    concern_id_by_name: dict[str, int] = dict(
        (await db.execute(select(SkinConcern.concern_name, SkinConcern.concern_id))).all()  # type: ignore[arg-type]
    )
    product_id_by_key = {
        (brand_name, product_name): product_id
        for product_id, brand_name, product_name in (
            await db.execute(
                select(Product.product_id, Product.brand_name, Product.product_name)
            )
        ).all()
    }
    existing_skin_type_pairs = {
        (product_id, skin_type_id)
        for product_id, skin_type_id in (
            await db.execute(select(ProductSkinType.product_id, ProductSkinType.skin_type_id))
        ).all()
    }
    existing_concern_pairs = {
        (product_id, concern_id)
        for product_id, concern_id in (
            await db.execute(select(ProductConcern.product_id, ProductConcern.concern_id))
        ).all()
    }

    skin_type_created = 0
    concern_created = 0
    for entry in products:
        product_id = product_id_by_key.get((entry["brand_name"], entry["product_name"]))
        if product_id is None:
            continue
        for name in entry.get("skin_type_names", []):
            skin_type_id = skin_type_id_by_name.get(name)
            if skin_type_id is None or (product_id, skin_type_id) in existing_skin_type_pairs:
                continue
            db.add(ProductSkinType(product_id=product_id, skin_type_id=skin_type_id))
            existing_skin_type_pairs.add((product_id, skin_type_id))
            skin_type_created += 1
        for name in entry.get("concern_names", []):
            concern_id = concern_id_by_name.get(name)
            if concern_id is None or (product_id, concern_id) in existing_concern_pairs:
                continue
            db.add(ProductConcern(product_id=product_id, concern_id=concern_id))
            existing_concern_pairs.add((product_id, concern_id))
            concern_created += 1

    await db.commit()
    return skin_type_created, concern_created


def write_ingest_report(products: list[dict[str, Any]], rejected: list[dict[str, Any]]) -> Path:
    _REPORT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.UTC).strftime("%Y%m%dT%H%M%SZ")
    report_path = _REPORT_DIR / f"products_ingest_{timestamp}.json"
    report_path.write_text(
        json.dumps(
            {
                "source": f"kaggle:{_DATASET_SLUG}",
                "source_url": f"https://www.kaggle.com/datasets/{_DATASET_SLUG}",
                "license": _LICENSE_NOTE,
                "ingested_at": timestamp,
                "accepted_count": len(products),
                "rejected_count": len(rejected),
            },
            indent=2,
        )
    )
    return report_path


async def run(db: AsyncSession) -> None:
    csv_path = download_dataset()
    df = pd.read_csv(csv_path)
    products, rejected = normalize_rows(df)
    created = await load_into_database(db, products)
    skin_type_created, concern_created = await load_product_associations(db, products)
    report_path = write_ingest_report(products, rejected)
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
