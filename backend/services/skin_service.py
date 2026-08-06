"""
Skin Intelligence Service
- 10-Condition Severity Skin Assessment Engine
- Milestone 2 Weighted Skin Health Scoring Formula (Condition 35%, Routine 20%, Lifestyle 20%, Sleep 15%, Hydration 10%)
- Personalized Routine Generator (Morning, Night, Weekly, Seasonal, Adaptive across 5 categories)
- AI Recommendations Generator (Precautions, Recommendations, Routine, Warnings)
"""

from typing import Dict, List, Any


def evaluate_skin_conditions(concerns_str: str, skin_type: str) -> Dict[str, Any]:
    """
    Evaluates 10 skin conditions with individual severity levels (1-10)
    Conditions: Acne, Pigmentation, Dry Skin, Oily Skin, Sensitive Skin,
                Fine Lines, Dark Spots, Wrinkles, Redness, Uneven Tone
    """
    concerns = (concerns_str or "").lower()
    st = (skin_type or "").lower()

    conditions = {
        "Acne": 7 if "acne" in concerns or "breakouts" in concerns else 2,
        "Pigmentation": 6 if "pigmentation" in concerns or "dark spots" in concerns or "hyper-pigmentation" in concerns else 2,
        "Dry Skin": 8 if "dryness" in concerns or st == "dry" else (5 if st == "combination" else 2),
        "Oily Skin": 8 if "oily" in concerns or st == "oily" else (5 if st == "combination" else 2),
        "Sensitive Skin": 8 if "sensitivity" in concerns or "redness" in concerns or st == "sensitive" else 3,
        "Fine Lines": 6 if "fine lines" in concerns or "wrinkles" in concerns or "aging" in concerns else 2,
        "Dark Spots": 7 if "dark spots" in concerns or "spots" in concerns or "pigmentation" in concerns else 2,
        "Wrinkles": 7 if "wrinkles" in concerns or "aging" in concerns else 2,
        "Redness": 7 if "redness" in concerns or "rosacea" in concerns or st == "sensitive" else 2,
        "Uneven Tone": 6 if "uneven" in concerns or "dullness" in concerns or "pigmentation" in concerns else 3,
    }

    # Calculate overall skin condition sub-score (0-100)
    # Average severity level (1-10) -> converted to condition health (100 - avg_severity * 8)
    avg_severity = sum(conditions.values()) / len(conditions)
    condition_subscore = max(20, min(100, int(100 - (avg_severity * 7))))

    return {
        "conditions": conditions,
        "average_severity": round(avg_severity, 1),
        "subscore": condition_subscore
    }


def calculate_skin_health_score(
    skin_profile: Any = None,
    lifestyle: Any = None,
    routine_logs: Any = None
) -> Dict[str, Any]:
    """
    Milestone 2 Weighted Skin Health Score (0-100)
    - Skin Condition: 35%
    - Routine Completion: 20%
    - Lifestyle: 20%
    - Sleep: 15%
    - Hydration: 10%
    """
    # 1. Skin Condition (35%)
    concerns_str = skin_profile.concerns if skin_profile else ""
    skin_type = skin_profile.skin_type if skin_profile else "Normal"
    eval_res = evaluate_skin_conditions(concerns_str, skin_type)
    condition_score = eval_res["subscore"]

    # 2. Routine Completion (20%)
    # Default 80% if routine active or historical completion rate
    routine_score = 85
    if routine_logs:
        morning = 1 if getattr(routine_logs, "morning_completed", False) else 0
        evening = 1 if getattr(routine_logs, "evening_completed", False) else 0
        weekly = 1 if getattr(routine_logs, "weekly_completed", False) else 0
        routine_score = int(((morning + evening + (weekly * 0.5)) / 2.5) * 100)

    # 3. Lifestyle Score (20%)
    lifestyle_score = 75
    if lifestyle:
        exercise_bonus = 20 if lifestyle.exercise == "Daily" else (10 if lifestyle.exercise == "3-4 times/week" else -10)
        stress_penalty = -20 if lifestyle.stress_level == "High" else (10 if lifestyle.stress_level == "Low" else 0)
        smoking_penalty = -20 if getattr(lifestyle, "smoking", False) else 0
        lifestyle_score = max(30, min(100, 75 + exercise_bonus + stress_penalty + smoking_penalty))

    # 4. Sleep Score (15%)
    sleep_hours = lifestyle.sleep_hours if (lifestyle and lifestyle.sleep_hours) else 7.0
    sleep_score = max(20, min(100, int((sleep_hours / 8.0) * 100)))

    # 5. Hydration Score (10%)
    water_intake = lifestyle.water_intake if (lifestyle and lifestyle.water_intake) else 2.0
    hydration_score = max(20, min(100, int((water_intake / 3.0) * 100)))

    # Weighted Total Score calculation
    overall_score = int(
        (condition_score * 0.35) +
        (routine_score * 0.20) +
        (lifestyle_score * 0.20) +
        (sleep_score * 0.15) +
        (hydration_score * 0.10)
    )
    overall_score = max(0, min(100, overall_score))

    # Determine Risk Level
    if overall_score >= 75:
        risk_level = "Low Risk"
    elif overall_score >= 55:
        risk_level = "Moderate Risk"
    else:
        risk_level = "High Risk"

    return {
        "overall_score": overall_score,
        "risk_level": risk_level,
        "breakdown": {
            "condition_score": condition_score,
            "routine_score": routine_score,
            "lifestyle_score": lifestyle_score,
            "sleep_score": sleep_score,
            "hydration_score": hydration_score
        },
        "weights": {
            "condition": "35%",
            "routine": "20%",
            "lifestyle": "20%",
            "sleep": "15%",
            "hydration": "10%"
        },
        "conditions_severity": eval_res["conditions"]
    }


