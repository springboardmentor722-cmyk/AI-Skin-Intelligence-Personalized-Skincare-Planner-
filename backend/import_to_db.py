import pandas as pd
from sqlalchemy import create_engine
from pathlib import Path

# Database connection
DB_USER = "postgres"
DB_PASSWORD = "admin123"  # Change to YOUR postgres password
DB_HOST = "localhost"
DB_PORT = "5432"
DB_NAME = "ai_skincare_db"

# Connection string
connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print("=" * 60)
print("IMPORTING CSV DATA TO PostgreSQL")
print("=" * 60)

try:
    # Create database engine
    engine = create_engine(connection_string)
    
    BASE_PATH = Path(__file__).parent
    
    # ====== 1. Import Skin Concerns ======
    print("\n1. Importing Skin Concerns...")
    try:
        df_concerns = pd.read_csv(BASE_PATH / "skin_concerns_import.csv")
        df_concerns.to_sql('skin_concerns', engine, if_exists='append', index=False)
        print(f"✅ Imported {len(df_concerns)} skin concerns")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # ====== 2. Import Ingredients ======
    print("\n2. Importing Ingredients...")
    try:
        df_ingredients = pd.read_csv(BASE_PATH / "ingredients_import.csv")
        df_ingredients.to_sql('ingredients', engine, if_exists='append', index=False)
        print(f"✅ Imported {len(df_ingredients)} ingredients")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # ====== 3. Import Products ======
    print("\n3. Importing Products...")
    try:
        df_products = pd.read_csv(BASE_PATH / "products_import.csv")
        df_products.to_sql('products', engine, if_exists='append', index=False)
        print(f"✅ Imported {len(df_products)} products")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 60)
    print("✅ ALL DATA IMPORTED SUCCESSFULLY!")
    print("=" * 60)
    
except Exception as e:
    print(f"\n❌ Database Connection Error: {e}")
    print("Make sure PostgreSQL is running and password is correct!")