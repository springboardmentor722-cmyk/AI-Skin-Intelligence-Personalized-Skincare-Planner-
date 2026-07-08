"""Idempotent local/dev seed data — `make seed` / `python -m app.db.seed`.

Seeds a small placeholder product catalog. Real product data is a separate Kaggle
ingestion pipeline (docs/DATASETS_AND_APIS.md §2, `backend/app/services/admin/ingest/
products.py` — not built yet); this is a stand-in so routines/recommendations have real
`products` rows to reference end-to-end before that pipeline exists. Swapped out, not
mixed in, once it lands.

skin_types/skin_concerns aren't seeded here — they already exist in every environment
loaded from database_schemas/skinlytics_postgresql_schema_v3.sql's own INSERT
statements; a Python seed script for those remains a separate, pending task
(PROGRESS.md).
"""

import asyncio
from typing import TypedDict

from sqlalchemy import select

from app.db.postgres import async_session_factory
from app.services.recommendations.models import Product, ProductConcern, ProductSkinType
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
    },
    {
        "brand_name": "Lumina Labs",
        "product_name": "10% Niacinamide Serum",
        "category": "Treatment",
        "price": 590,
        "volume_ml": 30,
        "skin_types": ["Oily", "Combination", "Normal"],
        "concerns": ["Hyperpigmentation", "Dark Spots", "Uneven Skin Tone"],
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Retinol 0.3% Night Treatment",
        "category": "Treatment",
        "price": 890,
        "volume_ml": 30,
        "skin_types": ["Normal", "Combination"],
        "concerns": ["Wrinkles", "Fine Lines"],
    },
    {
        "brand_name": "Bare Basics",
        "product_name": "Hyaluronic Acid Serum",
        "category": "Treatment",
        "price": 550,
        "volume_ml": 30,
        "skin_types": ["Normal", "Dry", "Oily", "Combination", "Sensitive"],
        "concerns": ["Dry Skin"],
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
    },
    {
        "brand_name": "DermaCare Co",
        "product_name": "Ceramide Repair Moisturizer",
        "category": "Moisturizer",
        "price": 480,
        "volume_ml": 50,
        "skin_types": ["Dry", "Sensitive"],
        "concerns": ["Dry Skin"],
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


async def seed_products() -> int:
    async with async_session_factory() as db:
        skin_types = {
            t.skin_type_name: t.skin_type_id for t in await skin_profile_service.list_skin_types(db)
        }
        concerns = {
            c.concern_name: c.concern_id for c in await skin_profile_service.list_skin_concerns(db)
        }

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

            created += 1

        await db.commit()
        return created


async def main() -> None:
    created = await seed_products()
    print(f"Seeded {created} new product(s) ({len(_PRODUCTS) - created} already present).")


if __name__ == "__main__":
    asyncio.run(main())
