# backend/import_test.py

import sys
import csv
from pathlib import Path
from datetime import datetime

sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product

def import_test():
    print("=" * 60)
    print("📥 IMPORTING 5 TEST PRODUCTS")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        csv_path = Path(__file__).parent / "data" / "test_products.csv"
        
        if not csv_path.exists():
            print(f"❌ CSV not found: {csv_path}")
            return
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                product = Product(
                    name=row['name'],
                    brand=row['brand'],
                    category=row['category'],
                    price=float(row['price']),
                    rating=float(row['rating']),
                    reviews_count=int(row['reviews_count']),
                    image_url=row['image_url'],
                    description=row['description'],
                    ingredients_text=row['ingredients_text'],
                    how_to_use=row['how_to_use'],
                    source='test_import',
                    availability='in_stock',
                    currency='USD',
                    created_at=datetime.utcnow()
                )
                db.add(product)
            
            db.commit()
            
            count = db.query(Product).count()
            print(f"\n✅ Imported {count} products!")
            
            print("\n📋 Products in database:")
            for p in db.query(Product).all():
                print(f"   {p.id}. {p.name} - {p.brand}")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_test()