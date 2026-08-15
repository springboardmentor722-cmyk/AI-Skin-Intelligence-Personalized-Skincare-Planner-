# backend/populate_ingredients.py

import sys
import os
import json
import re
import pandas as pd
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Product, Ingredient, ProductIngredient

CSV_PATH = "data/skincare_products_filtered.csv"

def parse_ingredients_json(raw):
    """Parse the ingredients column - handles malformed JSON."""
    if pd.isna(raw) or not raw:
        return []
    
    if isinstance(raw, list):
        return raw
    
    if not isinstance(raw, str):
        return []
    
    # Clean the string
    text = raw.strip()
    
    # If it's empty or just brackets
    if text in ['[]', '{}']:
        return []
    
    # Try multiple parsing strategies
    strategies = [
        # Strategy 1: Direct JSON parse
        lambda: json.loads(text),
        
        # Strategy 2: Replace single quotes with double quotes
        lambda: json.loads(text.replace("'", '"')),
        
        # Strategy 3: Use ast.literal_eval
        lambda: __import__('ast').literal_eval(text),
        
        # Strategy 4: Extract using regex
        lambda: extract_ingredients_with_regex(text),
    ]
    
    for strategy in strategies:
        try:
            result = strategy()
            if isinstance(result, list) and result:
                return result
        except:
            continue
    
    return []

def extract_ingredients_with_regex(text):
    """Extract ingredient objects using regex."""
    ingredients = []
    
    # Find all objects like {"position": 0, "label_name": "Water", ...}
    pattern = r'\{[^{}]*"label_name"[^{}]*\}'
    matches = re.findall(pattern, text)
    
    for match in matches:
        try:
            # Clean and parse each object
            cleaned = match.replace("'", '"')
            obj = json.loads(cleaned)
            if isinstance(obj, dict) and 'label_name' in obj:
                # Convert to expected format
                ingredient = {
                    'name': obj.get('label_name', ''),
                    'comedogenicity': obj.get('comedogenicity', None),
                    'irritancy': obj.get('irritancy', None),
                    'functions': obj.get('functions', []),
                    'rating': obj.get('rating', ''),
                    'category': obj.get('category', ''),
                }
                ingredients.append(ingredient)
        except:
            continue
    
    return ingredients

def populate_ingredients():
    print("=" * 70)
    print("🧪 POPULATING INGREDIENT TABLES FROM CSV")
    print("=" * 70)

    if not os.path.exists(CSV_PATH):
        print(f"\n❌ CSV not found: {CSV_PATH}")
        return

    df = pd.read_csv(CSV_PATH)
    db = SessionLocal()

    try:
        product_count = db.query(Product).count()
        print(f"\n📊 Found {product_count} products in database")

        products_dict = {}
        for p in db.query(Product).all():
            key = (p.name.lower().strip(), p.brand.lower().strip())
            products_dict[key] = p

        print(f"📊 Loaded {len(products_dict)} products for matching")

        ingredient_count = 0
        link_count = 0
        skipped_no_match = 0
        skipped_no_ingredients = 0
        processed_products = 0

        print("\n📝 Processing products...")

        for idx, row in df.iterrows():
            product_name = str(row.get("name", "")).strip()
            brand_name = str(row.get("brand", "")).strip()

            if not product_name or not brand_name:
                skipped_no_match += 1
                continue

            key = (product_name.lower().strip(), brand_name.lower().strip())
            product = products_dict.get(key)

            if not product:
                skipped_no_match += 1
                continue

            ingredients_list = parse_ingredients_json(row.get("ingredients", []))

            if not ingredients_list:
                skipped_no_ingredients += 1
                continue

            processed_products += 1

            for position, ing_data in enumerate(ingredients_list):
                if not isinstance(ing_data, dict):
                    continue

                ingredient_name = ing_data.get("name", "").strip()
                if not ingredient_name:
                    continue

                # Check if ingredient exists (case insensitive)
                existing_ing = db.query(Ingredient).filter(
                    Ingredient.name.ilike(ingredient_name)
                ).first()

                if not existing_ing:
                    new_ing = Ingredient(
                        name=ingredient_name,
                        comedogenicity=str(ing_data.get("comedogenicity", "")) if ing_data.get("comedogenicity") is not None else None,
                        irritancy=str(ing_data.get("irritancy", "")) if ing_data.get("irritancy") is not None else None,
                        functions=ing_data.get("functions", []) if isinstance(ing_data.get("functions"), list) else [],
                        rating=ing_data.get("rating", ""),
                        category=ing_data.get("category", ""),
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(new_ing)
                    db.flush()
                    ingredient_count += 1
                    existing_ing = new_ing

                link = ProductIngredient(
                    product_id=product.id,
                    ingredient_id=existing_ing.id,
                    position=position
                )
                db.add(link)
                link_count += 1

                if link_count % 500 == 0:
                    db.commit()
                    print(f"   ... processed {link_count} ingredient links, {ingredient_count} unique ingredients")

        db.commit()

        print("\n" + "=" * 70)
        print("📊 IMPORT SUMMARY")
        print("=" * 70)
        print(f"   Products processed: {processed_products}")
        print(f"   New ingredients added: {ingredient_count}")
        print(f"   Product-ingredient links: {link_count}")
        print(f"   Products with no ingredients: {skipped_no_ingredients}")
        print(f"   Products not found in DB: {skipped_no_match}")
        print("=" * 70)

        print("\n📋 Sample ingredients:")
        samples = db.query(Ingredient).limit(10).all()
        for ing in samples:
            print(f"   • {ing.name} (comedogenicity: {ing.comedogenicity}, irritancy: {ing.irritancy})")

        print("\n✅ POPULATION COMPLETE!")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    populate_ingredients()