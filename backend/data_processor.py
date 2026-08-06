import pandas as pd
import os
from pathlib import Path

# Define paths
BASE_PATH = Path(__file__).parent
DATASETS_PATH = BASE_PATH.parent / "database" / "datasets"

print("=" * 60)
print("DATA PROCESSING SCRIPT FOR AI SKINCARE PROJECT")
print("=" * 60)

# ====== 1. PROCESS SKIN CONCERNS (from folder names) ======
print("\n1. Processing Skin Concerns...")

skin_concerns = [
    "Acne",
    "Actinic Keratosis",
    "Benign Tumors",
    "Bullous",
    "Candidiasis",
    "Drug Eruption",
    "Eczema",
    "Infestations and Bites",
    "Lichen",
    "Lupus",
    "Moles",
    "Psoriasis",
    "Rosacea",
    "Seborrheic Keratoses",
    "Skin Cancer",
    "Sun and Sunlight Damage",
    "Tinea",
    "Normal Skin",
    "Vascular Tumors",
    "Vasculitis",
    "Vitiligo"
]

skin_concerns_df = pd.DataFrame({
    'concern_name': skin_concerns,
    'description': [f"Medical skin condition: {concern}" for concern in skin_concerns],
    'severity_level': ['Moderate'] * len(skin_concerns)
})

# Save skin concerns
skin_concerns_df.to_csv(BASE_PATH / "skin_concerns_import.csv", index=False)
print(f"✅ Skin Concerns: {len(skin_concerns_df)} records created")

# ====== 2. PROCESS INGREDIENTS ======
print("\n2. Processing Ingredients...")

try:
    # Exact path for ingredients CSV
    ingredients_path = DATASETS_PATH / "ingredients" / "ingredientsList.csv"
    
    if not ingredients_path.exists():
        print(f"❌ File not found at: {ingredients_path}")
    else:
        print(f"📂 Reading: {ingredients_path.name}")
        
        ingredients_raw = pd.read_csv(ingredients_path)
        
        print(f"   Columns found: {list(ingredients_raw.columns[:6])}")
        
        # Map columns
        ingredients_processed = pd.DataFrame({
            'ingredient_name': ingredients_raw.iloc[:, 0],  # First column = name
            'inci_name': ingredients_raw.iloc[:, 1] if len(ingredients_raw.columns) > 1 else '',
            'category': ingredients_raw.iloc[:, 3] if len(ingredients_raw.columns) > 3 else '',
            'benefits': ingredients_raw.iloc[:, 4] if len(ingredients_raw.columns) > 4 else '',
            'skin_type_suitable': ingredients_raw.iloc[:, 5] if len(ingredients_raw.columns) > 5 else '',
            'safety_rating': 'Safe'
        })
        
        # Remove duplicates
        ingredients_processed = ingredients_processed.drop_duplicates(subset=['ingredient_name'])
        ingredients_processed = ingredients_processed.dropna(subset=['ingredient_name'])
        
        # Save
        ingredients_processed.to_csv(BASE_PATH / "ingredients_import.csv", index=False)
        print(f"✅ Ingredients: {len(ingredients_processed)} records created")
        
except Exception as e:
    print(f"❌ Error processing ingredients: {e}")

# ====== 3. PROCESS PRODUCTS (Sephora) ======
print("\n3. Processing Products...")

try:
    # Exact path for skincare products CSV
    products_path = DATASETS_PATH / "sephora_products" / "skincare_df.csv"
    
    if not products_path.exists():
        print(f"❌ File not found at: {products_path}")
    else:
        print(f"📂 Reading: {products_path.name}")
        
        products_raw = pd.read_csv(products_path)
        
        print(f"   Found {len(products_raw)} products")
        print(f"   Columns: {list(products_raw.columns[:5])}")
        
        # Extract category from binary columns
        category_cols = [col for col in products_raw.columns if col.startswith('category_')]
        
        if category_cols:
            products_raw['product_category'] = products_raw[category_cols].idxmax(axis=1).str.replace('category_', '')
        else:
            products_raw['product_category'] = 'Skincare'
        
        # Map columns
        products_processed = pd.DataFrame({
            'product_name': products_raw['name'],
            'brand_name': products_raw['brand'],
            'product_category': products_raw['product_category'],
            'price': products_raw['price'],
            'product_image_url': 'https://via.placeholder.com/300x300?text=' + products_raw['name'].str.replace(' ', '+').str[:30],
            'product_description': products_raw['name'] + ' by ' + products_raw['brand'],
            'rating': products_raw['review_score'],
            'suitable_for_skin_type': 'All types'
        })
        
        # Remove rows with missing critical data
        products_processed = products_processed.dropna(subset=['product_name', 'brand_name'])
        
        # Save
        products_processed.to_csv(BASE_PATH / "products_import.csv", index=False)
        print(f"✅ Products: {len(products_processed)} records created")
        
except Exception as e:
    print(f"❌ Error processing products: {e}")

# ====== SUMMARY ======
print("\n" + "=" * 60)
print("PROCESSING COMPLETE!")
print("=" * 60)
print("\n📁 CSV files created in: C:\\AI_Skincare_Project\\backend\\")
print("   - skin_concerns_import.csv")
print("   - ingredients_import.csv")
print("   - products_import.csv")
print("\n✅ Ready to import to PostgreSQL!")
print("=" * 60)