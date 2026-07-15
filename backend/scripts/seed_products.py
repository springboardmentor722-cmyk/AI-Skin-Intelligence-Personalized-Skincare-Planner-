import asyncio
import sys
import os
import csv
from pathlib import Path

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session_maker
from app.models.product import Product

async def seed_products():
    print("Seeding Kaggle Sephora Product Dataset...")
    
    # Path to the dataset the user uploaded
    dataset_path = Path(__file__).parent.parent.parent / "database" / "datasets" / "product dataset" / "product_info.csv"
    
    if not dataset_path.exists():
        print(f"Error: Dataset not found at {dataset_path}")
        return

    # Use bulk insert logic
    async with async_session_maker() as session:
        # We process a sample subset for seeding speed (first 100 rows)
        count = 0
        with open(dataset_path, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if count >= 100:
                    break
                
                # Kaggle Sephora Dataset usually has: product_id, product_name, brand_name, ingredients
                product = Product(
                    name=row.get('product_name', 'Unknown Product'),
                    brand=row.get('brand_name', 'Unknown Brand'),
                    category=row.get('primary_category', 'Skincare'),
                    ingredients_text=row.get('ingredients', ''),
                    price=float(row.get('price_usd', 0.0)) if row.get('price_usd') else 0.0,
                    image_url=row.get('image_url', '')
                )
                session.add(product)
                count += 1
                
        await session.commit()
    print(f"Successfully seeded {count} products from Kaggle dataset.")

if __name__ == "__main__":
    asyncio.run(seed_products())
