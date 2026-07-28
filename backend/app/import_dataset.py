"""Reusable product/ingredient dataset importer — Milestone 3, Part 1.

Drop a dataset file into backend/data/ and run:

    python -m app.import_dataset --file data/products.csv --source kaggle-skincare

The importer is deliberately format-tolerant so that a dataset downloaded from
Kaggle (or anywhere else) can be ingested without rewriting code:

  * CSV or JSON input
  * A COLUMN_ALIASES map translates the many different header names real datasets
    use ("product_name" / "name" / "title" -> name) into our schema
  * Rows are de-duplicated on (brand, name) and on external_id, so re-running an
    import — or importing an updated dataset — updates rather than duplicates
  * Anything already in the DB from a previous run is upserted, not re-inserted

This satisfies "reusable import scripts" and "support future dataset updates":
the schema and this script are the stable contract; the dataset file is swappable.

NOTE ON DATA SOURCING
---------------------
No dataset is bundled in this repo. Public skincare datasets (e.g. on Kaggle)
carry their own licences and are often scraped from retailers, so shipping their
rows inside a submission can create licensing/IP issues. Instead, this importer
lets you point at a file you have obtained and are permitted to use. The seed
script (app/seed.py) provides a curated, citable starter catalogue so the app is
fully functional out of the box.
"""
from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Ingredient, Product, ProductIngredient

# Map the wildly-varying real-world column names onto our schema fields.
COLUMN_ALIASES: dict[str, list[str]] = {
    "name": ["name", "product_name", "product", "title", "product_title"],
    "brand": ["brand", "brand_name", "manufacturer", "company"],
    "category": ["category", "product_type", "type", "product_category"],
    "price": ["price", "price_usd", "cost", "price_gbp"],
    "description": ["description", "desc", "product_description", "about", "details"],
    "skin_type_compat": ["skin_type", "skin_types", "skintype", "suitable_skin_type", "skin_type_compatibility"],
    "concern_compat": ["concerns", "skin_concerns", "suitable_concerns", "concern", "addresses"],
    "ingredient_list": ["ingredients", "ingredient_list", "full_ingredients", "inci", "components"],
    "key_ingredients": ["key_ingredients", "active_ingredients", "actives", "highlights"],
    "usage_time": ["usage", "usage_time", "am_pm", "time_of_use", "when_to_use"],
    "warnings": ["warnings", "warning", "caution", "cautions"],
    "contraindications": ["contraindications", "avoid_with", "do_not_use_with"],
    "image_url": ["image", "image_url", "img", "picture", "image_link", "product_url"],
    "rating": ["rating", "rank", "stars", "avg_rating", "average_rating"],
    "review_count": ["reviews", "review_count", "num_reviews", "ratings_count"],
    "external_id": ["id", "product_id", "sku", "external_id", "asin"],
}


def _norm_headers(row: dict) -> dict:
    """Lowercase/space-normalise the raw dict keys once so aliasing is simple."""
    return {str(k).strip().lower().replace(" ", "_"): v for k, v in row.items()}


def _pick(row: dict, field: str):
    for alias in COLUMN_ALIASES.get(field, []):
        if alias in row and str(row[alias]).strip() not in ("", "nan", "none", "null"):
            return str(row[alias]).strip()
    return None


def _normalise_usage(raw: str | None) -> str:
    if not raw:
        return "both"
    r = raw.lower()
    has_am = any(w in r for w in ("am", "morning", "day"))
    has_pm = any(w in r for w in ("pm", "night", "evening"))
    if has_am and not has_pm:
        return "AM"
    if has_pm and not has_am:
        return "PM"
    return "both"


def _normalise_brand(raw: str | None) -> str | None:
    if not raw:
        return None
    return " ".join(w.capitalize() for w in raw.strip().split())


def _read_rows(path: Path) -> list[dict]:
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else data.get("products", data.get("data", []))
    # default: CSV
    with path.open(newline="", encoding="utf-8-sig") as f:
        return list(csv.DictReader(f))


def import_products(db: Session, path: Path, source: str) -> tuple[int, int]:
    rows = _read_rows(path)
    created = updated = 0

    for raw in rows:
        row = _norm_headers(raw)
        name = _pick(row, "name")
        if not name:
            continue
        brand = _normalise_brand(_pick(row, "brand"))
        external_id = _pick(row, "external_id")

        # Dedup: prefer external_id, else (brand, name)
        existing = None
        if external_id:
            existing = db.scalar(select(Product).where(Product.external_id == external_id))
        if existing is None:
            existing = db.scalar(select(Product).where(Product.name == name, Product.brand == brand))

        target = existing or Product(name=name)
        target.brand = brand
        target.category = (_pick(row, "category") or target.category or "other").lower()
        try:
            target.price = float(_pick(row, "price")) if _pick(row, "price") else target.price
        except ValueError:
            pass
        target.description = _pick(row, "description") or target.description
        target.skin_type_compat = (_pick(row, "skin_type_compat") or target.skin_type_compat or "").lower() or None
        target.concern_compat = (_pick(row, "concern_compat") or target.concern_compat or "").lower() or None
        target.ingredient_list = _pick(row, "ingredient_list") or target.ingredient_list
        target.key_ingredients = _pick(row, "key_ingredients") or target.key_ingredients
        target.usage_time = _normalise_usage(_pick(row, "usage_time"))
        target.warnings = _pick(row, "warnings") or target.warnings
        target.contraindications = _pick(row, "contraindications") or target.contraindications
        target.image_url = _pick(row, "image_url") or target.image_url
        try:
            target.rating = float(_pick(row, "rating")) if _pick(row, "rating") else target.rating
        except ValueError:
            pass
        try:
            target.review_count = int(float(_pick(row, "review_count"))) if _pick(row, "review_count") else target.review_count
        except ValueError:
            pass
        target.external_id = external_id or target.external_id
        target.source = f"imported:{source}"

        if existing is None:
            db.add(target)
            created += 1
        else:
            updated += 1

        # Link ingredients if a full list was supplied
        if target.ingredient_list and existing is None:
            db.flush()
            _link_ingredients(db, target)

    db.commit()
    return created, updated


def _link_ingredients(db: Session, product: Product) -> None:
    """Split the raw INCI list, find/create each ingredient, and link it."""
    raw = product.ingredient_list or ""
    names = [n.strip().title() for n in raw.replace(";", ",").split(",") if n.strip()]
    for iname in names[:60]:              # cap absurd lists
        ing = db.scalar(select(Ingredient).where(Ingredient.name == iname))
        if ing is None:
            ing = Ingredient(name=iname, source="imported")
            db.add(ing)
            db.flush()
        exists = db.scalar(select(ProductIngredient).where(
            ProductIngredient.product_id == product.id,
            ProductIngredient.ingredient_id == ing.id))
        if not exists:
            db.add(ProductIngredient(product_id=product.id, ingredient_id=ing.id))


def main() -> None:
    ap = argparse.ArgumentParser(description="Import a skincare product dataset into Lumen.")
    ap.add_argument("--file", required=True, help="Path to a CSV or JSON dataset")
    ap.add_argument("--source", default="external", help="Label recorded on each imported row")
    args = ap.parse_args()

    path = Path(args.file)
    if not path.exists():
        print(f"Dataset not found: {path}", file=sys.stderr)
        sys.exit(1)

    db = SessionLocal()
    try:
        created, updated = import_products(db, path, args.source)
        print(f"Import complete from {path.name}: {created} created, {updated} updated.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
