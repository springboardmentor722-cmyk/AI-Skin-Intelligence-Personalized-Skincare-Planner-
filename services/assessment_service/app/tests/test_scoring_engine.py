"""
Test 1 (Milestone 2 QA spec): perfect inputs must yield exactly 100.0.
"""
from services.assessment_service.app.business.scoring_engine import calculate_skin_health_score


def test_perfect_inputs_yield_100():
    result = calculate_skin_health_score(
        severities={
            "acne_severity": 0,
            "hyperpigmentation_severity": 0,
            "redness_severity": 0,
            "wrinkles_severity": 0,
        },
        sun_exposure="Low",
        sleep_hours=8.0,
        water_intake_liters=3.0,
        completed_logs=0,
        total_logs=0,  # no logs yet -> defaults to 100 consistency
    )
    assert result["overall_score"] == 100.0


def test_zero_effort_inputs_yield_low_score():
    result = calculate_skin_health_score(
        severities={
            "acne_severity": 9,
            "hyperpigmentation_severity": 8,
            "redness_severity": 9,
            "wrinkles_severity": 8,
        },
        sun_exposure="High",
        sleep_hours=2.0,
        water_intake_liters=0.5,
        completed_logs=0,
        total_logs=14,  # had a routine, completed none of it
    )
    assert result["overall_score"] < 40.0


def test_sleep_score_caps_at_100():
    from services.assessment_service.app.business.scoring_engine import calculate_sleep_score
    assert calculate_sleep_score(10.0) == 100.0  # oversleeping doesn't exceed the cap
    assert calculate_sleep_score(4.0) == 50.0


def test_hydration_score_caps_at_100():
    from services.assessment_service.app.business.scoring_engine import calculate_hydration_score
    assert calculate_hydration_score(5.0) == 100.0
    assert calculate_hydration_score(1.5) == 50.0
