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
    natural key load_into_database uses. ADR-010: the ES product document
    (build_product_document) reads skin_types_supported/concerns_supported from
    these same junction rows - every product whose association set actually
    changes here needs its own outbox row too, same as load_into_database's own
    upserts, or a fresh environment/re-run indexes it with permanently empty ES
    fields."""
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
        ),
        encoding="utf-8",
    )
    return report_path
