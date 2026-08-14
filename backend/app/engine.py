"""
Skin Intelligence Engine
------------------------
This module contains the "AI" decision logic for the platform: skin condition
scoring, concern prioritization, routine generation, ingredient suitability,
and product recommendation.

It is implemented as a transparent, explainable RULE-BASED engine rather than
a trained ML model, because at project start there is no historical skin/
outcome dataset to train on. This matches how most real skincare-AI MVPs
start (rules first, curated by domain logic), and it is intentionally
structured so each function can later be swapped for a trained scikit-learn /
XGBoost model without changing the API layer above it -- only the inside of
these functions would change.

Weighted Skin Health Score formula (from the product spec):
    overall = 0.35*condition + 0.20*lifestyle + 0.15*sleep
              + 0.20*routine_consistency + 0.10*hydration
"""
from typing import List, Dict
from . import models

CONCERN_BASE_SEVERITY = {
    "acne": 55, "hyperpigmentation": 45, "dark_spots": 40, "dry_skin": 35,
    "oily_skin": 35, "sensitive_skin": 40, "wrinkles": 30, "fine_lines": 30,
    "redness": 45, "uneven_skin_tone": 35,
}

RISK_LIFESTYLE_FACTORS = {
    "smoking": "Smoking accelerates collagen breakdown and dulls skin tone.",
    "high_stress": "Chronic stress raises cortisol, which can worsen acne and inflammation.",
    "poor_diet": "A high-sugar/processed diet is linked to breakouts and dull skin.",
    "excessive_sun_exposure": "Unprotected sun exposure increases pigmentation and premature aging risk.",
    "low_water_intake": "Inadequate hydration reduces skin barrier resilience.",
}

ENV_RISK_FACTORS = {
    "high_pollution": "High pollution exposure increases oxidative stress on skin.",
    "high_uv": "High UV exposure area increases risk of pigmentation and photoaging.",
    "dry_climate": "Dry climate strips moisture faster, aggravating barrier issues.",
    "high_humidity": "High humidity can increase oil production and breakout risk.",
}


# ---------------------------------------------------------------------------
# 1. Skin Assessment Engine
# ---------------------------------------------------------------------------
def concern_severity_score(profile: models.SkinProfile, concern: str) -> float:
    """
    Computes the rule-based severity (0-100) of a single concern for a given
    profile. Exposed as its own function (rather than inlined in
    run_skin_assessment) so it can also be used as the "ground truth" label
    generator when bootstrapping training data for the ML models in
    backend/app/ml/train_models.py -- see that file for why we train models
    on rule-generated labels instead of waiting for real outcome data.
    """
    base = CONCERN_BASE_SEVERITY.get(concern, 40)
    adjustment = 0
    if profile.sleep_quality in ("poor",):
        adjustment += 8
    if profile.water_intake_liters < 1.5:
        adjustment += 6
    if "high_uv" in (profile.environmental_exposure or []) and concern in ("hyperpigmentation", "dark_spots", "wrinkles", "fine_lines"):
        adjustment += 10
    if "high_pollution" in (profile.environmental_exposure or []):
        adjustment += 5
    if "smoking" in (profile.lifestyle_habits or []):
        adjustment += 7
    return round(min(100, base + adjustment), 1)


def profile_to_dict(profile: models.SkinProfile) -> dict:
    """Converts a SkinProfile SQLAlchemy row into the plain dict shape the
    ML feature-engineering code (app/ml/features.py) expects."""
    return {
        "skin_type": profile.skin_type,
        "age_group": profile.age_group,
        "skin_concerns": profile.skin_concerns or [],
        "allergies": profile.allergies or [],
        "sensitivities": profile.sensitivities or [],
        "lifestyle_habits": profile.lifestyle_habits or [],
        "sleep_quality": profile.sleep_quality,
        "sleep_hours": profile.sleep_hours,
        "water_intake_liters": profile.water_intake_liters,
        "environmental_exposure": profile.environmental_exposure or [],
        "budget_range": profile.budget_range,
    }


