# app/services/scoring_engine.py
"""
Milestone 2 core engine. Every number here is computed from real inputs
(user-submitted assessment data + real MongoDB routine_logs) — nothing is
a fixed/mock placeholder.
"""
import numpy as np
from datetime import datetime, timedelta
from typing import Optional

# ============================================================
# STEP 2 — CONCERN PRIORITIZATION
# ============================================================

# Baseline severity knowledge-map: how serious a concern typically is
# if the user hasn't told us more (e.g. an active flare-up).
DEFAULT_SEVERITY = {
    "acne": "high",
    "redness": "medium",
    "hyperpigmentation": "medium",
    "dark_spots": "medium",
    "wrinkles": "low",
    "fine_lines": "low",
    "oily_skin": "low",
    "dry_skin": "medium",
    "uneven_skin_tone": "low",
    "enlarged_pores": "low",
    "blackheads": "low",
    "whiteheads": "low",
    "sensitive_skin": "medium",
    "combination_skin": "low",
    "dark_circles": "low",
    "post_acne_marks": "medium",
}

SEVERITY_RANK = {"high": 3, "medium": 2, "low": 1}

# Slider score (0–10) to severity text mapping
SLIDER_TO_SEVERITY = {
    0: "low",
    1: "low",
    2: "low",
    3: "low",
    4: "medium",
    5: "medium",
    6: "medium",
    7: "high",
    8: "high",
    9: "high",
    10: "high",
}


def identify_skin_concerns(profile_data: dict) -> list[dict]:
    """
    profile_data expects:
      {
        "skin_concerns": ["acne", "wrinkles", ...],
        "flare_ups": ["acne"],           # optional — concerns the user flagged as actively flaring
        "severity_overrides": {"acne": "high"}   # optional — explicit user-reported severity
        "severity_scores": {"acne": 7, "redness": 3}  # optional — 0-10 slider values from frontend
      }

    Returns concerns sorted by severity (high -> low), each tagged with its severity.
    The first item in the returned list is the primary concern.
    """
    raw_concerns = profile_data.get("skin_concerns") or []
    flare_ups = set(c.lower() for c in (profile_data.get("flare_ups") or []))
    overrides = {k.lower(): v.lower() for k, v in (profile_data.get("severity_overrides") or {}).items()}
    severity_scores = {k.lower().replace(" ", "_"): int(v) for k, v in (profile_data.get("severity_scores") or {}).items()}

    scored = []
    for concern in raw_concerns:
        key = concern.lower().replace(" ", "_")
        # Priority: slider score > explicit override > flare-up > default
        if key in severity_scores:
            slider_val = min(10, max(0, severity_scores[key]))
            severity = SLIDER_TO_SEVERITY.get(slider_val, "medium")
        elif key in overrides:
            severity = overrides[key]
        elif key in flare_ups:
            severity = "high"
        else:
            severity = DEFAULT_SEVERITY.get(key, "medium")

        slider_value = severity_scores.get(key)
        scored.append({
            "concern": concern,
            "key": key,
            "severity": severity,
            "slider_value": slider_value,
        })

    scored.sort(key=lambda c: SEVERITY_RANK.get(c["severity"], 0), reverse=True)
    return scored


def get_primary_concern(prioritized_concerns: list[dict]) -> Optional[str]:
    return prioritized_concerns[0]["concern"] if prioritized_concerns else None


# ============================================================
# STEP 3 — WEIGHTED SCORING MODEL
# ============================================================

def _score_condition(prioritized_concerns: list[dict]) -> float:
    """S_cond (35%): start at 100.
    Uses actual slider values (0-10) when available for finer-grained deductions;
    falls back to severity category deductions.
    """
    score = 100.0
    for c in prioritized_concerns:
        slider = c.get("slider_value")
        if slider is not None:
            # Linear deduction: slider 10 → -20pts, slider 5 → -10pts, slider 0 → 0pts
            score -= slider * 2.0
        elif c["severity"] == "high":
            score -= 15
        elif c["severity"] == "medium":
            score -= 7
    return max(0.0, score)


def _score_lifestyle(
    uv_index: Optional[float],
    sun_protection_used: Optional[bool],
    pollution_exposure: Optional[str],
    smoking: Optional[bool] = None,
    alcohol: Optional[bool] = None,
    screen_time_hours: Optional[float] = None,
) -> float:
    """L_habits (20%): deduct for UV, pollution, smoking, alcohol, screen time."""
    score = 100.0
    if uv_index is not None:
        protected = bool(sun_protection_used)
        if uv_index >= 8 and not protected:
            score -= 35
        elif uv_index >= 6 and not protected:
            score -= 22
        elif uv_index >= 6 and protected:
            score -= 5
        elif uv_index >= 3 and not protected:
            score -= 10
    if pollution_exposure:
        level = pollution_exposure.lower()
        if level in ("high", "heavy", "very high"):
            score -= 10
        elif level in ("moderate", "medium"):
            score -= 5
    if smoking:
        score -= 12
    if alcohol:
        score -= 8
    if screen_time_hours and screen_time_hours > 3:
        score -= min(10, (screen_time_hours - 3) * 2)
    return max(0.0, score)


