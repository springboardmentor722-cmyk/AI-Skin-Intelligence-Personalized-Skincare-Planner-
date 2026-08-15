# backend/seed_products.py

"""
MILESTONE 3 - Seed Products Script
Imports products from Cult Beauty and Sephora datasets into the products table.
Merges products by (name, brand) to avoid duplicates.
"""

import sys
import os
import csv
from pathlib import Path
from datetime import datetime
import json
import re

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import Product
from backend.database import engine

# ============================================================
# CONFIGURATION - Update these paths to match your files
# ============================================================

DATA_DIR = Path(__file__).parent / "data"

# Your CSV file paths
CULT_BEAUTY_CSV = DATA_DIR / "cult_beauty_products_with_ingredients_dataset_csv_sample.csv"
SEPHORA_PRODUCTS_CSV = DATA_DIR / "product_info.csv"

# Placeholder image for products without real images
PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x300/8B6B8B/FFFFFF?text=No+Image"

# If your filenames are different, update them above


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clean_text(text):
    """Clean text by removing extra whitespace and newlines"""
    if not text:
        return None
    if isinstance(text, str):
        return " ".join(text.strip().split())
    return text


def parse_price(price_str):
    """Parse price from string to float"""
    if not price_str:
        return None
    if isinstance(price_str, (int, float)):
        return float(price_str)
    # Remove currency symbols and convert
    cleaned = re.sub(r'[^\d.]', '', str(price_str))
    try:
        return float(cleaned)
    except:
        return None


def parse_highlights(highlights_str):
    """Parse highlights from string to JSON list"""
    if not highlights_str:
        return []
    if isinstance(highlights_str, list):
        return highlights_str
    if isinstance(highlights_str, str):
        # Try JSON parsing first
        try:
            return json.loads(highlights_str)
        except:
            # Split by commas or semicolons
            items = re.split(r'[,;]', highlights_str)
            return [item.strip() for item in items if item.strip()]
    return []


def extract_ingredients(ingredients_text):
    """Extract and clean ingredients from text"""
    if not ingredients_text:
        return ""
    return clean_text(ingredients_text)


def get_image_url(row):
    """Get image URL from Cult Beauty dataset, or return placeholder"""
    # Try primary_image_url first
    image_url = row.get('primary_image_url', '')
    if image_url and image_url.strip():
        # Ensure URL is complete
        if image_url.startswith('//'):
            return 'https:' + image_url
        elif not image_url.startswith('http'):
            return None
        return image_url.strip()
    
    # Try additional_images if available
    additional = row.get('additional_images', '')
    if additional and additional.strip():
        try:
            # Try parsing as JSON
            images = json.loads(additional)
            if images and len(images) > 0:
                img = images[0].strip()
                if img.startswith('//'):
                    return 'https:' + img
                return img
        except:
            # Try simple string split
            parts = additional.split(',')
            if parts:
                img = parts[0].strip()
                if img.startswith('//'):
                    return 'https:' + img
                return img
    
    # No image found - return placeholder
    return PLACEHOLDER_IMAGE


def normalize_string(s):
    """Normalize a string for comparison"""
    if not s:
        return ""
    return re.sub(r'[^a-z0-9]', '', s.lower().strip())


def find_matching_product(sephora_product, cult_products_by_key):
    """Find matching Cult Beauty product for a Sephora product"""
    sephora_name = sephora_product.get('product_name', '')
    sephora_brand = sephora_product.get('brand_name', '')
    
    if not sephora_name or not sephora_brand:
        return None
    
    # Create keys for matching
    name_key = normalize_string(sephora_name)
    brand_key = normalize_string(sephora_brand)
    
    # Try exact match first
    exact_key = f"{name_key}_{brand_key}"
    if exact_key in cult_products_by_key:
        return cult_products_by_key[exact_key]
    
    # Try brand + partial name match (for products with extra info like size)
    for key, cult_row in cult_products_by_key.items():
        cult_name_key, cult_brand_key = key.rsplit('_', 1)
        if cult_brand_key == brand_key:
            # Check if one name contains the other (ignoring size/flavor info)
            cult_name_clean = normalize_string(cult_row.get('product_name', ''))
            sephora_name_clean = normalize_string(sephora_name)
            if cult_name_clean in sephora_name_clean or sephora_name_clean in cult_name_clean:
                return cult_row
    
    return None


# ============================================================
# MAIN SEED FUNCTION
# ============================================================