def run_skin_assessment_hybrid(profile: models.SkinProfile) -> dict:
    """
    Same output shape as run_skin_assessment, but scores each concern with
    the trained XGBoost model when it's available (app/ml/predict.py),
    falling back to the rule engine per-concern automatically otherwise.
    Also reports which method produced the numbers, for transparency.
    """
    from .ml import predict as ml_predict  # local import avoids a circular import at module load time

    concerns = profile.skin_concerns or []
    profile_dict = profile_to_dict(profile)

    condition_scores: Dict[str, float] = {}
    method_used = "rules"
    for concern in concerns:
        score, method = ml_predict.predict_concern_severity(
            profile_dict, concern, fallback_fn=lambda c=concern: concern_severity_score(profile, c)
        )
        condition_scores[concern] = score
        if method == "ml":
            method_used = "ml"

    overall_condition = round(sum(condition_scores.values()) / len(condition_scores), 1) if condition_scores else 20.0
    prioritized = sorted(condition_scores, key=lambda c: condition_scores[c], reverse=True)

    risk_factors = []
    for habit in (profile.lifestyle_habits or []):
        if habit in RISK_LIFESTYLE_FACTORS:
            risk_factors.append(RISK_LIFESTYLE_FACTORS[habit])
    for env in (profile.environmental_exposure or []):
        if env in ENV_RISK_FACTORS:
            risk_factors.append(ENV_RISK_FACTORS[env])
    if profile.water_intake_liters < 1.5:
        risk_factors.append("Low daily water intake may be affecting skin hydration.")
    if profile.sleep_quality == "poor":
        risk_factors.append("Poor sleep quality is a known driver of skin dullness and slower repair.")

    return {
        "concerns_identified": concerns,
        "condition_scores": condition_scores,
        "overall_condition_score": overall_condition,
        "prioritized_concerns": prioritized,
        "risk_factors": risk_factors,
        "scoring_method": method_used,
    }


def run_skin_assessment(profile: models.SkinProfile) -> dict:
    concerns = profile.skin_concerns or []
    condition_scores: Dict[str, float] = {concern: concern_severity_score(profile, concern) for concern in concerns}

    overall_condition = round(sum(condition_scores.values()) / len(condition_scores), 1) if condition_scores else 20.0

    # Prioritize: highest severity first
    prioritized = sorted(condition_scores, key=lambda c: condition_scores[c], reverse=True)

    risk_factors = []
    for habit in (profile.lifestyle_habits or []):
        if habit in RISK_LIFESTYLE_FACTORS:
            risk_factors.append(RISK_LIFESTYLE_FACTORS[habit])
    for env in (profile.environmental_exposure or []):
        if env in ENV_RISK_FACTORS:
            risk_factors.append(ENV_RISK_FACTORS[env])
    if profile.water_intake_liters < 1.5:
        risk_factors.append("Low daily water intake may be affecting skin hydration.")
    if profile.sleep_quality == "poor":
        risk_factors.append("Poor sleep quality is a known driver of skin dullness and slower repair.")

    return {
        "concerns_identified": concerns,
        "condition_scores": condition_scores,
        "overall_condition_score": overall_condition,
        "prioritized_concerns": prioritized,
        "risk_factors": risk_factors,
    }


# ---------------------------------------------------------------------------
# 2. Personalized Routine Generator
# ---------------------------------------------------------------------------
def generate_routine(profile: models.SkinProfile, routine_type: str, season: str = None) -> List[dict]:
    concerns = set(profile.skin_concerns or [])
    skin_type = profile.skin_type

    steps = []
    order = 1

    def add(category, product_category, instruction):
        nonlocal order
        steps.append({"order": order, "category": category, "product_category": product_category, "instruction": instruction})
        order += 1

    if routine_type == "morning":
        add("Cleansing", "Face Wash", f"Use a gentle cleanser suited for {skin_type} skin.")
        if "dry_skin" in concerns or skin_type == "dry":
            add("Toning", "Toner", "Apply a hydrating, alcohol-free toner.")
        if "hyperpigmentation" in concerns or "dark_spots" in concerns or "uneven_skin_tone" in concerns:
            add("Treatment", "Serum", "Apply a Vitamin C serum to brighten and even out tone.")
        elif "acne" in concerns or "oily_skin" in concerns:
            add("Treatment", "Serum", "Apply a Niacinamide serum to control oil and reduce breakouts.")
        add("Moisturizing", "Moisturizer", f"Apply a lightweight moisturizer suited for {skin_type} skin.")
        add("Sun Protection", "Sunscreen", "Apply broad-spectrum SPF 30+ sunscreen. Never skip this step.")

    elif routine_type == "evening":
        add("Cleansing", "Face Wash", "Double cleanse to remove sunscreen, makeup, and pollution buildup.")
        if "acne" in concerns:
            add("Treatment", "Treatment Products", "Apply a salicylic acid (BHA) treatment 2-3 nights a week.")
        if "wrinkles" in concerns or "fine_lines" in concerns:
            add("Treatment", "Serum", "Apply a retinoid at night, starting 2x/week and building tolerance.")
        if "sensitive_skin" in concerns or "redness" in concerns:
            add("Treatment", "Serum", "Use a soothing serum with centella asiatica or ceramides instead of actives.")
        add("Moisturizing", "Moisturizer", "Apply a richer night moisturizer or sleeping mask to support repair.")
        add("Night Care", "Night Care", "Ensure pillowcase is clean and avoid touching face overnight.")

    elif routine_type == "weekly":
        add("Exfoliation", "Treatment Products", "Exfoliate 1-2x/week with an AHA/BHA suited to your skin type.")
        add("Treatment", "Face Masks", "Use a treatment mask matched to your top concern (clay for oily, hydrating for dry).")

    elif routine_type == "seasonal":
        if season == "winter":
            add("Moisturizing", "Moisturizer", "Switch to a richer, ceramide-based moisturizer for winter dryness.")
            add("Treatment", "Serum", "Add a hyaluronic acid serum under moisturizer for extra hydration.")
        elif season == "summer":
            add("Sun Protection", "Sunscreen", "Switch to a lightweight, matte-finish, sweat-resistant SPF 50.")
            add("Cleansing", "Face Wash", "Consider a gel cleanser to manage extra oil and sweat.")
        else:
            add("Moisturizing", "Moisturizer", "Adjust moisturizer richness to current weather and humidity.")

    return steps


