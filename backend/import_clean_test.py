# backend/import_clean_test.py

import sys
import csv
from pathlib import Path
from datetime import datetime, timezone

sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product

def import_test():
    print("=" * 60)
    print("📥 IMPORTING CLEAN TEST PRODUCTS")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # First, delete ALL existing products
        print("\n🗑️ Deleting all existing products...")
        deleted = db.query(Product).delete()
        db.commit()
        print(f"   ✅ Deleted {deleted} products")
        
        csv_path = Path(__file__).parent / "data" / "test_products.csv"
        
        if not csv_path.exists():
            print(f"❌ CSV not found: {csv_path}")
            return
        
        print(f"\n📂 Reading CSV: {csv_path}")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            products = list(reader)
        
        print(f"   ✅ Found {len(products)} products in CSV")
        
        print("\n💾 Importing products...")
        
        for row in products:
            product = Product(
                name=row['name'].strip(),
                brand=row['brand'].strip(),
                category=row['category'].strip(),
                price=float(row['price']),
                rating=float(row['rating']),
                reviews_count=int(row['reviews_count']),
                image_url=row['image_url'].strip(),
                description=row['description'].strip(),
                ingredients_text=row['ingredients_text'].strip(),
                how_to_use=row['how_to_use'].strip(),
                source='clean_import',
                availability='in_stock',
                currency='USD',
                created_at=datetime.now(timezone.utc)
            )
            db.add(product)
        
        db.commit()
        
        # Verify
        count = db.query(Product).count()
        print(f"\n✅ Imported {count} products!")
        
        print("\n📋 Products in database:")
        for p in db.query(Product).all():
            print(f"   {p.id}. {p.name} - {p.brand} - {p.category}")
            print(f"      Image: {p.image_url[:50]}...")
        
        print("\n" + "=" * 60)
        print("✅ IMPORT COMPLETE!")
        print("=" * 60)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_test()