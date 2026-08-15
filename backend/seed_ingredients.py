# backend/seed_ingredients.py

"""
MILESTONE 3 - Seed Ingredients Knowledge Base
Imports the Celestia Skincare Treatment Dataset into the ingredient_knowledge table.
This maps skin concerns → ingredient combinations → effects.
"""

import sys
import os
import csv
import re
from pathlib import Path
from datetime import datetime

# Add project root to Python path
sys.path.append(str(Path(__file__).parent.parent))

from backend.database import SessionLocal
from backend.models import IngredientKnowledge

# ============================================================
# CONFIGURATION
# ============================================================

DATA_DIR = Path(__file__).parent / "data"

# Your Celestia CSV file path
CELESTIA_CSV = DATA_DIR / "CELESTIA_SKINCARE_DATASET_KAGGLE_READY.csv"


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def clean_text(text):
    """Clean text by removing extra whitespace and newlines"""
    if not text:
        return None
    if isinstance(text, str):
        return " ".join(text.strip().split())
    return text


def parse_ingredients(ingredient_text):
    """
    Parse ingredient combination into a list of individual ingredients.
    Example: "Zinc PCA + Benzoyl Peroxide 2.5% + Salicylic Acid 2%"
    Returns: ["Zinc PCA", "Benzoyl Peroxide", "Salicylic Acid"]
    """
    if not ingredient_text:
        return []
    
    # Clean the text
    text = clean_text(ingredient_text) or ""
    
    # Split by " + " or "+"
    parts = re.split(r'\s*\+\s*', text)
    
    # Clean each part (remove concentrations like "2.5%")
    cleaned_ingredients = []
    for part in parts:
        # Remove concentration percentages (e.g., "2.5%", "10%")
        part = re.sub(r'\d+\.?\d*%', '', part).strip()
        # Remove extra spaces
        part = " ".join(part.split())
        if part:
            cleaned_ingredients.append(part)
    
    return cleaned_ingredients


def parse_effects(effects_text):
    """Parse effects text into a list of individual effects"""
    if not effects_text:
        return []
    
    text = clean_text(effects_text) or ""
    
    # Split by commas or periods
    effects = re.split(r'[,;\.]', text)
    
    # Clean each effect
    cleaned_effects = []
    for effect in effects:
        effect = " ".join(effect.strip().split())
        if effect:
            cleaned_effects.append(effect)
    
    return cleaned_effects


def normalize_skin_type(skin_type):
    """Normalize skin type to match our enum"""
    if not skin_type:
        return None
    
    skin_type = skin_type.strip().lower()
    
    # Map variations to standard values
    mapping = {
        'normal': 'Normal',
        'dry': 'Dry',
        'oily': 'Oily',
        'combination': 'Combination',
        'sensitive': 'Sensitive',
    }
    
    # Check for partial matches
    for key, value in mapping.items():
        if key in skin_type:
            return value
    
    return skin_type.title()


def parse_sensitivity(sensitivity_text):
    """Parse sensitivity to boolean"""
    if not sensitivity_text:
        return False
    
    sensitivity_text = sensitivity_text.strip().lower()
    return sensitivity_text in ['yes', 'true', '1']


def normalize_concern(concern_text):
    """Normalize concern name"""
    if not concern_text:
        return None
    
    concern_text = clean_text(concern_text) or ""
    
    # Common variations
    concern_map = {
        'acne': 'Acne',
        'dark circles': 'Dark Circles',
        'dark spots': 'Dark Spots',
        'hyperpigmentation': 'Hyperpigmentation',
        'open pores': 'Open Pores',
        'redness': 'Redness',
        'sun tan': 'Sun Tan',
        'whiteheads': 'Whiteheads / Blackheads',
        'wrinkles': 'Wrinkles',
        'dullness': 'Dullness',
    }
    
    concern_lower = concern_text.lower()
    for key, value in concern_map.items():
        if key in concern_lower:
            return value
    
    return concern_text


def parse_internal_type(internal_type_text):
    """Parse internal type"""
    if not internal_type_text:
        return None
    
    internal_type_text = clean_text(internal_type_text) or ""
    
    # Common internal types
    type_map = {
        'comedonal': 'Comedonal',
        'comedone': 'Comedonal',
        'inflammatory': 'Inflammatory',
        'inflamed': 'Inflammatory',
        'fungal': 'Fungal',
        'cystic': 'Cystic',
        'pigmented': 'Pigmented',
        'vascular': 'Vascular',
        'general': 'General',
        'pustular': 'Pustular',
    }
    
    type_lower = internal_type_text.lower()
    for key, value in type_map.items():
        if key in type_lower:
            return value
    
    return internal_type_text


