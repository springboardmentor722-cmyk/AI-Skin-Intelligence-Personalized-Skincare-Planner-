# backend/recommendation_engine.py

"""
MILESTONE 3 - Recommendation Engine
Generates product recommendations from 3 sources:
1. Rule Engine (based on skin profile concerns)
2. AI Analysis (based on detected skin conditions)
3. Professional (Consultant/Dermatologist manual selection)
"""

import logging
from sqlalchemy.orm import Session
from datetime import datetime
from backend.models import (
    User, SkinProfile, Product, IngredientKnowledge, 
    ProductRecommendation, SkinAssessment
)

logger = logging.getLogger(__name__)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def extract_ingredients_from_text(ingredients_text):
    """
    Extract individual ingredient names from product ingredients text.
    Converts "Water, Glycerin, Dimethicone..." to ["Water", "Glycerin", "Dimethicone"]
    """
    if not ingredients_text:
        return []
    
    # Split by commas and clean
    ingredients = [i.strip().lower() for i in ingredients_text.split(',') if i.strip()]
    return ingredients


def find_ingredient_match(product_ingredients, ingredient_combination):
    """
    Check if any ingredient from the combination exists in the product.
    Returns matching ingredients.
    """
    if not product_ingredients or not ingredient_combination:
        return []
    
    product_ingredients_lower = [i.lower() for i in product_ingredients]
    combination_parts = [p.strip().lower() for p in ingredient_combination.split('+')]
    
    matches = []
    for part in combination_parts:
        # Remove concentrations like "2.5%"
        ingredient_name = part.split('%')[-1].strip()
        if not ingredient_name:
            continue
        # Check if this ingredient exists in product
        for prod_ing in product_ingredients_lower:
            if ingredient_name in prod_ing or prod_ing in ingredient_name:
                matches.append(ingredient_name)
                break
    
    return matches


# ============================================================
# 1. RULE ENGINE RECOMMENDATIONS
# ============================================================

def generate_rule_based_recommendations(db: Session, user_id: int):
    """
    Generate product recommendations based on user's skin profile concerns.
    Reads skin_concerns from SkinProfile → finds matching ingredients from IngredientKnowledge
    → finds products containing those ingredients → creates recommendations.
    """
    print(f"\n🔍 Generating rule-based recommendations for user {user_id}...")
    
    # Get user's skin profile
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == user_id).first()
    if not profile:
        print("   ❌ No skin profile found for user")
        return []
    
    # Get user's concerns
    concerns_text = profile.skin_concerns or ""
    if not concerns_text:
        print("   ⚠️ No skin concerns found in profile")
        return []
    
    concerns = [c.strip().lower() for c in concerns_text.split(',') if c.strip()]
    print(f"   📋 User concerns: {concerns}")
    
    # Find ingredient knowledge matching these concerns
    ingredient_matches = []
    for concern in concerns:
        knowledge = db.query(IngredientKnowledge).filter(
            IngredientKnowledge.concern.ilike(f"%{concern}%")
        ).all()
        for k in knowledge:
            ingredient_matches.append(k)
    
    if not ingredient_matches:
        print("   ⚠️ No ingredient knowledge found for concerns")
        return []
    
    print(f"   📋 Found {len(ingredient_matches)} ingredient knowledge entries")
    
    # Find products containing these ingredients
    all_products = db.query(Product).all()
    recommended_products = []
    
    for knowledge in ingredient_matches:
        ingredient_combination = knowledge.ingredient_combination
        effects = knowledge.effects
        
        for product in all_products:
            # Skip if already recommended
            if product.id in [r[0] for r in recommended_products]:
                continue
            
            # Check if product contains these ingredients
            product_ingredients = extract_ingredients_from_text(product.ingredients_text)
            matches = find_ingredient_match(product_ingredients, ingredient_combination)
            
            if matches:
                recommended_products.append((product.id, knowledge.concern, matches, effects))
    
    if not recommended_products:
        print("   ⚠️ No products found containing matching ingredients")
        return []
    
    print(f"   ✅ Found {len(recommended_products)} product recommendations")
    
    # Insert recommendations into database
    inserted_count = 0
    for product_id, concern, matches, effects in recommended_products:
        # Check if already exists
        existing = db.query(ProductRecommendation).filter(
            ProductRecommendation.user_id == user_id,
            ProductRecommendation.product_id == product_id,
            ProductRecommendation.source == "rule_engine"
        ).first()
        
        if existing:
            continue
        
        reason = f"Matches your concern: {concern}. Contains: {', '.join(matches[:3])}"
        if effects:
            reason += f" | Benefits: {effects[:100]}"
        
        recommendation = ProductRecommendation(
            user_id=user_id,
            product_id=product_id,
            source="rule_engine",
            recommended_by=None,
            reason=reason[:255],
            matching_concerns=[concern],
            created_at=datetime.utcnow()
        )
        
        db.add(recommendation)
        inserted_count += 1
        
        if inserted_count % 50 == 0:
            db.commit()
    
    db.commit()
    print(f"   ✅ Inserted {inserted_count} rule-based recommendations")
    
    return recommended_products


# ============================================================
# 2. AI ANALYSIS RECOMMENDATIONS
# ============================================================

