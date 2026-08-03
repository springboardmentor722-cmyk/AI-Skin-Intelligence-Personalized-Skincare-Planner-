# Dataset Expansion (5 Kaggle datasets) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ingest 3 new Kaggle product datasets into the existing `products`/`ingredients`/`product_ingredients` Postgres tables via the same pattern `products.py` already uses for Sephora, and land 2 more (plus 4 non-product files from one of the 3) raw-only where real inspection found no usable mandatory-field/category signal.

**Architecture:** Extract `products.py`'s generic DB-loading logic (`load_into_database`, `load_product_associations`, `write_ingest_report`) into a shared module so 3 new ingest modules each only need their own `download_dataset()` + `normalize_rows()`. Every dataset normalizes onto the same target row shape; cross-dataset "matching" is the existing exact `(brand_name, product_name)` natural-key dedupe — no new fuzzy-matching layer.

**Tech Stack:** Python 3.11+, FastAPI backend (`backend/`), SQLAlchemy async, pandas, `uv`, pytest, Kaggle API (`kaggle` package, credentials already in `.env`).

## Global Constraints

- All business logic in `backend/app/services/admin/ingest/` — no layer skipping (AGENTS.md §2).
- Every ingested product still passes the same mandatory-field gate `products.py` uses: `brand_name`, `product_name`, `price` all present, or the row is rejected with a reason — never guessed or defaulted (AGENTS.md §0.2).
- Category values map only to the 7-value catalog (`Face Wash`, `Moisturizer`, `Sunscreen`, `Serum`, `Toner`, `Face Masks`, `Treatment Products`) or `uncategorized` — only using category/type values actually observed in each dataset's real data (recorded below), never invented.
- `ingredients.ingredient_name` is `VARCHAR(150)` — any parsed ingredient fragment over 150 chars is rejected, never truncated (same rule `products.py._parse_ingredients` already enforces).
- No fuzzy/RapidFuzz matching anywhere — exact-match natural-key dedupe only (AGENTS.md precedent, `enrich_product_images.py`).
- `ruff` + `mypy --strict` + `pytest` must pass for every backend change (run from `backend/`: `uv run ruff check .`, `uv run mypy --strict app`, `uv run pytest`).
- Never commit real downloaded dataset files — `training_dataset/raw/` and `training_dataset/processed/` are gitignored; only code, docs, and small JSON metadata files (`dataset_info.json`, `schema.json`, `column_mapping.json`) get committed.
- Git workflow: one feature branch per task, merged to local `dev`, branch deleted. `dev` never pushed. `main` never touched. `satya-sai-tharun-skinlytics` untouched until the owner explicitly asks.
- Commit author/no-Claude-co-author rules per `AGENTS.md` §6 — do not add a `Co-Authored-By: Claude` trailer.

---

## Task 1: Extract shared ingest-loader helpers from `products.py`

**Files:**
- Create: `backend/app/services/admin/ingest/_shared.py`
- Modify: `backend/app/services/admin/ingest/products.py:1-464` (remove the extracted functions, import + call the shared ones instead)
- Test: `backend/tests/test_products_ingest.py` (existing tests must still pass unmodified — this task changes internal structure, not behavior — plus one new test for the natural-key within-batch fix below)

**Interfaces:**
- Produces (used by Tasks 2–4):
  - `async def load_into_database(db: AsyncSession, products: list[dict[str, Any]]) -> int`
  - `async def load_product_associations(db: AsyncSession, products: list[dict[str, Any]]) -> tuple[int, int]`
  - `def write_ingest_report(products: list[dict[str, Any]], rejected: list[dict[str, Any]], *, report_dir: Path, report_name: str, source: str, source_url: str, license_note: str) -> Path`
  - `MAX_INGREDIENT_NAME_LENGTH: int = 150`

- [ ] **Step 1: Run the existing test suite to capture a baseline**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: all tests PASS (this is the pre-refactor baseline — the refactor must not change this).

- [ ] **Step 2: Create `backend/app/services/admin/ingest/_shared.py`**

```python
"""Shared loader helpers for the Kaggle product ingest pipeline
(backend/app/services/admin/ingest/*.py). Every dataset module normalizes its own
source columns into the same product-dict shape (see products.py's normalize_rows
docstring for the exact fields); these functions then load that shape into
Postgres identically regardless of source, so the natural-key
(brand_name, product_name) dedupe in load_into_database is the one place
cross-dataset "matching" happens — never per-dataset custom logic, no fuzzy
matching (AGENTS.md precedent, enrich_product_images.py).
"""

import datetime
import json
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.outbox import append_outbox
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.skin_profile.models import SkinConcern, SkinType

MAX_INGREDIENT_NAME_LENGTH = 150  # ingredients.ingredient_name is VARCHAR(150)


async def load_into_database(db: AsyncSession, products: list[dict[str, Any]]) -> int:
    """Idempotent upsert - check-then-insert on the natural key
    (brand_name, product_name), same pattern as backend/app/db/seed.py. This is the
    one place cross-dataset duplicate products are caught: a product landing from a
    second dataset with the same (brand_name, product_name) is skipped here, never
    double-inserted.

    `existing_products.add(key)` inside the loop (not just the initial DB read) is a
    real fix over the original single-dataset version: normalize_rows' own dedupe
    key can include a field load_into_database's key doesn't (e.g. volume_ml/size),
    so two accepted rows in the *same* normalize_rows output can share this
    function's (brand_name, product_name) key without normalize_rows having caught
    it. Without tracking newly-created keys as the loop proceeds, the second row
    would insert a second, duplicate product for that same natural key within one
    run."""
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
        existing_products.add(key)

    await db.commit()
    return created


async def load_product_associations(
    db: AsyncSession, products: list[dict[str, Any]]
) -> tuple[int, int]:
    """Idempotent - populates product_skin_types/product_concerns for every
    accepted product from this ingest, keyed by the same (brand_name, product_name)
    natural key load_into_database uses. ADR-010: every product whose association
    set actually changes gets its own outbox row, same as load_into_database's own
    upserts."""
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
    changed_product_ids: set[int] = set()
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
            changed_product_ids.add(product_id)
        for name in entry.get("concern_names", []):
            concern_id = concern_id_by_name.get(name)
            if concern_id is None or (product_id, concern_id) in existing_concern_pairs:
                continue
            db.add(ProductConcern(product_id=product_id, concern_id=concern_id))
            existing_concern_pairs.add((product_id, concern_id))
            concern_created += 1
            changed_product_ids.add(product_id)

    for product_id in changed_product_ids:
        await append_outbox(db, "product", str(product_id), "upsert")

    await db.commit()
    return skin_type_created, concern_created


def write_ingest_report(
    products: list[dict[str, Any]],
    rejected: list[dict[str, Any]],
    *,
    report_dir: Path,
    report_name: str,
    source: str,
    source_url: str,
    license_note: str,
) -> Path:
    report_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.UTC).strftime("%Y%m%dT%H%M%SZ")
    report_path = report_dir / f"{report_name}_ingest_{timestamp}.json"
    report_path.write_text(
        json.dumps(
            {
                "source": source,
                "source_url": source_url,
                "license": license_note,
                "ingested_at": timestamp,
                "accepted_count": len(products),
                "rejected_count": len(rejected),
            },
            indent=2,
        )
    )
    return report_path
```

- [ ] **Step 3: Update `products.py` to use the shared module**

