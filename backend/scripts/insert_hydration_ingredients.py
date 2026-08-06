import os
import sys

sys.path.append(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

from app.database import SessionLocal
from app.models import Ingredient

db = SessionLocal()

ingredients = [
    {
        "ingredient_name": "Hyaluronic Acid",
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "Dry, Normal, Combination",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Attracts and retains moisture in the skin."
    },
    {
        "ingredient_name": "Glycerin",
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "All",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Draws water into the skin and improves moisture."
    },
    {
        "ingredient_name": "Ceramide",
        "category": "Barrier Repair",
        "benefits": "Barrier Repair, Hydration",
        "suitable_skin_types": "Dry, Sensitive",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Strengthens the skin barrier and prevents moisture loss."
    },
    {
        "ingredient_name": "Panthenol",
        "category": "Vitamin B5",
        "benefits": "Healing, Hydration",
        "suitable_skin_types": "Sensitive, Dry",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Soothes irritated skin and improves hydration."
    },
    {
        "ingredient_name": "Squalane",
        "category": "Emollient",
        "benefits": "Moisturizing",
        "suitable_skin_types": "Dry, Sensitive",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Lightweight moisturizer that restores skin softness."
    },
    {
        "ingredient_name": "Urea",
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "Dry",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Improves moisture retention and softens rough skin."
    },
    {
        "ingredient_name": "Sodium PCA",
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "All",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Natural moisturizing factor that keeps skin hydrated."
    },
    {
        "ingredient_name": "Betaine",
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "All",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Balances skin moisture and reduces irritation."
    },
    {
        "ingredient_name": "Aloe Vera",
        "category": "Botanical",
        "benefits": "Hydration, Soothing",
        "suitable_skin_types": "Sensitive, Dry",
        "skin_concerns": "Dryness, Redness",
        "irritation_level": "Low",
        "description": "Natural soothing ingredient that calms irritated skin."
    },
    {
        "ingredient_name": "Allantoin",
        "category": "Skin Protectant",
        "benefits": "Healing, Soothing",
        "suitable_skin_types": "Sensitive",
        "skin_concerns": "Irritation",
        "irritation_level": "Low",
        "description": "Promotes skin healing and reduces irritation."
    },
]

count = 0

for data in ingredients:

    existing = (
        db.query(Ingredient)
        .filter(
            Ingredient.ingredient_name == data["ingredient_name"]
        )
        .first()
    )

    if existing:
        continue

    ingredient = Ingredient(**data)

    db.add(ingredient)

    count += 1

db.commit()

print(f"✅ {count} hydration ingredients inserted successfully!")