def generate_ai_based_recommendations(db: Session, user_id: int, detected_concerns: list):
    """
    Generate product recommendations based on AI-detected skin conditions.
    detected_concerns: list of strings like ["Acne", "Oily", "Wrinkles"]
    """
    print(f"\n🤖 Generating AI-based recommendations for user {user_id}...")
    print(f"   📋 Detected concerns: {detected_concerns}")
    
    if not detected_concerns:
        print("   ⚠️ No detected concerns provided")
        return []
    
    # Find ingredient knowledge for detected concerns
    ingredient_matches = []
    for concern in detected_concerns:
        knowledge = db.query(IngredientKnowledge).filter(
            IngredientKnowledge.concern.ilike(f"%{concern}%")
        ).all()
        for k in knowledge:
            ingredient_matches.append(k)
    
    if not ingredient_matches:
        print("   ⚠️ No ingredient knowledge found for detected concerns")
        return []
    
    # Find products
    all_products = db.query(Product).all()
    recommended_products = []
    
    for knowledge in ingredient_matches:
        ingredient_combination = knowledge.ingredient_combination
        effects = knowledge.effects
        
        for product in all_products:
            if product.id in [r[0] for r in recommended_products]:
                continue
            
            product_ingredients = extract_ingredients_from_text(product.ingredients_text)
            matches = find_ingredient_match(product_ingredients, ingredient_combination)
            
            if matches:
                recommended_products.append((product.id, knowledge.concern, matches, effects))
    
    if not recommended_products:
        print("   ⚠️ No products found for detected concerns")
        return []
    
    # Insert recommendations
    inserted_count = 0
    for product_id, concern, matches, effects in recommended_products:
        existing = db.query(ProductRecommendation).filter(
            ProductRecommendation.user_id == user_id,
            ProductRecommendation.product_id == product_id,
            ProductRecommendation.source == "ai_analysis"
        ).first()
        
        if existing:
            continue
        
        reason = f"AI detected: {concern}. Contains: {', '.join(matches[:3])}"
        
        recommendation = ProductRecommendation(
            user_id=user_id,
            product_id=product_id,
            source="ai_analysis",
            recommended_by=None,
            reason=reason[:255],
            matching_concerns=[concern],
            created_at=datetime.utcnow()
        )
        
        db.add(recommendation)
        inserted_count += 1
        
        if inserted_count % 50 == 0:
            db.commit()
    
    db.commit()
    print(f"   ✅ Inserted {inserted_count} AI-based recommendations")
    
    return recommended_products


# ============================================================
# 3. PROFESSIONAL RECOMMENDATIONS
# ============================================================

def generate_professional_recommendation(
    db: Session, 
    professional_id: int, 
    user_id: int, 
    product_id: int, 
    reason: str = None,
    source: str = "consultant"
):
    """
    Generate a professional recommendation.
    source: "consultant" or "dermatologist"
    """
    print(f"\n👨‍⚕️ Generating professional recommendation...")
    print(f"   Professional: {professional_id}")
    print(f"   User: {user_id}")
    print(f"   Product: {product_id}")
    
    # Verify product exists
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        print("   ❌ Product not found")
        return None
    
    # Check if already exists
    existing = db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == user_id,
        ProductRecommendation.product_id == product_id,
        ProductRecommendation.source == source,
        ProductRecommendation.recommended_by == professional_id
    ).first()
    
    if existing:
        print("   ⚠️ Recommendation already exists")
        return existing
    
    # Create recommendation
    if not reason:
        reason = f"Recommended by professional for your skin needs"
    
    recommendation = ProductRecommendation(
        user_id=user_id,
        product_id=product_id,
        source=source,
        recommended_by=professional_id,
        reason=reason[:255],
        matching_concerns=[],
        created_at=datetime.utcnow()
    )
    
    db.add(recommendation)
    db.commit()
    
    print(f"   ✅ Professional recommendation created!")
    return recommendation


# ============================================================
# 4. GET RECOMMENDATIONS FOR USER
# ============================================================

def get_user_recommendations(db: Session, user_id: int, limit: int = 20):
    """
    Get all recommendations for a user, ordered by source priority.
    Priority: Professional > AI > Rule Engine
    """
    recommendations = db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == user_id
    ).order_by(
        # Professional first, then AI, then Rule Engine
        ProductRecommendation.source
    ).limit(limit).all()
    
    return recommendations


# ============================================================
# 5. REGENERATE RECOMMENDATIONS FOR USER
# ============================================================

def regenerate_user_recommendations(db: Session, user_id: int):
    """
    Clear and regenerate all recommendations for a user.
    """
    print(f"\n🔄 Regenerating all recommendations for user {user_id}...")
    
    # Clear existing recommendations (keep professional ones)
    db.query(ProductRecommendation).filter(
        ProductRecommendation.user_id == user_id,
        ProductRecommendation.source.in_(["rule_engine", "ai_analysis"])
    ).delete()
    db.commit()
    
    # Generate new recommendations
    generate_rule_based_recommendations(db, user_id)
    
    # Check if user has AI assessment
    assessment = db.query(SkinAssessment).filter(
        SkinAssessment.user_id == user_id
    ).order_by(SkinAssessment.created_at.desc()).first()
    
    if assessment and assessment.detected_concerns:
        generate_ai_based_recommendations(db, user_id, assessment.detected_concerns)
    
    print(f"   ✅ Recommendations regenerated!")