def _score_sleep(sleep_hours: Optional[float]) -> float:
    """S_sleep (15%): (hours logged / 8) * 100, capped at 100."""
    if not sleep_hours or sleep_hours <= 0:
        return 0.0
    return float(np.clip((sleep_hours / 8.0) * 100.0, 0.0, 100.0))


def _score_hydration(water_intake_liters: Optional[float], recommended_liters: float = 2.5) -> float:
    """H_hydro (10%): compare intake to a standard recommendation, capped at 100."""
    if not water_intake_liters or water_intake_liters <= 0:
        return 0.0
    return float(np.clip((water_intake_liters / recommended_liters) * 100.0, 0.0, 100.0))


def score_consistency_from_logs(routine_logs: list[dict], scheduled_steps_per_day: int) -> float:
    """
    R_consist (20%): % of scheduled routine steps actually completed over the
    last 7 days, computed from real MongoDB routine_logs documents.
    """
    if scheduled_steps_per_day <= 0:
        return 100.0
    total_possible = scheduled_steps_per_day * 7
    total_completed = sum(len(day.get("completed_steps", [])) for day in routine_logs)
    return min(100.0, (total_completed / total_possible) * 100.0)


def _get_risk_level(score: float) -> str:
    """Derive risk level from overall skin health score."""
    if score >= 80:
        return "Low"
    elif score >= 60:
        return "Moderate"
    elif score >= 40:
        return "High"
    else:
        return "Very High"


def _get_health_category(score: float) -> str:
    """Derive health category label from score."""
    if score >= 85:
        return "Excellent"
    elif score >= 70:
        return "Good"
    elif score >= 50:
        return "Fair"
    else:
        return "Poor"


def _get_improvement_suggestions(
    breakdown: dict,
    prioritized_concerns: list[dict],
    smoking: Optional[bool] = None,
    alcohol: Optional[bool] = None,
    screen_time_hours: Optional[float] = None,
) -> list[str]:
    """Generate targeted improvement suggestions based on which sub-scores are low."""
    suggestions = []

    # Condition-based
    if breakdown["condition"] < 60 and prioritized_concerns:
        top = prioritized_concerns[0]
        concern_name = top["concern"]
        severity = top["severity"]
        suggestions.append(
            f"Your primary concern ({concern_name}) is rated {severity} severity. "
            "Consider a targeted treatment serum and consult a dermatologist if it persists."
        )

    # Sleep-based
    if breakdown["sleep"] < 70:
        suggestions.append(
            "Your sleep score is below optimal. Aim for 7–8 hours of sleep to allow skin regeneration and barrier repair."
        )

    # Hydration-based
    if breakdown["hydration"] < 70:
        suggestions.append(
            "Increase your daily water intake to at least 2.5 liters. Proper hydration reduces dryness and improves skin elasticity."
        )

    # Lifestyle-based
    if breakdown["lifestyle"] < 70:
        suggestions.append(
            "Apply broad-spectrum SPF 30+ sunscreen daily, even on cloudy days, to protect against UV-induced damage."
        )
    if smoking:
        suggestions.append(
            "Smoking significantly accelerates skin aging and impairs wound healing. Reducing or quitting smoking will noticeably improve skin health."
        )
    if alcohol:
        suggestions.append(
            "Alcohol dehydrates skin and depletes essential nutrients. Limit intake and increase water consumption on days you drink."
        )
    if screen_time_hours and screen_time_hours > 3:
        suggestions.append(
            f"Reducing late-night screen time (currently ~{screen_time_hours:.0f}h) can improve sleep quality and reduce under-eye dark circles."
        )

    # Consistency-based
    if breakdown["consistency"] < 60:
        suggestions.append(
            "Your skincare routine adherence is low. Consistency is key — even a simple 2-step AM/PM routine performed daily outperforms an elaborate routine done sporadically."
        )

    if not suggestions:
        suggestions.append(
            "Your skin health looks great! Keep up your current routine, stay hydrated, and maintain your healthy lifestyle habits."
        )

    return suggestions