# ---------------------------------------------------------------------------
# 3. Ingredient Intelligence
# ---------------------------------------------------------------------------
def check_ingredient_suitability(ingredient: models.Ingredient, profile: models.SkinProfile) -> dict:
    warnings = []
    suitable = True

    for allergy in (profile.allergies or []):
        if allergy.lower() in [c.lower() for c in (ingredient.cautions or [])] or allergy.lower() == ingredient.name.lower():
            warnings.append(f"Contains/relates to a declared allergen: {allergy}")
            suitable = False

    if profile.skin_type and ingredient.good_for_skin_types and profile.skin_type not in ingredient.good_for_skin_types:
        warnings.append(f"Not commonly recommended for {profile.skin_type} skin.")

    if "sensitive_skin" in (profile.skin_concerns or []) and ingredient.category in ("Retinoids", "AHAs/BHAs"):
        warnings.append("Strong active ingredient - introduce slowly and patch test for sensitive skin.")

    return {
        "ingredient": ingredient.name,
        "suitable": suitable,
        "warnings": warnings,
    }


def check_ingredient_interactions(ingredient_names: List[str], all_ingredients: Dict[str, models.Ingredient]) -> List[str]:
    conflicts = []
    names_lower = [n.lower() for n in ingredient_names]
    for name in ingredient_names:
        ing = all_ingredients.get(name.lower())
        if not ing:
            continue
        for conflict in (ing.conflicts_with or []):
            if conflict.lower() in names_lower:
                conflicts.append(f"{ing.name} should not be combined with {conflict} in the same routine step.")
    return conflicts


# ---------------------------------------------------------------------------
# 4. Product Recommendation Engine
# ---------------------------------------------------------------------------
BUDGET_CEILINGS = {"low": 800, "medium": 2000, "high": 999999}


def score_product_for_profile(product: models.Product, profile: models.SkinProfile) -> Dict:
    score = 50.0
    reasons = []

    if profile.skin_type in (product.suitable_skin_types or []):
        score += 20
        reasons.append(f"matches your {profile.skin_type} skin type")

    matched_concerns = set(product.suitable_concerns or []) & set(profile.skin_concerns or [])
    if matched_concerns:
        score += min(25, 8 * len(matched_concerns))
        reasons.append(f"targets your concerns: {', '.join(matched_concerns)}")

    blocked = set(a.lower() for a in (profile.allergies or [])) & set(i.lower() for i in (product.key_ingredients or []))
    if blocked:
        score -= 60
        reasons.append(f"CAUTION: contains {', '.join(blocked)} which you've flagged as an allergen")

    ceiling = BUDGET_CEILINGS.get(profile.budget_range, 2000)
    if product.price <= ceiling:
        score += 5
        reasons.append("fits your budget range")
    else:
        score -= 10
        reasons.append("above your usual budget range")

    score = max(0, min(100, score))
    reason_text = "Recommended because it " + "; ".join(reasons) + "." if reasons else "General match for your profile."
    return {"score": round(score, 1), "reason": reason_text}

