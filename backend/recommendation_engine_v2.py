# backend/recommendation_engine_v2.py

"""
MILESTONE 3 - Product Recommendation Engine

This module provides:
1. Product scoring based on concern match, skin type fit, and rating
2. Safety filtering using the Ingredient Intelligence Engine
3. Budget filtering
4. Ranked recommendations with match percentages
"""

import logging
from typing import List, Dict, Any, Optional, Set
from sqlalchemy.orm import Session
from backend.models import Product, SkinProfile, ProductRecommendation
from backend.ingredient_intelligence import filter_products_by_ingredient_safety, analyze_product

logger = logging.getLogger(__name__)

# ============================================================
# 1. CONCERN-TO-INGREDIENT MAPPING
# ============================================================

# Map skin concerns to beneficial ingredients
CONCERN_INGREDIENT_MAP = {
    'acne': [
        'salicylic acid', 'benzoyl peroxide', 'niacinamide', 'zinc',
        'tea tree oil', 'sulfur', 'retinol', 'azelaic acid',
        'glycolic acid', 'lactic acid', 'adapalene'
    ],
    'hyperpigmentation': [
        'vitamin c', 'niacinamide', 'alpha arbutin', 'kojic acid',
        'tranexamic acid', 'azelaic acid', 'licorice root',
        'retinol', 'ferulic acid', 'hydroquinone'
    ],
    'dark spots': [
        'vitamin c', 'niacinamide', 'alpha arbutin', 'kojic acid',
        'tranexamic acid', 'azelaic acid', 'licorice root',
        'retinol', 'ferulic acid'
    ],
    'dry skin': [
        'hyaluronic acid', 'glycerin', 'ceramides', 'squalane',
        'shea butter', 'jojoba oil', 'aloe vera', 'panthenol',
        'urea', 'lactic acid', 'cholesterol'
    ],
    'oily skin': [
        'niacinamide', 'salicylic acid', 'zinc', 'tea tree oil',
        'witch hazel', 'clay', 'charcoal', 'sulfur',
        'retinol', 'glycolic acid'
    ],
    'sensitive skin': [
        'centella asiatica', 'aloe vera', 'panthenol', 'ceramides',
        'chamomile', 'oat extract', 'allantoin', 'squalane',
        'hyaluronic acid', 'glycerin'
    ],
    'wrinkles': [
        'retinol', 'peptides', 'vitamin c', 'hyaluronic acid',
        'copper peptides', 'niacinamide', 'ferulic acid',
        'resveratrol', 'coenzyme q10', 'astaxanthin'
    ],
    'fine lines': [
        'retinol', 'peptides', 'vitamin c', 'hyaluronic acid',
        'copper peptides', 'niacinamide', 'ferulic acid'
    ],
    'redness': [
        'centella asiatica', 'aloe vera', 'chamomile', 'calendula',
        'green tea', 'niacinamide', 'azelaic acid', 'licorice root'
    ],
    'uneven skin tone': [
        'vitamin c', 'niacinamide', 'alpha arbutin', 'kojic acid',
        'tranexamic acid', 'azelaic acid', 'licorice root',
        'retinol', 'ferulic acid'
    ],
    'blackheads': [
        'salicylic acid', 'glycolic acid', 'lactic acid', 'mandelic acid',
        'niacinamide', 'retinol', 'charcoal', 'clay'
    ],
    'whiteheads': [
        'salicylic acid', 'glycolic acid', 'lactic acid', 'mandelic acid',
        'niacinamide', 'retinol', 'benzoyl peroxide'
    ],
    'pores': [
        'niacinamide', 'salicylic acid', 'glycolic acid', 'retinol',
        'clay', 'charcoal', 'lactic acid'
    ],
    'dullness': [
        'vitamin c', 'glycolic acid', 'lactic acid', 'niacinamide',
        'retinol', 'ferulic acid', 'resveratrol'
    ],
    'sun damage': [
        'vitamin c', 'niacinamide', 'ferulic acid', 'retinol',
        'alpha arbutin', 'kojic acid', 'tranexamic acid'
    ],
    'dehydration': [
        'hyaluronic acid', 'glycerin', 'panthenol', 'ceramides',
        'squalane', 'aloe vera', 'sodium hyaluronate'
    ],
}

