# backend/ingredient_intelligence.py

"""
MILESTONE 3 - Ingredient Intelligence Engine

This module provides:
1. Allergy detection - matches user sensitivities against product ingredients
2. Chemical conflict detection - finds incompatible ingredient pairings
3. Safety scoring - rates products from 0-100 based on ingredients
4. Ingredient education - provides information about ingredients
"""

import logging
from typing import List, Dict, Any, Optional, Set, Tuple
from sqlalchemy.orm import Session
from backend.models import Product, Ingredient, ProductIngredient, SkinProfile

logger = logging.getLogger(__name__)

# ============================================================
# 1. INGREDIENT CATEGORIES & CONFLICT MATRIX
# ============================================================

# Known ingredient categories with their active types
INGREDIENT_CATEGORIES = {
    # Retinoids (Vitamin A derivatives)
    'retinoids': [
        'retinol', 'retinal', 'retinyl palmitate', 'retinoic acid', 
        'tretinoin', 'adapalene', 'tazarotene', 'retinyl acetate',
        'hydroxypinacolone retinoate', 'granactive retinoid'
    ],
    # AHAs (Alpha Hydroxy Acids)
    'ahas': [
        'glycolic acid', 'lactic acid', 'mandelic acid', 'malic acid',
        'tartaric acid', 'citric acid', 'alphahydroxy acid', 'aha'
    ],
    # BHAs (Beta Hydroxy Acids)
    'bhas': [
        'salicylic acid', 'salix alba bark extract', 'willow bark extract',
        'beta hydroxy acid', 'bha'
    ],
    # Vitamin C
    'vitamin_c': [
        'ascorbic acid', 'l-ascorbic acid', 'sodium ascorbyl phosphate',
        'magnesium ascorbyl phosphate', 'ascorbyl palmitate', 'tetrahexyldecyl ascorbate'
    ],
    # Niacinamide
    'niacinamide': [
        'niacinamide', 'nicotinamide'
    ],
    # Peptides
    'peptides': [
        'copper peptide', 'peptide', 'palmitoyl tripeptide', 'palmitoyl tetrapeptide',
        'acetyl hexapeptide', 'matrixyl', 'argireline'
    ],
    # Ceramides
    'ceramides': [
        'ceramide np', 'ceramide ap', 'ceramide eop', 'ceramide ns',
        'ceramide', 'ceramide 1', 'ceramide 2', 'ceramide 3'
    ],
    # Hyaluronic Acid
    'hyaluronic_acid': [
        'hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic acid',
        'sodium hyaluronate crosspolymer'
    ],
    # Sulfates (harsh cleansers)
    'sulfates': [
        'sodium lauryl sulfate', 'sls', 'sodium laureth sulfate', 'sles',
        'ammonium lauryl sulfate', 'ammonium laureth sulfate'
    ],
    # Fragrances (common allergens)
    'fragrances': [
        'fragrance', 'parfum', 'perfume', 'limonene', 'linalool', 
        'citronellol', 'geraniol', 'eugenol', 'coumarin'
    ],
    # Essential oils (potential irritants)
    'essential_oils': [
        'essential oil', 'peppermint oil', 'eucalyptus oil', 'lavender oil',
        'lemon oil', 'orange oil', 'bergamot oil', 'tea tree oil'
    ],
}

# Chemical conflict rules: {category1: [conflicting_category1, conflicting_category2, ...]}
CONFLICT_MATRIX = {
    'retinoids': ['ahas', 'bhas', 'vitamin_c'],
    'ahas': ['retinoids', 'vitamin_c'],
    'bhas': ['retinoids'],
    'vitamin_c': ['retinoids', 'ahas'],
}

# Comedogenicity scale (0-5, higher = more pore-clogging)
COMEDOGENICITY_MAP = {
    '0': 'Non-comedogenic (safe)',
    '1': 'Low comedogenic risk',
    '2': 'Moderate comedogenic risk',
    '3': 'High comedogenic risk',
    '4': 'Very high comedogenic risk',
    '5': 'Extreme comedogenic risk',
}

# Irritancy scale (0-5, higher = more irritating)
IRRITANCY_MAP = {
    '0': 'Non-irritating',
    '1': 'Mild irritation potential',
    '2': 'Moderate irritation potential',
    '3': 'High irritation potential',
    '4': 'Very high irritation potential',
    '5': 'Extreme irritation potential',
}


