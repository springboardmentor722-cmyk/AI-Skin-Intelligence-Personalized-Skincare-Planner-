import sys
import os

# Adjust path to import backend modules
sys.path.append(os.path.join(os.path.dirname(__file__), "..", ".."))

from app.database import get_mongo_db

def seed_ingredients_and_conflicts():
    print("[SEED] Connecting to MongoDB...")
    mongo = get_mongo_db()

    # Clear existing
    mongo.ingredients.delete_many({})
    mongo.conflict_matrix.delete_many({})

    # 1. Seed Ingredients
    ingredients_list = [
        {
            "name": "Retinoids",
            "category": "Active",
            "irritation_risk": "high",
            "comedogenic_risk": "low",
            "incompatible_categories": ["AHAs/BHAs", "Benzoyl Peroxide"],
            "target_concerns": ["Aging", "Wrinkles", "Dark Spots"]
        },
        {
            "name": "AHAs/BHAs",
            "category": "Exfoliant",
            "irritation_risk": "high",
            "comedogenic_risk": "low",
            "incompatible_categories": ["Retinoids", "Vitamin C"],
            "target_concerns": ["Acne", "Oiliness", "Dullness"]
        },
        {
            "name": "Vitamin C",
            "category": "Antioxidant",
            "irritation_risk": "medium",
            "comedogenic_risk": "low",
            "incompatible_categories": ["AHAs/BHAs", "Niacinamide"],
            "target_concerns": ["Dullness", "Hyperpigmentation", "Dark Spots"]
        },
        {
            "name": "Niacinamide",
            "category": "Active",
            "irritation_risk": "low",
            "comedogenic_risk": "low",
            "incompatible_categories": ["Vitamin C"],
            "target_concerns": ["Oiliness", "Redness", "Dark Spots"]
        },
        {
            "name": "Hyaluronic Acid",
            "category": "Humectant",
            "irritation_risk": "low",
            "comedogenic_risk": "low",
            "incompatible_categories": [],
            "target_concerns": ["Dryness"]
        },
        {
            "name": "Ceramides",
            "category": "Barrier Repair",
            "irritation_risk": "low",
            "comedogenic_risk": "low",
            "incompatible_categories": [],
            "target_concerns": ["Dryness", "Redness"]
        },
        {
            "name": "Peptides",
            "category": "Barrier Repair",
            "irritation_risk": "low",
            "comedogenic_risk": "low",
            "incompatible_categories": [],
            "target_concerns": ["Aging", "Wrinkles"]
        }
    ]
    
    mongo.ingredients.insert_many(ingredients_list)
    print(f"[SEED] Seeded {len(ingredients_list)} ingredients.")

    # 2. Seed Chemical Conflict Matrix
    conflict_rules = [
        {
            "active_1": "Retinoids",
            "active_2": "AHAs/BHAs",
            "type": "same_step_conflict",
            "severity": "unsafe",
            "reason": "Retinoids and strong AHAs/BHAs exfoliants combined in the same routine step cause severe dryness and barrier disruption."
        },
        {
            "active_1": "Benzoyl Peroxide",
            "active_2": "Retinoids",
            "type": "same_step_conflict",
            "severity": "unsafe",
            "reason": "Benzoyl Peroxide oxidizes Retinoids, rendering both ingredients inactive and causing severe irritation."
        },
        {
            "active_1": "Vitamin C",
            "active_2": "Niacinamide",
            "type": "same_step_conflict",
            "severity": "caution",
            "reason": "Combining high concentration Vitamin C and Niacinamide can cause redness, flushing, and temporary discoloration."
        },
        {
            "active_1": "Vitamin C",
            "active_2": "AHAs/BHAs",
            "type": "same_step_conflict",
            "severity": "caution",
            "reason": "Both are acidic actives; layering them together can over-exfoliate and compromise the skin barrier."
        }
    ]
    
    mongo.conflict_matrix.insert_many(conflict_rules)
    print(f"[SEED] Seeded {len(conflict_rules)} conflict rules.")
    print("[SEED] MongoDB Seeding completed successfully.")

if __name__ == "__main__":
    seed_ingredients_and_conflicts()
