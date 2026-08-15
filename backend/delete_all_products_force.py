# backend/delete_all_products_force.py

import sys
import os
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product, ProductRecommendation, Review, SkinAssessment

def force_delete_all():
    print("=" * 60)
    print("🗑️ FORCE DELETING ALL PRODUCTS & RECOMMENDATIONS")
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
        
        print(f"\n🗑️ Deleting all data...")
        
        # Delete in correct order (foreign keys first)
        print("   Deleting product recommendations...")
        db.query(ProductRecommendation).delete()
        
        print("   Deleting reviews...")
        db.query(Review).delete()
        
        print("   Deleting products...")
        db.query(Product).delete()
        
        db.commit()
        
        # Verify deletion
        final_count = db.query(Product).count()
        print(f"\n✅ Products remaining: {final_count}")
        
        print("\n" + "=" * 60)
        print("✅ ALL DATA DELETED SUCCESSFULLY!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    force_delete_all()