# ============================================================
# 2. HELPER FUNCTIONS
# ============================================================

def get_ingredient_objects(db: Session, product_id: int) -> List[Dict]:
    """
    Get all ingredients for a product with their safety data.
    """
    product_ingredients = db.query(ProductIngredient).filter(
        ProductIngredient.product_id == product_id
    ).order_by(ProductIngredient.position).all()
    
    result = []
    for pi in product_ingredients:
        ingredient = db.query(Ingredient).filter(Ingredient.id == pi.ingredient_id).first()
        if ingredient:
            result.append({
                'id': ingredient.id,
                'name': ingredient.name,
                'comedogenicity': ingredient.comedogenicity,
                'irritancy': ingredient.irritancy,
                'functions': ingredient.functions or [],
                'rating': ingredient.rating,
                'category': ingredient.category,
                'position': pi.position,
            })
    return result


def categorize_ingredients(ingredients: List[str]) -> Set[str]:
    """
    Categorize a list of ingredient names into active categories.
    """
    categories = set()
    for ing_name in ingredients:
        ing_lower = ing_name.lower().strip()
        for category, members in INGREDIENT_CATEGORIES.items():
            for member in members:
                if member in ing_lower:
                    categories.add(category)
                    break
    return categories


def extract_ingredient_names(ingredient_objects: List[Dict]) -> List[str]:
    """
    Extract just the names from ingredient objects.
    """
    return [ing['name'] for ing in ingredient_objects]


# ============================================================
# 3. ALLERGY DETECTION
# ============================================================

def detect_allergies(
    db: Session, 
    product_id: int, 
    user_id: int
) -> Dict[str, Any]:
    """
    Check if a product contains any ingredients that the user is allergic to.
    """
    # Get user's allergies from skin profile
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile or not profile.allergies:
        return {'has_allergies': False, 'allergens': [], 'safety': 'Safe - No allergies detected'}
    
    user_allergies = [a.strip().lower() for a in profile.allergies.split(',') if a.strip()]
    if not user_allergies:
        return {'has_allergies': False, 'allergens': [], 'safety': 'Safe - No allergies detected'}
    
    # Get product ingredients
    ingredients = get_ingredient_objects(db, product_id)
    ingredient_names = extract_ingredient_names(ingredients)
    
    # Check for matches
    matched_allergens = []
    for allergen in user_allergies:
        for ing_name in ingredient_names:
            if allergen in ing_name.lower() or ing_name.lower() in allergen:
                matched_allergens.append({
                    'allergen': allergen,
                    'ingredient': ing_name,
                })
                break
    
    if matched_allergens:
        return {
            'has_allergies': True,
            'allergens': matched_allergens,
            'safety': '⚠️ Contains allergens - Not recommended'
        }
    
    return {
        'has_allergies': False,
        'allergens': [],
        'safety': '✅ Safe - No allergens detected'
    }


# ============================================================
# 4. CHEMICAL CONFLICT DETECTION
# ============================================================

def detect_conflicts(ingredient_objects: List[Dict]) -> Dict[str, Any]:
    """
    Detect chemical conflicts between ingredients in a product.
    """
    ingredient_names = extract_ingredient_names(ingredient_objects)
    categories = categorize_ingredients(ingredient_names)
    
    conflicts = []
    for cat in categories:
        if cat in CONFLICT_MATRIX:
            conflicting = CONFLICT_MATRIX[cat]
            for conf in conflicting:
                if conf in categories:
                    conflicts.append({
                        'ingredient_category': cat,
                        'conflict_with': conf,
                        'severity': 'High' if cat == 'retinoids' else 'Medium',
                        'message': f"⚠️ {cat} and {conf} should not be used together - potential irritation risk"
                    })
    
    return {
        'has_conflicts': len(conflicts) > 0,
        'conflicts': conflicts,
    }


# ============================================================
# 5. SAFETY SCORE CALCULATION
# ============================================================

