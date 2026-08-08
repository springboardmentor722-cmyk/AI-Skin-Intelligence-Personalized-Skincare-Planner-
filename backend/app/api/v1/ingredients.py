from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from uuid import UUID
import json

from app.api import deps
from app.models.user import User
from app.models.product import Ingredient, Product
from app.models.profile import SkinProfile
from app.services.ingredient_engine import IngredientEngine

router = APIRouter()

@router.post("/analyze")
def analyze_product_ingredients(
    product_id: str = Query(..., description="The ID of the product to analyze"),
    routine_time: str = Query("Evening", description="Morning or Evening"),
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Receives a product's ingredient list and routine time, returning an overall safety score (0-100), 
    status label (Safe, Warning, Unsafe), allergy alerts, and detailed interaction warnings.
    """
    from app.models.skin_screening import SkinScreening
    
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    
    user_allergies = []
    user_sensitivities = []
    
    if profile:
        if profile.allergies:
            user_allergies = [a.strip() for a in profile.allergies.split(",")]
        if profile.sensitivities:
            user_sensitivities = [s.strip() for s in profile.sensitivities.split(",")]
            
    product_ingredients = [ing.name for ing in product.ingredients]
    
    result = IngredientEngine.evaluate_safety(
        product_ingredients=product_ingredients,
        user_allergies=user_allergies,
        user_sensitivities=user_sensitivities,
        routine_time=routine_time
    )
    
    return result

@router.get("/intelligence")
def get_ingredient_intelligence(
    db: Session = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user)
):
    profile = db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).first()
    
    user_allergies = []
    user_sensitivities = []
    skin_type = "normal"
    concerns = []

    if profile:
        if profile.allergies:
            user_allergies = [a.strip().lower() for a in profile.allergies.split(",") if a.strip()]
        if profile.sensitivities:
            user_sensitivities = [s.strip().lower() for s in profile.sensitivities.split(",") if s.strip()]
        if profile.skin_type:
            skin_type = profile.skin_type.lower()
        if profile.skin_concerns:
            concerns = [c.strip().lower() for c in profile.skin_concerns.split(",") if c.strip()]
        
    # Fetch ingredients from database
    ingredients = db.query(Ingredient).all()
    
    # Sensitivities/Irritant risk map
    HARSH_INGREDIENTS = ["salicylic acid", "glycolic acid", "retinol", "tretinoin", "benzoyl peroxide", "alcohol denat", "lactic acid"]
    
    results = []
    for ing in ingredients:
        is_safe = True
        warning = ""
        conflicts = []
        ing_name_lower = ing.name.lower()
        
        # 1. Check allergies
        for a in user_allergies:
            if a in ing_name_lower or ing_name_lower in a:
                is_safe = False
                warning = f"Matches your reported allergy '{a.capitalize()}'"
                break
                
        # 2. Check sensitivities
        if is_safe and user_sensitivities:
            for s in user_sensitivities:
                if s in ing_name_lower or ing_name_lower in s or (s == "sensitive" and any(h in ing_name_lower for h in HARSH_INGREDIENTS)):
                    is_safe = False
                    warning = f"Potentially irritating for your '{s.capitalize()}' skin profile"
                    break

        # 3. Check skin type incompatibility
        if is_safe and skin_type == "dry" and any(h in ing_name_lower for h in ["salicylic acid", "benzoyl peroxide", "alcohol"]):
            is_safe = False
            warning = f"Drying active — use with caution on Dry skin"
        elif is_safe and skin_type == "sensitive" and any(h in ing_name_lower for h in HARSH_INGREDIENTS):
            is_safe = False
            warning = f"Strong active — may cause redness on Sensitive skin"
            
        if ing.base_conflicts:
            conflicts.extend([c.strip() for c in ing.base_conflicts.split("|") if c.strip()])
            
        if not conflicts:
            conflicts = ["No major chemical interactions recorded."]
            
        results.append({
            "name": ing.name,
            "category": ing.category or "Skincare Active",
            "description": ing.description or "Active ingredient evaluated for safety and compatibility.",
            "safe": is_safe,
            "warning": warning,
            "conflicts": conflicts
        })
        
    return results
