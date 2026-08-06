import csv
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    host="localhost",
    database="ai_skincare_db",
    user="postgres",
    password="admin123",
    port=5432
)
cur = conn.cursor()

print("🔄 Starting data import...")

# ===== IMPORT INGREDIENTS =====
print("\n📥 Importing Ingredients...")

ingredients_file = r"C:\AI_Skincare_Project\database\datasets\ingredients\ingredientsList.csv"

try:
    with open(ingredients_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        
        data = []
        for row in reader:
            data.append((
                row.get('name', ''),
                row.get('scientific_name', ''),
                row.get('short_description', '')[:500] if row.get('short_description') else '',
                row.get('what_is_it', '')[:500] if row.get('what_is_it') else '',
                row.get('what_does_it_do', '')[:500] if row.get('what_does_it_do') else '',
                row.get('who_is_it_good_for', '')[:500] if row.get('who_is_it_good_for') else '',
                row.get('who_should_avoid', '')[:500] if row.get('who_should_avoid') else '',
                row.get('url', ''),
                datetime.now()
            ))
        
        if data:
            execute_values(
                cur,
                """INSERT INTO ingredients 
                   (name, scientific_name, short_description, what_is_it, what_does_it_do, 
                    who_is_it_good_for, who_should_avoid, url, created_at)
                   VALUES %s
                   ON CONFLICT (name) DO NOTHING""",
                data
            )
            conn.commit()
            print(f"✅ Imported {len(data)} ingredients")
except Exception as e:
    print(f"❌ Error importing ingredients: {str(e)}")
    conn.rollback()

# ===== IMPORT PRODUCTS =====
print("\n📥 Importing Products...")

products_file = r"C:\AI_Skincare_Project\database\datasets\sephora_products\skincare_df.csv"

try:
    with open(products_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        data = []
        for row in reader:
            try:
                # Convert to boolean properly
                clean_product = True if int(row.get('clean_product', 0)) == 1 else False
                cat_anti_aging = True if int(row.get('category_Anti-Aging', 0)) == 1 else False
                cat_moisturizer = True if int(row.get('category_Moisturizers', 0)) == 1 else False
                cat_face_wash = True if int(row.get('category_Face_Wash_&_Cleansers', 0)) == 1 else False
                cat_serums = True if int(row.get('category_Face_Serums', 0)) == 1 else False
                cat_masks = True if int(row.get('category_Face_Masks', 0)) == 1 else False
                cat_eye_cream = True if int(row.get('category_Eye_Creams_&_Treatments', 0)) == 1 else False
                cat_sunscreen = True if int(row.get('category_Face_Sunscreen', 0)) == 1 else False
                cat_exfoliators = True if int(row.get('category_Exfoliators', 0)) == 1 else False
                cat_toners = True if int(row.get('category_Toners', 0)) == 1 else False
                cat_oils = True if int(row.get('category_Face_Oils', 0)) == 1 else False
                
                data.append((
                    row.get('brand', '')[:255],
                    row.get('name', '')[:500],
                    float(row.get('price', 0)) if row.get('price') else 0,
                    int(row.get('n_of_reviews', 0)) if row.get('n_of_reviews') else 0,
                    int(row.get('n_of_loves', 0)) if row.get('n_of_loves') else 0,
                    float(row.get('review_score', 0)) if row.get('review_score') else 0,
                    row.get('size', '')[:50],
                    clean_product,
                    cat_anti_aging,
                    cat_moisturizer,
                    cat_face_wash,
                    cat_serums,
                    cat_masks,
                    cat_eye_cream,
                    cat_sunscreen,
                    cat_exfoliators,
                    cat_toners,
                    cat_oils,
                    float(row.get('reviews_to_loves_ratio', 0)) if row.get('reviews_to_loves_ratio') else 0,
                    float(row.get('return_on_reviews', 0)) if row.get('return_on_reviews') else 0,
                    float(row.get('price_per_ounce', 0)) if row.get('price_per_ounce') else 0,
                    datetime.now()
                ))
            except Exception as row_error:
                continue
        
        if data:
            execute_values(
                cur,
                """INSERT INTO products 
                   (brand, name, price, n_of_reviews, n_of_loves, review_score, size, 
                    clean_product, category_anti_aging, category_moisturizer, category_face_wash,
                    category_serums, category_masks, category_eye_cream, category_sunscreen,
                    category_exfoliators, category_toners, category_oils, reviews_to_loves_ratio,
                    return_on_reviews, price_per_ounce, created_at)
                   VALUES %s""",
                data
            )
            conn.commit()
            print(f"✅ Imported {len(data)} products")
except Exception as e:
    print(f"❌ Error importing products: {str(e)}")
    conn.rollback()

# ===== SUMMARY =====
cur.execute("SELECT COUNT(*) FROM ingredients")
ingredient_count = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM products")
product_count = cur.fetchone()[0]

cur.execute("SELECT COUNT(*) FROM skin_concerns")
concern_count = cur.fetchone()[0]

print("\n" + "="*50)
print("✅ DATA IMPORT COMPLETE!")
print("="*50)
print(f"📊 Ingredients: {ingredient_count}")
print(f"📊 Products: {product_count}")
print(f"📊 Skin Concerns: {concern_count}")
print("="*50)

cur.close()
conn.close()