def generate_personalized_routine(skin_type: str = "Normal", concerns: str = "", season: str = "Summer") -> Dict[str, Any]:
    """
    Generates Morning, Night, Weekly, Seasonal, and Adaptive Routines across 5 Categories:
    - Cleanser
    - Treatment
    - Moisturizer
    - Sunscreen
    - Night Care
    """
    st = (skin_type or "Normal").capitalize()
    conc = (concerns or "").lower()

    # Category recommendations tailored to skin type & concerns
    cleanser = "Gentle Hydrating Foam Cleanser" if st == "Dry" else ("Salicylic Acid Gel Cleanser" if st == "Oily" else "Gentle pH Balancing Cleanser")
    treatment = "Niacinamide 10% + Zinc Serum" if "acne" in conc or "oily" in conc else ("Vitamin C Brightening Serum" if "pigmentation" in conc or "spots" in conc else "Hyaluronic Acid 2% + B5 Serum")
    moisturizer = "Lightweight Gel-Cream Moisturizer" if st in ["Oily", "Combination"] else "Ceramide Barrier Repair Cream"
    sunscreen = "Broad Spectrum SPF 50 PA++++ Mineral Sunscreen" if st == "Sensitive" else "Ultra-Light Invisible SPF 50 Gel"
    night_care = "Retinol 0.5% Night Treatment Cream" if "wrinkles" in conc or "aging" in conc else "Overnight Barrier Restorative Night Balm"

    morning_routine = [
        {"step": 1, "category": "Cleanser", "title": "Morning Cleanse", "action": f"Wash face with {cleanser}", "duration": "1 min"},
        {"step": 2, "category": "Treatment", "title": "Targeted Serum", "action": f"Apply 3-4 drops of {treatment}", "duration": "2 mins"},
        {"step": 3, "category": "Moisturizer", "title": "Hydration Lock", "action": f"Massage {moisturizer} evenly", "duration": "1 min"},
        {"step": 4, "category": "Sunscreen", "title": "UV Protection", "action": f"Apply generous layer of {sunscreen} (reapply every 2 hrs outdoor)", "duration": "2 mins"}
    ]

    night_routine = [
        {"step": 1, "category": "Cleanser", "title": "Double Cleanse", "action": f"Remove impurities using Micellar Water followed by {cleanser}", "duration": "3 mins"},
        {"step": 2, "category": "Treatment", "title": "Night Active", "action": f"Apply active treatment ({treatment})", "duration": "2 mins"},
        {"step": 3, "category": "Night Care", "title": "Overnight Repair", "action": f"Smooth {night_care} onto face and neck", "duration": "2 mins"}
    ]

    weekly_routine = [
        {"day": "Wednesday", "category": "Exfoliant", "title": "Gentle BHA/AHA Chemical Exfoliation", "action": "Unclog pores and remove dead skin cells gently"},
        {"day": "Sunday", "category": "Mask", "title": "Deep Hydration / Clay Purifying Mask", "action": "Apply mask for 15 minutes, rinse with lukewarm water"}
    ]

    seasonal_routine = {
        "season": season,
        "recommendation": f"During {season}, focus on {'extra lightweight hydration & matte oil control' if season in ['Summer', 'Monsoon'] else 'intense lipid barrier nutrition & soothing ceramides'}.",
        "key_adjustment": "Switch to barrier defense serum during seasonal transitions."
    }

    adaptive_routine = {
        "trigger": "Low Sleep (<6 hrs) or High Stress",
        "adjustment": "Add Centella Asiatica / Aloe Soothing Gel and skip strong actives for 24 hours to prevent reactive inflammation."
    }

    return {
        "morning": morning_routine,
        "night": night_routine,
        "weekly": weekly_routine,
        "seasonal": seasonal_routine,
        "adaptive": adaptive_routine
    }


def generate_ai_recommendations(
    skin_profile: Any = None,
    lifestyle: Any = None,
    assessment: Any = None
) -> Dict[str, Any]:
    """
    Generates AI Recommendations: Precautions, Recommendations, Routine advice, Warnings
    """
    st = skin_profile.skin_type if skin_profile else "Normal"
    age = skin_profile.age if skin_profile else 25
    concerns = skin_profile.concerns if skin_profile else ""
    sleep = lifestyle.sleep_hours if lifestyle else 7.0
    water = lifestyle.water_intake if lifestyle else 2.0

    recommendations = [
        f"Maintain consistent application of broad-spectrum SPF 50 daily, tailored for {st} skin.",
        f"Target active concerns ({concerns or 'general care'}) with clinically proven ingredients like Niacinamide and Hyaluronic Acid."
    ]
    if water < 2.5:
        recommendations.append("Increase daily water intake to at least 2.5–3.0 Liters to boost cellular skin hydration from within.")

    precautions = [
        "Perform a 24-hour patch test before introducing any new active serum or chemical exfoliant.",
        "Avoid scrubbing skin aggressively with rough towels or harsh physical beads."
    ]

    warnings = []
    if "sensitive" in (st or "").lower() or "redness" in (concerns or "").lower():
        warnings.append("Sensitive Skin Warning: Limit AHA/BHA exfoliants to maximum once per week to protect epidermal moisture barrier.")
    if sleep < 6.0:
        warnings.append("Sleep Deprivation Alert: Less than 6 hours of sleep elevates cortisol, which degrades collagen synthesis and worsens dark circles.")

    routine_advice = f"Follow the 4-step morning routine and 3-step evening repair routine customized for age {age} and {st} skin type."

    return {
        "recommendations": recommendations,
        "precautions": precautions,
        "warnings": warnings,
        "routine_advice": routine_advice
    }