def score_products_for_profile_hybrid(products: List[models.Product], profile: models.SkinProfile) -> List[dict]:
    """
    True Hybrid Recommendation System:
    Combines NLP Content-Based TF-IDF similarity with strict Knowledge-Based rule filtering.
    """
    from .ml import recommender
    
    if not products:
        return []

    profile_dict = profile_to_dict(profile)
    product_dicts = [
        {
            "category": p.category,
            "key_ingredients": p.key_ingredients or [],
            "suitable_concerns": p.suitable_concerns or [],
            "description": p.description or ""
        }
        for p in products
    ]

    # Content-Based Scores (0.0 to 1.0)
    content_scores = recommender.compute_content_similarity(profile_dict, product_dicts)

    results = []
    for idx, product in enumerate(products):
        # Knowledge-Based Score (0 to 100)
        rule_result = score_product_for_profile(product, profile)
        knowledge_score = rule_result["score"]
        
        # Scale content score to 100
        content_score_100 = content_scores[idx] * 100
        
        # Hybrid blend: 60% NLP Content similarity + 40% strict Knowledge rules
        hybrid_score = round((content_score_100 * 0.6) + (knowledge_score * 0.4), 1)
        
        # Severe penalization if the rule engine flagged an allergen (which drops knowledge score heavily)
        if knowledge_score < 40:
            hybrid_score = min(hybrid_score, knowledge_score)

        results.append({
            "product": product,
            "score": hybrid_score,
            "reason": rule_result["reason"],
            "method": "hybrid_tfidf"
        })
    
    return results



def score_product_for_profile_hybrid(product: models.Product, profile: models.SkinProfile) -> dict:
    # Retained for single-product endpoints like /compare
    result = score_products_for_profile_hybrid([product], profile)
    return result[0]


def blend_photo_signals(condition_scores: Dict[str, float], photo_signals: dict) -> Dict[str, float]:
    """
    Blends photo-based CV signal estimates (see cv_engine.py) into the
    questionnaire-derived condition scores. Each concern is only adjusted if
    the photo pipeline produced a relevant, valid signal; everything else is
    left untouched. Blend is a simple 60/40 weighted average (questionnaire-
    weighted higher, since it's the most direct source of truth about how the
    person's skin behaves) -- documented here so it's easy to defend/tune.
    """
    if not photo_signals or not photo_signals.get("face_detected"):
        return condition_scores

    blended = dict(condition_scores)
    redness = photo_signals.get("redness_score")
    texture = photo_signals.get("texture_score")
    evenness = photo_signals.get("evenness_score")
    oiliness = photo_signals.get("oiliness_score")

    if redness is not None and "redness" in blended:
        blended["redness"] = round(blended["redness"] * 0.6 + redness * 0.4, 1)
    if texture is not None:
        for concern in ("wrinkles", "fine_lines"):
            if concern in blended:
                blended[concern] = round(blended[concern] * 0.6 + texture * 0.4, 1)
    if evenness is not None and "uneven_skin_tone" in blended:
        unevenness = 100 - evenness
        blended["uneven_skin_tone"] = round(blended["uneven_skin_tone"] * 0.6 + unevenness * 0.4, 1)
    if oiliness is not None and "oily_skin" in blended:
        blended["oily_skin"] = round(blended["oily_skin"] * 0.6 + oiliness * 0.4, 1)

    return blended


# ---------------------------------------------------------------------------
# 5. Skin Health Scoring Engine (weighted model from spec)
# ---------------------------------------------------------------------------
def compute_skin_health_score(
    overall_condition_score: float,
    profile: models.SkinProfile,
    routine_consistency_percent: float,
) -> dict:
    # Condition score: invert severity (lower severity = healthier), 0-100
    condition_score = round(100 - overall_condition_score, 1)

    lifestyle_penalty = 5 * len(profile.lifestyle_habits or [])
    lifestyle_score = max(0, round(100 - lifestyle_penalty, 1))

    sleep_map = {"poor": 30, "average": 60, "good": 85, "excellent": 100}
    sleep_score = sleep_map.get(profile.sleep_quality, 60)

    routine_score = round(max(0, min(100, routine_consistency_percent)), 1)

    hydration_score = round(min(100, (profile.water_intake_liters / 3.0) * 100), 1)

    overall = round(
        condition_score * 0.35
        + lifestyle_score * 0.20
        + sleep_score * 0.15
        + routine_score * 0.20
        + hydration_score * 0.10,
        1,
    )

    return {
        "condition_score": condition_score,
        "lifestyle_score": lifestyle_score,
        "sleep_score": sleep_score,
        "routine_consistency_score": routine_score,
        "hydration_score": hydration_score,
        "overall_score": overall,
    }