Delete `load_into_database`, `load_product_associations`, `write_ingest_report`, and the module-level `_MAX_INGREDIENT_NAME_LENGTH` from `products.py` (lines 170, 283-433 in the current file). Replace with imports and update `run()`:

```python
from app.services.admin.ingest._shared import (
    MAX_INGREDIENT_NAME_LENGTH,
    load_into_database,
    load_product_associations,
    write_ingest_report,
)
```

Change every reference to `_MAX_INGREDIENT_NAME_LENGTH` in `_parse_ingredients` to `MAX_INGREDIENT_NAME_LENGTH`. Update `run()`:

```python
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
        report_name="products",
        source=f"kaggle:{_DATASET_SLUG}",
        source_url=f"https://www.kaggle.com/datasets/{_DATASET_SLUG}",
        license_note=_LICENSE_NOTE,
    )
    print(
        f"Ingested {created} new product(s) ({len(products) - created} already present, "
        f"{len(rejected)} rejected). Associations: {skin_type_created} skin-type link(s), "
        f"{concern_created} concern link(s). Report: {report_path}"
    )
```

- [ ] **Step 4: Run the existing test suite again to confirm no behavior change**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: all tests PASS, identical results to Step 1.

- [ ] **Step 5: Add a regression test for the within-batch natural-key fix**

Add to `backend/tests/test_products_ingest.py`:

```python
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
```

Also update the existing test file's imports: `load_into_database`, `load_product_associations` now come from `app.services.admin.ingest._shared` instead of `app.services.admin.ingest.products` — update the `from app.services.admin.ingest.products import (...)` block to drop those two names and add `from app.services.admin.ingest._shared import load_into_database, load_product_associations`.

- [ ] **Step 6: Run the full test file once more**

Run: `cd backend && uv run pytest tests/test_products_ingest.py -v`
Expected: all tests PASS including the new one.

- [ ] **Step 7: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-shared-ingest-loader
git add backend/app/services/admin/ingest/_shared.py backend/app/services/admin/ingest/products.py backend/tests/test_products_ingest.py
git commit -m "refactor: extract shared product-ingest DB loaders from products.py

Three new Kaggle dataset ingest modules are about to reuse the same
load_into_database/load_product_associations/write_ingest_report logic
products.py already has - extracted once here instead of duplicating ~150
lines per new module. Also fixes a latent within-batch natural-key bug:
load_into_database now tracks newly-created (brand_name, product_name)
keys as it loops, not just the initial DB read, so two accepted rows
sharing that key within one run only ever create one product."
git checkout dev
git merge feature/dataset-shared-ingest-loader
git branch -d feature/dataset-shared-ingest-loader
```

---

## Task 2: Ingest Skincare Products Clean Dataset (`eward96`)

**Files:**
- Create: `backend/app/services/admin/ingest/ingest_skincare_clean.py`
- Create: `backend/tests/test_skincare_clean_ingest.py`
- Create: `training_dataset/raw/skincare-clean/dataset_info.json`
- Create: `training_dataset/raw/skincare-clean/schema.json`
- Create: `training_dataset/raw/skincare-clean/column_mapping.json`
- Modify: `Makefile:5` (add `ingest-skincare-clean` to `.PHONY`, add the target)
- Modify: `training_dataset/MANIFEST.md` (add row #5)
- Modify: `training_dataset/README.md` (add a Status table row)

**Interfaces:**
- Consumes: `load_into_database`, `load_product_associations`, `write_ingest_report`, `MAX_INGREDIENT_NAME_LENGTH` from `app.services.admin.ingest._shared` (Task 1)
- Produces: `normalize_rows(df: pd.DataFrame) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]` (same shape as `products.py`'s), `download_dataset() -> Path`, `run(db)`, `main()`

Real data already inspected (raw file at `training_dataset/raw/skincare-clean/skincare_products_clean.csv`, 1,138 rows, **zero nulls in any column**):
- Columns: `product_name, product_url, product_type, clean_ingreds, price`
- Must read with `encoding="latin-1"` — confirmed live, default UTF-8 mangles the `£` symbol in `price`.
- `price` format: `"£5.20"` (always GBP, always has the `£` prefix).
- `clean_ingreds` format: a Python-list-literal string, e.g. `"['capric triglyceride', 'cetyl alcohol', ...]"` — no parenthetical notes to strip (unlike Sephora's), just a literal list.
- No `brand_name` column at all — `product_name` embeds the brand (e.g. `"The Ordinary Natural Moisturising Factors + HA 30ml"`, `"CeraVe Facial Moisturising Lotion SPF 25 52ml"`). Brand is the first word/words before the product descriptor — extracted via a small known-brand lookup built from this dataset's own real distinct leading words (not guessed per-row), falling back to using the first word alone as `brand_name` when no better split is available. **No mandatory-field rejection risk from this** — `product_name` is always non-empty and a leading-word brand is always extractable.
- All 14 real `product_type` values → target category:
  - `Moisturiser` → `Moisturizer`
  - `Serum` → `Serum`
  - `Toner` → `Toner`
  - `Cleanser` → `Face Wash`
  - `Mask` → `Face Masks`
  - `Eye Care` → `Treatment Products`
  - `Exfoliator` → `Treatment Products`
  - `Peel` → `Treatment Products`
  - `Body Wash`, `Mist`, `Oil`, `Balm`, `Bath Salts`, `Bath Oil` → `uncategorized` (no confident real match to the 7-value catalog — never guessed)
- No `volume_ml`, `rating`, `review_count`, `image_url`, `skin_type_names`, `concern_names` columns exist at all — all `None`/`[]` for every row from this source.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_skincare_clean_ingest.py`:

```python
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_skincare_clean_ingest.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services.admin.ingest.ingest_skincare_clean'`

- [ ] **Step 3: Write the implementation**

Create `backend/app/services/admin/ingest/ingest_skincare_clean.py`:

```python
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
    word(s) of product_name (real observed pattern: "CeraVe ...", "The Ordinary
    ...", "Weleda ..."). Two-word brands starting with "The" are kept together
    (the only real multi-word-leading-article brand observed); every other brand is
    the single leading word - never guessed beyond what's mechanically extractable
    from the string itself."""
    words = product_name.split()
    if words and words[0] == "The" and len(words) > 1:
        return f"{words[0]} {words[1]}", product_name
    return words[0], product_name


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
        if isinstance(item, str) and item.strip() and len(item.strip()) <= MAX_INGREDIENT_NAME_LENGTH
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

        products.append(
            {
                "brand_name": brand_name,
                "product_name": product_name,
                "category": map_product_type(row.get("product_type")),
                "product_url": str(row["product_url"]).strip() if pd.notna(row.get("product_url")) else None,
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && uv run pytest tests/test_skincare_clean_ingest.py -v`
Expected: PASS (all cases).

- [ ] **Step 5: Write `dataset_info.json`, `schema.json`, `column_mapping.json`**

Create `training_dataset/raw/skincare-clean/dataset_info.json`:

