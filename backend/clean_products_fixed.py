# backend/clean_products_fixed.py

import sys
import os

sys.path.insert(0, os.getcwd())

from backend.database import SessionLocal
from backend.models import Product, Review, ProductRecommendation, SkincareRoutine, RoutineLog

# Categories to KEEP (skincare only)
SKINCARE_CATEGORIES = [
    'moisturizer', 'moisturizers', 'cream', 'lotion',
    'cleanser', 'cleansers', 'face wash', 'wash',
    'serum', 'serums', 'essence',
    'sunscreen', 'spf', 'sun protection',
    'toner', 'toners',
    'mask', 'masks', 'face mask',
    'eye cream', 'eye treatment', 'eye serum',
    'lip balm', 'lip treatment',
    'exfoliator', 'exfoliant', 'scrub',
    'face oil', 'facial oil',
    'treatment', 'spot treatment',
    'retinol', 'vitamin c', 'hyaluronic acid',
    'peptide', 'niacinamide'
]

# Categories to REMOVE (NOT skincare)
REMOVE_CATEGORIES = [
    'makeup', 'foundation', 'concealer', 'powder', 'blush', 'bronzer',
    'highlighter', 'primer', 'setting spray', 'bb cream', 'cc cream',
    'hair', 'shampoo', 'conditioner', 'hair mask', 'hair oil',
    'body wash', 'shower gel', 'body lotion', 'deodorant',
    'perfume', 'fragrance', 'cologne',
    'brush', 'tool', 'accessory', 'sponge',
    'nail', 'polish', 'remover',
    'tanning', 'self tan',
    'candle', 'diffuser', 'home scent'
]

db = SessionLocal()

try:
    # Count before
    total_before = db.query(Product).count()
    print(f"📊 Total products before cleaning: {total_before}")

    # Get all products
    all_products = db.query(Product).all()

    # Find products to delete
    products_to_delete = []

    for p in all_products:
        category = (p.category or "").lower()
        sub_category = (p.sub_category or "").lower()
        name = (p.name or "").lower()
        
        is_skincare = False
        
        for sk_category in SKINCARE_CATEGORIES:
            if sk_category in category or sk_category in sub_category or sk_category in name:
                is_skincare = True
                break
        
        for rm_category in REMOVE_CATEGORIES:
            if rm_category in category or rm_category in sub_category or rm_category in name:
                is_skincare = False
                break
        
        if not is_skincare:
            products_to_delete.append(p.id)

    print(f"   Products to delete: {len(products_to_delete)}")
    print(f"   Products to keep: {len(all_products) - len(products_to_delete)}")

    if not products_to_delete:
        print("\n✅ No products to delete!")
        db.close()
        exit()

    # Step 1: Delete ProductRecommendations
    print("\n🗑️ Deleting product recommendations...")
    deleted_recs = db.query(ProductRecommendation).filter(
        ProductRecommendation.product_id.in_(products_to_delete)
    ).delete(synchronize_session=False)
    db.commit()
    print(f"   ✅ Deleted {deleted_recs} product recommendations")

    # Step 2: Delete RoutineLogs
    print("\n🗑️ Deleting routine logs...")
    deleted_logs = db.query(RoutineLog).filter(
        RoutineLog.routine_step_id.in_(
            db.query(SkincareRoutine.id).filter(
                SkincareRoutine.product_id.in_(products_to_delete)
            )
        )
    ).delete(synchronize_session=False)
    db.commit()
    print(f"   ✅ Deleted {deleted_logs} routine logs")

    # Step 3: Delete SkincareRoutines
    print("\n🗑️ Deleting skincare routines...")
    deleted_routines = db.query(SkincareRoutine).filter(
        SkincareRoutine.product_id.in_(products_to_delete)
    ).delete(synchronize_session=False)
    db.commit()
    print(f"   ✅ Deleted {deleted_routines} skincare routines")

    # Step 4: Delete Reviews
    print("\n🗑️ Deleting reviews...")
    deleted_reviews = db.query(Review).filter(
        Review.product_id.in_(products_to_delete)
    ).delete(synchronize_session=False)
    db.commit()
    print(f"   ✅ Deleted {deleted_reviews} reviews")

    # Step 5: Delete Products
    print("\n🗑️ Deleting products...")
    deleted_count = 0
    for product_id in products_to_delete:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            db.delete(product)
            deleted_count += 1
            if deleted_count % 100 == 0:
                db.commit()
                print(f"   ... deleted {deleted_count} products")

    db.commit()

    # Final count
    total_after = db.query(Product).count()
    review_count = db.query(Review).count()
    rec_count = db.query(ProductRecommendation).count()

    print("\n" + "=" * 70)
    print("📊 PRODUCT CLEANUP SUMMARY")
    print("=" * 70)
    print(f"   Products before: {total_before}")
    print(f"   Products deleted: {deleted_count}")
    print(f"   Products kept (skincare only): {total_after}")
    print(f"   Reviews remaining: {review_count}")
    print(f"   Recommendations remaining: {rec_count}")
    print("=" * 70)

except Exception as e:
    print(f"\n❌ Error: {e}")
    db.rollback()
finally:
    db.close()