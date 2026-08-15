# backend/import_sephora_products.py

import sys
import csv
import os
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Product

def get_image_url(product_id):
    """Generate Sephora image URL from product_id"""
    if not product_id:
        return None
    # Remove any leading/trailing spaces
    product_id = product_id.strip()
    # Sephora image URL pattern
    return f"https://www.sephora.com/productimages/product/p{product_id.lower()}-av-01-zoom.jpg"

def import_sephora_products():
    print("=" * 70)
    print("📥 IMPORTING SKINCARE PRODUCTS FROM SEPHORA DATASET")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # First, delete ALL existing products
        print("\n🗑️ Deleting all existing products...")
        deleted = db.query(Product).delete()
        db.commit()
        print(f"   ✅ Deleted {deleted} products")
        
        csv_path = Path(__file__).parent / "data" / "product_info.csv"
        
        if not csv_path.exists():
            print(f"❌ CSV not found: {csv_path}")
            print("   Please place product_info.csv in backend/data/")
            return
        
        print(f"\n📂 Reading CSV: {csv_path}")
        
        products_to_import = []
        total_skincare = 0
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                # Only get skincare products
                primary_category = row.get('primary_category', '').lower()
                secondary_category = row.get('secondary_category', '').lower()
                
                # Check if it's skincare (not makeup, fragrance, hair, etc.)
                if 'skincare' not in primary_category and 'skincare' not in secondary_category:
                    continue
                
                # Skip if no product_name or brand_name
                product_name = row.get('product_name', '').strip()
                brand_name = row.get('brand_name', '').strip()
                product_id = row.get('product_id', '').strip()
                
                if not product_name or not brand_name:
                    continue
                
                total_skincare += 1
                
                # Get other details
                price = row.get('price_usd', '0')
                rating = row.get('rating', '0')
                reviews = row.get('reviews', '0')
                ingredients = row.get('ingredients', '').strip()
                
                # Generate image URL from product_id
                image_url = get_image_url(product_id)
                
                # Use secondary_category as fallback category
                category = row.get('secondary_category', '').strip() or row.get('primary_category', '').strip()
                
                products_to_import.append({
                    'name': product_name,
                    'brand': brand_name,
                    'category': category,
                    'price': float(price) if price else 0,
                    'rating': float(rating) if rating else 0,
                    'reviews_count': int(reviews) if reviews else 0,
                    'image_url': image_url,
                    'description': '',
                    'ingredients_text': ingredients[:500] if ingredients else '',
                    'how_to_use': '',
                    'product_id': product_id
                })
        
        print(f"   ✅ Found {total_skincare} skincare products in dataset")
        
        # Limit to 20 products for now (take first 20)
        products_to_import = products_to_import[:20]
        print(f"   ✅ Importing first {len(products_to_import)} products")
        
        if not products_to_import:
            print("❌ No skincare products found in dataset!")
            return
        
        print("\n💾 Importing products...")
        print()
        
        imported = 0
        for p in products_to_import:
            product = Product(
                name=p["name"],
                brand=p["brand"],
                category=p["category"],
                price=p["price"],
                rating=p["rating"],
                reviews_count=p["reviews_count"],
                image_url=p["image_url"],
                description=p["description"],
                ingredients_text=p["ingredients_text"],
                how_to_use=p["how_to_use"],
                source="sephora_import",
                availability="in_stock",
                currency="USD",
                created_at=datetime.now(timezone.utc)
            )
            db.add(product)
            imported += 1
            print(f"   ✅ {imported}. {p['name'][:40]}... - {p['brand']}")
        
        db.commit()
        
        # Verify
        count = db.query(Product).count()
        print(f"\n" + "=" * 70)
        print(f"✅ SUCCESS! Imported {count} products from Sephora!")
        print("=" * 70)
        
        print("\n📋 Products with image URLs:")
        for i, p in enumerate(db.query(Product).all(), 1):
            print(f"   {i}. {p.name[:40]}... - {p.brand}")
            print(f"      Image URL: {p.image_url}")
            print()
        
        print("\n" + "=" * 70)
        print("✅ IMPORT COMPLETE! Refresh your browser.")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_sephora_products()