def calculate_safety_score(
    ingredient_objects: List[Dict],
    user_skin_type: Optional[str] = None
) -> Dict[str, Any]:
    """
    Calculate a safety score (0-100) for a product based on its ingredients.
    """
    if not ingredient_objects:
        return {
            'score': 0,
            'status': '⚠️ No ingredients data available',
            'breakdown': {},
            'warnings': []
        }
    
    total_ingredients = len(ingredient_objects)
    safety_breakdown = {
        'comedogenicity_score': 0,
        'irritancy_score': 0,
        'active_count': 0,
        'total_score': 0
    }
    
    warnings = []
    comedogenicity_sum = 0
    irritancy_sum = 0
    comedogenicity_count = 0
    irritancy_count = 0
    active_ingredients = 0
    
    for ing in ingredient_objects:
        # Check comedogenicity
        comedogenicity = ing.get('comedogenicity')
        if comedogenicity and comedogenicity != 'None' and comedogenicity != 'null':
            try:
                # Handle ranges like "0-3" -> average
                if '-' in str(comedogenicity):
                    parts = str(comedogenicity).split('-')
                    val = (int(parts[0]) + int(parts[1])) / 2
                else:
                    val = float(comedogenicity)
                comedogenicity_sum += val
                comedogenicity_count += 1
                
                if val >= 4:
                    warnings.append(f"⚠️ {ing['name']} has high comedogenicity ({comedogenicity})")
            except (ValueError, TypeError):
                pass
        
        # Check irritancy
        irritancy = ing.get('irritancy')
        if irritancy and irritancy != 'None' and irritancy != 'null':
            try:
                if '-' in str(irritancy):
                    parts = str(irritancy).split('-')
                    val = (int(parts[0]) + int(parts[1])) / 2
                else:
                    val = float(irritancy)
                irritancy_sum += val
                irritancy_count += 1
                
                if val >= 3:
                    warnings.append(f"⚠️ {ing['name']} has high irritancy ({irritancy})")
            except (ValueError, TypeError):
                pass
        
        # Check if it's an active ingredient
        if ing.get('rating') in ['direct actives', 'supporting actives']:
            active_ingredients += 1
    
    # Calculate scores (0-100 where higher is safer)
    comedogenicity_score = 100
    if comedogenicity_count > 0:
        avg_comedogenicity = comedogenicity_sum / comedogenicity_count
        comedogenicity_score = max(0, 100 - (avg_comedogenicity * 15))
    
    irritancy_score = 100
    if irritancy_count > 0:
        avg_irritancy = irritancy_sum / irritancy_count
        irritancy_score = max(0, 100 - (avg_irritancy * 15))
    
    # Active ingredients bonus (having actives is good but too many can be bad)
    active_score = 100
    if active_ingredients > 3:
        active_score = max(60, 100 - ((active_ingredients - 3) * 5))
    elif active_ingredients == 0:
        active_score = 70  # No actives means less effective
    
    # Total weighted score
    total_score = (
        comedogenicity_score * 0.35 +
        irritancy_score * 0.35 +
        active_score * 0.30
    )
    
    # Determine status
    if total_score >= 80:
        status = '✅ Safe'
    elif total_score >= 60:
        status = '⚠️ Caution - Some concerns'
    else:
        status = '❌ Not recommended - Safety concerns'
    
    safety_breakdown['comedogenicity_score'] = round(comedogenicity_score, 2)
    safety_breakdown['irritancy_score'] = round(irritancy_score, 2)
    safety_breakdown['active_score'] = round(active_score, 2)
    safety_breakdown['total_score'] = round(total_score, 2)
    
    return {
        'score': round(total_score, 2),
        'status': status,
        'breakdown': safety_breakdown,
        'warnings': warnings,
        'active_ingredients_count': active_ingredients,
        'total_ingredients': total_ingredients
    }


# ============================================================
# 6. COMPLETE PRODUCT ANALYSIS
# ============================================================

