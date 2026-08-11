from app.database.database import SessionLocal
from app.models.product import Product
from app.models.ingredient import Ingredient

from datasets.products_data import products
from datasets.ingredients_data import ingredients

db = SessionLocal()

# Insert Products
for product in products:

    existing = db.query(Product).filter(
        Product.product_name == product["product_name"]
    ).first()

    if not existing:
        db.add(Product(**product))

# Insert Ingredients
for ingredient in ingredients:

    existing = db.query(Ingredient).filter(
        Ingredient.ingredient_name == ingredient["ingredient_name"]
    ).first()

    if not existing:
        db.add(Ingredient(**ingredient))

db.commit()
db.close()

print("Database populated successfully!")