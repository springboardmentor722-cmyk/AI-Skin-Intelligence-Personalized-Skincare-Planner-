"""Idempotent local/dev seed data — `make seed` / `python -m app.db.seed`.

Seeds a small placeholder product catalog plus a curated ingredient master. Real product
data is a separate Kaggle ingestion pipeline (docs/DATASETS_AND_APIS.md §2,
`backend/app/services/admin/ingest/products.py` — code-complete, credential-blocked on
a real `KAGGLE_USERNAME`/`KAGGLE_KEY`, see `training_dataset/README.md`); this is a
stand-in so routines/recommendations have real `products` rows to reference end-to-end
regardless. Swapped out, not mixed in, once real credentials exist.

The ingredient master below is **hand-curated common dermatological knowledge** (INCI
names, treats/avoid relationships), not scraped from INCIDecoder/COSDNA — exactly the
approach `docs/DATASETS_AND_APIS.md` §3 prescribes ("no public API, do not scrape;
build the ingredient master from curated references... quality over quantity") for the
PDF's 8 named categories: Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic
Acid, Ceramides, Peptides, AHAs/BHAs. A larger, automated ingredient feed is out of scope
until a licensed source is available.

skin_types/skin_concerns aren't seeded here — they're a real Alembic data migration now
(`a9c3d2f81b47_seed_skin_types_and_concerns.py`, production-readiness audit), not a
Python seed script: no environment before that migration had any automated way to get
this foundational reference data at all.
"""

import asyncio
from typing import TypedDict

from sqlalchemy import select

from app.db.postgres import async_session_factory
from app.services.ingredients.models import (
    Ingredient,
    IngredientConcernTreats,
    IngredientSkintypeAvoid,
)
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.skin_profile import service as skin_profile_service


class _ProductSeed(TypedDict, total=False):
    brand_name: str
    product_name: str
    category: str
    price: float
    volume_ml: int
    spf_rating: int
    skin_types: list[str]
    concerns: list[str]
    ingredients: list[str]  # ingredient_name, must match an _INGREDIENTS entry below


