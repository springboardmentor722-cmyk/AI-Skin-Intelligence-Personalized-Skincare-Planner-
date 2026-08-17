from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from app import models
from app.auth import get_current_user
from app.database import get_db, get_mongo_db
from app.services.inci_parser import INCIParserEngine

router = APIRouter(tags=["Ingredients Safety"])

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

# Legacy endpoint /api/ingredients/safety-score
@router.post("/api/ingredients/safety-score", response_model=SafetyScoreOut)
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
        for allergen in allergies:
            if allergen in ing_lower or ing_lower in allergen:
                allergy_alerts.append(AllergyAlert(ingredient=ing, matched_allergen=allergen))
        for sens in sensitivities:
            if sens in ing_lower or ing_lower in sens:
                allergy_alerts.append(AllergyAlert(ingredient=ing, matched_allergen=sens))

    # 3. Detect Chemical active categories
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
        for idx, active_1 in enumerate(detected_actives):
            for active_2 in detected_actives[idx+1:]:
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
        has_unsafe = False
        has_caution = False
        for c in conflicts:
            if c.severity == "unsafe":
                score -= 40
                has_unsafe = True
            elif c.severity == "caution":
                score -= 15
                has_caution = True
        
        score = max(0, min(100, score))
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

class CompatibilityRequest(BaseModel):
    actives: List[str]

class CompatibilityOut(BaseModel):
    compatible: bool
    conflicts: List[ConflictWarning]

# Explicit endpoints for PDF spec and backward compatibility
@router.post("/api/v1/ingredients/analyze-compatibility", response_model=CompatibilityOut)
@router.post("/api/ingredients/v1/analyze-compatibility", response_model=CompatibilityOut)
def analyze_compatibility(
    payload: CompatibilityRequest,
    current_user: models.User = Depends(get_current_user)
):
    mongo = get_mongo_db()
    conflicts = []
    actives_lower = [a.strip().lower() for a in payload.actives if a.strip()]

    # Explicit hardcoded active conflicts fallback if conflict_matrix is empty
    HARDCODED_CONFLICTS = {
        ("retinol", "salicylic acid"): ("unsafe", "Concurrent use of Retinoids and BHAs significantly increases irritation & peeling risks."),
        ("retinoids", "ahas/bhas"): ("unsafe", "Concurrent use of Retinoids and AHAs/BHAs disrupts moisture barrier."),
        ("vitamin c", "retinoids"): ("caution", "Vitamin C at low pH can destabilize Retinoids; use Vitamin C AM and Retinoids PM.")
    }

    if len(actives_lower) > 1:
        for idx, act_1 in enumerate(actives_lower):
            for act_2 in actives_lower[idx+1:]:
                rule = mongo.conflict_matrix.find_one({
                    "$or": [
                        {"active_1": act_1, "active_2": act_2},
                        {"active_1": act_2, "active_2": act_1}
                    ]
                })
                if rule:
                    conflicts.append(ConflictWarning(
                        active_1=act_1,
                        active_2=act_2,
                        severity=rule.get("severity", "caution"),
                        reason=rule.get("reason", "")
                    ))
                else:
                    # Check hardcoded fallbacks
                    for (c1, c2), (sev, reas) in HARDCODED_CONFLICTS.items():
                        if (c1 in act_1 and c2 in act_2) or (c2 in act_1 and c1 in act_2):
                            conflicts.append(ConflictWarning(
                                active_1=act_1,
                                active_2=act_2,
                                severity=sev,
                                reason=reas
                            ))

    compatible = len([c for c in conflicts if c.severity == "unsafe"]) == 0
    return CompatibilityOut(compatible=compatible, conflicts=conflicts)


class INCIParseRequest(BaseModel):
    raw_inci: str

@router.post("/api/v1/ingredients/parse-inci")
@router.post("/api/ingredients/parse-inci")
def parse_inci_text(payload: INCIParseRequest):
    """
    INCI Text Parsing Engine endpoint:
    Converts raw product ingredient strings into tokenized arrays,
    extracts active categories, and flags fragrance/allergen triggers.
    """
    return INCIParserEngine.parse(payload.raw_inci)


class AllergyCheckRequest(BaseModel):
    product_ingredients: List[str]

@router.post("/api/v1/ingredients/check-allergies")
def check_user_allergies(
    payload: AllergyCheckRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Compares product ingredients directly against user profile sensitivity arrays.
    Returns safety rating: Safe, Caution, or Unsafe.
    """
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    user_allergies = []
    user_sensitivities = []
    if profile:
        if profile.allergies:
            user_allergies = [a.strip().lower() for a in profile.allergies.replace("[", "").replace("]", "").replace('"', "").split(",") if a.strip()]
        if profile.skin_sensitivities:
            user_sensitivities = [s.strip().lower() for s in profile.skin_sensitivities.replace("[", "").replace("]", "").replace('"', "").split(",") if s.strip()]

    allergens_set = set(user_allergies + user_sensitivities)
    flagged = []

    for ing in payload.product_ingredients:
        ing_lower = ing.strip().lower()
        for allergen in allergens_set:
            if allergen in ing_lower or ing_lower in allergen:
                flagged.append({"ingredient": ing, "matched_allergen": allergen})

    rating = "Safe"
    if flagged:
        rating = "Unsafe"

    return {
        "safety_rating": rating,
        "flagged_allergens": flagged,
        "user_sensitivities_checked": list(allergens_set)
    }


@router.get("/api/v1/ingredients/educational-context")
@router.get("/api/ingredients/educational-context")
def get_educational_context(name: Optional[str] = None):
    """
    Provides response payloads explaining ingredient functions, benefits, pH ranges,
    synergies, and usage warnings.
    """
    mongo = get_mongo_db()
    ingredients = list(mongo.ingredients.find())
    
    # Strip ObjectId for JSON serialization
    results = []
    for ing in ingredients:
        ing_copy = dict(ing)
        if "_id" in ing_copy:
            ing_copy["id"] = str(ing_copy["_id"])
            del ing_copy["_id"]
        
        if name:
            if name.lower() in ing_copy.get("name", "").lower():
                results.append(ing_copy)
        else:
            results.append(ing_copy)

    return {"ingredients": results}
