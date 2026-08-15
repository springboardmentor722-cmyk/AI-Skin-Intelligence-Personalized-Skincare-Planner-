# clean_products.py

import sys
import os

# Add the current directory to Python path
sys.path.insert(0, os.getcwd())

from backend.database import SessionLocal
from backend.models import Product, Review

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

# Count before
total_before = db.query(Product).count()
print(f"📊 Total products before cleaning: {total_before}")

# Step 1: Get all products
all_products = db.query(Product).all()

# Step 2: Find products to delete
products_to_delete = []
keep_ids = []

for p in all_products:
    category = (p.category or "").lower()
    sub_category = (p.sub_category or "").lower()
    name = (p.name or "").lower()
    
    # Check if product is skincare
    is_skincare = False
    
    for sk_category in SKINCARE_CATEGORIES:
        if sk_category in category or sk_category in sub_category or sk_category in name:
            is_skincare = True
            break
    
    # Check if it should be removed
    for rm_category in REMOVE_CATEGORIES:
        if rm_category in category or rm_category in sub_category or rm_category in name:
            is_skincare = False
            break
    
    if is_skincare:
        keep_ids.append(p.id)
    else:
        products_to_delete.append(p.id)

print(f"   Products to delete: {len(products_to_delete)}")
print(f"   Products to keep: {len(keep_ids)}")

# Step 3: Delete reviews for products that will be deleted
if products_to_delete:
    print("\n🗑️ Deleting reviews for non-skincare products...")
    deleted_reviews = db.query(Review).filter(Review.product_id.in_(products_to_delete)).delete(synchronize_session=False)
    db.commit()
    print(f"   ✅ Deleted {deleted_reviews} reviews")

# Step 4: Delete non-skincare products
print("\n🗑️ Deleting non-skincare products...")
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

print("\n" + "=" * 70)
print("📊 PRODUCT CLEANUP SUMMARY")
print("=" * 70)
print(f"   Products before: {total_before}")
print(f"   Products deleted: {deleted_count}")
print(f"   Products kept (skincare only): {total_after}")
print(f"   Reviews remaining: {review_count}")
print("=" * 70)

db.close()