"""
Seeds the database with initial ingredient and product datasets.
These are used in later milestones for AI-driven recommendations.

Usage: py -m app.db.seed_data
"""

from app.db.postgres import SessionLocal
from app.models.ingredient import Ingredient
from app.models.product import Product, ProductIngredient, ProductCategory

INGREDIENTS = [
    {
        "name": "Retinol",
        "category": "Retinoids",
        "benefits": "Boosts cell turnover, reduces fine lines and wrinkles, improves texture and tone.",
        "common_side_effects": "Dryness, peeling, irritation, sun sensitivity.",
        "suitable_for_skin_types": "normal,oily,combination",
    },
    {
        "name": "Niacinamide",
        "category": "Niacinamide",
        "benefits": "Reduces redness, minimizes pores, controls oil, brightens skin tone.",
        "common_side_effects": "Rare mild flushing in high concentrations.",
        "suitable_for_skin_types": "normal,dry,oily,combination,sensitive",
    },
    {
        "name": "Vitamin C (Ascorbic Acid)",
        "category": "Vitamin C",
        "benefits": "Brightens skin, fades hyperpigmentation, provides antioxidant protection.",
        "common_side_effects": "Can cause irritation in sensitive skin; unstable if not stored properly.",
        "suitable_for_skin_types": "normal,dry,oily,combination",
    },
    {
        "name": "Hyaluronic Acid",
        "category": "Hyaluronic Acid",
        "benefits": "Deeply hydrates, plumps skin, reduces the appearance of fine lines.",
        "common_side_effects": "Rarely causes issues; can draw moisture out of skin in very dry climates if not sealed with moisturizer.",
        "suitable_for_skin_types": "normal,dry,oily,combination,sensitive",
    },
    {
        "name": "Salicylic Acid",
        "category": "AHAs/BHAs",
        "benefits": "Exfoliates inside pores, reduces acne and blackheads, controls oil.",
        "common_side_effects": "Dryness, peeling, irritation if overused.",
        "suitable_for_skin_types": "oily,combination",
    },
    {
        "name": "Glycolic Acid",
        "category": "AHAs/BHAs",
        "benefits": "Exfoliates surface skin cells, improves texture, fades dark spots.",
        "common_side_effects": "Sun sensitivity, irritation, redness.",
        "suitable_for_skin_types": "normal,oily,combination",
    },
    {
        "name": "Ceramides",
        "category": "Ceramides",
        "benefits": "Restores and strengthens skin barrier, locks in moisture.",
        "common_side_effects": "Very well tolerated; rare irritation.",
        "suitable_for_skin_types": "dry,sensitive,normal",
    },
    {
        "name": "Peptides",
        "category": "Peptides",
        "benefits": "Supports collagen production, improves firmness and elasticity.",
        "common_side_effects": "Rare; generally well tolerated.",
        "suitable_for_skin_types": "normal,dry,combination",
    },
    {
        "name": "Zinc Oxide",
        "category": "Sunscreen Filters",
        "benefits": "Provides broad-spectrum physical sun protection, soothes irritated skin.",
        "common_side_effects": "Can leave a white cast in high concentrations.",
        "suitable_for_skin_types": "sensitive,normal,dry,oily,combination",
    },
    {
        "name": "Tea Tree Oil",
        "category": "Botanical Extracts",
        "benefits": "Antibacterial and anti-inflammatory, helps reduce acne.",
        "common_side_effects": "Can be irritating if used undiluted.",
        "suitable_for_skin_types": "oily,combination",
    },
]

