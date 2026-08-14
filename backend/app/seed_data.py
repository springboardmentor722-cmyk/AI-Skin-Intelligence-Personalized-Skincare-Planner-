"""
Run this once after first starting the backend to populate a baseline
ingredient/product catalog and a default admin account:

    python -m app.seed_data
"""
from .database import SessionLocal, engine, Base
from . import models, security

Base.metadata.create_all(bind=engine)

INGREDIENTS = [
    dict(name="Niacinamide", category="Niacinamide",
         description="Reduces oil production, minimizes pores, calms inflammation.",
         benefits=["oil control", "pore appearance", "anti-inflammatory"],
         good_for_concerns=["acne", "oily_skin", "redness", "uneven_skin_tone"],
         good_for_skin_types=["oily", "combination", "normal"],
         cautions=[], conflicts_with=["Vitamin C (pure L-ascorbic acid, low pH)"]),
    dict(name="Vitamin C", category="Vitamin C",
         description="Antioxidant that brightens skin and fades dark spots.",
         benefits=["brightening", "antioxidant", "collagen support"],
         good_for_concerns=["hyperpigmentation", "dark_spots", "uneven_skin_tone", "wrinkles"],
         good_for_skin_types=["normal", "dry", "combination"],
         cautions=["can irritate very sensitive skin"], conflicts_with=["Niacinamide"]),
    dict(name="Hyaluronic Acid", category="Hyaluronic Acid",
         description="Humectant that draws moisture into the skin.",
         benefits=["hydration", "plumping"],
         good_for_concerns=["dry_skin", "fine_lines", "wrinkles"],
         good_for_skin_types=["dry", "normal", "combination", "oily", "sensitive"],
         cautions=[], conflicts_with=[]),
    dict(name="Salicylic Acid", category="AHAs/BHAs",
         description="Oil-soluble exfoliant that unclogs pores, ideal for acne.",
         benefits=["exfoliation", "pore clearing", "acne control"],
         good_for_concerns=["acne", "oily_skin"],
         good_for_skin_types=["oily", "combination"],
         cautions=["avoid combining with retinoids on the same night"],
         conflicts_with=["Retinol"]),
    dict(name="Retinol", category="Retinoids",
         description="Vitamin A derivative that boosts cell turnover and collagen.",
         benefits=["anti-aging", "acne control", "texture improvement"],
         good_for_concerns=["wrinkles", "fine_lines", "acne", "uneven_skin_tone"],
         good_for_skin_types=["normal", "oily", "combination"],
         cautions=["not for pregnancy", "start slow for sensitive skin", "increases sun sensitivity"],
         conflicts_with=["Salicylic Acid", "Vitamin C"]),
    dict(name="Ceramides", category="Ceramides",
         description="Lipids that restore and strengthen the skin barrier.",
         benefits=["barrier repair", "moisture retention"],
         good_for_concerns=["dry_skin", "sensitive_skin", "redness"],
         good_for_skin_types=["dry", "sensitive", "normal"],
         cautions=[], conflicts_with=[]),
    dict(name="Peptides", category="Peptides",
         description="Amino acid chains that signal collagen production.",
         benefits=["anti-aging", "firmness"],
         good_for_concerns=["wrinkles", "fine_lines"],
         good_for_skin_types=["normal", "dry", "combination"],
         cautions=[], conflicts_with=[]),
]

import csv
import os

def load_products_from_csv():
    csv_path = os.path.join(os.path.dirname(__file__), "data", "skincare_catalog.csv")
    products = []
    if not os.path.exists(csv_path):
        return products
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            row['price'] = float(row['price'])
            row['key_ingredients'] = [i.strip() for i in row['key_ingredients'].split(',') if i.strip()]
            row['suitable_skin_types'] = [i.strip() for i in row['suitable_skin_types'].split(',') if i.strip()]
            row['suitable_concerns'] = [i.strip() for i in row['suitable_concerns'].split(',') if i.strip()]
            products.append(row)
    return products


def seed():
    db = SessionLocal()
    try:
        if not db.query(models.User).filter(models.User.email == "admin@skinintel.com").first():
            admin = models.User(
                name="Platform Admin",
                email="admin@skinintel.com",
                hashed_password=security.hash_password("Admin@123"),
                role=models.RoleEnum.admin,
            )
            db.add(admin)
            print("Created default admin -> email: admin@skinintel.com | password: Admin@123")

        if db.query(models.Ingredient).count() == 0:
            for data in INGREDIENTS:
                db.add(models.Ingredient(**data))
            print(f"Seeded {len(INGREDIENTS)} ingredients.")

        if db.query(models.Product).count() == 0:
            products_from_csv = load_products_from_csv()
            for data in products_from_csv:
                db.add(models.Product(**data))
            print(f"Seeded {len(products_from_csv)} products from CSV.")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