# Skin type compatibility (product categories that work best for each skin type)
SKIN_TYPE_COMPATIBILITY = {
    'Oily': {
        'preferred': ['Serum', 'Cleanser', 'Exfoliator', 'Face Wash'],
        'avoid': ['Face Oil', 'Cream', 'Balms'],
        'keywords': ['oil-free', 'non-comedogenic', 'gel', 'lightweight', 'matte']
    },
    'Dry': {
        'preferred': ['Moisturizer', 'Serum', 'Face Oil', 'Cream'],
        'avoid': ['Exfoliator', 'Toner'],
        'keywords': ['cream', 'rich', 'nourishing', 'hydrating', 'softening']
    },
    'Combination': {
        'preferred': ['Serum', 'Cleanser', 'Moisturizer'],
        'avoid': ['Face Oil', 'Heavy Cream'],
        'keywords': ['oil-free', 'lightweight', 'balancing', 'gel']
    },
    'Sensitive': {
        'preferred': ['Moisturizer', 'Cleanser', 'Serum'],
        'avoid': ['Exfoliator', 'Toner', 'Face Oil'],
        'keywords': ['gentle', 'fragrance-free', 'soothing', 'calming']
    },
    'Normal': {
        'preferred': ['Serum', 'Cleanser', 'Moisturizer', 'Sunscreen'],
        'avoid': [],
        'keywords': ['balanced', 'nourishing', 'hydrating']
    },
}


# ============================================================
# 2. HELPER FUNCTIONS
# ============================================================

def get_user_profile(db: Session, user_id: int) -> Optional[SkinProfile]:
    """Get user's skin profile."""
    return db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()


def get_concern_match_score(product: Product, user_concerns: List[str]) -> float:
    """
    Calculate concern match score (50% of total).
    Returns a score from 0-100 based on how well the product's ingredients
    match the user's concerns.
    """
    if not user_concerns or not product.ingredients_text:
        return 50  # Neutral score if no data
    
    product_ingredients = product.ingredients_text.lower()
    total_concerns = len(user_concerns)
    
    if total_concerns == 0:
        return 50
    
    matched_concerns = 0
    matched_ingredients = []
    
    for concern in user_concerns:
        concern_lower = concern.lower().strip()
        beneficial_ingredients = CONCERN_INGREDIENT_MAP.get(concern_lower, [])
        
        for ing in beneficial_ingredients:
            if ing in product_ingredients:
                matched_concerns += 1
                matched_ingredients.append(ing)
                break
    
    # Calculate score: percentage of concerns matched
    match_percentage = (matched_concerns / total_concerns) * 100
    
    # Cap at 100 and ensure minimum 0
    return min(100, max(0, match_percentage))


def get_skin_type_fit_score(product: Product, skin_type: str) -> float:
    """
    Calculate skin type fit score (35% of total).
    Returns a score from 0-100 based on product suitability for skin type.
    """
    if not skin_type or not product.category:
        return 50  # Neutral score
    
    compatibility = SKIN_TYPE_COMPATIBILITY.get(skin_type, {})
    preferred = compatibility.get('preferred', [])
    avoid = compatibility.get('avoid', [])
    keywords = compatibility.get('keywords', [])
    
    product_category = product.category or ''
    product_name = product.name.lower() if product.name else ''
    product_description = product.description.lower() if product.description else ''
    
    score = 50  # Start neutral
    
    # Check if category is preferred
    for pref in preferred:
        if pref.lower() in product_category.lower():
            score += 20
            break
    
    # Check if category should be avoided
    for av in avoid:
        if av.lower() in product_category.lower():
            score -= 20
            break
    
    # Check for keywords in name/description
    product_text = f"{product_name} {product_description}"
    for keyword in keywords:
        if keyword in product_text:
            score += 5
    
    # Cap at 0-100
    return min(100, max(0, score))


def get_rating_score(product: Product) -> float:
    """
    Calculate rating score (15% of total).
    Returns a score from 0-100 based on product rating.
    """
    if not product.rating or product.rating == 0:
        return 50  # Neutral score
    
    # Scale rating (0-5) to 0-100
    return min(100, (product.rating / 5) * 100)


def calculate_match_percentage(concern_score: float, skin_type_score: float, rating_score: float) -> float:
    """
    Calculate overall match percentage using weights:
    - Concern match: 50%
    - Skin type fit: 35%
    - Rating: 15%
    """
    total = (concern_score * 0.50) + (skin_type_score * 0.35) + (rating_score * 0.15)
    return round(total, 1)


# ============================================================
# 3. MAIN RECOMMENDATION FUNCTION
# ============================================================