PRODUCTS = [
    {
        "name": "Gentle Foaming Cleanser",
        "brand": "DermaCare",
        "category": ProductCategory.FACE_WASH,
        "description": "A sulfate-free foaming cleanser that removes impurities without stripping the skin.",
        "price": 12.99,
        "suitable_for_skin_types": "normal,dry,sensitive",
        "ingredients": ["Ceramides", "Niacinamide"],
    },
    {
        "name": "Salicylic Acid Clarifying Wash",
        "brand": "ClearSkin Labs",
        "category": ProductCategory.FACE_WASH,
        "description": "Deep-cleansing face wash formulated to reduce breakouts and unclog pores.",
        "price": 14.50,
        "suitable_for_skin_types": "oily,combination",
        "ingredients": ["Salicylic Acid", "Tea Tree Oil"],
    },
    {
        "name": "Daily Hydration Moisturizer",
        "brand": "AquaGlow",
        "category": ProductCategory.MOISTURIZER,
        "description": "Lightweight, fast-absorbing moisturizer for 24-hour hydration.",
        "price": 18.00,
        "suitable_for_skin_types": "normal,dry,combination",
        "ingredients": ["Hyaluronic Acid", "Ceramides"],
    },
    {
        "name": "Oil-Free Gel Moisturizer",
        "brand": "ClearSkin Labs",
        "category": ProductCategory.MOISTURIZER,
        "description": "A non-greasy gel moisturizer designed for oily and acne-prone skin.",
        "price": 16.99,
        "suitable_for_skin_types": "oily,combination",
        "ingredients": ["Niacinamide", "Hyaluronic Acid"],
    },
    {
        "name": "Mineral Sunscreen SPF 50",
        "brand": "SunShield",
        "category": ProductCategory.SUNSCREEN,
        "description": "Broad-spectrum mineral sunscreen suitable for sensitive skin.",
        "price": 22.00,
        "suitable_for_skin_types": "sensitive,normal,dry,oily,combination",
        "ingredients": ["Zinc Oxide"],
    },
    {
        "name": "Vitamin C Brightening Serum",
        "brand": "GlowLab",
        "category": ProductCategory.SERUM,
        "description": "Antioxidant-rich serum that brightens skin and fades dark spots over time.",
        "price": 28.00,
        "suitable_for_skin_types": "normal,dry,oily,combination",
        "ingredients": ["Vitamin C (Ascorbic Acid)", "Hyaluronic Acid"],
    },
    {
        "name": "Retinol Renewal Serum",
        "brand": "DermaCare",
        "category": ProductCategory.SERUM,
        "description": "Nightly treatment serum that smooths fine lines and improves skin texture.",
        "price": 32.00,
        "suitable_for_skin_types": "normal,oily,combination",
        "ingredients": ["Retinol", "Peptides"],
    },
    {
        "name": "Balancing Toner",
        "brand": "AquaGlow",
        "category": ProductCategory.TONER,
        "description": "Alcohol-free toner that balances skin pH and preps skin for serums.",
        "price": 13.50,
        "suitable_for_skin_types": "normal,dry,sensitive,combination",
        "ingredients": ["Niacinamide"],
    },
    {
        "name": "Overnight Exfoliating Treatment",
        "brand": "GlowLab",
        "category": ProductCategory.TREATMENT,
        "description": "Leave-on exfoliating treatment that resurfaces skin while you sleep.",
        "price": 26.50,
        "suitable_for_skin_types": "normal,oily,combination",
        "ingredients": ["Glycolic Acid"],
    },
    {
        "name": "Hydrating Sheet Mask",
        "brand": "AquaGlow",
        "category": ProductCategory.FACE_MASK,
        "description": "Intensely hydrating sheet mask for a quick moisture boost.",
        "price": 4.99,
        "suitable_for_skin_types": "normal,dry,sensitive,combination",
        "ingredients": ["Hyaluronic Acid", "Ceramides"],
    },
]


def seed():
    db = SessionLocal()
    try:
        # --- Seed ingredients ---
        ingredient_map = {}
        for ing_data in INGREDIENTS:
            existing = db.query(Ingredient).filter(Ingredient.name == ing_data["name"]).first()
            if existing:
                ingredient_map[ing_data["name"]] = existing
                continue
            ingredient = Ingredient(**ing_data)
            db.add(ingredient)
            db.flush()  # get the id without committing yet
            ingredient_map[ing_data["name"]] = ingredient

        db.commit()
        print(f"Seeded {len(ingredient_map)} ingredients.")

        # --- Seed products + link ingredients ---
        product_count = 0
        for prod_data in PRODUCTS:
            existing = db.query(Product).filter(Product.name == prod_data["name"]).first()
            if existing:
                continue

            ingredient_names = prod_data.pop("ingredients")
            product = Product(**prod_data)
            db.add(product)
            db.flush()

            for ing_name in ingredient_names:
                ingredient = ingredient_map.get(ing_name)
                if ingredient:
                    link = ProductIngredient(product_id=product.id, ingredient_id=ingredient.id)
                    db.add(link)

            product_count += 1

        db.commit()
        print(f"Seeded {product_count} new products with ingredient links.")
        print("Seeding complete.")

    finally:
        db.close()


if __name__ == "__main__":
    seed()