```json
{
  "name": "Skincare Products Clean Dataset",
  "source": "Kaggle",
  "kaggle_url": "https://www.kaggle.com/datasets/eward96/skincare-products-clean-dataset",
  "kaggle_slug": "eward96/skincare-products-clean-dataset",
  "download_date": "2026-08-03",
  "license": "Unknown (per Kaggle dataset page)",
  "file_count": 1,
  "row_count": 1138,
  "column_count": 5,
  "columns": ["product_name", "product_url", "product_type", "clean_ingreds", "price"],
  "missing_values": {"product_name": 0, "product_url": 0, "product_type": 0, "clean_ingreds": 0, "price": 0},
  "file_size_bytes": 761156,
  "notes": "Zero nulls in any column. Requires encoding='latin-1' to read the £ price symbol correctly - default UTF-8 mangles it."
}
```

Create `training_dataset/raw/skincare-clean/schema.json`:

```json
{
  "product_name": {"dtype": "str", "nullable": false, "unique_count": 1138, "examples": ["The Ordinary Natural Moisturising Factors + HA 30ml", "CeraVe Facial Moisturising Lotion SPF 25 52ml", "CeraVe Moisturising Cream 50ml"]},
  "product_url": {"dtype": "str", "nullable": false, "unique_count": 1126, "examples": ["https://www.lookfantastic.com/the-ordinary-natural-moisturising-factors-ha-30ml/11396687.html"]},
  "product_type": {"dtype": "str", "nullable": false, "unique_count": 14, "examples": ["Moisturiser", "Serum", "Mask"]},
  "clean_ingreds": {"dtype": "str (python-list-literal)", "nullable": false, "unique_count": 1071, "examples": ["['capric triglyceride', 'cetyl alcohol', 'propanediol']"]},
  "price": {"dtype": "str (GBP, £-prefixed)", "nullable": false, "unique_count": 213, "examples": ["£5.20", "£13.00", "£22.00"]}
}
```

Create `training_dataset/raw/skincare-clean/column_mapping.json`:

```json
{
  "product_name": "product_name (also source of brand_name via leading-word extraction)",
  "product_url": "product_url",
  "product_type": "category (via _PRODUCT_TYPE_MAP)",
  "clean_ingreds": "ingredients (python-list-literal parse, title-cased)",
  "price": "price (£ stripped), currency hardcoded 'GBP'",
  "_unmapped_target_fields": ["image_url", "volume_ml", "rating", "review_count", "skin_type_names", "concern_names"]
}
```

- [ ] **Step 6: Add the Makefile target**

Edit `Makefile` — add `ingest-skincare-clean` to the `.PHONY` line (line 5), then add after the `ingest-products` target:

```makefile
ingest-skincare-clean:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.services.admin.ingest.ingest_skincare_clean; \
	else \
		echo "backend/ does not exist yet — nothing to ingest."; \
	fi
```

- [ ] **Step 7: Run the real ingest against local Postgres**

Run: `make ingest-skincare-clean`
Record the real printed output (accepted/rejected/created counts) — do not proceed to Step 8 until this has actually run against live Postgres.

- [ ] **Step 8: Update `training_dataset/MANIFEST.md`**

Add a new row to the table (after row 4):

```markdown
| 5 | Skincare Products Clean Dataset | `eward96/skincare-products-clean-dataset` | `training_dataset/raw/skincare-clean/` | `skincare_products_clean.csv` | `backend/app/services/admin/ingest/ingest_skincare_clean.py` → `products`/`ingredients`/`product_ingredients` (Postgres) | **Ingested 2026-08-03** — [real accepted/rejected counts from Step 7]. No brand_name column - brand extracted from product_name's leading word(s). GBP pricing. |
```

- [ ] **Step 9: Update `training_dataset/README.md`'s Status table**

Add a row matching the existing table's format (real counts from Step 7, not estimated).

- [ ] **Step 10: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app && uv run pytest tests/test_skincare_clean_ingest.py -v`
Expected: no errors, all tests pass.

- [ ] **Step 11: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-skincare-clean
git add backend/app/services/admin/ingest/ingest_skincare_clean.py backend/tests/test_skincare_clean_ingest.py training_dataset/raw/skincare-clean/dataset_info.json training_dataset/raw/skincare-clean/schema.json training_dataset/raw/skincare-clean/column_mapping.json Makefile training_dataset/MANIFEST.md training_dataset/README.md
git commit -m "feat(data): ingest Skincare Products Clean Dataset (eward96)

1,138 lookfantastic.com-scraped skincare products, GBP pricing. No
brand_name column in the source - brand extracted from product_name's
leading word(s), verified against the real distinct product names."
git checkout dev
git merge feature/dataset-skincare-clean
git branch -d feature/dataset-skincare-clean
```

---

## Task 3: Ingest E-Commerce Cosmetics Dataset (`devi5723`), skincare rows only

