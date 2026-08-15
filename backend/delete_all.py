# backend/delete_all.py

import sys
import os

# Add parent directory to path so we can import backend
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Product, ProductRecommendation, Review

db = SessionLocal()

try:
    print("=" * 60)
    print("🗑️ DELETING ALL PRODUCTS")
    print("=" * 60)
    
    # Count existing products
    count = db.query(Product).count()
    print(f"\n📊 Found {count} products in database")
    
    if count == 0:
        print("✅ No products to delete!")
    else:
        print(f"\n🗑️ Deleting {count} products...")
        
        # Delete in correct order (foreign keys first)
        print("   Deleting recommendations...")
        db.query(ProductRecommendation).delete()
        
        print("   Deleting reviews...")
        db.query(Review).delete()
        
        print("   Deleting products...")
        deleted = db.query(Product).delete()
        
        db.commit()
        print(f"\n✅ Successfully deleted {deleted} products!")
    
    print("\n" + "=" * 60)
    print("✅ DONE!")
    print("=" * 60)
    
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()