# backend/delete_all_products.py

"""
DELETE ALL PRODUCTS FROM DATABASE
Run this first to clean out old data
"""

import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product, ProductRecommendation, Review

def delete_all_products():
    print("=" * 60)
    print("🗑️ DELETING ALL PRODUCTS FROM DATABASE")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Count before deletion
        product_count = db.query(Product).count()
        rec_count = db.query(ProductRecommendation).count()
        review_count = db.query(Review).count()
        
        print(f"\n📊 Current counts:")
        print(f"   Products: {product_count}")
        print(f"   Recommendations: {rec_count}")
        print(f"   Reviews: {review_count}")
        
        if product_count == 0:
            print("\n✅ No products to delete!")
            db.close()
            return
        
        # Confirm
        print(f"\n⚠️ This will delete ALL {product_count} products!")
        print(f"⚠️ This will also delete {rec_count} recommendations and {review_count} reviews!")
        confirm = input("\nType 'DELETE' (without quotes) to confirm: ").strip()
        
        if confirm != "DELETE":
            print("❌ Cancelled.")
            db.close()
            return
        
        # Delete in correct order (foreign keys)
        print("\n🗑️ Deleting product recommendations...")
        deleted_recs = db.query(ProductRecommendation).delete()
        print(f"   ✅ Deleted {deleted_recs} recommendations")
        
        print("\n🗑️ Deleting reviews...")
        deleted_reviews = db.query(Review).delete()
        print(f"   ✅ Deleted {deleted_reviews} reviews")
        
        print("\n🗑️ Deleting products...")
        deleted_products = db.query(Product).delete()
        print(f"   ✅ Deleted {deleted_products} products")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print("✅ ALL PRODUCTS DELETED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    delete_all_products()