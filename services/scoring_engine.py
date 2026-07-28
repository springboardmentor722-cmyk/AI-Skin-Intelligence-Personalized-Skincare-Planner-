"""
scoring_engine.py — Milestone 2, Step 3.

The mathematical core of the Skin Health Score. Every function here is a
pure function: given the same inputs, it always returns the same output,
with no database or network calls. That's deliberate — it's what makes
Step 6's unit tests possible (assert calculate_skin_health_score(...) ==
100.0 for ideal inputs) and it keeps the equation itself easy to audit
independently of how the inputs get gathered.

    Skin Health Score = (S_cond * 0.35) + (L_habits * 0.20)
                       + (S_sleep * 0.15) + (R_consist * 0.20)
                       + (H_hydro * 0.10)
"""

import numpy as np

# --- Weights (must sum to 1.0) ---
WEIGHT_SKIN_CONDITION = 0.35
WEIGHT_LIFESTYLE = 0.20
WEIGHT_SLEEP = 0.15
WEIGHT_CONSISTENCY = 0.20
WEIGHT_HYDRATION = 0.10

HIGH_SEVERITY_PENALTY = 15
MEDIUM_SEVERITY_PENALTY = 7

IDEAL_SLEEP_HOURS = 8.0
DEFAULT_RECOMMENDED_WATER_ML = 2000.0


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


# ---------------------------------------------------------------------------
# Component scores (each 0–100)
# ---------------------------------------------------------------------------

def compute_skin_condition_score(concerns: list[dict]) -> float:
    """
    S_cond (35%). Start at 100. Subtract 15 per "High" severity concern
    and 7 per "Medium" severity concern. "Low" severity concerns are not
    penalized. `concerns` is a list of {"name": str, "severity": str}.
    """
    score = 100.0
    for concern in concerns or []:
        severity = (concern.get("severity") or "").strip().lower()
        if severity == "high":
            score -= HIGH_SEVERITY_PENALTY
        elif severity == "medium":
            score -= MEDIUM_SEVERITY_PENALTY
    return _clamp(score)


def compute_lifestyle_score(
    uv_exposure: str | None,
    sun_protection_used: bool,
    smoking: bool = False,
    alcohol: bool = False,
    screen_time_hours: float | None = None,
    exercise_minutes: float | None = None,
) -> float:
    """
    L_habits (20%). Start at 100 and deduct for unprotected UV exposure
    (the specific factor called out in the spec) plus a few other
    lifestyle signals already captured in Milestone 1's LifestyleLog,
    so this score isn't based on UV alone when that data exists.
    """
    score = 100.0
    uv = (uv_exposure or "").strip().lower()

    if uv == "high" and not sun_protection_used:
        score -= 30
    elif uv == "moderate" and not sun_protection_used:
        score -= 15
    elif uv == "high" and sun_protection_used:
        score -= 5  # still some deduction — high exposure isn't fully offset by protection

    if smoking:
        score -= 20
    if alcohol:
        score -= 10
    if screen_time_hours is not None and screen_time_hours > 8:
        score -= 10
    if exercise_minutes is not None and exercise_minutes < 20:
        score -= 10

    return _clamp(score)


def compute_sleep_score(sleep_hours: float | None) -> float:
    """S_sleep (15%). (Hours logged / 8) * 100, capped at 100."""
    if sleep_hours is None:
        return 0.0
    return _clamp((float(sleep_hours) / IDEAL_SLEEP_HOURS) * 100.0)


def compute_consistency_score(completed_count: int, expected_count: int) -> float:
    """
    R_consist (20%). Percentage of expected routine checks completed
    over the last 7 days. If there's no active routine yet to be
    consistent with, this is 0 — there's nothing to have been consistent
    about, and the score should reflect that rather than defaulting to
    a misleading 100.
    """
    if not expected_count:
        return 0.0
    return _clamp((completed_count / expected_count) * 100.0)


def compute_hydration_score(
    water_intake_ml: float | None, recommended_ml: float = DEFAULT_RECOMMENDED_WATER_ML
) -> float:
    """H_hydro (10%). Water intake vs. the recommended daily amount, capped at 100."""
    if not water_intake_ml or not recommended_ml:
        return 0.0
    return _clamp((float(water_intake_ml) / float(recommended_ml)) * 100.0)


# ---------------------------------------------------------------------------
# The weighted equation itself
# ---------------------------------------------------------------------------

def calculate_skin_health_score(
    s_cond: float,
    l_habits: float,
    s_sleep: float,
    r_consist: float,
    h_hydro: float,
) -> float:
    """
    Combine the five (already 0–100) component scores into the single
    overall Skin Health Score using the fixed weights above. Uses NumPy
    per the spec's suggested toolset for the floating-point computation.
    """
    components = np.array([s_cond, l_habits, s_sleep, r_consist, h_hydro], dtype=float)
    weights = np.array(
        [
            WEIGHT_SKIN_CONDITION,
            WEIGHT_LIFESTYLE,
            WEIGHT_SLEEP,
            WEIGHT_CONSISTENCY,
            WEIGHT_HYDRATION,
        ]
    )
    overall = float(np.dot(components, weights))
    return round(_clamp(overall), 1)
