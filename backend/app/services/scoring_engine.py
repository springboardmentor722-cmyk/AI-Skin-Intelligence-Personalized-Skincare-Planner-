"""Weighted Skin Health Score — Milestone 2, Step 3.

Implements the exact equation from the specification:

    Skin Health Score = (S_cond   x 0.35)
                      + (L_habits x 0.20)
                      + (S_sleep  x 0.15)
                      + (R_consist x 0.20)
                      + (H_hydro  x 0.10)

Each sub-score is computed on a 0-100 scale, then combined by its weight with
NumPy's dot product. Every function here is pure — plain data in, plain data out —
so the whole engine is unit-testable without a database or a request.
"""
from __future__ import annotations

import numpy as np

# ---------------------------------------------------------------------------
# Weights (must sum to 1.0)
# ---------------------------------------------------------------------------
W_CONDITION = 0.35
W_LIFESTYLE = 0.20
W_CONSISTENCY = 0.20
W_SLEEP = 0.15
W_HYDRATION = 0.10

WEIGHTS = np.array([W_CONDITION, W_LIFESTYLE, W_SLEEP, W_CONSISTENCY, W_HYDRATION])

# Severity penalties for the skin-condition sub-score
PENALTY_HIGH = 15.0
PENALTY_MEDIUM = 7.0
PENALTY_LOW = 3.0

# Targets
IDEAL_SLEEP_HOURS = 8.0
IDEAL_WATER_LITRES = 2.5


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return float(np.clip(value, low, high))


# ---------------------------------------------------------------------------
# S_cond — Skin Condition (35%)
# ---------------------------------------------------------------------------
def calculate_condition_score(concerns: list[dict]) -> float:
    """Start at 100. Deduct 15 per high-severity concern, 7 per medium, 3 per low."""
    score = 100.0
    for c in concerns:
        severity = str(c.get("severity", "low")).lower()
        if severity == "high":
            score -= PENALTY_HIGH
        elif severity == "medium":
            score -= PENALTY_MEDIUM
        else:
            score -= PENALTY_LOW
    return _clamp(score)


# ---------------------------------------------------------------------------
# L_habits — Lifestyle (20%)
# ---------------------------------------------------------------------------
def calculate_lifestyle_score(
    environment_exposure: str | None = "low",
    uses_sunscreen: bool = True,
    exercise_minutes: float | None = None,
    stress_level: int | None = None,
    smokes: bool = False,
) -> float:
    """Start at 100. Deduct for unprotected UV / environmental exposure and habits."""
    score = 100.0

    exposure = (environment_exposure or "low").strip().lower()
    exposure_penalty = {"low": 0.0, "moderate": 10.0, "high": 20.0}.get(exposure, 0.0)

    # Unprotected exposure is what actually harms skin — sunscreen mitigates it.
    if not uses_sunscreen:
        exposure_penalty *= 2.0     # unprotected high UV is the worst case
        score -= 10.0               # baseline penalty for skipping SPF at all
    score -= exposure_penalty

    if stress_level is not None and stress_level > 6:
        score -= (stress_level - 6) * 3.0      # up to -12 at maximum stress

    if exercise_minutes is not None and exercise_minutes < 15:
        score -= 5.0

    if smokes:
        score -= 15.0

    return _clamp(score)


# ---------------------------------------------------------------------------
# S_sleep — Sleep Quality (15%)
# ---------------------------------------------------------------------------
def calculate_sleep_score(sleep_hours: float | None) -> float:
    """(hours / 8) x 100, capped at 100. No data means no credit."""
    if sleep_hours is None:
        return 0.0
    return _clamp((float(sleep_hours) / IDEAL_SLEEP_HOURS) * 100.0)


# ---------------------------------------------------------------------------
# R_consist — Routine Consistency (20%)
# ---------------------------------------------------------------------------
def calculate_consistency_score(completed_steps: int, expected_steps: int) -> float:
    """Percentage of routine checks completed over the last 7 days (from MongoDB)."""
    if expected_steps <= 0:
        return 0.0
    return _clamp((completed_steps / expected_steps) * 100.0)


# ---------------------------------------------------------------------------
# H_hydro — Hydration (10%)
# ---------------------------------------------------------------------------
def calculate_hydration_score(water_intake_l: float | None) -> float:
    """Water intake against the 2.5 L standard recommendation."""
    if water_intake_l is None:
        return 0.0
    return _clamp((float(water_intake_l) / IDEAL_WATER_LITRES) * 100.0)


# ---------------------------------------------------------------------------
# The weighted total
# ---------------------------------------------------------------------------
def calculate_skin_health_score(
    condition_score: float,
    lifestyle_score: float,
    sleep_score: float,
    consistency_score: float,
    hydration_score: float,
) -> float:
    """Combine the five sub-scores by their weights. Ideal inputs return exactly 100.0."""
    subs = np.array([condition_score, lifestyle_score, sleep_score,
                     consistency_score, hydration_score], dtype=float)
    return round(float(np.dot(subs, WEIGHTS)), 2)


def score_band(score: float) -> str:
    """A human label for the numeric score."""
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "Fair"
    if score >= 40:
        return "Needs attention"
    return "Critical"


def score_breakdown(
    concerns: list[dict],
    sleep_hours: float | None,
    water_intake_l: float | None,
    completed_steps: int,
    expected_steps: int,
    environment_exposure: str | None = "low",
    uses_sunscreen: bool = True,
    exercise_minutes: float | None = None,
    stress_level: int | None = None,
    smokes: bool = False,
) -> dict:
    """Run the whole engine end-to-end. This is what GET /assessment/score serves."""
    cond = calculate_condition_score(concerns)
    life = calculate_lifestyle_score(environment_exposure, uses_sunscreen,
                                     exercise_minutes, stress_level, smokes)
    sleep = calculate_sleep_score(sleep_hours)
    consist = calculate_consistency_score(completed_steps, expected_steps)
    hydro = calculate_hydration_score(water_intake_l)

    overall = calculate_skin_health_score(cond, life, sleep, consist, hydro)

    return {
        "overall_score": overall,
        "breakdown": {
            "skin_condition": {"score": round(cond, 2), "weight": W_CONDITION,
                               "contribution": round(cond * W_CONDITION, 2)},
            "lifestyle": {"score": round(life, 2), "weight": W_LIFESTYLE,
                          "contribution": round(life * W_LIFESTYLE, 2)},
            "sleep": {"score": round(sleep, 2), "weight": W_SLEEP,
                      "contribution": round(sleep * W_SLEEP, 2)},
            "consistency": {"score": round(consist, 2), "weight": W_CONSISTENCY,
                            "contribution": round(consist * W_CONSISTENCY, 2)},
            "hydration": {"score": round(hydro, 2), "weight": W_HYDRATION,
                          "contribution": round(hydro * W_HYDRATION, 2)},
        },
        "band": score_band(overall),
    }
