import os
import sys
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from sqlalchemy import create_engine
import json

# Add parent directory to path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.base import Base
from app.models.product import Ingredient
from app.core.config import settings

def seed():
    engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
    
    # Define our intelligence ingredients
    ingredients_data = [
        { 
            "name": 'Retinoids', 
            "category": 'Anti-Aging', 
            "base_conflicts": json.dumps(['AHAs/BHAs', 'Vitamin C (use alternate times)']), 
            "description": 'Accelerates cell turnover, fades spots, and boosts collagen.', 
            "allergy_triggers": json.dumps(['sensitive skin', 'dry skin', 'eczema', 'rosacea'])
        },
        { 
            "name": 'Niacinamide', 
            "category": 'Brightening / Barrier Repair', 
            "base_conflicts": json.dumps(['None (highly compatible)']), 
            "description": 'Improves skin barrier, regulates sebum, and fades hyperpigmentation.', 
            "allergy_triggers": json.dumps([]) 
        },
        { 
            "name": 'Vitamin C', 
            "category": 'Antioxidant', 
            "base_conflicts": json.dumps(['Retinoids', 'Benzoyl Peroxide']), 
            "description": 'Brightens skin tone and protects against environmental damage.', 
            "allergy_triggers": json.dumps(['sensitive skin']) 
        },
        { 
            "name": 'Hyaluronic Acid', 
            "category": 'Hydration', 
            "base_conflicts": json.dumps(['None']), 
            "description": 'Draws moisture into the skin for a plump, hydrated look.', 
            "allergy_triggers": json.dumps([]) 
        },
        { 
            "name": 'Salicylic Acid', 
            "category": 'Exfoliation', 
            "base_conflicts": json.dumps(['Retinoids']), 
            "description": 'Oil-soluble BHA that penetrates pores to clear acne.', 
            "allergy_triggers": json.dumps(['dry skin', 'sensitive skin', 'salicylate allergy']) 
        },
        { 
            "name": 'Ceramides', 
            "category": 'Barrier Repair', 
            "base_conflicts": json.dumps(['None']), 
            "description": 'Lipids that help form the skin barrier and retain moisture.', 
            "allergy_triggers": json.dumps([]) 
        },
        { 
            "name": 'Peptides', 
            "category": 'Anti-Aging', 
            "base_conflicts": json.dumps(['AHAs/BHAs (can destabilize)']), 
            "description": 'Amino acids that build collagen and elastin.', 
            "allergy_triggers": json.dumps([]) 
        },
        { 
            "name": 'AHAs/BHAs', 
            "category": 'Exfoliation', 
            "base_conflicts": json.dumps(['Retinoids', 'Peptides']), 
            "description": 'Chemical exfoliants that slough off dead skin.', 
            "allergy_triggers": json.dumps(['sensitive skin', 'rosacea', 'eczema']) 
        }
    ]

    with Session(engine) as db:
        print("Seeding Ingredient Intelligence data...")
        for data in ingredients_data:
            existing = db.query(Ingredient).filter(Ingredient.name == data["name"]).first()
            if existing:
                print(f"Updating existing ingredient: {data['name']}")
                existing.category = data["category"]
                existing.description = data["description"]
                existing.base_conflicts = data["base_conflicts"]
                existing.allergy_triggers = data["allergy_triggers"]
            else:
                print(f"Adding new ingredient: {data['name']}")
                ingredient = Ingredient(
                    name=data["name"],
                    category=data["category"],
                    description=data["description"],
                    base_conflicts=data["base_conflicts"],
                    allergy_triggers=data["allergy_triggers"]
                )
                db.add(ingredient)
        
        db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    seed()