def get_product_recommendations(
    db: Session,
    user_id: int,
    limit: int = 20,
    max_price: Optional[float] = None,
    min_rating: float = 0,
    categories: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Get personalized product recommendations for a user.
    
    Args:
        db: Database session
        user_id: User ID
        limit: Maximum number of recommendations to return
        max_price: Optional maximum price filter
        min_rating: Minimum rating filter (0-5)
        categories: Optional list of product categories to filter
    
    Returns:
        List of product recommendations with scores and explanations
    """
    # Get user profile
    profile = get_user_profile(db, user_id)
    if not profile:
        return []
    
    skin_type = profile.skin_type or ''
    concerns_text = profile.skin_concerns or ''
    user_concerns = [c.strip().lower() for c in concerns_text.split(',') if c.strip()]
    
    # Get all products
    query = db.query(Product)
    
    # Apply filters
    if max_price:
        query = query.filter(Product.price <= max_price)
    
    if min_rating > 0:
        query = query.filter(Product.rating >= min_rating)
    
    if categories:
        query = query.filter(Product.category.in_(categories))
    
    products = query.all()
    
    # First, filter by ingredient safety using the Ingredient Intelligence Engine
    product_ids = [p.id for p in products]
    safe_ids = filter_products_by_ingredient_safety(db, product_ids, user_id)
    
    # Create a set for quick lookup
    safe_id_set = set(safe_ids)
    
    # Score each product
    scored_products = []
    
    for product in products:
        # Skip if not safe
        if product.id not in safe_id_set:
            continue
        
        # Calculate individual scores
        concern_score = get_concern_match_score(product, user_concerns)
        skin_type_score = get_skin_type_fit_score(product, skin_type)
        rating_score = get_rating_score(product)
        
        # Calculate overall match
        match_percentage = calculate_match_percentage(concern_score, skin_type_score, rating_score)
        
        # Only include products with at least 30% match
        if match_percentage < 30:
            continue
        
        # Get ingredient analysis for additional context
        ingredient_analysis = analyze_product(db, product.id, user_id)
        safety_score = ingredient_analysis.get('safety_score', {}).get('score', 0)
        
        # Determine match label
        if match_percentage >= 80:
            match_label = '💯 Excellent Match'
        elif match_percentage >= 70:
            match_label = '🌟 Great Match'
        elif match_percentage >= 60:
            match_label = '👍 Good Match'
        elif match_percentage >= 50:
            match_label = '🤔 Consider'
        else:
            match_label = 'ℹ️ Alternative'
        
        scored_products.append({
            'id': product.id,
            'name': product.name,
            'brand': product.brand,
            'category': product.category,
            'price': product.price,
            'rating': product.rating,
            'reviews_count': product.reviews_count,
            'image_url': product.image_url,
            'description': product.description[:200] if product.description else '',
            'ingredients_text': product.ingredients_text[:200] if product.ingredients_text else '',
            'match_percentage': match_percentage,
            'match_label': match_label,
            'scores': {
                'concern_match': round(concern_score, 1),
                'skin_type_fit': round(skin_type_score, 1),
                'rating_score': round(rating_score, 1),
            },
            'safety_score': safety_score,
            'explanation': generate_explanation(concern_score, skin_type_score, rating_score, user_concerns, product)
        })
    
    # Sort by match percentage (highest first)
    scored_products.sort(key=lambda x: x['match_percentage'], reverse=True)
    
    # Return limited results
    return scored_products[:limit]


def generate_explanation(
    concern_score: float,
    skin_type_score: float,
    rating_score: float,
    user_concerns: List[str],
    product: Product
) -> str:
    """
    Generate a human-readable explanation for the recommendation.
    """
    parts = []
    
    # Concern match
    if concern_score >= 70:
        parts.append(f"✅ Matches your concerns ({user_concerns[:2]})")
    elif concern_score >= 40:
        parts.append(f"⚠️ Partially matches your concerns")
    else:
        parts.append(f"❌ May not address your specific concerns")
    
    # Skin type fit
    if skin_type_score >= 70:
        parts.append(f"✅ Suitable for {product.skin_type or 'your'} skin type")
    elif skin_type_score >= 40:
        parts.append(f"⚠️ May work for your skin type")
    else:
        parts.append(f"❌ Not ideal for your skin type")
    
    # Rating
    if rating_score >= 70:
        parts.append(f"⭐ Rated {product.rating}/5 by users")
    elif rating_score >= 40:
        parts.append(f"⭐ Rated {product.rating}/5")
    else:
        parts.append(f"⭐ Rating: {product.rating}/5")
    
    return " | ".join(parts)


# ============================================================
# 4. API HELPER FUNCTIONS
# ============================================================

def get_concern_categories() -> List[str]:
    """Get all available concern categories."""
    return list(CONCERN_INGREDIENT_MAP.keys())


def get_skin_types() -> List[str]:
    """Get all available skin types."""
    return list(SKIN_TYPE_COMPATIBILITY.keys())