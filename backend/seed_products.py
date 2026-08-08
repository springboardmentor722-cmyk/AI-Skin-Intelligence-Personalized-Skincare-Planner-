import sys
import os
import csv
from pathlib import Path
from sqlalchemy import text
from sqlalchemy.orm import Session

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.database import engine, SessionLocal
from app.db.base import Base
from app.models.product import Product, Ingredient

def reset_and_seed_products():
    print("Dropping products and ingredients tables...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS product_ingredients CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS products CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS ingredients CASCADE"))
        
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    
    print("Seeding products from Kaggle dataset...")
    db = SessionLocal()
    try:
        dataset_path = Path(__file__).parent.parent / "datasets" / "product dataset" / "product_info.csv"
        
        if not dataset_path.exists():
            print(f"Error: Dataset not found at {dataset_path}")
            return
            
        count = 0
        ingredient_cache = {}
        seen_names = set()
        
        with open(dataset_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # We only want Skincare products, maybe some others but mostly Skincare
                if row.get('primary_category') != 'Skincare':
                    continue
                    
                name = row.get('product_name', 'Unknown')
                if name in seen_names:
                    continue
                seen_names.add(name)
                    
                price_str = row.get('price_usd', '0').strip()
                price = float(price_str) if price_str else 0.0
                rating_str = row.get('rating', '0').strip()
                rating = float(rating_str) if rating_str else 0.0
                
                product_type = row.get('secondary_category') or row.get('primary_category', 'Skincare')
                
                # Assign relevant images based on category or name keywords
                lower_type = product_type.lower()
                lower_name = name.lower()
                
                if 'cleans' in lower_type or 'wash' in lower_type or 'cleans' in lower_name or 'wash' in lower_name or 'makeup remover' in lower_name:
                    image_url = "/images/cleanser.png"
                elif 'moistur' in lower_type or 'lotion' in lower_type or 'cream' in lower_type or 'moistur' in lower_name or 'cream' in lower_name or 'lotion' in lower_name:
                    image_url = "/images/moisturizer.png"
                else:
                    image_url = "/images/serum.png"
                
                product = Product(
                    name=name,
                    brand=row.get('brand_name', 'Unknown'),
                    product_type=product_type,
                    price=price,
                    rating=rating,
                    image_url=image_url
                )
                
                # Parse highlights as tags/ingredients for matching
                highlights_str = row.get('highlights', '')
                if highlights_str and highlights_str != '[]':
                    # very basic parsing of array string "['Vegan', 'Cruelty-Free']"
                    highlights = [h.strip(" '\"[]") for h in highlights_str.split(',')]
                    seen_tags_for_product = set()
                    for t in highlights:
                        if not t or len(t) > 50:
                            continue
                        if t in seen_tags_for_product:
                            continue
                        seen_tags_for_product.add(t)
                            
                        if t not in ingredient_cache:
                            ing = db.query(Ingredient).filter(Ingredient.name == t).first()
                            if not ing:
                                ing = Ingredient(name=t, benefits=t, concerns_targeted=t)
                                db.add(ing)
                            ingredient_cache[t] = ing
                        product.ingredients.append(ingredient_cache[t])
                
                db.add(product)
                count += 1
                
        db.commit()
        print(f"Successfully seeded {count} products.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed_products()