# ============================================================
# MAIN SEED FUNCTION
# ============================================================

def seed_ingredients():
    """Main function to seed ingredient knowledge from Celestia dataset"""
    print("=" * 70)
    print("🧪 Seeding Ingredient Knowledge Base")
    print("=" * 70)
    
    # Check if CSV exists
    if not CELESTIA_CSV.exists():
        print(f"\n❌ Celestia CSV not found: {CELESTIA_CSV}")
        print("   Please update CELESTIA_CSV path in the script.")
        return
    
    db = SessionLocal()
    stats = {
        'total_rows': 0,
        'inserted': 0,
        'skipped': 0,
        'errors': 0
    }
    
    try:
        print("\n📂 Loading Celestia dataset...")
        
        with open(CELESTIA_CSV, 'r', encoding='utf-8') as f:
            # Try to detect delimiter
            sample = f.read(1024)
            f.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter
            
            reader = csv.DictReader(f, delimiter=delimiter)
            
            for row in reader:
                stats['total_rows'] += 1
                
                try:
                    # Extract columns - USING YOUR EXACT COLUMN NAMES
                    age_group = clean_text(row.get('Age_Group', ''))
                    skin_type = normalize_skin_type(row.get('Skin_Type', ''))
                    skin_subtype = clean_text(row.get('Skin_Subtype', ''))
                    sensitivity = parse_sensitivity(row.get('Sensitivity', ''))
                    concern = normalize_concern(row.get('Concern', ''))
                    internal_type = parse_internal_type(row.get('Internal_Type', ''))
                    
                    # Ingredient combination and effects - USING YOUR EXACT COLUMN NAMES
                    ingredient_text = clean_text(row.get('Ingredients_with_Concentration', ''))
                    effects_text = clean_text(row.get('Effects', ''))
                    
                    # Skip if missing critical data
                    if not concern or not ingredient_text:
                        stats['skipped'] += 1
                        continue
                    
                    # Parse ingredients and effects
                    parsed_ingredients = parse_ingredients(ingredient_text)
                    parsed_effects = parse_effects(effects_text)
                    
                    # Create ingredient knowledge entry
                    knowledge = IngredientKnowledge(
                        age_group=age_group,
                        skin_type=skin_type,
                        skin_subtype=skin_subtype,
                        sensitivity=sensitivity,
                        concern=concern,
                        internal_type=internal_type,
                        ingredient_combination=ingredient_text,
                        effects=effects_text or "",
                        parsed_ingredients=parsed_ingredients,
                        created_at=datetime.utcnow()
                    )
                    
                    db.add(knowledge)
                    stats['inserted'] += 1
                    
                    # Commit in batches
                    if stats['inserted'] % 100 == 0:
                        db.commit()
                        print(f"   ... processed {stats['inserted']} rows")
                    
                except Exception as e:
                    stats['errors'] += 1
                    print(f"   ⚠️ Error processing row {stats['total_rows']}: {e}")
                    continue
        
        # Final commit
        db.commit()
        
        # ----------------------------------------------------
        # Summary
        # ----------------------------------------------------
        print("\n" + "=" * 70)
        print("📊 INGREDIENT SEED SUMMARY")
        print("=" * 70)
        print(f"   Total rows in CSV:        {stats['total_rows']}")
        print(f"   Inserted into database:   {stats['inserted']}")
        print(f"   Skipped (missing data):   {stats['skipped']}")
        print(f"   Errors:                   {stats['errors']}")
        print("=" * 70)
        
        # Verify count
        total_in_db = db.query(IngredientKnowledge).count()
        print(f"\n✅ Total ingredient knowledge records in database: {total_in_db}")
        
        # Show sample of what was imported
        print("\n📋 Sample of imported ingredient knowledge:")
        samples = db.query(IngredientKnowledge).limit(5).all()
        for s in samples:
            print(f"\n   Concern: {s.concern}")
            print(f"   Skin Type: {s.skin_type} | Sensitivity: {s.sensitivity}")
            print(f"   Ingredients: {s.ingredient_combination[:60]}...")
            print(f"   Effects: {s.effects[:60]}...")
        
        print("\n" + "=" * 70)
        print("✅ Ingredient knowledge seeded successfully!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error seeding ingredient knowledge: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# ============================================================
# RUN THE SEED
# ============================================================

if __name__ == "__main__":
    seed_ingredients()