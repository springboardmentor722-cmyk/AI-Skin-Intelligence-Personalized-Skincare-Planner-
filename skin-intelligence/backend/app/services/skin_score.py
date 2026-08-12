"""
Skin Health Score Engine

Weighted composite score (0-100):
    Skin Condition        35%
    Lifestyle              20%
    Sleep                  15%
    Routine Consistency    20%
    Hydration              10%

Each sub-score is normalized to 0-100 before weighting.
"""

from dataclasses import dataclass
from app.core.config import get_settings

settings = get_settings()


@dataclass
class SkinConditionInput:
    """Raw ML model outputs, each 0 (worst) - 100 (best/clear)."""
    acne_clarity: float
    redness_control: float
    wrinkle_smoothness: float
    pigmentation_evenness: float
    pore_refinement: float
    oil_balance: float
    hydration_of_skin: float
    dark_circle_lightness: float


@dataclass
class LifestyleInput:
    hydration_glasses_per_day: float   # 0-8+
    stress_level_1_to_10: float        # 1 (low) - 10 (high)
    exercise_minutes_per_day: float
    diet_quality_1_to_10: float        # self-reported / heuristic
    sun_exposure_hours: float


@dataclass
class SleepInput:
    avg_hours_last_7_days: float
    consistency_score_0_100: float     # variance-based regularity


@dataclass
class RoutineInput:
    days_logged_last_14: int
    total_days: int = 14


def _clamp(value: float, lo: float = 0, hi: float = 100) -> float:
    return max(lo, min(hi, value))


def score_skin_condition(data: SkinConditionInput) -> float:
    components = [
        data.acne_clarity,
        data.redness_control,
        data.wrinkle_smoothness,
        data.pigmentation_evenness,
        data.pore_refinement,
        data.oil_balance,
        data.hydration_of_skin,
        data.dark_circle_lightness,
    ]
    return _clamp(sum(components) / len(components))


def score_lifestyle(data: LifestyleInput) -> float:
    hydration_score = _clamp((data.hydration_glasses_per_day / 8) * 100)
    stress_score = _clamp(100 - (data.stress_level_1_to_10 - 1) * (100 / 9))
    exercise_score = _clamp((data.exercise_minutes_per_day / 45) * 100)
    diet_score = _clamp((data.diet_quality_1_to_10 / 10) * 100)
    sun_score = _clamp(100 - abs(data.sun_exposure_hours - 1) * 20)  # ~1hr moderate sun is ideal
    return _clamp((hydration_score + stress_score + exercise_score + diet_score + sun_score) / 5)


def score_sleep(data: SleepInput) -> float:
    # Ideal range 7-9 hours
    if 7 <= data.avg_hours_last_7_days <= 9:
        duration_score = 100.0
    else:
        distance = min(abs(data.avg_hours_last_7_days - 7), abs(data.avg_hours_last_7_days - 9))
        duration_score = _clamp(100 - distance * 15)
    return _clamp((duration_score * 0.7) + (data.consistency_score_0_100 * 0.3))


def score_routine_consistency(data: RoutineInput) -> float:
    return _clamp((data.days_logged_last_14 / data.total_days) * 100)


def score_hydration(skin_hydration_from_ml: float) -> float:
    """Dedicated hydration weight uses the ML-estimated skin hydration level directly."""
    return _clamp(skin_hydration_from_ml)


@dataclass
class SkinHealthScoreResult:
    overall_score: float
    skin_condition: float
    lifestyle: float
    sleep: float
    routine_consistency: float
    hydration: float
    breakdown_weighted: dict


def compute_skin_health_score(
    skin_condition: SkinConditionInput,
    lifestyle: LifestyleInput,
    sleep: SleepInput,
    routine: RoutineInput,
    skin_hydration_from_ml: float,
) -> SkinHealthScoreResult:
    sc = score_skin_condition(skin_condition)
    lf = score_lifestyle(lifestyle)
    sl = score_sleep(sleep)
    rc = score_routine_consistency(routine)
    hy = score_hydration(skin_hydration_from_ml)

    weighted = {
        "skin_condition": round(sc * settings.WEIGHT_SKIN_CONDITION, 2),
        "lifestyle": round(lf * settings.WEIGHT_LIFESTYLE, 2),
        "sleep": round(sl * settings.WEIGHT_SLEEP, 2),
        "routine_consistency": round(rc * settings.WEIGHT_ROUTINE_CONSISTENCY, 2),
        "hydration": round(hy * settings.WEIGHT_HYDRATION, 2),
    }
    overall = round(sum(weighted.values()), 2)

    return SkinHealthScoreResult(
        overall_score=overall,
        skin_condition=round(sc, 2),
        lifestyle=round(lf, 2),
        sleep=round(sl, 2),
        routine_consistency=round(rc, 2),
        hydration=round(hy, 2),
        breakdown_weighted=weighted,
    )
