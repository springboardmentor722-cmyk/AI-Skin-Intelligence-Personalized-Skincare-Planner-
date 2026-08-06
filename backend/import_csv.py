import pandas as pd

from database import SessionLocal
from models import Product, Ingredient, ProductIngredient

db = SessionLocal()

print("Reading CSV files...")

products_df = pd.read_csv("product_info.csv")
ingredients_df = pd.read_csv("ingredient.csv")

print("Importing Products...")

product_map = {}

for _, row in products_df.iterrows():
    # Extract highlights
    highlights_raw = row.get("highlights", "")
    skin_types = []
    benefits = []
    if pd.notna(highlights_raw):
        try:
            import ast
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
            import ast
            ing_list = ast.literal_eval(ing_raw)
            if ing_list:
                main_ing = ", ".join(ing_list[:3])
        except Exception:
            main_ing = str(ing_raw)

    product = Product(
        product_name=str(row.get("product_name", "")),
        brand=str(row.get("brand_name", "")),
        category=str(row.get("primary_category", "")),
        skin_type=", ".join(skin_types) if skin_types else "All",
        main_ingredient=main_ing[:250],
        benefit=", ".join(benefits) if benefits else "General Skincare",
        price=float(row.get("price_usd", 0) or 0),
        rating=float(row.get("rating", 0) or 0),
    )

    db.add(product)
    db.flush()

    product_map[product.product_name] = product.id

db.commit()

print("Products Imported!")

print("Importing Ingredients...")

ingredient_map = {}

for _, row in ingredients_df.iterrows():

    ingredient_name = str(row.get("Ingredient name", "")).strip()

    ingredient = (
        db.query(Ingredient)
        .filter(Ingredient.ingredient_name == ingredient_name)
        .first()
    )

    if ingredient is None:

        ingredient = Ingredient(
    ingredient_name=ingredient_name,
    description=str(row.get("what-it-does", "")),
    benefits=str(row.get("what-it-does", "")),
)

        db.add(ingredient)
        db.flush()

    ingredient_map[ingredient_name] = ingredient.id

db.commit()

print("Ingredients Imported!")

print("Creating Product-Ingredient Mapping...")

for _, row in ingredients_df.iterrows():

    product_name = str(row.get("Product Name", "")).strip()
    ingredient_name = str(row.get("Ingredient name", "")).strip()

    if (
        product_name in product_map
        and ingredient_name in ingredient_map
    ):

        exists = (
            db.query(ProductIngredient)
            .filter(
                ProductIngredient.product_id == product_map[product_name],
                ProductIngredient.ingredient_id == ingredient_map[ingredient_name],
            )
            .first()
        )

        if not exists:

            db.add(
                ProductIngredient(
                    product_id=product_map[product_name],
                    ingredient_id=ingredient_map[ingredient_name],
                )
            )

db.commit()

print("Product-Ingredient Mapping Imported!")

db.close()

print("Everything Imported Successfully!")