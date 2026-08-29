"""
Weighted Skin Health Scoring Engine.

Score = 0.35*Condition + 0.20*Lifestyle + 0.15*Sleep + 0.20*Consistency + 0.10*Hydration

Every sub-score function is pure (no DB access) so it can be unit tested in
isolation per the Milestone 2 QA requirement ("perfect input -> exactly 100.0").
"""

CONDITION_WEIGHT = 0.35
LIFESTYLE_WEIGHT = 0.20
SLEEP_WEIGHT = 0.15
CONSISTENCY_WEIGHT = 0.20
HYDRATION_WEIGHT = 0.10

SLEEP_TARGET_HOURS = 8.0
HYDRATION_TARGET_LITERS = 3.0

HIGH_SEVERITY_THRESHOLD = 7   # >=7 on a 0-10 slider
MEDIUM_SEVERITY_THRESHOLD = 4  # 4-6 on a 0-10 slider

HIGH_SEVERITY_PENALTY = 15
MEDIUM_SEVERITY_PENALTY = 7

SUN_EXPOSURE_PENALTY = {
    "Low": 0,
    "Medium": 15,
    "High": 30,
}


def severity_level(severity: int) -> str:
    if severity >= HIGH_SEVERITY_THRESHOLD:
        return "High"
    if severity >= MEDIUM_SEVERITY_THRESHOLD:
        return "Medium"
    if severity > 0:
        return "Low"
    return "None"


def calculate_condition_score(severities: dict) -> float:
    """Start at 100, deduct per concern based on severity level."""
    score = 100.0
    for severity in severities.values():
        level = severity_level(severity)
        if level == "High":
            score -= HIGH_SEVERITY_PENALTY
        elif level == "Medium":
            score -= MEDIUM_SEVERITY_PENALTY
    return max(0.0, score)


def calculate_lifestyle_score(sun_exposure: str) -> float:
    """Start at 100, deduct for unprotected UV/sun exposure risk."""
    penalty = SUN_EXPOSURE_PENALTY.get(sun_exposure, 15)
    return max(0.0, 100.0 - penalty)


def calculate_sleep_score(sleep_hours: float) -> float:
    """Sleep vs an 8-hour ideal, capped at 100."""
    return min(100.0, (sleep_hours / SLEEP_TARGET_HOURS) * 100)


def calculate_consistency_score(completed: int, total: int) -> float:
    """
    % of routine steps completed over the last 7 days.
    Defaults to 100 for brand-new users with no logs yet (per spec).
    """
    if total == 0:
        return 100.0
    return max(0.0, min(100.0, (completed / total) * 100))


def calculate_hydration_score(water_intake_liters: float) -> float:
    """Water intake vs a 3.0L benchmark, capped at 100."""
    return min(100.0, (water_intake_liters / HYDRATION_TARGET_LITERS) * 100)


def calculate_skin_health_score(
    severities: dict,
    sun_exposure: str,
    sleep_hours: float,
    water_intake_liters: float,
    completed_logs: int = 0,
    total_logs: int = 0,
) -> dict:
    condition = calculate_condition_score(severities)
    lifestyle = calculate_lifestyle_score(sun_exposure)
    sleep = calculate_sleep_score(sleep_hours)
    consistency = calculate_consistency_score(completed_logs, total_logs)
    hydration = calculate_hydration_score(water_intake_liters)

    overall = (
        condition * CONDITION_WEIGHT
        + lifestyle * LIFESTYLE_WEIGHT
        + sleep * SLEEP_WEIGHT
        + consistency * CONSISTENCY_WEIGHT
        + hydration * HYDRATION_WEIGHT
    )

    return {
        "overall_score": round(overall, 2),
        "condition_score": round(condition, 2),
        "lifestyle_score": round(lifestyle, 2),
        "sleep_score": round(sleep, 2),
        "consistency_score": round(consistency, 2),
        "hydration_score": round(hydration, 2),
    }
