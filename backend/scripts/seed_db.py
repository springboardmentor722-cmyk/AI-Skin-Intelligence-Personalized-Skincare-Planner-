import os
import sys

# Add the backend directory to python path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal, engine
from app.db.base import Base
from app.models.product import Product, Ingredient
from app.models.role import Role

def seed_database():
    # Make sure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Create Roles
        roles_to_create = ["User", "Skincare Consultant", "Dermatologist", "Administrator"]
        for role_name in roles_to_create:
            existing_role = db.query(Role).filter(Role.name == role_name).first()
            if not existing_role:
                new_role = Role(name=role_name, description=f"{role_name} access role")
                db.add(new_role)
        
        db.commit()

        # Check if we already have data
        if db.query(Product).count() > 0:
            print("Database already seeded with products.")
            return

        print("Seeding database with skincare products and ingredients...")

        # Create Ingredients
        ing_ha = Ingredient(name="Hyaluronic Acid", benefits="Intense hydration, plumps skin", concerns_targeted="Dryness, Fine lines")
        ing_vitc = Ingredient(name="Vitamin C", benefits="Brightens skin, antioxidant protection", concerns_targeted="Dullness, Uneven tone")
        ing_nio = Ingredient(name="Niacinamide", benefits="Reduces redness, regulates oil", concerns_targeted="Redness, Large pores")
        ing_ret = Ingredient(name="Retinol", benefits="Increases cell turnover, anti-aging", concerns_targeted="Wrinkles, Texture")
        ing_sa = Ingredient(name="Salicylic Acid", benefits="Exfoliates inside pores", concerns_targeted="Acne, Blackheads")
        ing_cer = Ingredient(name="Ceramides", benefits="Restores skin barrier", concerns_targeted="Dryness, Sensitivity")
        
        # Create Products
        prod_cleanser = Product(
            name="Gentle Hydrating Cleanser",
            brand="AI Skincare",
            product_type="Cleanser",
            description="A non-foaming cleanser that removes dirt without stripping the skin barrier.",
            skin_types="Dry, Normal, Sensitive"
        )
        prod_cleanser.ingredients.extend([ing_cer, ing_ha])
        
        prod_serum = Product(
            name="Brightening Vitamin C Serum",
            brand="AI Skincare",
            product_type="Serum",
            description="A potent antioxidant serum to brighten and protect.",
            skin_types="All"
        )
        prod_serum.ingredients.append(ing_vitc)
        
        prod_moisturizer = Product(
            name="Barrier Repair Cream",
            brand="AI Skincare",
            product_type="Moisturizer",
            description="A rich cream to repair and protect the skin barrier overnight.",
            skin_types="Dry, Sensitive"
        )
        prod_moisturizer.ingredients.extend([ing_cer, ing_nio])

        prod_treatment = Product(
            name="BHA Pore Minimizer",
            brand="AI Skincare",
            product_type="Treatment",
            description="Exfoliating liquid to clear pores and reduce breakouts.",
            skin_types="Oily, Combination"
        )
        prod_treatment.ingredients.append(ing_sa)
        
        prod_night = Product(
            name="Renewing Retinol Cream",
            brand="AI Skincare",
            product_type="Treatment",
            description="Overnight anti-aging treatment.",
            skin_types="Normal, Oily, Combination"
        )
        prod_night.ingredients.append(ing_ret)

        # Add to session
        db.add_all([prod_cleanser, prod_serum, prod_moisturizer, prod_treatment, prod_night])
        
        # Commit
        db.commit()
        print("Successfully seeded the database!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
