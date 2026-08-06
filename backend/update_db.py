import pandas as pd
import ast
from database import SessionLocal
from models import Product

def update_products():
    db = SessionLocal()
    try:
        print("Fetching existing products from PostgreSQL...")
        products = db.query(Product).all()
        print(f"Loaded {len(products)} products from database.")
        
        # Build dictionary for fast lookup
        product_dict = {}
        for p in products:
            key = (p.product_name.strip().lower(), (p.brand or "").strip().lower())
            product_dict[key] = p
            
        print("Reading product_info.csv...")
        df = pd.read_csv("product_info.csv")
        
        print("Parsing csv and updating in-memory products...")
        updated_count = 0
        for _, row in df.iterrows():
            name = str(row.get("product_name", "")).strip().lower()
            brand = str(row.get("brand_name", "")).strip().lower()
            
            key = (name, brand)
            if key in product_dict:
                product = product_dict[key]
                
                # Extract highlights
                highlights_raw = row.get("highlights", "")
                skin_types = []
                benefits = []
                if pd.notna(highlights_raw):
                    try:
                        highlights_list = ast.literal_eval(highlights_raw)
                        for h in highlights_list:
                            if "Best for" in h or "Skin" in h:
                                st = h.replace("Best for ", "").replace(" Skin", "").strip()
                                skin_types.append(st)
                            if h.startswith("Good for:"):
                                b = h.replace("Good for:", "").strip()
                                benefits.append(b)
                    except Exception:
                        pass
                
                # Extract ingredients
                ing_raw = row.get("ingredients", "")
                main_ing = ""
                if pd.notna(ing_raw):
                    try:
                        ing_list = ast.literal_eval(ing_raw)
                        if ing_list:
                            main_ing = ", ".join(ing_list[:3])
                    except Exception:
                        main_ing = str(ing_raw)
                
                product.skin_type = ", ".join(skin_types) if skin_types else "All"
                product.benefit = ", ".join(benefits) if benefits else "General Skincare"
                product.main_ingredient = main_ing[:250]
                product.rating = float(row.get("rating", 0) or 0)
                
                updated_count += 1
                
        print(f"Committing changes to PostgreSQL for {updated_count} products...")
        db.commit()
        print("Database updated successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error occurred: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_products()
