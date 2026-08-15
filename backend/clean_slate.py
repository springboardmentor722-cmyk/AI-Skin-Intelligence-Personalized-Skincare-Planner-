# backend/clean_slate.py

import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product, ProductRecommendation, Review

def clean_slate():
    print("=" * 60)
    print("🧹 CLEAN SLATE - DELETING EVERYTHING")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Count
        products = db.query(Product).count()
        recs = db.query(ProductRecommendation).count()
        reviews = db.query(Review).count()
        
        print(f"\nCurrent counts:")
        print(f"  Products: {products}")
        print(f"  Recommendations: {recs}")
        print(f"  Reviews: {reviews}")
        
        if products == 0:
            print("\n✅ Already clean!")
            db.close()
            return
        
        print("\n🗑️ Deleting everything...")
        
        # Delete in order
        db.query(ProductRecommendation).delete()
        db.query(Review).delete()
        db.query(Product).delete()
        
        db.commit()
        
        # Verify
        final_products = db.query(Product).count()
        final_recs = db.query(ProductRecommendation).count()
        
        print(f"\n✅ After cleanup:")
        print(f"  Products: {final_products}")
        print(f"  Recommendations: {final_recs}")
        
        print("\n" + "=" * 60)
        print("✅ DATABASE IS NOW CLEAN!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    clean_slate()