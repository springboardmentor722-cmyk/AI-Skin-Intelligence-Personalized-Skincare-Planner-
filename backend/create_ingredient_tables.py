# backend/create_ingredient_tables.py

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import engine
from sqlalchemy import inspect, text

def create_tables():
    print("=" * 60)
    print("🔧 CREATING INGREDIENT TABLES")
    print("=" * 60)
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    print(f"\n📊 Existing tables: {len(existing_tables)}")
    
    with engine.connect() as conn:
        # Check if ingredients_master exists
        if 'ingredients_master' not in existing_tables:
            print("\n📝 Creating ingredients_master table...")
            conn.execute(text("""
                CREATE TABLE ingredients_master (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL UNIQUE,
                    comedogenicity VARCHAR,
                    irritancy VARCHAR,
                    functions JSONB DEFAULT '[]',
                    rating VARCHAR,
                    category VARCHAR,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """))
            conn.commit()
            print("   ✅ ingredients_master created")
        else:
            print("   ✅ ingredients_master already exists")
        
        # Check if product_ingredients exists
        if 'product_ingredients' not in existing_tables:
            print("\n📝 Creating product_ingredients table...")
            conn.execute(text("""
                CREATE TABLE product_ingredients (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                    ingredient_id INTEGER NOT NULL REFERENCES ingredients_master(id) ON DELETE CASCADE,
                    position INTEGER DEFAULT 0
                )
            """))
            conn.commit()
            print("   ✅ product_ingredients created")
        else:
            print("   ✅ product_ingredients already exists")
    
    # Verify
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"\n📊 Tables now: {len(tables)}")
    for t in sorted(tables):
        print(f"  - {t}")
    
    print("\n" + "=" * 60)
    print("✅ DONE!")
    print("=" * 60)

if __name__ == "__main__":
    create_tables()