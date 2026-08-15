# backend/seed_real_products.py

import sys
import os
import hashlib
import ast
import pandas as pd
from datetime import datetime, timezone

# Add the parent directory to path so we can import backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Product, Review, ProductRecommendation

CSV_PATH = "data/skincare_products_filtered.csv"
IMAGE_URL_PREFIX = "/static/products/"

PRICE_RANGES = {
    "skincare": (10, 60),
    "suncare": (12, 45),
}

CATEGORY_HOW_TO_USE = {
    "skincare": "Apply to clean skin as directed, morning or evening depending on the product type.",
    "suncare": "Apply generously 15 minutes before sun exposure and reapply every 2 hours.",
}


def _hash_float(seed, low, high):
    """Deterministic float in [low, high] derived from a seed string."""
    h = int(hashlib.md5(seed.encode()).hexdigest(), 16)
    fraction = (h % 10000) / 10000
    return round(low + fraction * (high - low), 2)


def _hash_int(seed, low, high):
    h = int(hashlib.md5((seed + "salt").encode()).hexdigest(), 16)
    return low + (h % (high - low))


def generate_price(name, brand, category):
    low, high = PRICE_RANGES.get(category, (10, 50))
    return _hash_float(name + brand, low, high)


def generate_rating(name, brand):
    return _hash_float(name + brand + "rating", 3.8, 4.9)


def generate_reviews_count(name, brand):
    return _hash_int(name + brand, 40, 12000)


def generate_description(name, brand, category, ingredients_simple):
    top_ingredients = str(ingredients_simple).split("|")[:3]
    top_ingredients = [i.strip() for i in top_ingredients if i.strip()]
    ing_text = ", ".join(top_ingredients) if top_ingredients else "a blend of active ingredients"
    return f"{name} by {brand} is a {category} product formulated with {ing_text}."


def parse_ingredients_json(raw):
    if pd.isna(raw) or not raw:
        return []
    try:
        return ast.literal_eval(raw)
    except (ValueError, SyntaxError):
        return []


def seed():
    print("=" * 60)
    print("📥 IMPORTING REAL SKINCARE PRODUCTS")
    print("=" * 60)

    # Check if CSV exists
    if not os.path.exists(CSV_PATH):
        print(f"\n❌ CSV file not found: {CSV_PATH}")
        print("   Please make sure the file exists in the data folder.")
        return

    df = pd.read_csv(CSV_PATH)
    db = SessionLocal()

    try:
        # Count existing products
        existing = db.query(Product).count()
        print(f"\n🗑️ Deleting {existing} existing products...")

        db.query(ProductRecommendation).delete()
        db.query(Review).delete()
        db.query(Product).delete()
        db.commit()
        print("   ✅ Deleted")

        print(f"\n📂 Reading {len(df)} products from CSV...")

        inserted = 0
        skipped = 0
        seen = set()

        for idx, row in df.iterrows():
            name = str(row["name"]).strip()
            brand = str(row["brand"]).strip()

            if pd.isna(name) or pd.isna(brand) or not name or not brand:
                skipped += 1
                continue

            key = (name, brand)
            if key in seen:
                skipped += 1
                continue
            seen.add(key)

            category = str(row.get("category", "skincare")).strip()
            if category not in PRICE_RANGES:
                category = "skincare"

            # Generate values
            price = generate_price(name, brand, category)
            rating = generate_rating(name, brand)
            reviews_count = generate_reviews_count(name, brand)
            description = generate_description(
                name, brand, category,
                row.get("ingredients_simple", "")
            )
            how_to_use = CATEGORY_HOW_TO_USE.get(category, "Follow the instructions on the product packaging.")

            # Image URL
            image_name = row.get("image_name", "")
            if pd.notna(image_name) and image_name:
                image_url = IMAGE_URL_PREFIX + str(image_name)
            else:
                image_url = None

            # Ingredient flags
            contains_fragrance = bool(row.get("contains_fragrance", False))
            contains_drying_alcohol = bool(row.get("contains_drying_alcohol", False))
            contains_parabens = bool(row.get("contains_parabens", False))
            contains_sulfates = bool(row.get("contains_sulfates", False))
            contains_silicones = bool(row.get("contains_silicones", False))

            # Build ingredients text with flags
            ingredients_text = str(row.get("ingredients_simple", ""))
            if ingredients_text and ingredients_text != "nan":
                # Add safety flags to ingredients text for display
                flags = []
                if contains_fragrance:
                    flags.append("Contains Fragrance")
                if contains_drying_alcohol:
                    flags.append("Contains Drying Alcohol")
                if contains_parabens:
                    flags.append("Contains Parabens")
                if contains_sulfates:
                    flags.append("Contains Sulfates")
                if contains_silicones:
                    flags.append("Contains Silicones")
                if flags:
                    ingredients_text = ingredients_text + " | " + " | ".join(flags)

            # Create product
            product = Product(
                name=name[:255],
                brand=brand[:255],
                category=category[:100],
                price=price,
                currency="USD",
                rating=rating,
                reviews_count=reviews_count,
                description=description[:500] if description else "",
                how_to_use=how_to_use[:500],
                ingredients_text=ingredients_text[:1000] if ingredients_text else "",
                image_url=image_url,
                source="thebeautyapi",
                availability="in_stock",
                created_at=datetime.now(timezone.utc),
                last_updated=datetime.now(timezone.utc)
            )

            db.add(product)
            inserted += 1

            if inserted % 50 == 0:
                db.commit()
                print(f"   ... imported {inserted} products")

        db.commit()

        print(f"\n" + "=" * 60)
        print(f"✅ IMPORT COMPLETE!")
        print("=" * 60)
        print(f"   Imported: {inserted} products")
        print(f"   Skipped: {skipped} products")
        print("")
        print("📝 NOTE: price, rating, reviews_count are")
        print("   deterministically estimated (not from source data)")
        print("=" * 60)

        # Show sample
        print("\n📋 Sample products:")
        samples = db.query(Product).limit(5).all()
        for p in samples:
            print(f"   • {p.name} - {p.brand} (${p.price})")
            print(f"     Image: {p.image_url}")
            print(f"     ⭐ {p.rating} ({p.reviews_count} reviews)")
            print()

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed()