"""
Seed script for Milestone 3 AI Skin Intelligence Engine
Safely migrates columns and seeds ingredient database with safety, conflict matrix, pregnancy safety, sensitivity scores,
products, sample progress photo records, and compliance records.
"""

from database import Base, engine, SessionLocal
from models import Ingredient, Product, ProgressPhoto, ComplianceHistory, User, SkinProfile, Lifestyle, PrescriptionNote
from datetime import datetime, timedelta
from sqlalchemy import text

def migrate_db_columns():
    db = SessionLocal()
    try:
        print("[Migration] Ensuring table structures & new columns...")
        # Add new columns to ingredients table if they don't exist
        columns_to_add = [
            ("purpose", "VARCHAR"),
            ("warnings", "VARCHAR"),
            ("compatible_ingredients", "VARCHAR"),
            ("incompatible_ingredients", "VARCHAR"),
            ("pregnancy_safety", "VARCHAR DEFAULT 'Safe'"),
            ("sensitivity_score", "INTEGER DEFAULT 1")
        ]
        for col_name, col_type in columns_to_add:
            try:
                db.execute(text(f"ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS {col_name} {col_type};"))
            except Exception as ex:
                db.rollback()
                try:
                    db.execute(text(f"ALTER TABLE ingredients ADD COLUMN {col_name} {col_type};"))
                except Exception:
                    pass
        db.commit()
    except Exception as e:
        print(f"[Migration Warning] Column migration notice: {e}")
        db.rollback()
    finally:
        db.close()

