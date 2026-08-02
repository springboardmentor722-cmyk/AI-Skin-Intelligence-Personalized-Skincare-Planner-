# source: owner request 2026-08-03 -- use yamqwe/sephora-products (already downloaded
# for enrich_product_images.py, ADR-040) as a full product source in its own right,
# not just an image backfill for the primary nadyinky-sourced catalog.
"""One-off ingest — `make ingest-sephora-images-catalog` /
`python -m app.services.admin.ingest.ingest_sephora_images_catalog`.

Loads the ~278 image-bearing rows of `yamqwe/sephora-products` as new `products` rows
in their own right (not matched against the primary catalog — enrich_product_images.py
already does that exact-match backfill separately). Every image URL in a row (2+ per
row) goes into `product_images`, rendered directly by the frontend as-is — an explicit
owner decision (2026-08-03) not to re-host these through storage.py the way ADR-040/041
does, given the smaller, more exploratory nature of this batch.

**Known, accepted gap:** this dataset has no primary_category/skin-type/concern
columns at all (`breadcrumbs` is empty on every row checked) and skews heavily
towards makeup, not skincare (samples: eyeliner, foundation brands). Products land
with `category="uncategorized"` and no skin_type/concern associations — they will
show up in the general `/products` catalog with real images, but will never surface
in personalized `/recommendations` (which requires a skin_type_id match). Guessing a
category/skin-type mapping from product names would be exactly the kind of invented
classification AGENTS.md §0.2 says not to do.
"""

import csv
from pathlib import Path
from typing import TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.outbox import append_outbox
from app.services.admin.ingest.enrich_product_images import clean_image_url, download_dataset
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import Product, ProductImage, ProductIngredient

_RAW_DIR = Path(__file__).resolve().parents[5] / "training_dataset" / "raw" / "sephora-images"
_PRIMARY_CSV = _RAW_DIR / "sephora.csv"


class _ProductEntry(TypedDict):
    brand_name: str
    product_name: str
    price: float | None
    review_count: int | None
    images: list[str]
    ingredients: list[str]


def _parse_price(raw: str) -> float | None:
    cleaned = raw.strip().lstrip("$").replace(",", "")
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _parse_int(raw: str) -> int | None:
    try:
        return int(float(raw)) if raw.strip() else None
    except ValueError:
        return None


def _parse_images(raw: str) -> list[str]:
    urls = [clean_image_url(part) for part in raw.split(" ~ ")]
    return list(dict.fromkeys(url for url in urls if url))


_INGREDIENT_NAME_MAX_LENGTH = 150  # matches ingredients.ingredient_name's column width


def _parse_ingredients(raw: str) -> list[str]:
    """This dataset's `ingrediat_desc` is free text, not a clean INCI list — some
    rows end with a multi-sentence disclaimer paragraph with no comma before it
    (e.g. "...Yellow 5 (Ci 19140)].\\nPlease be aware..."), which would otherwise
    insert as a single 150+ char "ingredient". Real ingredient names are always
    short; anything longer than the column width is disclaimer text, not dropped
    silently but never mistaken for a real ingredient."""
    parts = (part.strip() for part in raw.split(","))
    return list(
        dict.fromkeys(p for p in parts if p and len(p) <= _INGREDIENT_NAME_MAX_LENGTH)
    )


def normalize_rows(csv_path: Path) -> list[_ProductEntry]:
    """Pure transform, no I/O beyond reading the given file — unit-testable without
    a live download, same discipline as products.py's normalize_rows()."""
    products: list[_ProductEntry] = []
    with open(csv_path, encoding="utf-8", newline="") as f:
        csv.field_size_limit(10_000_000)
        for row in csv.DictReader(f):
            brand = (row.get("brand") or "").strip()
            name = (row.get("product_name") or "").strip()
            images = _parse_images(row.get("images", ""))
            if not brand or not name or not images:
                continue
            products.append(
                {
                    "brand_name": brand,
                    "product_name": name,
                    "price": _parse_price(row.get("price", "")),
                    "review_count": _parse_int(row.get("reviews_count", "")),
                    "images": images,
                    "ingredients": _parse_ingredients(row.get("ingrediat_desc", "")),
                }
            )
    return products


async def load_into_database(db: AsyncSession, products: list[_ProductEntry]) -> int:
    """Idempotent — same natural-key dedupe (brand_name, product_name) as
    products.py's load_into_database, checked against the *entire* products table
    so this never creates a duplicate of a row the primary ingest already has."""
    existing_result = await db.execute(select(Product.brand_name, Product.product_name))
    existing = {(b, n) for b, n in existing_result.all()}

    ingredient_rows = await db.execute(select(Ingredient.ingredient_name, Ingredient.ingredient_id))
    ingredient_ids: dict[str, int] = {name: iid for name, iid in ingredient_rows.all()}

    created = 0
    for entry in products:
        key = (entry["brand_name"], entry["product_name"])
        if key in existing:
            continue
        existing.add(key)

        product = Product(
            brand_name=entry["brand_name"],
            product_name=entry["product_name"],
            category="uncategorized",
            price=entry["price"],
            currency="USD",
            review_count=entry["review_count"],
        )
        db.add(product)
        await db.flush()
        await append_outbox(db, "product", str(product.product_id), "upsert")

        for order, image_url in enumerate(entry["images"]):
            db.add(
                ProductImage(product_id=product.product_id, image_url=image_url, sort_order=order)
            )

        for ingredient_name in entry["ingredients"]:
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


async def run(db: AsyncSession) -> None:
    csv_path = download_dataset() if not _PRIMARY_CSV.exists() else _PRIMARY_CSV
    products = normalize_rows(csv_path)
    created = await load_into_database(db, products)
    print(
        f"Ingested {created} new product(s) from yamqwe/sephora-products "
        f"({len(products) - created} already present)."
    )


async def main() -> None:
    from app.db.postgres import async_session_factory

    async with async_session_factory() as db:
        await run(db)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
