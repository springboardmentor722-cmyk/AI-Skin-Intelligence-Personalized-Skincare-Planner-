# backend/seed_reviews.py

"""
MILESTONE 3 - Seed Reviews (SMALLEST FILE ONLY - FIXED)
Imports ONLY reviews_1250-end.csv (smallest file - 23 MB)
"""

import sys
import csv
import re
from pathlib import Path
from datetime import datetime

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product, Review

# ============================================================
# CONFIGURATION - SMALLEST FILE ONLY
# ============================================================

DATA_DIR = Path(__file__).parent / "data"

# SMALLEST FILE - reviews_1250-end.csv (23 MB)
REVIEWS_FILE = DATA_DIR / "reviews_1250-end.csv"


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clean_text(text):
    if not text:
        return None
    if isinstance(text, str):
        return " ".join(text.strip().split())
    return text


def parse_rating(rating_str):
    if not rating_str:
        return None
    try:
        rating = float(rating_str)
        if 1 <= rating <= 5:
            return int(rating)
    except:
        pass
    return None


def parse_boolean(value):
    if not value:
        return None
    value = str(value).strip().lower()
    return value in ['true', '1', 'yes', '1.0']


def parse_date(date_str):
    if not date_str:
        return None
    try:
        for fmt in ['%Y-%m-%d', '%Y-%m-%d %H:%M:%S', '%m/%d/%Y', '%d/%m/%Y']:
            try:
                return datetime.strptime(str(date_str).strip(), fmt)
            except:
                continue
    except:
        pass
    return None


def normalize_string(s):
    if not s:
        return ""
    s = re.sub(r'[^a-z0-9\s]', '', str(s).lower())
    return " ".join(s.split())


def find_product(db, product_name, brand_name):
    if not product_name or not brand_name:
        return None
    
    product = db.query(Product).filter(
        Product.name == product_name,
        Product.brand == brand_name
    ).first()
    if product:
        return product
    
    product = db.query(Product).filter(
        Product.name.ilike(product_name),
        Product.brand.ilike(brand_name)
    ).first()
    if product:
        return product
    
    norm_name = normalize_string(product_name)
    norm_brand = normalize_string(brand_name)
    
    all_products = db.query(Product).all()
    for p in all_products:
        p_norm_name = normalize_string(p.name)
        p_norm_brand = normalize_string(p.brand)
        if p_norm_name == norm_name and p_norm_brand == norm_brand:
            return p
    
    return None


# ============================================================
# MAIN SEED FUNCTION
# ============================================================