def calculate_skin_health_score(
    prioritized_concerns: list[dict],
    sleep_hours: Optional[float],
    water_intake_liters: Optional[float],
    uv_index: Optional[float],
    sun_protection_used: Optional[bool],
    pollution_exposure: Optional[str],
    consistency_score: float,
    smoking: Optional[bool] = None,
    alcohol: Optional[bool] = None,
    screen_time_hours: Optional[float] = None,
) -> dict:
    """
    Returns full breakdown + overall Skin Health Score (0-100) + risk_level +
    health_category + improvement_suggestions. All computed from real inputs.
    """
    s_cond = _score_condition(prioritized_concerns)
    l_habits = _score_lifestyle(uv_index, sun_protection_used, pollution_exposure, smoking, alcohol, screen_time_hours)
    s_sleep = _score_sleep(sleep_hours)
    r_consist = consistency_score
    h_hydro = _score_hydration(water_intake_liters)

    component_scores = np.array([s_cond, l_habits, s_sleep, r_consist, h_hydro], dtype=float)
    weights = np.array([0.35, 0.20, 0.15, 0.20, 0.10], dtype=float)
    overall = float(np.dot(component_scores, weights))

    breakdown = {
        "condition": round(s_cond, 2),
        "lifestyle": round(l_habits, 2),
        "sleep": round(s_sleep, 2),
        "consistency": round(r_consist, 2),
        "hydration": round(h_hydro, 2),
    }

    return {
        "overall_score": round(overall, 2),
        "breakdown": breakdown,
        "risk_level": _get_risk_level(overall),
        "health_category": _get_health_category(overall),
        "improvement_suggestions": _get_improvement_suggestions(
            breakdown, prioritized_concerns, smoking, alcohol, screen_time_hours
        ),
    }


# ============================================================
# STEP 1.3 / STEP 4 — ROUTINE DECISION MATRIX + GENERATION
# ============================================================

ROUTINE_MATRIX = {
    "oily": {
        "AM": ["Cleansing", "Treatment", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Night Care"],
        "Weekly": ["Exfoliation", "Clay Mask"],
    },
    "sensitive": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Moisturizing"],
        "Weekly": ["Calming Mask"],
    },
    "dry": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing"],
        "Weekly": ["Hydrating Mask"],
    },
    "combination": {
        "AM": ["Cleansing", "Treatment", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing"],
        "Weekly": ["Exfoliation", "Balancing Mask"],
    },
    "normal": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing"],
        "Weekly": ["Exfoliation"],
    },
}


def get_seasonal_steps(is_highly_sensitive: bool = False, month: Optional[int] = None) -> list[str]:
    """Real, dynamic seasonal logic derived from the actual calendar month."""
    m = month if month is not None else datetime.utcnow().month
    if m in (12, 1, 2):
        return ["Extra Calming Care" if is_highly_sensitive else "Barrier Repair Treatment"]
    if m in (6, 7, 8):
        return ["Extra Sun Protection Reapplication"]
    return ["Seasonal Skin Check-In"]


HARSH_CATEGORY_REPLACEMENTS = {
    "Treatment": "Gentle Moisture Treatment",
}


def generate_routine_steps(skin_type: str, is_highly_sensitive: bool = False, primary_concern: Optional[str] = None) -> dict:
    """
    Returns {"AM": [{step_number, step_category}, ...], "PM": [...], "Weekly": [...], "Seasonal": [...]}
    based on skin type + sensitivity safety check + primary concern from Step 2.
    """
    key = (skin_type or "normal").lower()
    template = ROUTINE_MATRIX.get(key, ROUTINE_MATRIX["normal"])

    concern_key = (primary_concern or "").lower().replace(" ", "_")
    concern_requires_treatment = concern_key in {"acne", "oily_skin", "hyperpigmentation", "dark_spots", "post_acne_marks"}

    result = {}
    for time_of_day, categories in template.items():
        categories = list(categories)
        if concern_requires_treatment and "Treatment" not in categories and time_of_day != "Weekly":
            insert_at = categories.index("Cleansing") + 1 if "Cleansing" in categories else 0
            categories.insert(insert_at, "Treatment")

        steps = []
        for i, category in enumerate(categories, start=1):
            final_category = category
            if is_highly_sensitive and category in HARSH_CATEGORY_REPLACEMENTS:
                final_category = HARSH_CATEGORY_REPLACEMENTS[category]
            steps.append({"step_number": i, "step_category": final_category})
        result[time_of_day] = steps

    # Add seasonal steps
    seasonal = get_seasonal_steps(is_highly_sensitive)
    result["Seasonal"] = [{"step_number": i + 1, "step_category": s} for i, s in enumerate(seasonal)]

    return result