**Files:**
- Create: `backend/app/services/admin/ingest/ingest_ecommerce_cosmetics.py`
- Create: `backend/tests/test_ecommerce_cosmetics_ingest.py`
- Create: `training_dataset/raw/ecommerce/dataset_info.json`
- Create: `training_dataset/raw/ecommerce/schema.json`
- Create: `training_dataset/raw/ecommerce/column_mapping.json`
- Modify: `Makefile` (add `ingest-ecommerce-cosmetics`)
- Modify: `training_dataset/MANIFEST.md` (row #6)
- Modify: `training_dataset/README.md` (Status table row)

**Interfaces:**
- Consumes: same `_shared` imports as Task 2.
- Produces: `normalize_rows`, `download_dataset`, `run`, `main` (same shapes as Task 2).

Real data already inspected (raw file `training_dataset/raw/ecommerce/E-commerce  cosmetic dataset.csv`, note the real filename has a double space; 12,615 total rows, 2,077 with real `category == "skincare"`):
- Real columns: `product_name, website, country, category, subcategory, title-href, price, brand, ingredients, form, type, color, size, rating, noofratings` (note: real names differ from the Kaggle page's prose — verified from the actual header, not the description).
- Must read with `encoding="latin-1"` — confirmed live, default UTF-8 raises `UnicodeDecodeError` on this file.
- `category` real values (6): `body, lips, eyes, skincare, face, hair` — filter to `category == "skincare"` only.
- Real `subcategory` values within `category == "skincare"` (8, all observed): `serum(817), moisturizer(404), cleanser(281), mask(172), face wash(172), toner(128), eye treatment(73), spray(30)`.
- `price` is numeric (already a float column), always INR (per the dataset's own description — scraped for Indian-market cosmetics analysis regardless of source country).
- Within the skincare subset: `ingredients` null for 401/2077 rows, `type`/`color` null for 577/2077, `size` null for 105/2077, `rating`/`noofratings` null for 31/2077 (each a string when present, e.g. `"4.16"`/`"14"`) — all real, all left `None` when absent, never defaulted.
- `size` is a bare numeric string (e.g. `"75"`) with no unit suffix visible in the samples — treated as already-mL (real observed values are in the same 30-500 range as Sephora's mL sizes) and parsed as an int when it's a clean digit string, `None` otherwise (never guessed as a different unit).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_ecommerce_cosmetics_ingest.py`:

```python
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_ecommerce_cosmetics_ingest.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Write the implementation**

Create `backend/app/services/admin/ingest/ingest_ecommerce_cosmetics.py`:

```python
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
        return float(value)
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && uv run pytest tests/test_ecommerce_cosmetics_ingest.py -v`
Expected: PASS (all cases).

- [ ] **Step 5: Write `dataset_info.json`, `schema.json`, `column_mapping.json`**

Create `training_dataset/raw/ecommerce/dataset_info.json`:

```json
{
  "name": "E-Commerce Cosmetics Dataset",
  "source": "Kaggle",
  "kaggle_url": "https://www.kaggle.com/datasets/devi5723/e-commerce-cosmetics-dataset",
  "kaggle_slug": "devi5723/e-commerce-cosmetics-dataset",
  "download_date": "2026-08-03",
  "license": "MIT",
  "file_count": 1,
  "row_count": 12615,
  "skincare_row_count": 2077,
  "column_count": 15,
  "columns": ["product_name", "website", "country", "category", "subcategory", "title-href", "price", "brand", "ingredients", "form", "type", "color", "size", "rating", "noofratings"],
  "file_size_bytes": 7600800,
  "notes": "Requires encoding='latin-1' - default UTF-8 raises UnicodeDecodeError. Real column names differ from the Kaggle page's prose description (size not quantity, noofratings not 'number of ratings') - verified from the actual header. Price is INR throughout regardless of source country."
}
```

Create `training_dataset/raw/ecommerce/schema.json`:

```json
{
  "category": {"dtype": "str", "nullable": false, "unique_count": 6, "examples": ["skincare", "body", "lips"]},
  "subcategory": {"dtype": "str", "nullable": false, "unique_count": 8, "note": "within category==skincare only", "examples": ["serum", "moisturizer", "cleanser"]},
  "price": {"dtype": "float64 (INR)", "nullable": true, "null_count_in_skincare": 2, "examples": [3100.0, 1633.38]},
  "ingredients": {"dtype": "str", "nullable": true, "null_count_in_skincare": 401, "examples": ["Aqua (Water), Glycerin (Vegetable), Lauryl Glucoside."]},
  "size": {"dtype": "str (bare digits)", "nullable": true, "null_count_in_skincare": 105, "examples": ["75", "50"]},
  "rating": {"dtype": "str (numeric)", "nullable": true, "null_count_in_skincare": 31, "examples": ["4.16"]},
  "noofratings": {"dtype": "str (numeric)", "nullable": true, "null_count_in_skincare": 31, "examples": ["14"]}
}
```

Create `training_dataset/raw/ecommerce/column_mapping.json`:

```json
{
  "product_name": "product_name",
  "brand": "brand_name",
  "subcategory": "category (via _SUBCATEGORY_MAP, only within category=='skincare')",
  "title-href": "product_url",
  "price": "price, currency hardcoded 'INR'",
  "ingredients": "ingredients (comma-split, 150-char cap)",
  "size": "volume_ml (bare-digit strings only)",
  "rating": "rating",
  "noofratings": "review_count",
  "_filter": "category == 'skincare' only; other rows rejected as 'not a skincare product'",
  "_unmapped_target_fields": ["image_url", "skin_type_names", "concern_names"],
  "_unused_source_columns": ["website", "country", "form", "type", "color"]
}
```

- [ ] **Step 6: Add the Makefile target**

Same pattern as Task 2 Step 6, target name `ingest-ecommerce-cosmetics`, module `app.services.admin.ingest.ingest_ecommerce_cosmetics`.

- [ ] **Step 7: Run the real ingest against local Postgres**

Run: `make ingest-ecommerce-cosmetics`
Record the real printed output.

- [ ] **Step 8: Update `training_dataset/MANIFEST.md`** (row #6, same format as Task 2 Step 8, using real Step 7 counts).

- [ ] **Step 9: Update `training_dataset/README.md`'s Status table** (real counts).

- [ ] **Step 10: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app && uv run pytest tests/test_ecommerce_cosmetics_ingest.py -v`

- [ ] **Step 11: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-ecommerce-cosmetics
git add backend/app/services/admin/ingest/ingest_ecommerce_cosmetics.py backend/tests/test_ecommerce_cosmetics_ingest.py training_dataset/raw/ecommerce/dataset_info.json training_dataset/raw/ecommerce/schema.json training_dataset/raw/ecommerce/column_mapping.json Makefile training_dataset/MANIFEST.md training_dataset/README.md
git commit -m "feat(data): ingest E-Commerce Cosmetics Dataset (devi5723), skincare rows only

2,077 of 12,615 rows have real category==skincare (Amazon/Flipkart/
Sephora/Ulta India scrape); the other 5 categories (body/lips/eyes/face/
hair) are rejected, never guessed into skincare. INR pricing throughout."
git checkout dev
git merge feature/dataset-ecommerce-cosmetics
git branch -d feature/dataset-ecommerce-cosmetics
```

---

## Task 4: Ingest `Sephora_all_423.csv` only (from `autumndyer/skincare-products-and-ingredients`)

**Files:**
- Create: `backend/app/services/admin/ingest/ingest_skincare_ingredients.py`
- Create: `backend/tests/test_skincare_ingredients_ingest.py`
- Create: `training_dataset/raw/skincare-ingredients/dataset_info.json`
- Create: `training_dataset/raw/skincare-ingredients/schema.json`
- Create: `training_dataset/raw/skincare-ingredients/column_mapping.json`
- Modify: `Makefile` (add `ingest-skincare-ingredients`)
- Modify: `training_dataset/MANIFEST.md` (row #7)
- Modify: `training_dataset/README.md` (Status table row)

**Interfaces:**
- Consumes: same `_shared` imports as Tasks 2–3.
- Produces: `normalize_rows`, `download_dataset`, `run`, `main` (same shapes).

Real data already inspected (raw file `training_dataset/raw/skincare-ingredients/Sephora_all_423.csv`, 2,179 rows — **confirmed a genuinely independent Sephora scrape**, not a duplicate of nadyinky's already-ingested dataset: entirely different field set, no `product_id`/`brand_id`):
- Columns used: `brand_name, cosmetic_name, price, ingredients, Skin Type` (pandas normalizes the header's literal `"What it is"` etc. as-is — the two columns used here keep their exact real names `brand_name`, `cosmetic_name`, `price`, `ingredients`, `"Skin Type"`).
- `price` is text, sometimes a single value (`"$24.00 "`, trailing space) or a range for size/shade variants (`"$16.00 - $35.00"`) — parse takes the **low end** (documented as "starting price," not an invented average).
- `ingredients` is a long narrative/marketing text block (not a clean INCI list) ending in a comma-separated ingredient list after the marketing prose — real samples show the actual INCI list is the *last* comma-separated segment of the multi-paragraph text, preceded by bullet-style callouts. Given no reliable machine split point between "marketing prose" and "the real INCI list" without per-row judgment, **this dataset's `ingredients` field is not parsed into individual ingredients** — `ingredients: []` for every row from this source (real, honest limitation, not guessed).
- `"Skin Type"` is free text when present (e.g. `"Normal, Dry, Combination, and Oily"`), null otherwise — split on `,`/`and`, matched against the same real seeded skin-type names `products.py.parse_highlights` already targets (`Dry`, `Oily`, `Combination`, `Normal`, `Sensitive`); unmatched fragments contribute nothing.
- No `volume_ml`, `image_url`, `rating`, `review_count`, `concern_names` — all `None`/`[]`.
- No category/product-type column at all in this file — every accepted row gets `category = "uncategorized"` (real, honest — no invented category).

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_skincare_ingredients_ingest.py`:

```python
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_skincare_ingredients_ingest.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Write the implementation**

Create `backend/app/services/admin/ingest/ingest_skincare_ingredients.py`:

```python
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

from app.services.admin.ingest._shared import (
    load_into_database,
    load_product_associations,
    write_ingest_report,
)
from app.services.admin.ingest.products import KaggleCredentialsError
from app.core.config import settings

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
                "skin_type_names": _parse_skin_types(skin_type_raw if pd.notna(skin_type_raw) else None),
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && uv run pytest tests/test_skincare_ingredients_ingest.py -v`
Expected: PASS.

- [ ] **Step 5: Write `dataset_info.json`, `schema.json`, `column_mapping.json`**

Create `training_dataset/raw/skincare-ingredients/dataset_info.json`:

```json
{
  "name": "Skincare Products and Ingredients (Sephora_all_423.csv only)",
  "source": "Kaggle",
  "kaggle_url": "https://www.kaggle.com/datasets/autumndyer/skincare-products-and-ingredients",
  "kaggle_slug": "autumndyer/skincare-products-and-ingredients",
  "download_date": "2026-08-03",
  "license": "MIT",
  "file_count": 5,
  "ingested_file": "Sephora_all_423.csv",
  "ingested_row_count": 2179,
  "ingested_column_count": 19,
  "other_files_landing_only": ["Paula_SUM_LIST.csv", "Paula_embedding_SUMLIST_before_422.csv", "binary_cosmetic_ingredient.csv", "pre_alternatives.csv"],
  "notes": "Confirmed independent from the already-ingested nadyinky Sephora dataset (entirely different field set: no product_id/brand_id, narrative about/Skincare Concerns text, num_customer). The other 4 files are not product-catalog-shaped: Paula_SUM_LIST.csv is a 26,087-row ingredient dictionary (no products), Paula_embedding is embeddings, binary_cosmetic_ingredient.csv is a redundant product×ingredient flatten, pre_alternatives.csv is ingredient-substitution pairs. Landed raw only, no ingest module."
}
```

Create `training_dataset/raw/skincare-ingredients/schema.json`:

```json
{
  "brand_name": {"dtype": "str", "nullable": false, "examples": ["Summer Fridays", "Glow Recipe"]},
  "cosmetic_name": {"dtype": "str", "nullable": false, "examples": ["Lip Butter Balm for Hydration & Shine", "Watermelon Glow PHA + BHA Pore-Tight Toner"]},
  "price": {"dtype": "str (USD, sometimes a range)", "nullable": false, "examples": ["$24.00 ", "$16.00 - $35.00"]},
  "ingredients": {"dtype": "str (marketing prose, not a clean INCI list)", "nullable": true, "examples": ["-Watermelon Extract: Hydrates, soothes...\\n\\nOpuntia Ficus-Indica Extract, ..."]},
  "Skin Type": {"dtype": "str (free text)", "nullable": true, "examples": ["Normal, Dry, Combination, and Oily"]}
}
```

Create `training_dataset/raw/skincare-ingredients/column_mapping.json`:

```json
{
  "brand_name": "brand_name",
  "cosmetic_name": "product_name",
  "cosmetic_link": "product_url",
  "price": "price (low end of range if a range), currency hardcoded 'USD'",
  "Skin Type": "skin_type_names (matched against known seeded skin-type names)",
  "_deliberately_unparsed": {"ingredients": "marketing prose, not a clean INCI list - no reliable split point, left [] rather than guessed"},
  "category": "always 'uncategorized' - no category/product-type column exists in this source",
  "_unmapped_target_fields": ["image_url", "volume_ml", "rating", "review_count", "concern_names"],
  "_unused_source_columns": ["num_customer", "reviews", "recommended", "What it is", "Skincare Concerns", "Formulation", "Benefits", "Highlighted Ingredients", "Ingredient Callouts", "What Else You Need to Know", "Clinical Results", "clean_ingredients", "new_ingredients"]
}
```

- [ ] **Step 6: Add the Makefile target**

Same pattern, target name `ingest-skincare-ingredients`, module `app.services.admin.ingest.ingest_skincare_ingredients`.

- [ ] **Step 7: Run the real ingest against local Postgres**

Run: `make ingest-skincare-ingredients`
Record the real printed output.

- [ ] **Step 8: Update `training_dataset/MANIFEST.md`** (row #7, real Step 7 counts, note the "1 of 5 files ingested, other 4 landing-only" detail).

- [ ] **Step 9: Update `training_dataset/README.md`'s Status table** (real counts).

- [ ] **Step 10: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app && uv run pytest tests/test_skincare_ingredients_ingest.py -v`

- [ ] **Step 11: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-skincare-ingredients
git add backend/app/services/admin/ingest/ingest_skincare_ingredients.py backend/tests/test_skincare_ingredients_ingest.py training_dataset/raw/skincare-ingredients/dataset_info.json training_dataset/raw/skincare-ingredients/schema.json training_dataset/raw/skincare-ingredients/column_mapping.json Makefile training_dataset/MANIFEST.md training_dataset/README.md
git commit -m "feat(data): ingest Sephora_all_423.csv from autumndyer's dataset

2,179 rows from an independently-scraped Sephora catalog (confirmed
distinct from the already-ingested nadyinky dataset). The other 4 files
in this Kaggle dataset (an ingredient dictionary, embeddings, a redundant
ingredient join, and substitution pairs) aren't product-shaped - landed
raw only, no ingest module."
git checkout dev
git merge feature/dataset-skincare-ingredients
git branch -d feature/dataset-skincare-ingredients
```

---

## Task 5: Document the 2 landing-only datasets in `MANIFEST.md`

**Files:**
- Create: `training_dataset/raw/open-beauty-facts/dataset_info.json`
- Create: `training_dataset/raw/dermstore/dataset_info.json`
- Modify: `training_dataset/MANIFEST.md` (rows #8, #9)

No `schema.json`/`column_mapping.json` for these two — there's no ingest pipeline to document a mapping for (matches the existing treatment of dataset #2, Cosmetics, which is also landing-only with no per-column docs).

- [ ] **Step 1: Create `training_dataset/raw/open-beauty-facts/dataset_info.json`**

```json
{
  "name": "Open Beauty Facts",
  "source": "Kaggle",
  "kaggle_url": "https://www.kaggle.com/datasets/openfoodfacts/openbeautyfacts",
  "kaggle_slug": "openfoodfacts/openbeautyfacts",
  "download_date": "2026-08-03",
  "license": "Database: Open Database License (ODbL), Contents: Database Contents License (DbCL)",
  "file_count": 1,
  "row_count": 4304,
  "column_count": 162,
  "file_size_bytes": 12317416,
  "status": "landing only - no ingest module",
  "reason": "No price field exists anywhere in this dataset (Open Food Facts' nutrition-style schema, not a retail dataset) - every row would fail the same brand_name/product_name/price mandatory-field gate every other dataset in this pipeline honors. Also dominated by hair/soap/toothpaste/nail-polish/perfume categories (French-heavy crowdsourced data); skincare ('Visage') is a small minority, with 39-69% missingness on category/ingredients/image fields. Owner-confirmed 2026-08-03: land raw only."
}
```

- [ ] **Step 2: Create `training_dataset/raw/dermstore/dataset_info.json`**

```json
{
  "name": "Dermstore Skincare Products & Ingredients Dataset",
  "source": "Kaggle",
  "kaggle_url": "https://www.kaggle.com/datasets/crawlfeeds/dermstore-skincare-products-and-ingredients-dataset",
  "kaggle_slug": "crawlfeeds/dermstore-skincare-products-and-ingredients-dataset",
  "download_date": "2026-08-03",
  "license": "CC BY 4.0",
  "file_count": 1,
  "row_count": 126,
  "file_size_bytes": 682812,
  "status": "landing only - no ingest module",
  "reason": "Only 126 rows and not skincare-exclusive - includes a hair comb, candles, hair straighteners, LED devices, foundation makeup. The 'category' field is a useless per-product breadcrumb ('Brands / X / Y', 126 unique values, one per product). 'range'/'skin_type_and_concerns' fields are 58-65% null with no reliable skincare/not-skincare signal - building a keyword classifier here would be guessing (AGENTS.md §0.2). Owner-confirmed 2026-08-03: land raw only."
}
```

- [ ] **Step 3: Update `training_dataset/MANIFEST.md`**

Add rows #8 and #9:

```markdown
| 8 | Open Beauty Facts | `openfoodfacts/openbeautyfacts` | `training_dataset/raw/open-beauty-facts/` | `en.openbeautyfacts.org.products.tsv` | None — landing only | **Downloaded 2026-08-03, landing only** — 4,304 rows, no price field anywhere in the dataset (fails the mandatory-field gate every other dataset here honors), dominated by non-skincare categories. No ingest pipeline built. |
| 9 | Dermstore Skincare Products & Ingredients | `crawlfeeds/dermstore-skincare-products-and-ingredients-dataset` | `training_dataset/raw/dermstore/` | `dermstore_data.json` | None — landing only | **Downloaded 2026-08-03, landing only** — 126 rows, not skincare-exclusive, no reliable category signal (per-product breadcrumb only). No ingest pipeline built. |
```

- [ ] **Step 4: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-landing-only-docs
git add training_dataset/raw/open-beauty-facts/dataset_info.json training_dataset/raw/dermstore/dataset_info.json training_dataset/MANIFEST.md
git commit -m "docs(data): document Open Beauty Facts and Dermstore as landing-only

Both were downloaded and inspected but have no usable mandatory-field/
category signal for the products ingest pipeline - documented here rather
than silently dropped, per AGENTS.md §0.2."
git checkout dev
git merge feature/dataset-landing-only-docs
git branch -d feature/dataset-landing-only-docs
```

---

## Task 6: Cross-cutting reports — `missing_data_report.md`, `master_product_schema.md`, `normalized_ingredients.csv`

**Files:**
- Create: `backend/app/services/admin/ingest/generate_dataset_reports.py`
- Create: `backend/tests/test_generate_dataset_reports.py`
- Modify: `Makefile` (add `generate-dataset-reports`)

**Interfaces:**
- Consumes: the JSON run-manifest files each ingest module already writes to `training_dataset/processed/*_ingest_*.json` (Task 1's `write_ingest_report`); `training_dataset/raw/*/column_mapping.json` (Tasks 2–4); the live `ingredients` table.
- Produces: `training_dataset/processed/missing_data_report.md`, `training_dataset/master_product_schema.md`, `training_dataset/processed/normalized_ingredients.csv`

This task depends on Tasks 2–4 having run for real (it reads their actual output files) — do not start it until at least one real `*_ingest_*.json` report exists per ingested dataset.

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_generate_dataset_reports.py`:

```python
"""backend/app/services/admin/ingest/generate_dataset_reports.py - pure functions
that read already-written per-run JSON reports and column_mapping.json files, no
network/DB required for these two functions (the ingredients export needs a real
DB session, tested separately)."""

import json
from pathlib import Path

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.admin.ingest.generate_dataset_reports import (
    build_master_schema_markdown,
    build_missing_data_report,
    export_normalized_ingredients,
    write_normalized_ingredients_csv,
)


def test_build_missing_data_report_aggregates_real_run_reports(tmp_path: Path) -> None:
    report_dir = tmp_path / "processed"
    report_dir.mkdir()
    (report_dir / "skincare_clean_ingest_20260803T120000Z.json").write_text(
        json.dumps(
            {
                "source": "kaggle:eward96/skincare-products-clean-dataset",
                "accepted_count": 1100,
                "rejected_count": 38,
            }
        )
    )
    (report_dir / "ecommerce_cosmetics_ingest_20260803T120500Z.json").write_text(
        json.dumps(
            {
                "source": "kaggle:devi5723/e-commerce-cosmetics-dataset",
                "accepted_count": 1900,
                "rejected_count": 177,
            }
        )
    )

    markdown = build_missing_data_report(report_dir)

    assert "eward96/skincare-products-clean-dataset" in markdown
    assert "1100" in markdown
    assert "devi5723/e-commerce-cosmetics-dataset" in markdown
    assert "1900" in markdown


def test_build_missing_data_report_handles_no_reports(tmp_path: Path) -> None:
    report_dir = tmp_path / "processed"
    report_dir.mkdir()

    markdown = build_missing_data_report(report_dir)

    assert "No ingest reports found" in markdown


def test_build_master_schema_markdown_includes_each_dataset_mapping(tmp_path: Path) -> None:
    raw_dir = tmp_path / "raw"
    (raw_dir / "skincare-clean").mkdir(parents=True)
    (raw_dir / "skincare-clean" / "column_mapping.json").write_text(
        json.dumps({"product_name": "product_name", "price": "price"})
    )

    markdown = build_master_schema_markdown(raw_dir)

    assert "skincare-clean" in markdown
    assert "product_name" in markdown


async def test_export_normalized_ingredients_returns_real_sorted_names(
    db_session: AsyncSession,
) -> None:
    from app.services.ingredients.models import Ingredient

    db_session.add(Ingredient(ingredient_name="Water"))
    db_session.add(Ingredient(ingredient_name="Glycerin"))
    await db_session.commit()

    names = await export_normalized_ingredients(db_session)

    assert names == sorted(names)
    assert "Water" in names
    assert "Glycerin" in names


def test_write_normalized_ingredients_csv_writes_header_and_rows(tmp_path: Path) -> None:
    output_path = tmp_path / "processed" / "normalized_ingredients.csv"

    result_path = write_normalized_ingredients_csv(["Glycerin", "Water"], output_path)

    content = result_path.read_text()
    assert content == "ingredient_name\nGlycerin\nWater\n"
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_generate_dataset_reports.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Write the implementation**

Create `backend/app/services/admin/ingest/generate_dataset_reports.py`:

```python
"""Aggregates the per-run JSON reports every ingest module already writes
(app.services.admin.ingest._shared.write_ingest_report) into one real missing-data
summary, and each dataset's column_mapping.json into one master-schema doc. Reads
existing artifacts only - never recomputes accepted/rejected counts itself, so the
numbers always match what a real ingest run actually printed."""

import json
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ingredients.models import Ingredient


def build_missing_data_report(report_dir: Path) -> str:
    reports: list[dict[str, Any]] = []
    for path in sorted(report_dir.glob("*_ingest_*.json")):
        reports.append(json.loads(path.read_text()))

    if not reports:
        return "# Missing Data Report\n\nNo ingest reports found in this directory yet.\n"

    lines = [
        "# Missing Data Report",
        "",
        "Aggregated from real per-run ingest reports in `training_dataset/processed/`"
        " — every number here is copied from an actual completed run, never recomputed.",
        "",
        "| Source | Accepted | Rejected | Ingested At |",
        "|---|---|---|---|",
    ]
    for report in reports:
        lines.append(
            f"| {report['source']} | {report['accepted_count']} | "
            f"{report['rejected_count']} | {report.get('ingested_at', '?')} |"
        )
    return "\n".join(lines) + "\n"


def build_master_schema_markdown(raw_dir: Path) -> str:
    lines = [
        "# Master Product Schema",
        "",
        "The one real target shape every dataset in `training_dataset/raw/` maps onto"
        " is the `products`/`ingredients`/`product_ingredients` Postgres tables"
        " (`database_schemas/skinlytics_postgresql_schema_v3.sql`,"
        " `backend/app/services/recommendations/models.py`'s `Product` model,"
        " `backend/app/services/ingredients/models.py`'s `Ingredient` model)."
        " This document is not a new schema — it's each dataset's real"
        " `column_mapping.json`, gathered in one place.",
        "",
    ]
    for mapping_path in sorted(raw_dir.glob("*/column_mapping.json")):
        dataset_slug = mapping_path.parent.name
        mapping = json.loads(mapping_path.read_text())
        lines.append(f"## {dataset_slug}")
        lines.append("")
        lines.append("```json")
        lines.append(json.dumps(mapping, indent=2))
        lines.append("```")
        lines.append("")
    return "\n".join(lines)


async def export_normalized_ingredients(db: AsyncSession) -> list[str]:
    """Plain export of the already-normalized (on ingest) ingredients table - not
    a new normalization pass."""
    result = await db.execute(select(Ingredient.ingredient_name).order_by(Ingredient.ingredient_name))
    return list(result.scalars().all())


def write_normalized_ingredients_csv(ingredient_names: list[str], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["ingredient_name"] + ingredient_names
    output_path.write_text("\n".join(lines) + "\n")
    return output_path


async def main() -> None:
    from app.db.postgres import async_session_factory

    repo_root = Path(__file__).resolve().parents[5]
    raw_dir = repo_root / "training_dataset" / "raw"
    processed_dir = repo_root / "training_dataset" / "processed"

    missing_data_md = build_missing_data_report(processed_dir)
    (processed_dir / "missing_data_report.md").write_text(missing_data_md)

    master_schema_md = build_master_schema_markdown(raw_dir)
    (repo_root / "training_dataset" / "master_product_schema.md").write_text(master_schema_md)

    async with async_session_factory() as db:
        ingredient_names = await export_normalized_ingredients(db)
    csv_path = write_normalized_ingredients_csv(ingredient_names, processed_dir / "normalized_ingredients.csv")

    print(
        f"Wrote {processed_dir / 'missing_data_report.md'}, "
        f"{repo_root / 'training_dataset' / 'master_product_schema.md'}, "
        f"{csv_path} ({len(ingredient_names)} ingredients)."
    )


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && uv run pytest tests/test_generate_dataset_reports.py -v`
Expected: PASS (the `db_session`-based test uses the same fixture `test_products_ingest.py` already relies on — no new fixture setup needed).

- [ ] **Step 5: Add the Makefile target**

```makefile
generate-dataset-reports:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.services.admin.ingest.generate_dataset_reports; \
	else \
		echo "backend/ does not exist yet — nothing to generate."; \
	fi
```

Add `generate-dataset-reports` to the `.PHONY` line.

- [ ] **Step 6: Run for real**

Run: `make generate-dataset-reports`
Confirm `training_dataset/processed/missing_data_report.md`, `training_dataset/master_product_schema.md`, and `training_dataset/processed/normalized_ingredients.csv` are written with real content (open and check them — the `.md` files aggregate Tasks 2–4's real run reports, they must not be empty/placeholder).

- [ ] **Step 7: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app && uv run pytest tests/test_generate_dataset_reports.py -v`

- [ ] **Step 8: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-cross-cutting-reports
git add backend/app/services/admin/ingest/generate_dataset_reports.py backend/tests/test_generate_dataset_reports.py Makefile
git commit -m "feat(etl): generate aggregated missing-data and master-schema reports

Reads the per-run JSON reports each ingest module already writes and each
dataset's column_mapping.json - never recomputes counts, so the reports
always match what real ingest runs actually produced."
git checkout dev
git merge feature/dataset-cross-cutting-reports
git branch -d feature/dataset-cross-cutting-reports
```

---

## Task 7: Product link verification (`verify_product_links.py`)

**Files:**
- Create: `backend/app/services/admin/ingest/verify_product_links.py`
- Create: `backend/tests/test_verify_product_links.py`
- Modify: `Makefile` (add `verify-product-links`)

**Interfaces:**
- Consumes: the live `products` table (`product_url`, `image_url` columns).
- Produces: `training_dataset/processed/broken_images.csv`, `training_dataset/processed/broken_urls.csv`

Checks what's actually live in Postgres after ingestion (all 3 new datasets plus the 2 existing ones), not raw CSVs — avoids re-checking the same overlapping URLs multiple times, and answers the real question ("is our live product data broken").

- [ ] **Step 1: Write the failing test**

Create `backend/tests/test_verify_product_links.py`:

```python
"""backend/app/services/admin/ingest/verify_product_links.py's pure
classification logic - the actual HTTP calls are mocked, this tests how results
get turned into the two CSV row lists."""

from app.services.admin.ingest.verify_product_links import classify_check_results


def test_classify_check_results_separates_broken_from_ok() -> None:
    results = [
        ("https://example.com/ok.jpg", 200),
        ("https://example.com/missing.jpg", 404),
        ("https://example.com/error.jpg", None),  # request raised, no status code
    ]

    broken = classify_check_results(results)

    assert broken == [
        ("https://example.com/missing.jpg", 404),
        ("https://example.com/error.jpg", "request failed"),
    ]


def test_classify_check_results_returns_empty_when_all_ok() -> None:
    results = [("https://example.com/a.jpg", 200), ("https://example.com/b.jpg", 301)]

    assert classify_check_results(results) == []
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_verify_product_links.py -v`
Expected: FAIL with `ModuleNotFoundError`.

- [ ] **Step 3: Write the implementation**

Create `backend/app/services/admin/ingest/verify_product_links.py`:

```python
"""Checks every distinct non-null products.image_url/product_url currently in
Postgres - not raw CSVs, so overlapping URLs across the 5 ingested datasets are
each checked once. Run manually (make verify-product-links), never part of an
ingest run - network flakiness shouldn't block ingestion."""

import asyncio
import csv
from pathlib import Path
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.recommendations.models import Product

_TIMEOUT_SECONDS = 10.0
_MAX_CONCURRENCY = 10
_MAX_RETRIES = 2


async def _check_one(client: httpx.AsyncClient, url: str, semaphore: asyncio.Semaphore) -> tuple[str, int | None]:
    async with semaphore:
        for attempt in range(_MAX_RETRIES + 1):
            try:
                response = await client.head(url, timeout=_TIMEOUT_SECONDS, follow_redirects=True)
                return url, response.status_code
            except httpx.HTTPError:
                if attempt == _MAX_RETRIES:
                    return url, None
                await asyncio.sleep(2**attempt)
        return url, None


async def check_urls(urls: list[str]) -> list[tuple[str, int | None]]:
    semaphore = asyncio.Semaphore(_MAX_CONCURRENCY)
    async with httpx.AsyncClient() as client:
        return await asyncio.gather(*[_check_one(client, url, semaphore) for url in urls])


def classify_check_results(results: list[tuple[str, int | None]]) -> list[tuple[str, Any]]:
    broken: list[tuple[str, Any]] = []
    for url, status in results:
        if status is None:
            broken.append((url, "request failed"))
        elif status >= 400:
            broken.append((url, status))
    return broken


def _write_broken_csv(broken: list[tuple[str, Any]], output_path: Path) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["url", "status"])
        writer.writerows(broken)
    return output_path


async def run(db: AsyncSession, processed_dir: Path) -> None:
    image_urls = list(
        (await db.execute(select(Product.image_url).where(Product.image_url.is_not(None)).distinct()))
        .scalars()
        .all()
    )
    product_urls = list(
        (await db.execute(select(Product.product_url).where(Product.product_url.is_not(None)).distinct()))
        .scalars()
        .all()
    )

    image_results = await check_urls(image_urls)
    url_results = await check_urls(product_urls)

    broken_images = classify_check_results(image_results)
    broken_urls = classify_check_results(url_results)

    images_path = _write_broken_csv(broken_images, processed_dir / "broken_images.csv")
    urls_path = _write_broken_csv(broken_urls, processed_dir / "broken_urls.csv")

    print(
        f"Checked {len(image_urls)} image URL(s), {len(broken_images)} broken -> {images_path}. "
        f"Checked {len(product_urls)} product URL(s), {len(broken_urls)} broken -> {urls_path}."
    )


async def main() -> None:
    from app.db.postgres import async_session_factory

    repo_root = Path(__file__).resolve().parents[5]
    processed_dir = repo_root / "training_dataset" / "processed"

    async with async_session_factory() as db:
        await run(db, processed_dir)


if __name__ == "__main__":
    asyncio.run(main())
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd backend && uv run pytest tests/test_verify_product_links.py -v`
Expected: PASS.

- [ ] **Step 5: Confirm `httpx` is already a backend dependency**

Run: `cd backend && grep -i httpx pyproject.toml`
Expected: a match (it's already used elsewhere for the weather/UV adapter per `docs/DATASETS_AND_APIS.md`'s adapter contract). If no match, add it: `cd backend && uv add httpx`.

- [ ] **Step 6: Add the Makefile target**

```makefile
verify-product-links:
	@if [ -d backend ]; then \
		cd backend && uv run python -m app.services.admin.ingest.verify_product_links; \
	else \
		echo "backend/ does not exist yet — nothing to verify."; \
	fi
```

Add `verify-product-links` to the `.PHONY` line.

- [ ] **Step 7: Run for real**

Run: `make verify-product-links`
Record the real printed counts. Confirm `training_dataset/processed/broken_images.csv` and `broken_urls.csv` are written.

- [ ] **Step 8: Quality gates**

Run: `cd backend && uv run ruff check . && uv run mypy --strict app && uv run pytest tests/test_verify_product_links.py -v`

- [ ] **Step 9: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-link-verification
git add backend/app/services/admin/ingest/verify_product_links.py backend/tests/test_verify_product_links.py Makefile
git commit -m "feat(validation): verify live product image/product URLs

Checks what's actually in Postgres after ingestion, not raw CSVs - avoids
re-checking overlapping URLs across datasets and answers the real
question of whether our live product data is broken."
git checkout dev
git merge feature/dataset-link-verification
git branch -d feature/dataset-link-verification
```

---

## Task 8: Final docs sync — `docs/DATASETS_AND_APIS.md`, ADR, `PROGRESS.md`

**Files:**
- Modify: `docs/DATASETS_AND_APIS.md` (add real entries for the 5 datasets — currently has zero mentions of any of them)
- Modify: `docs/DECISIONS.md` (append one ADR)
- Modify: `PROGRESS.md` (real completed/remaining state)

This task depends on Tasks 2–7 all being complete — it documents their real, final outcome.

- [ ] **Step 1: Add entries to `docs/DATASETS_AND_APIS.md`**

Read the file's existing entry for dataset #1 (Sephora) first to match its format exactly, then add 5 entries (3 ingested + 2 landing-only) following that same structure — access method (Kaggle), license, target store, ToS caveats, real row counts from Tasks 2–7's actual run output.

- [ ] **Step 2: Append an ADR to `docs/DECISIONS.md`**

Follow the file's existing ADR format (see ADR-040/041/042 for the most recent examples). Content:

```markdown
## ADR-0NN — 5 additional Kaggle product datasets ingested; 2 landed raw-only after real inspection found no usable signal

**Context:** The dataset layer needed expansion beyond the 4 datasets in
`training_dataset/MANIFEST.md`. An initial 7-dataset request included 4 URLs that
turned out not to exist (verified live via the Kaggle API and dataset pages, not
assumed) and 2 real-but-duplicate datasets (both explicitly republish the
already-ingested nadyinky Sephora scrape, per their own dataset descriptions).

**Decision:** Ingested 3 real, non-duplicate, product-shaped datasets via the
existing per-dataset ingest-module pattern (`products.py`'s shape, now sharing
`_shared.py`'s DB-loading logic): Skincare Products Clean Dataset (eward96),
E-Commerce Cosmetics Dataset skincare rows only (devi5723), and
Sephora_all_423.csv from autumndyer's dataset (the other 4 files in that dataset
aren't product-shaped). Exact-match `(brand_name, product_name)` dedupe only — no
fuzzy matching, consistent with the enrich_product_images.py precedent.

Landed 2 more datasets raw-only, no ingest module: Open Beauty Facts (no price
field exists anywhere in the dataset — fails the mandatory-field gate every other
dataset here honors) and Dermstore Skincare Products & Ingredients (only 126 rows,
not skincare-exclusive, no reliable category signal beyond a useless per-product
breadcrumb).

**Consequences:** `products`/`ingredients`/`product_ingredients` gain [real total
new product count from Tasks 2/3/4's actual runs] more real products across 3
sources. `training_dataset/MANIFEST.md` grows to 9 entries. Two Kaggle datasets
sit in `training_dataset/raw/` fully documented as landing-only rather than force-fit
through a pipeline that would reject 100% of their rows or need an invented
category classifier.
```

- [ ] **Step 3: Update `PROGRESS.md`**

Add an entry documenting: which datasets were ingested (with real counts from Tasks 2/3/4), which were landed raw-only (with reasons), the shared-loader refactor (Task 1), and the two new scripts (Tasks 6, 7). Report honestly — no dataset marked "done" unless its real ingest run in Tasks 2–4 actually completed.

- [ ] **Step 4: Commit**

```bash
git checkout dev
git checkout -b feature/dataset-expansion-docs-sync
git add docs/DATASETS_AND_APIS.md docs/DECISIONS.md PROGRESS.md
git commit -m "docs: sync DATASETS_AND_APIS, add ADR, update PROGRESS for dataset expansion

Documents the real outcome of Tasks 1-7: 3 datasets ingested via the
shared ingest-loader pattern, 2 landed raw-only after real inspection
found no usable price/category signal."
git checkout dev
git merge feature/dataset-expansion-docs-sync
git branch -d feature/dataset-expansion-docs-sync
```

---

## After all 8 tasks

Run the full backend test suite once more (`cd backend && uv run pytest -v`) and quality gates (`uv run ruff check . && uv run mypy --strict app`) to confirm nothing broke across the whole session's changes. Do **not** merge `dev` into `satya-sai-tharun-skinlytics` — per the owner's explicit instruction earlier in this session, that only happens after the owner reviews the result and says so.