_PRODUCTS: list[_ProductSeed] = [
    {
        "brand_name": "Lumina Labs",
        "product_name": "Gentle Foaming Cleanser",
        "category": "Cleanser",
        "price": 450,
        "volume_ml": 150,
        "skin_types": ["Normal", "Oily", "Combination"],
        "concerns": ["Acne", "Oily Skin"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Cream Hydrating Cleanser",
        "category": "Cleanser",
        "price": 420,
        "volume_ml": 150,
        "skin_types": ["Dry", "Sensitive"],
        "concerns": ["Dry Skin", "Sensitive Skin"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Micellar Cleansing Water",
        "category": "Cleanser",
        "price": 350,
        "volume_ml": 250,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": ["Sensitive Skin"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "2% Salicylic Acid Treatment",
        "category": "Treatment",
        "price": 650,
        "volume_ml": 30,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Acne", "Oily Skin"],
        "ingredients": ["Salicylic Acid"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "10% Niacinamide Serum",
        "category": "Treatment",
        "price": 590,
        "volume_ml": 30,
        "skin_types": ["Oily", "Combination", "Normal"],
        "concerns": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
        "ingredients": ["Niacinamide"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Retinol 0.3% Night Treatment",
        "category": "Treatment",
        "price": 890,
        "volume_ml": 30,
        "skin_types": ["Normal", "Combination"],
        "concerns": ["Wrinkles", "Fine Lines"],
        "ingredients": ["Retinol"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Hyaluronic Acid Serum",
        "category": "Treatment",
        "price": 550,
        "volume_ml": 30,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": ["Dry Skin"],
        "ingredients": ["Hyaluronic Acid"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Centella Calming Serum",
        "category": "Treatment",
        "price": 620,
        "volume_ml": 30,
        "skin_types": ["Sensitive"],
        "concerns": ["Redness", "Sensitive Skin"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Vitamin C Brightening Serum",
        "category": "Treatment",
        "price": 750,
        "volume_ml": 30,
        "skin_types": ["Normal", "Combination", "Dry"],
        "concerns": ["Dark Spots", "Hyperpigmentation", "Uneven Skin Tone"],
        "ingredients": ["Ascorbic Acid"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "8% Glycolic Acid Night Exfoliant",
        "category": "Treatment",
        "price": 720,
        "volume_ml": 30,
        "skin_types": ["Normal", "Oily", "Combination"],
        "concerns": ["Dark Spots", "Uneven Skin Tone", "Wrinkles"],
        "ingredients": ["Glycolic Acid"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Peptide Firming Serum",
        "category": "Treatment",
        "price": 810,
        "volume_ml": 30,
        "skin_types": ["Normal", "Dry", "Combination"],
        "concerns": ["Wrinkles", "Fine Lines"],
        "ingredients": ["Palmitoyl Pentapeptide-4"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Ceramide Repair Moisturizer",
        "category": "Moisturizer",
        "price": 480,
        "volume_ml": 50,
        "skin_types": ["Dry", "Sensitive"],
        "concerns": ["Dry Skin"],
        "ingredients": ["Ceramide NP", "Ceramide AP"],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Oil-Free Gel Moisturizer",
        "category": "Moisturizer",
        "price": 430,
        "volume_ml": 50,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Oily Skin", "Acne"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Daily Barrier Moisturizer",
        "category": "Moisturizer",
        "price": 400,
        "volume_ml": 50,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": [],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Broad-Spectrum SPF 50 Sunscreen",
        "category": "Sunscreen",
        "price": 550,
        "volume_ml": 50,
        "spf_rating": 50,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": [],
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "Matte Finish SPF 40 Sunscreen",
        "category": "Sunscreen",
        "price": 520,
        "volume_ml": 50,
        "spf_rating": 40,
        "skin_types": ["Oily", "Combination"],
        "concerns": ["Oily Skin"],
    },
]


class _IngredientSeed(TypedDict, total=False):
    ingredient_name: str
    inci_name: str
    category: str
    treats: list[tuple[str, str]]  # (concern_name, evidence_strength)
    avoid_for: list[tuple[str, str]]  # (skin_type_name, reason)


# The PDF's 8 named ingredient categories (docs/DATASETS_AND_APIS.md §3). One or two
# well-established, commonly-cited actives per category — hand-curated, not scraped.
_INGREDIENTS: list[_IngredientSeed] = [
    {
        "ingredient_name": "Retinol",
        "inci_name": "Retinol",
        "category": "Retinoids",
        "treats": [("Wrinkles", "strong"), ("Fine Lines", "strong"), ("Acne", "moderate")],
        "avoid_for": [("Sensitive", "High irritation/purging risk without gradual introduction")],
    },
    {
        "ingredient_name": "Niacinamide",
        "inci_name": "Niacinamide",
        "category": "Niacinamide",
        "treats": [
            ("Hyperpigmentation", "strong"),
            ("Dark Spots", "strong"),
            ("Uneven Skin Tone", "strong"),
            ("Oily Skin", "moderate"),
            ("Redness", "moderate"),
        ],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Ascorbic Acid",
        "inci_name": "L-Ascorbic Acid",
        "category": "Vitamin C",
        "treats": [
            ("Dark Spots", "strong"),
            ("Hyperpigmentation", "strong"),
            ("Uneven Skin Tone", "moderate"),
        ],
        "avoid_for": [("Sensitive", "Low pH formulations can sting or irritate reactive skin")],
    },
    {
        "ingredient_name": "Hyaluronic Acid",
        "inci_name": "Sodium Hyaluronate",
        "category": "Hyaluronic Acid",
        "treats": [("Dry Skin", "strong"), ("Fine Lines", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Salicylic Acid",
        "inci_name": "Salicylic Acid",
        "category": "Salicylic Acid",
        "treats": [
            ("Acne", "strong"),
            ("Oily Skin", "strong"),
            ("Uneven Skin Tone", "weak"),
        ],
        "avoid_for": [
            ("Dry", "Can increase dryness and flaking"),
            ("Sensitive", "Beta-hydroxy exfoliation risks irritation"),
        ],
    },
    {
        "ingredient_name": "Ceramide NP",
        "inci_name": "Ceramide NP",
        "category": "Ceramides",
        "treats": [("Dry Skin", "strong"), ("Sensitive Skin", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Ceramide AP",
        "inci_name": "Ceramide AP",
        "category": "Ceramides",
        "treats": [("Dry Skin", "strong")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Palmitoyl Pentapeptide-4",
        "inci_name": "Palmitoyl Pentapeptide-4",
        "category": "Peptides",
        "treats": [("Wrinkles", "moderate"), ("Fine Lines", "moderate")],
        "avoid_for": [],
    },
    {
        "ingredient_name": "Glycolic Acid",
        "inci_name": "Glycolic Acid",
        "category": "AHAs/BHAs",
        "treats": [
            ("Dark Spots", "moderate"),
            ("Uneven Skin Tone", "moderate"),
            ("Wrinkles", "weak"),
        ],
        "avoid_for": [("Sensitive", "Strong exfoliation risks irritation and barrier disruption")],
    },
    {
        "ingredient_name": "Lactic Acid",
        "inci_name": "Lactic Acid",
        "category": "AHAs/BHAs",
        "treats": [("Dry Skin", "moderate"), ("Uneven Skin Tone", "moderate")],
        "avoid_for": [],
    },
]


async def seed_ingredients() -> int:
    async with async_session_factory() as db:
        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

        existing_result = await db.execute(select(Ingredient.ingredient_name))
        existing_names = {row[0] for row in existing_result.all()}

        created = 0
        for entry in _INGREDIENTS:
            if entry["ingredient_name"] in existing_names:
                continue  # idempotent — dedupe by ingredient_name (docs/DATASETS_AND_APIS.md)

            ingredient = Ingredient(
                ingredient_name=entry["ingredient_name"],
                inci_name=entry.get("inci_name"),
                category=entry["category"],
                is_active=True,
            )
            db.add(ingredient)
            await db.flush()  # assigns ingredient.ingredient_id without committing yet

            for concern_name, evidence_strength in entry.get("treats", []):
                concern_id = concerns.get(concern_name)
                if concern_id is not None:
                    db.add(
                        IngredientConcernTreats(
                            ingredient_id=ingredient.ingredient_id,
                            concern_id=concern_id,
                            evidence_strength=evidence_strength,
                        )
                    )

            for skin_type_name, reason in entry.get("avoid_for", []):
                skin_type_id = skin_types.get(skin_type_name)
                if skin_type_id is not None:
                    db.add(
                        IngredientSkintypeAvoid(
                            ingredient_id=ingredient.ingredient_id,
                            skin_type_id=skin_type_id,
                            reason=reason,
                        )
                    )

            created += 1

        await db.commit()
        return created


async def seed_products() -> int:
    async with async_session_factory() as db:
        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

        ingredient_result = await db.execute(
            select(Ingredient.ingredient_name, Ingredient.ingredient_id)
        )
        ingredient_ids = {row[0]: row[1] for row in ingredient_result.all()}

        existing_result = await db.execute(select(Product.brand_name, Product.product_name))
        existing_pairs = {(row[0], row[1]) for row in existing_result.all()}

        created = 0
        for entry in _PRODUCTS:
            key = (entry["brand_name"], entry["product_name"])
            if key in existing_pairs:
                continue  # idempotent — dedupe by brand+name (docs/DATASETS_AND_APIS.md)

            product = Product(
                brand_name=entry["brand_name"],
                product_name=entry["product_name"],
                category=entry["category"],
                price=entry["price"],
                currency="INR",
                volume_ml=entry["volume_ml"],
                spf_rating=entry.get("spf_rating"),
                is_active=True,
            )
            db.add(product)
            await db.flush()  # assigns product.product_id without committing yet

            for skin_type_name in entry.get("skin_types", []):
                skin_type_id = skin_types.get(skin_type_name)
                if skin_type_id is not None:
                    db.add(
                        ProductSkinType(product_id=product.product_id, skin_type_id=skin_type_id)
                    )

            for concern_name in entry.get("concerns", []):
                concern_id = concerns.get(concern_name)
                if concern_id is not None:
                    db.add(ProductConcern(product_id=product.product_id, concern_id=concern_id))

            for ingredient_name in entry.get("ingredients", []):
                ingredient_id = ingredient_ids.get(ingredient_name)
                if ingredient_id is not None:
                    db.add(
                        ProductIngredient(
                            product_id=product.product_id, ingredient_id=ingredient_id
                        )
                    )

            created += 1

        await db.commit()
        return created


async def main() -> None:
    # Ingredients first — seed_products() links product_ingredients against them.
    ingredients_created = await seed_ingredients()
    print(
        f"Seeded {ingredients_created} new ingredient(s) "
        f"({len(_INGREDIENTS) - ingredients_created} already present)."
    )
    created = await seed_products()
    print(f"Seeded {created} new product(s) ({len(_PRODUCTS) - created} already present).")


if __name__ == "__main__":
    asyncio.run(main())
