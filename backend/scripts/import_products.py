import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pandas as pd
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Product

db: Session = SessionLocal()

csv_path = os.path.join(
    os.path.dirname(__file__),
    "..",
    "datasets",
    "indian_products.csv"      # <-- our new dataset
)

df = pd.read_csv(csv_path)

count = 0

for _, row in df.iterrows():

    existing = (
        db.query(Product)
        .filter(Product.product_id == str(row["product_id"]))
        .first()
    )

    if existing:
        continue

    product = Product(

        product_id=str(row["product_id"]),
        product_name=row["product_name"],
        brand_name=row["brand_name"],
        category=row["category"],
        skin_type=row["skin_type"],
        skin_concern=row["skin_concern"],
        ingredients=row["ingredients"],
        description=row["description"],
        usage=row["usage"],
        price=float(row["price"]),
        rating=float(row["rating"]),
        image_url=row["image_url"] if pd.notna(row["image_url"]) else None,
        product_url=row["product_url"],
    )

    try:
        db.add(product)
        db.commit()
        count += 1

    except Exception as e:
        db.rollback()
        print(e)

db.close()

print(f"✅ {count} products imported successfully!")