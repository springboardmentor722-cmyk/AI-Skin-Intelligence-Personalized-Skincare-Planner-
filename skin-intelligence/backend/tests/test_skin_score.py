from app.services.skin_score import (
    compute_skin_health_score, SkinConditionInput, LifestyleInput, SleepInput, RoutineInput,
)


def test_weights_sum_to_one():
    from app.core.config import get_settings
    s = get_settings()
    total = (
        s.WEIGHT_SKIN_CONDITION + s.WEIGHT_LIFESTYLE + s.WEIGHT_SLEEP
        + s.WEIGHT_ROUTINE_CONSISTENCY + s.WEIGHT_HYDRATION
    )
    assert round(total, 4) == 1.0


def test_perfect_inputs_yield_max_score():
    result = compute_skin_health_score(
        skin_condition=SkinConditionInput(100, 100, 100, 100, 100, 100, 100, 100),
        lifestyle=LifestyleInput(8, 1, 45, 10, 1),
        sleep=SleepInput(8, 100),
        routine=RoutineInput(14, 14),
        skin_hydration_from_ml=100,
    )
    assert result.overall_score == 100.0


def test_worst_inputs_yield_low_score():
    result = compute_skin_health_score(
        skin_condition=SkinConditionInput(0, 0, 0, 0, 0, 0, 0, 0),
        lifestyle=LifestyleInput(0, 10, 0, 1, 8),
        sleep=SleepInput(2, 0),
        routine=RoutineInput(0, 14),
        skin_hydration_from_ml=0,
    )
    assert result.overall_score < 15.0


def test_score_breakdown_matches_weighting_spec():
    result = compute_skin_health_score(
        skin_condition=SkinConditionInput(80, 80, 80, 80, 80, 80, 80, 80),
        lifestyle=LifestyleInput(6, 3, 30, 8, 1),
        sleep=SleepInput(7.5, 90),
        routine=RoutineInput(12, 14),
        skin_hydration_from_ml=75,
    )
    assert result.breakdown_weighted["skin_condition"] == round(result.skin_condition * 0.35, 2)
    assert result.breakdown_weighted["hydration"] == round(result.hydration * 0.10, 2)
