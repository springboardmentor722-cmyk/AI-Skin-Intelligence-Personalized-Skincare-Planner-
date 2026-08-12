"""
Product recommendation engine.

Matches the routine engine's required (product_category, key_actives) slots against
a product catalog (MongoDB `products` collection, seeded from brand INCI listings)
filtered by skin type, sensitivity, and budget tier.

Seed catalog covers: Minimalist, Dot & Key, CeraVe, Cetaphil, The Ordinary, Neutrogena.
Real deployment: scrape/ingest brand ingredient lists (respecting each site's ToS/licensing)
into `ingredients` + `products` collections via a scheduled ETL job (see /scripts/etl).
"""

from app.db.mongo import product_catalog_collection
from app.services.routine_engine import RoutineStep

BUDGET_TIERS = {"budget": (0, 600), "mid": (600, 1500), "premium": (1500, 10_000)}  # INR


async def recommend_products_for_step(
    step: RoutineStep,
    skin_type: str,
    sensitive_skin: bool,
    budget_tier: str = "mid",
    limit: int = 3,
) -> list[dict]:
    lo, hi = BUDGET_TIERS.get(budget_tier, BUDGET_TIERS["mid"])

    query = {
        "category": step.product_category,
        "price_inr": {"$gte": lo, "$lte": hi},
        "suitable_skin_types": skin_type,
        "key_ingredients": {"$in": step.key_actives},
    }
    if sensitive_skin:
        query["fragrance_free"] = True

    cursor = product_catalog_collection.find(query).limit(limit)
    products = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        products.append(doc)

    # Fallback: relax ingredient match if nothing found, still respect skin type/budget/sensitivity
    if not products:
        fallback_query = {k: v for k, v in query.items() if k != "key_ingredients"}
        cursor = product_catalog_collection.find(fallback_query).limit(limit)
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            products.append(doc)

    return products


SEED_PRODUCTS = [
    {
        "brand": "Minimalist", "name": "Salicylic Acid 2% Solution", "category": "bha_or_benzoyl_peroxide",
        "key_ingredients": ["salicylic_acid"], "suitable_skin_types": "oily", "fragrance_free": True, "price_inr": 549,
    },
    {
        "brand": "The Ordinary", "name": "Niacinamide 10% + Zinc 1%", "category": "lightweight_moisturizer",
        "key_ingredients": ["niacinamide"], "suitable_skin_types": "combination", "fragrance_free": True, "price_inr": 700,
    },
    {
        "brand": "CeraVe", "name": "Moisturizing Cream", "category": "night_cream",
        "key_ingredients": ["ceramides", "hyaluronic_acid"], "suitable_skin_types": "dry", "fragrance_free": True, "price_inr": 1250,
    },
    {
        "brand": "Cetaphil", "name": "Gentle Skin Cleanser", "category": "gentle_cleanser",
        "key_ingredients": ["glycerin"], "suitable_skin_types": "normal", "fragrance_free": True, "price_inr": 500,
    },
    {
        "brand": "Dot & Key", "name": "Vitamin C Serum", "category": "vitamin_c_serum",
        "key_ingredients": ["vitamin_c", "ferulic_acid"], "suitable_skin_types": "combination", "fragrance_free": False, "price_inr": 795,
    },
    {
        "brand": "Neutrogena", "name": "Ultra Sheer Dry-Touch SPF 50+", "category": "sunscreen_spf50",
        "key_ingredients": ["zinc_oxide"], "suitable_skin_types": "oily", "fragrance_free": True, "price_inr": 549,
    },
]