def analyze_product(
    db: Session,
    product_id: int,
    user_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Complete ingredient analysis for a product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return {'error': 'Product not found'}
    
    ingredients = get_ingredient_objects(db, product_id)
    ingredient_names = extract_ingredient_names(ingredients)
    categories = categorize_ingredients(ingredient_names)
    
    result = {
        'product_id': product_id,
        'product_name': product.name,
        'brand': product.brand,
        'total_ingredients': len(ingredients),
        'ingredient_count': len(ingredients),
        'active_categories': list(categories),
    }
    
    # Check conflicts
    conflict_result = detect_conflicts(ingredients)
    result['conflicts'] = conflict_result
    
    # Check allergies (if user_id provided)
    if user_id:
        allergy_result = detect_allergies(db, product_id, user_id)
        result['allergies'] = allergy_result
    
    # Calculate safety score
    skin_type = None
    if user_id:
        profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
        if profile:
            skin_type = profile.skin_type
    
    safety_result = calculate_safety_score(ingredients, skin_type)
    result['safety_score'] = safety_result
    
    return result


# ============================================================
# 7. BATCH ANALYSIS (for recommendation filtering)
# ============================================================

def filter_products_by_ingredient_safety(
    db: Session,
    product_ids: List[int],
    user_id: int
) -> List[int]:
    """
    Filter a list of product IDs to only those that are safe for the user.
    Removes products that:
    - Contain user allergens
    - Have safety score below 60
    - Have severe conflicts
    """
    safe_products = []
    
    for product_id in product_ids:
        analysis = analyze_product(db, product_id, user_id)
        
        # Skip if error
        if 'error' in analysis:
            continue
        
        # Skip if allergies detected
        if analysis.get('allergies', {}).get('has_allergies', False):
            continue
        
        # Skip if safety score below 60
        safety_score = analysis.get('safety_score', {})
        if safety_score.get('score', 0) < 60:
            continue
        
        # Skip if severe conflicts
        conflicts = analysis.get('conflicts', {})
        if conflicts.get('has_conflicts', False):
            severe_conflicts = [c for c in conflicts.get('conflicts', []) if c.get('severity') == 'High']
            if severe_conflicts:
                continue
        
        safe_products.append(product_id)
    
    return safe_products


# ============================================================
# 8. INGREDIENT EDUCATION
# ============================================================

def get_ingredient_info(db: Session, ingredient_name: str) -> Dict[str, Any]:
    """
    Get detailed information about an ingredient.
    """
    ingredient = db.query(Ingredient).filter(
        Ingredient.name.ilike(f"%{ingredient_name}%")
    ).first()
    
    if not ingredient:
        return {'error': 'Ingredient not found'}
    
    return {
        'id': ingredient.id,
        'name': ingredient.name,
        'comedogenicity': ingredient.comedogenicity,
        'comedogenicity_description': COMEDOGENICITY_MAP.get(str(ingredient.comedogenicity), 'Unknown'),
        'irritancy': ingredient.irritancy,
        'irritancy_description': IRRITANCY_MAP.get(str(ingredient.irritancy), 'Unknown'),
        'functions': ingredient.functions or [],
        'rating': ingredient.rating,
        'category': ingredient.category,
    }


def get_ingredient_alternatives(
    db: Session,
    ingredient_name: str,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Find alternative ingredients with similar functions but better safety profiles.
    """
    # First, find the ingredient
    ingredient = db.query(Ingredient).filter(
        Ingredient.name.ilike(f"%{ingredient_name}%")
    ).first()
    
    if not ingredient:
        return []
    
    # Find ingredients with similar functions but better comedogenicity/irritancy
    similar_ingredients = []
    
    for ing in db.query(Ingredient).filter(
        Ingredient.id != ingredient.id,
        Ingredient.functions.isnot(None)
    ).all():
        # Check if they share any functions
        if ingredient.functions and ing.functions:
            common_functions = set(ingredient.functions) & set(ing.functions)
            if common_functions:
                similar_ingredients.append(ing)
    
    # Sort by safety (lower comedogenicity and irritancy is better)
    def safety_sort(ing):
        com_score = 0
        if ing.comedogenicity and ing.comedogenicity != 'None':
            try:
                if '-' in str(ing.comedogenicity):
                    parts = str(ing.comedogenicity).split('-')
                    com_score = (int(parts[0]) + int(parts[1])) / 2
                else:
                    com_score = float(ing.comedogenicity)
            except:
                com_score = 5
        else:
            com_score = 5
        
        irr_score = 0
        if ing.irritancy and ing.irritancy != 'None':
            try:
                if '-' in str(ing.irritancy):
                    parts = str(ing.irritancy).split('-')
                    irr_score = (int(parts[0]) + int(parts[1])) / 2
                else:
                    irr_score = float(ing.irritancy)
            except:
                irr_score = 5
        else:
            irr_score = 5
        
        return (com_score + irr_score) / 2
    
    similar_ingredients.sort(key=safety_sort)
    
    return [
        {
            'name': ing.name,
            'comedogenicity': ing.comedogenicity,
            'irritancy': ing.irritancy,
            'functions': ing.functions or [],
            'safety_score': safety_sort(ing)
        }
        for ing in similar_ingredients[:limit]
    ]