def seed_products():
    """Main function to seed products from CSV files"""
    print("=" * 70)
    print("🚀 Seeding Products from Cult Beauty + Sephora")
    print("=" * 70)
    
    db = SessionLocal()
    stats = {
        'cult_loaded': 0,
        'sephora_loaded': 0,
        'merged': 0,
        'new_cult': 0,
        'new_sephora': 0,
        'total': 0,
        'errors': 0
    }
    
    try:
        # ----------------------------------------------------
        # Step 1: Load Cult Beauty Products
        # ----------------------------------------------------
        print("\n📂 Loading Cult Beauty products...")
        
        if not CULT_BEAUTY_CSV.exists():
            print(f"❌ Cult Beauty CSV not found: {CULT_BEAUTY_CSV}")
            print("   Please update CULT_BEAUTY_CSV path in the script.")
            return
        
        cult_products = []
        cult_products_by_key = {}
        
        with open(CULT_BEAUTY_CSV, 'r', encoding='utf-8') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                try:
                    product_name = clean_text(row.get('product_name', ''))
                    brand_name = clean_text(row.get('brand_name', ''))
                    
                    if not product_name or not brand_name:
                        continue
                    
                    product = {
                        'name': product_name,
                        'brand': brand_name,
                        'category': clean_text(row.get('category_1', '')),
                        'sub_category': clean_text(row.get('category_2', '')),
                        'sub_category_2': clean_text(row.get('category_3', '')),
                        'price': parse_price(row.get('price', '')),
                        'currency': row.get('currency', 'USD'),
                        'description': clean_text(row.get('description', '')),
                        'how_to_use': clean_text(row.get('how_to_use', '')),
                        'ingredients_text': extract_ingredients(row.get('ingredients', '')),
                        'image_url': get_image_url(row),  # Now returns placeholder if no image
                        'source': 'cult_beauty',
                        'external_id': clean_text(row.get('sku', '')),
                        'sku': clean_text(row.get('sku', '')),
                        'upc': clean_text(row.get('upc', '')),
                        'asin': clean_text(row.get('asin', '')),
                        'availability': row.get('availability', 'in_stock'),
                        'highlights': parse_highlights(row.get('highlights', '')),
                        'rating': 0.0,
                        'reviews_count': 0,
                    }
                    
                    cult_products.append(product)
                    cult_products_by_key[f"{normalize_string(product_name)}_{normalize_string(brand_name)}"] = product
                    stats['cult_loaded'] += 1
                    
                except Exception as e:
                    stats['errors'] += 1
                    print(f"   ⚠️ Error processing Cult Beauty row: {e}")
                    continue
        
        print(f"   ✅ Loaded {stats['cult_loaded']} Cult Beauty products")
        
        # ----------------------------------------------------
        # Step 2: Load Sephora Products
        # ----------------------------------------------------
        print("\n📂 Loading Sephora products...")
        
        sephora_products = []
        
        if SEPHORA_PRODUCTS_CSV.exists():
            with open(SEPHORA_PRODUCTS_CSV, 'r', encoding='utf-8') as f:
                sample = f.read(1024)
                f.seek(0)
                sniffer = csv.Sniffer()
                delimiter = sniffer.sniff(sample).delimiter
                
                reader = csv.DictReader(f, delimiter=delimiter)
                
                for row in reader:
                    try:
                        product_name = clean_text(row.get('product_name', ''))
                        brand_name = clean_text(row.get('brand_name', ''))
                        
                        if not product_name or not brand_name:
                            continue
                        
                        product = {
                            'name': product_name,
                            'brand': brand_name,
                            'category': clean_text(row.get('primary_category', '')),
                            'sub_category': clean_text(row.get('secondary_category', '')),
                            'sub_category_2': clean_text(row.get('tertiary_category', '')),
                            'price': parse_price(row.get('price_usd', '')),
                            'currency': 'USD',
                            'description': clean_text(row.get('description', '')),
                            'ingredients_text': extract_ingredients(row.get('ingredients', '')),
                            'image_url': PLACEHOLDER_IMAGE,  # Sephora products get placeholder
                            'source': 'sephora',
                            'external_id': clean_text(row.get('product_id', '')),
                            'sku': None,
                            'upc': None,
                            'asin': None,
                            'availability': 'in_stock',
                            'highlights': parse_highlights(row.get('highlights', '')),
                            'rating': float(row.get('rating', 0) or 0),
                            'reviews_count': int(row.get('reviews', 0) or 0),
                        }
                        
                        sephora_products.append(product)
                        stats['sephora_loaded'] += 1
                        
                    except Exception as e:
                        stats['errors'] += 1
                        print(f"   ⚠️ Error processing Sephora row: {e}")
                        continue
        else:
            print(f"   ⚠️ Sephora CSV not found: {SEPHORA_PRODUCTS_CSV}")
            print("   Continuing with Cult Beauty products only...")
        
        print(f"   ✅ Loaded {stats['sephora_loaded']} Sephora products")
        
        # ----------------------------------------------------
        # Step 3: Merge and Prepare for Database
        # ----------------------------------------------------
        print("\n🔄 Merging products...")
        
        products_to_insert = []
        
        # First, add all Cult Beauty products
        for cult_product in cult_products:
            products_to_insert.append(cult_product)
            stats['new_cult'] += 1
        
        # Then, add Sephora products that don't exist in Cult Beauty
        # or merge ratings with existing Cult Beauty products
        for sephora_product in sephora_products:
            matching_cult = find_matching_product(sephora_product, cult_products_by_key)
            
            if matching_cult:
                # Merge: Keep Cult Beauty image, add Sephora rating/reviews
                if sephora_product['rating'] > matching_cult['rating']:
                    matching_cult['rating'] = sephora_product['rating']
                if sephora_product['reviews_count'] > matching_cult['reviews_count']:
                    matching_cult['reviews_count'] = sephora_product['reviews_count']
                matching_cult['source'] = 'merged'
                stats['merged'] += 1
            else:
                # New Sephora product
                products_to_insert.append(sephora_product)
                stats['new_sephora'] += 1
        
        stats['total'] = len(products_to_insert)
        
        print(f"   ✅ Merged: {stats['merged']} products")
        print(f"   ✅ New Cult Beauty: {stats['new_cult']} products")
        print(f"   ✅ New Sephora: {stats['new_sephora']} products")
        print(f"   ✅ Total to insert: {stats['total']} products")
        
        # ----------------------------------------------------
        # Step 4: Insert into Database
        # ----------------------------------------------------
        print("\n💾 Inserting products into database...")
        
        inserted_count = 0
        
        for product_data in products_to_insert:
            try:
                # Check if product already exists
                existing = db.query(Product).filter(
                    Product.name == product_data['name'],
                    Product.brand == product_data['brand']
                ).first()
                
                if existing:
                    # Update existing product
                    for key, value in product_data.items():
                        if value is not None and key in ['rating', 'reviews_count', 'price', 'description', 'ingredients_text', 'image_url', 'highlights', 'availability']:
                            setattr(existing, key, value)
                    existing.source = 'merged'
                    existing.last_updated = datetime.utcnow()
                else:
                    # Create new product
                    new_product = Product(
                        name=product_data['name'],
                        brand=product_data['brand'],
                        category=product_data.get('category'),
                        sub_category=product_data.get('sub_category'),
                        sub_category_2=product_data.get('sub_category_2'),
                        price=product_data.get('price'),
                        currency=product_data.get('currency', 'USD'),
                        rating=product_data.get('rating', 0.0),
                        reviews_count=product_data.get('reviews_count', 0),
                        description=product_data.get('description'),
                        how_to_use=product_data.get('how_to_use'),
                        ingredients_text=product_data.get('ingredients_text'),
                        image_url=product_data.get('image_url', PLACEHOLDER_IMAGE),
                        source=product_data.get('source', 'cult_beauty'),
                        external_id=product_data.get('external_id'),
                        sku=product_data.get('sku'),
                        upc=product_data.get('upc'),
                        asin=product_data.get('asin'),
                        availability=product_data.get('availability', 'in_stock'),
                        highlights=product_data.get('highlights', []),
                    )
                    db.add(new_product)
                
                inserted_count += 1
                
                if inserted_count % 100 == 0:
                    print(f"   ... processed {inserted_count} products")
                    db.commit()
                
            except Exception as e:
                stats['errors'] += 1
                print(f"   ⚠️ Error inserting product '{product_data.get('name', '')}': {e}")
                db.rollback()
                continue
        
        # Final commit
        db.commit()
        
        # ----------------------------------------------------
        # Step 5: Summary
        # ----------------------------------------------------
        print("\n" + "=" * 70)
        print("📊 SEED SUMMARY")
        print("=" * 70)
        print(f"   Cult Beauty products loaded:   {stats['cult_loaded']}")
        print(f"   Sephora products loaded:      {stats['sephora_loaded']}")
        print(f"   Merged products:              {stats['merged']}")
        print(f"   New Cult Beauty products:     {stats['new_cult']}")
        print(f"   New Sephora products:         {stats['new_sephora']}")
        print(f"   Total products in database:   {stats['total']}")
        print(f"   Errors:                       {stats['errors']}")
        print("=" * 70)
        
        # Verify count
        total_in_db = db.query(Product).count()
        print(f"\n✅ Total products in database: {total_in_db}")
        
        # Count products with images (real or placeholder)
        products_with_images = db.query(Product).filter(Product.image_url.isnot(None)).count()
        print(f"📸 Products with images (including placeholders): {products_with_images}")
        
        # Count products with real images (not placeholder)
        real_images = db.query(Product).filter(Product.image_url != PLACEHOLDER_IMAGE).count()
        print(f"📸 Products with REAL images: {real_images}")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error seeding products: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# ============================================================
# RUN THE SEED
# ============================================================

if __name__ == "__main__":
    seed_products()