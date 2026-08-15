# backend/import_clean_products.py

"""
IMPORT CLEAN SKINCARE PRODUCTS
This script imports the 20 clean skincare products from CSV
"""

import sys
import os
import csv
from pathlib import Path
from datetime import datetime

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product

def import_clean_products():
    """Main function to import clean skincare products"""
    
    print("=" * 70)
    print("🧴 IMPORTING CLEAN SKINCARE PRODUCTS")
    print("=" * 70)
    
    db = SessionLocal()
    
    try:
        # Check if CSV exists
        csv_path = Path(__file__).parent / "data" / "skincare_products_clean.csv"
        
        if not csv_path.exists():
            print(f"\n❌ CSV file not found: {csv_path}")
            print("   Please create the file first!")
            print("   Location: backend/data/skincare_products_clean.csv")
            return
        
        # Read the CSV file
        print(f"\n📂 Reading CSV file: {csv_path}")
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            products = list(reader)
        
        print(f"   ✅ Found {len(products)} products in CSV")
        
        if len(products) == 0:
            print("   ❌ CSV is empty!")
            return
        
        # Show first product preview
        print("\n📋 Preview of first product:")
        first = products[0]
        print(f"   Name: {first.get('name', 'N/A')}")
        print(f"   Brand: {first.get('brand', 'N/A')}")
        print(f"   Category: {first.get('category', 'N/A')}")
        print(f"   Price: ${first.get('price', 'N/A')}")
        
        # Import products
        print("\n💾 Importing products into database...")
        
        imported_count = 0
        for row in products:
            try:
                # Skip if required fields are missing
                if not row.get('name') or not row.get('brand'):
                    print(f"   ⚠️ Skipping product with missing name/brand: {row}")
                    continue
                
                product = Product(
                    name=row['name'].strip(),
                    brand=row['brand'].strip(),
                    category=row.get('category', '').strip(),
                    price=float(row.get('price', 0) or 0),
                    rating=float(row.get('rating', 0) or 0),
                    reviews_count=int(row.get('reviews_count', 0) or 0),
                    image_url=row.get('image_url', '').strip(),
                    description=row.get('description', '').strip(),
                    ingredients_text=row.get('ingredients_text', '').strip(),
                    how_to_use=row.get('how_to_use', '').strip(),
                    source='clean_dataset',
                    availability='in_stock',
                    currency='USD',
                    created_at=datetime.utcnow(),
                    last_updated=datetime.utcnow()
                )
                db.add(product)
                imported_count += 1
                
                if imported_count % 5 == 0:
                    print(f"   ... imported {imported_count} products")
                    
            except Exception as e:
                print(f"   ⚠️ Error importing product '{row.get('name', 'Unknown')}': {e}")
                continue
        
        # Final commit
        db.commit()
        
        # Verification
        print("\n📊 Verification...")
        total_products = db.query(Product).count()
        print(f"   ✅ Total products in database: {total_products}")
        
        # Show all imported products
        print("\n📋 All imported products:")
        all_products = db.query(Product).order_by(Product.id).all()
        for i, p in enumerate(all_products, 1):
            print(f"   {i}. {p.name} - {p.brand} (${p.price}) - ⭐{p.rating}")
        
        print("\n" + "=" * 70)
        print("✅ IMPORT COMPLETED SUCCESSFULLY!")
        print("=" * 70)
        print(f"   Total products imported: {total_products}")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error during import: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    import_clean_products()