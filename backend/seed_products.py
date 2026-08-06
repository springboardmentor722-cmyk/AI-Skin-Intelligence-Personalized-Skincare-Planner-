import pandas as pd
from database import SessionLocal
from models import Product

db = SessionLocal()

# Read CSV
df = pd.read_csv("product_info.csv")

count = 0

for _, row in df.iterrows():
    product = Product(
        product_name=str(row["product_name"]),
        brand=str(row["brand_name"]),
        skin_type="All",
        category="Skincare",
        main_ingredient=str(row["ingredients"])[:250],
        benefit="General Skincare",
        price=float(row["price_usd"]) if pd.notna(row["price_usd"]) else 0
    )

    db.add(product)
    count += 1

db.commit()
db.close()

print(f"{count} products imported successfully!")