def seed_reviews():
    print("=" * 70)
    print("⭐ Seeding Reviews (SMALLEST FILE ONLY - FIXED)")
    print("=" * 70)
    
    if not REVIEWS_FILE.exists():
        print(f"\n❌ Review file not found: {REVIEWS_FILE}")
        return
    
    file_size_mb = REVIEWS_FILE.stat().st_size / (1024 * 1024)
    print(f"\n📂 Processing: {REVIEWS_FILE.name} ({file_size_mb:.1f} MB)")
    print("   ⏱️ This should take 2-5 minutes only!")
    
    db = SessionLocal()
    stats = {
        'rows': 0,
        'inserted': 0,
        'skipped_no_product': 0,
        'skipped_no_rating': 0,
        'duplicates': 0,
        'errors': 0
    }
    
    try:
        print("\n📦 Loading products into memory...")
        all_products = db.query(Product).all()
        product_lookup = {}
        
        for p in all_products:
            key = f"{normalize_string(p.name)}|{normalize_string(p.brand)}"
            product_lookup[key] = p
            key_exact = f"{p.name.lower()}|{p.brand.lower()}"
            product_lookup[key_exact] = p
        
        print(f"   ✅ Loaded {len(all_products)} products")
        print(f"\n📄 Reading {REVIEWS_FILE.name}...")
        
        # Open with utf-8-sig to handle BOM
        with open(REVIEWS_FILE, 'r', encoding='utf-8-sig') as f:
            # Use comma as delimiter directly
            reader = csv.DictReader(f, delimiter=',')
            
            print(f"   Columns found: {reader.fieldnames}")
            print("")
            
            for row in reader:
                stats['rows'] += 1
                
                try:
                    # Extract data - using correct column names
                    product_name = clean_text(row.get('product_name', ''))
                    brand_name = clean_text(row.get('brand_name', ''))
                    author_id = clean_text(row.get('author_id', ''))
                    rating = parse_rating(row.get('rating', ''))
                    is_recommended = parse_boolean(row.get('is_recommended', ''))
                    helpfulness = int(float(row.get('helpfulness', 0) or 0))
                    total_feedback = int(float(row.get('total_feedback_count', 0) or 0))
                    neg_feedback = int(float(row.get('total_neg_feedback_count', 0) or 0))
                    pos_feedback = int(float(row.get('total_pos_feedback_count', 0) or 0))
                    review_text = clean_text(row.get('review_text', ''))
                    review_title = clean_text(row.get('review_title', ''))
                    skin_type = clean_text(row.get('skin_type', ''))
                    skin_tone = clean_text(row.get('skin_tone', ''))
                    eye_color = clean_text(row.get('eye_color', ''))
                    hair_color = clean_text(row.get('hair_color', ''))
                    submission_time = parse_date(row.get('submission_time', ''))
                    
                    # Debug first row
                    if stats['rows'] == 1:
                        print(f"   First row sample:")
                        print(f"      product_name: {product_name}")
                        print(f"      brand_name: {brand_name}")
                        print(f"      rating: {rating}")
                        print(f"      review_text: {review_text[:50] if review_text else 'EMPTY'}...")
                    
                    # Skip if no rating
                    if not rating:
                        stats['skipped_no_rating'] += 1
                        continue
                    
                    # Find product
                    product = None
                    if product_name and brand_name:
                        key = f"{normalize_string(product_name)}|{normalize_string(brand_name)}"
                        product = product_lookup.get(key)
                        
                        if not product:
                            product = find_product(db, product_name, brand_name)
                    
                    if not product:
                        stats['skipped_no_product'] += 1
                        if stats['skipped_no_product'] <= 5:
                            print(f"   ⚠️ No product: '{brand_name}' - '{product_name}'")
                        continue
                    
                    # Check duplicate
                    existing = db.query(Review).filter(
                        Review.product_id == product.id,
                        Review.author_id == author_id,
                        Review.review_text == review_text
                    ).first()
                    
                    if existing:
                        stats['duplicates'] += 1
                        continue
                    
                    # Create review
                    new_review = Review(
                        product_id=product.id,
                        author_id=author_id,
                        rating=rating,
                        is_recommended=is_recommended if is_recommended is not None else True,
                        helpfulness=helpfulness,
                        total_feedback_count=total_feedback,
                        total_neg_feedback_count=neg_feedback,
                        total_pos_feedback_count=pos_feedback,
                        review_text=review_text,
                        review_title=review_title,
                        skin_type=skin_type,
                        skin_tone=skin_tone,
                        eye_color=eye_color,
                        hair_color=hair_color,
                        submission_time=submission_time,
                        created_at=datetime.utcnow()
                    )
                    
                    db.add(new_review)
                    stats['inserted'] += 1
                    
                    if stats['inserted'] % 100 == 0:
                        db.commit()
                        print(f"   ... inserted {stats['inserted']} reviews")
                    
                except Exception as e:
                    stats['errors'] += 1
                    if stats['errors'] <= 3:
                        print(f"   ⚠️ Error at row {stats['rows']}: {e}")
                    continue
        
        db.commit()
        
        print("\n" + "=" * 70)
        print("📊 REVIEWS SEED SUMMARY")
        print("=" * 70)
        print(f"   File processed:           {REVIEWS_FILE.name}")
        print(f"   Total rows in file:       {stats['rows']}")
        print(f"   Reviews inserted:         {stats['inserted']}")
        print(f"   Skipped - no product:     {stats['skipped_no_product']}")
        print(f"   Skipped - no rating:      {stats['skipped_no_rating']}")
        print(f"   Duplicates skipped:       {stats['duplicates']}")
        print(f"   Errors:                   {stats['errors']}")
        print("=" * 70)
        
        total_in_db = db.query(Review).count()
        print(f"\n✅ Total reviews in database: {total_in_db}")
        print("=" * 70)
        print("\n✅ Reviews seeded successfully!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_reviews()