def seed_milestone3_data():
    migrate_db_columns()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("[Seed] Seeding Ingredient Intelligence Database...")

        ingredients_data = [
            {
                "ingredient_name": "Retinoids",
                "purpose": "Cellular Turnover & Collagen Synthesis",
                "benefits": "Reduces fine lines, clears acne, improves texture, stimulates collagen production.",
                "warnings": "Causes sun sensitivity, peeling, and dryness during initiation phase. Do not mix with AHA/BHA or Benzoyl Peroxide in the same routine.",
                "compatible_ingredients": "Niacinamide, Ceramides, Hyaluronic Acid, Peptides, Centella",
                "incompatible_ingredients": "AHA, BHA, Salicylic Acid, Vitamin C (L-Ascorbic Acid), Benzoyl Peroxide",
                "pregnancy_safety": "Avoid",
                "sensitivity_score": 7
            },
            {
                "ingredient_name": "Vitamin C",
                "purpose": "Antioxidant Protection & Brightening",
                "benefits": "Fades hyperpigmentation, neutralizes free radicals, boosts collagen synthesis.",
                "warnings": "L-Ascorbic Acid oxidizes in light/air. Can irritate sensitive skin at concentrations above 15%.",
                "compatible_ingredients": "Vitamin E, Ferulic Acid, Hyaluronic Acid, Ceramides, Sunscreen",
                "incompatible_ingredients": "Retinoids, Niacinamide (at high conc/low pH), AHA, BHA, Copper Peptides",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 4
            },
            {
                "ingredient_name": "Niacinamide",
                "purpose": "Barrier Support & Sebum Regulation",
                "benefits": "Reduces redness, minimizes pores, regulates oil, strengthens skin moisture barrier.",
                "warnings": "High concentrations (>10%) can cause mild flushing or temporary breakouts in sensitive individuals.",
                "compatible_ingredients": "Retinoids, Hyaluronic Acid, Ceramides, Zinc, Centella, Peptides",
                "incompatible_ingredients": "Pure L-Ascorbic Acid (when layered simultaneously at low pH)",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 2
            },
            {
                "ingredient_name": "Ceramides",
                "purpose": "Lipid Barrier Restoration & Moisture Retention",
                "benefits": "Restores intracellular lipids, prevents trans-epidermal water loss (TEWL), soothes irritated skin.",
                "warnings": "Extremely safe. Essential for barrier repair.",
                "compatible_ingredients": "Hyaluronic Acid, Niacinamide, Retinoids, AHA, BHA, Peptides, Centella",
                "incompatible_ingredients": "None",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 1
            },
            {
                "ingredient_name": "Peptides",
                "purpose": "Structural Support & Firming",
                "benefits": "Promotes elastin and collagen firming, repairs damaged skin matrix, smooths fine lines.",
                "warnings": "Direct acids (AHA/BHA) can hydrolyze peptides if combined improperly.",
                "compatible_ingredients": "Hyaluronic Acid, Ceramides, Niacinamide, Retinoids, Centella",
                "incompatible_ingredients": "Strong AHA/BHA, L-Ascorbic Acid, Direct Acids",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 1
            },
            {
                "ingredient_name": "AHA",
                "purpose": "Chemical Surface Exfoliation",
                "benefits": "Exfoliates surface dead skin cells, enhances hydration, brightens dull complexion (Glycolic/Lactic Acid).",
                "warnings": "Increases photosensitivity. Over-exfoliation compromises skin barrier.",
                "compatible_ingredients": "Hyaluronic Acid, Ceramides, Centella, SPF",
                "incompatible_ingredients": "Retinoids, BHA, Vitamin C, Peptides",
                "pregnancy_safety": "Caution",
                "sensitivity_score": 6
            },
            {
                "ingredient_name": "BHA",
                "purpose": "Pore Decongestion & Anti-inflammatory",
                "benefits": "Lipophilic acid penetrates deep into pores to dissolve sebum and clear comedones.",
                "warnings": "May dry out non-oily skin types. Limit use to 2-3 times per week.",
                "compatible_ingredients": "Niacinamide, Hyaluronic Acid, Ceramides, Centella",
                "incompatible_ingredients": "Retinoids, AHA, Vitamin C",
                "pregnancy_safety": "Caution",
                "sensitivity_score": 5
            },
            {
                "ingredient_name": "Salicylic Acid",
                "purpose": "Acne Treatment & Pore Refining",
                "benefits": "Targeted BHA that unclogs pores, reduces active inflammatory acne, and smooths skin texture.",
                "warnings": "Can cause mild peeling or dryness if overused.",
                "compatible_ingredients": "Niacinamide, Hyaluronic Acid, Ceramides, Tea Tree, Centella",
                "incompatible_ingredients": "Retinoids, Glycolic Acid, High % Vitamin C",
                "pregnancy_safety": "Caution",
                "sensitivity_score": 5
            },
            {
                "ingredient_name": "Hyaluronic Acid",
                "purpose": "Deep Moisture Attraction & Plumping",
                "benefits": "Attracts up to 1000x its weight in water, instantly plumps fine lines, provides hydration.",
                "warnings": "Must be sealed with an occlusive moisturizer in dry climates to prevent water draw out.",
                "compatible_ingredients": "All ingredients (Retinoids, Vitamin C, Niacinamide, Ceramides, Peptides, AHA/BHA)",
                "incompatible_ingredients": "None",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 1
            },
            {
                "ingredient_name": "Centella",
                "purpose": "Soothing & Anti-inflammatory Repair",
                "benefits": "Calms redness, heals damaged barrier, reduces rosacea symptoms, speeds up wound healing.",
                "warnings": "Extremely gentle and well-tolerated.",
                "compatible_ingredients": "All ingredients, especially actives like Retinoids and Exfoliants",
                "incompatible_ingredients": "None",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 1
            },
            {
                "ingredient_name": "Azelaic Acid",
                "purpose": "Rosacea Relief & Melasma Brightening",
                "benefits": "Reduces erythema/redness, targets hyperpigmentation without bleaching, antibacterial for acne.",
                "warnings": "May cause mild tingling upon initial application.",
                "compatible_ingredients": "Niacinamide, Hyaluronic Acid, Ceramides, Gentle Cleansers",
                "incompatible_ingredients": "Harsh physical scrubs, strong AHA combinations",
                "pregnancy_safety": "Safe",
                "sensitivity_score": 3
            }
        ]

        for ing in ingredients_data:
            existing = db.query(Ingredient).filter(Ingredient.ingredient_name == ing["ingredient_name"]).first()
            if existing:
                existing.purpose = ing["purpose"]
                existing.benefits = ing["benefits"]
                existing.warnings = ing["warnings"]
                existing.compatible_ingredients = ing["compatible_ingredients"]
                existing.incompatible_ingredients = ing["incompatible_ingredients"]
                existing.pregnancy_safety = ing["pregnancy_safety"]
                existing.sensitivity_score = ing["sensitivity_score"]
                existing.description = ing["purpose"] + " - " + ing["benefits"]
            else:
                db.add(Ingredient(
                    ingredient_name=ing["ingredient_name"],
                    description=ing["purpose"] + " - " + ing["benefits"],
                    benefits=ing["benefits"],
                    purpose=ing["purpose"],
                    warnings=ing["warnings"],
                    compatible_ingredients=ing["compatible_ingredients"],
                    incompatible_ingredients=ing["incompatible_ingredients"],
                    pregnancy_safety=ing["pregnancy_safety"],
                    sensitivity_score=ing["sensitivity_score"]
                ))
        db.commit()

        print("[Seed] Seeding Milestone 3 Products Catalog...")
        sample_products = [
            {
                "product_name": "CeraVe Hydrating Facial Cleanser",
                "brand": "CeraVe",
                "skin_type": "Dry, Sensitive, Normal",
                "category": "Cleanser",
                "main_ingredient": "Ceramides, Hyaluronic Acid",
                "benefit": "Restores skin barrier, non-foaming hydrating cleanse",
                "price": 15.99,
                "rating": 4.8
            },
            {
                "product_name": "The Ordinary Niacinamide 10% + Zinc 1%",
                "brand": "The Ordinary",
                "skin_type": "Oily, Combination, Acne-prone",
                "category": "Serum",
                "main_ingredient": "Niacinamide, Zinc PCA",
                "benefit": "Reduces skin blemishes, balances sebum activity",
                "price": 10.50,
                "rating": 4.6
            },
            {
                "product_name": "Paula's Choice 2% BHA Liquid Exfoliant",
                "brand": "Paula's Choice",
                "skin_type": "Oily, Combination, Acne-prone",
                "category": "Exfoliant",
                "main_ingredient": "Salicylic Acid, Green Tea",
                "benefit": "Unclogs pores, refines texture, evens skin tone",
                "price": 34.00,
                "rating": 4.9
            },
            {
                "product_name": "La Roche-Posay Hyalu B5 Pure Hyaluronic Acid Serum",
                "brand": "La Roche-Posay",
                "skin_type": "All, Dry, Sensitive",
                "category": "Serum",
                "main_ingredient": "Hyaluronic Acid, Vitamin B5, Centella",
                "benefit": "Plumps skin, repairs moisture barrier",
                "price": 39.99,
                "rating": 4.7
            },
            {
                "product_name": "COSRX Advanced Snail 96 Mucin Power Essence",
                "brand": "COSRX",
                "skin_type": "All, Sensitive",
                "category": "Essence",
                "main_ingredient": "Snail Secretion Filtrate, Hyaluronic Acid",
                "benefit": "Deep hydration, soothing, skin repair",
                "price": 25.00,
                "rating": 4.8
            },
            {
                "product_name": "Kiehl's Retinol Fast Release Night Serum",
                "brand": "Kiehl's",
                "skin_type": "Normal, Combination, Aging",
                "category": "Night Treatment",
                "main_ingredient": "Retinoids, Ceramides",
                "benefit": "Accelerates surface skin cell renewal, reduces wrinkles",
                "price": 88.00,
                "rating": 4.5
            }
        ]

        for p in sample_products:
            exists = db.query(Product).filter(Product.product_name == p["product_name"]).first()
            if not exists:
                db.add(Product(**p))
        db.commit()

        users = db.query(User).all()
        for user in users:
            print(f"[Seed] Seeding sample Progress Photos for user_id={user.id} ({user.email})...")
            photos_data = [
                {
                    "user_id": user.id,
                    "image_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
                    "upload_date": datetime.utcnow() - timedelta(days=28),
                    "skin_health_score": 62,
                    "routine_adherence": 65.0,
                    "week_number": 0,
                    "tag": "Baseline",
                    "notes": "Baseline scan - active inflammatory acne & redness on cheeks."
                },
                {
                    "user_id": user.id,
                    "image_url": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
                    "upload_date": datetime.utcnow() - timedelta(days=14),
                    "skin_health_score": 74,
                    "routine_adherence": 85.0,
                    "week_number": 2,
                    "tag": "Week 2",
                    "notes": "Significant reduction in acne redness, barrier hydration improving."
                },
                {
                    "user_id": user.id,
                    "image_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
                    "upload_date": datetime.utcnow(),
                    "skin_health_score": 85,
                    "routine_adherence": 94.0,
                    "week_number": 4,
                    "tag": "Month 1",
                    "notes": "Smooth skin texture, hyperpigmentation faded by 28%, glowing hydration."
                }
            ]
            for ph in photos_data:
                ex = db.query(ProgressPhoto).filter(ProgressPhoto.user_id == ph["user_id"], ProgressPhoto.tag == ph["tag"]).first()
                if not ex:
                    db.add(ProgressPhoto(**ph))

            comp_ex = db.query(ComplianceHistory).filter(ComplianceHistory.user_id == user.id).first()
            if not comp_ex:
                db.add(ComplianceHistory(
                    user_id=user.id,
                    date=datetime.utcnow(),
                    morning_completed=True,
                    evening_completed=True,
                    weekly_completed=True,
                    compliance_7d=88.5,
                    compliance_30d=91.0,
                    compliance_90d=89.2
                ))

        db.commit()
        print("[Seed] Milestone 3 Seeding Completed Successfully!")
    except Exception as e:
        db.rollback()
        print(f"[Seed Error] {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_milestone3_data()
