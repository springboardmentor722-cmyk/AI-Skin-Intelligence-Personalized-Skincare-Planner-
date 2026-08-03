from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app import models
from app.auth import get_current_user
from app.database import get_db, get_mongo_db

router = APIRouter(prefix="/api/ingredients", tags=["Ingredients Safety"])

class SafetyScoreRequest(BaseModel):
    ingredients_list: List[str]  # e.g., ["Retinol", "Salicylic Acid", "Niacinamide"]
    time_of_day: Optional[str] = "PM"  # "AM" or "PM"

class AllergyAlert(BaseModel):
    ingredient: str
    matched_allergen: str

class ConflictWarning(BaseModel):
    active_1: str
    active_2: str
    severity: str
    reason: str

class SafetyScoreOut(BaseModel):
    score: int
    status: str  # "Safe", "Warning", "Unsafe"
    allergy_alerts: List[AllergyAlert]
    conflicts: List[ConflictWarning]

@router.post("/safety-score", response_model=SafetyScoreOut)
def calculate_safety_score(
    payload: SafetyScoreRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    mongo = get_mongo_db()
    
    # 1. Fetch user's profile to get allergies & sensitivities
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    allergies = []
    sensitivities = []
    if profile:
        if profile.allergies:
            allergies = [a.strip().lower() for a in profile.allergies.replace("[", "").replace("]", "").replace('"', "").split(",") if a.strip()]
        if profile.skin_sensitivities:
            sensitivities = [s.strip().lower() for s in profile.skin_sensitivities.replace("[", "").replace("]", "").replace('"', "").split(",") if s.strip()]

    # Normalized input ingredients
    input_ingredients_lower = [i.strip().lower() for i in payload.ingredients_list if i.strip()]

    # 2. Allergy & Sensitivity Matching
    allergy_alerts = []
    for ing in payload.ingredients_list:
        ing_lower = ing.strip().lower()
        # Direct or alias matching
        for allergen in allergies:
            if allergen in ing_lower or ing_lower in allergen:
                allergy_alerts.append(AllergyAlert(ingredient=ing, matched_allergen=allergen))
        for sens in sensitivities:
            if sens in ing_lower or ing_lower in sens:
                allergy_alerts.append(AllergyAlert(ingredient=ing, matched_allergen=sens))

    # 3. Detect Chemical active categories
    # Match input ingredients against seeded ingredients knowledge base in MongoDB
    db_ingredients = list(mongo.ingredients.find())
    detected_actives = []
    for ing_lower in input_ingredients_lower:
        for db_ing in db_ingredients:
            db_ing_name = db_ing.get("name", "").lower()
            is_match = db_ing_name in ing_lower or ing_lower in db_ing_name
            if db_ing_name == "ahas/bhas" and ("salicylic" in ing_lower or "glycolic" in ing_lower or "lactic" in ing_lower or "aha" in ing_lower or "bha" in ing_lower):
                is_match = True
            elif db_ing_name == "retinoids" and ("retin" in ing_lower or "tretinoin" in ing_lower or "adapalene" in ing_lower or "tazarotene" in ing_lower):
                is_match = True
            elif db_ing_name == "vitamin c" and ("ascorb" in ing_lower):
                is_match = True
            
            if is_match:
                if db_ing.get("name") not in detected_actives:
                    detected_actives.append(db_ing.get("name"))

    # 4. Check Conflict Matrix
    conflicts = []
    if len(detected_actives) > 1:
        # Check pairs of detected actives
        for idx, active_1 in enumerate(detected_actives):
            for active_2 in detected_actives[idx+1:]:
                # Query conflict matrix
                rule = mongo.conflict_matrix.find_one({
                    "$or": [
                        {"active_1": active_1, "active_2": active_2},
                        {"active_1": active_2, "active_2": active_1}
                    ]
                })
                if rule:
                    conflicts.append(ConflictWarning(
                        active_1=active_1,
                        active_2=active_2,
                        severity=rule.get("severity", "caution"),
                        reason=rule.get("reason", "")
                    ))

    # 5. Compute Safety Score (0-100)
    score = 100
    status = "Safe"

    if allergy_alerts:
        score = 0
        status = "Unsafe"
    else:
        # Deduct for conflicts
        has_unsafe = False
        has_caution = False
        for c in conflicts:
            if c.severity == "unsafe":
                score -= 40
                has_unsafe = True
            elif c.severity == "caution":
                score -= 15
                has_caution = True
        
        # Clamp score between 0 and 100
        score = max(0, min(100, score))
        
        # Determine status
        if has_unsafe or score < 50:
            status = "Unsafe"
        elif has_caution or score < 85:
            status = "Warning"

    return SafetyScoreOut(
        score=score,
        status=status,
        allergy_alerts=allergy_alerts,
        conflicts=conflicts
    )
