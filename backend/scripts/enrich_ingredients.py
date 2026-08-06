from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Ingredient

db: Session = SessionLocal()

updates = {
    "Niacinamide": {
        "category": "Active Ingredient",
        "benefits": "Oil Control, Brightening",
        "suitable_skin_types": "Oily, Combination",
        "skin_concerns": "Acne, Pigmentation",
        "irritation_level": "Low",
        "description": "Reduces excess oil, improves skin tone and strengthens the skin barrier."
    },

    "Salicylic Acid": {
        "category": "BHA",
        "benefits": "Exfoliation, Acne Treatment",
        "suitable_skin_types": "Oily",
        "skin_concerns": "Acne",
        "irritation_level": "Medium",
        "description": "Penetrates pores and helps reduce acne."
    },

    "Hyaluronic Acid": {
        "category": "Humectant",
        "benefits": "Hydration",
        "suitable_skin_types": "Dry, Normal, Combination",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Attracts and retains moisture in the skin."
    },

    "Ceramide": {
        "category": "Barrier Repair",
        "benefits": "Hydration, Barrier Repair",
        "suitable_skin_types": "Dry, Sensitive",
        "skin_concerns": "Dryness",
        "irritation_level": "Low",
        "description": "Strengthens the skin barrier and prevents moisture loss."
    }
}

for ingredient in ingredients:

    ingredient = clean_ingredient(ingredient)

    # existing database insert code continues here...

    if ingredient.ingredient_name in updates:

        data = updates[ingredient.ingredient_name]

        ingredient.category = data["category"]
        ingredient.benefits = data["benefits"]
        ingredient.suitable_skin_types = data["suitable_skin_types"]
        ingredient.skin_concerns = data["skin_concerns"]
        ingredient.irritation_level = data["irritation_level"]
        ingredient.description = data["description"]

db.commit()

print("Ingredient enrichment completed.")