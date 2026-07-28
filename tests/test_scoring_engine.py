"""
Milestone 2, Step 6.1 — Test 1: Math & Score Precision.

Goal: ensure a perfect data input outputs a perfect score.
"""

from services.scoring_engine import (
    calculate_skin_health_score,
    compute_consistency_score,
    compute_hydration_score,
    compute_lifestyle_score,
    compute_skin_condition_score,
    compute_sleep_score,
)


def test_ideal_metrics_yield_perfect_overall_score():
    """Zero concerns, perfect sleep, excellent habits, full hydration, full consistency -> 100.0."""
    s_cond = compute_skin_condition_score(concerns=[])
    l_habits = compute_lifestyle_score(
        uv_exposure="Low", sun_protection_used=True, smoking=False, alcohol=False
    )
    s_sleep = compute_sleep_score(sleep_hours=8.0)
    r_consist = compute_consistency_score(completed_count=14, expected_count=14)
    h_hydro = compute_hydration_score(water_intake_ml=2000, recommended_ml=2000)

    assert s_cond == 100.0
    assert l_habits == 100.0
    assert s_sleep == 100.0
    assert r_consist == 100.0
    assert h_hydro == 100.0

    overall = calculate_skin_health_score(s_cond, l_habits, s_sleep, r_consist, h_hydro)
    assert overall == 100.0


def test_calculate_skin_health_score_applies_exact_weights():
    """Directly verifies the 0.35/0.20/0.15/0.20/0.10 weighting with distinguishable inputs."""
    overall = calculate_skin_health_score(
        s_cond=80, l_habits=60, s_sleep=100, r_consist=50, h_hydro=40
    )
    expected = round(80 * 0.35 + 60 * 0.20 + 100 * 0.15 + 50 * 0.20 + 40 * 0.10, 1)
    assert overall == expected


def test_skin_condition_score_deducts_exact_severity_penalties():
    concerns = [{"name": "Acne", "severity": "High"}, {"name": "Wrinkles", "severity": "Medium"}]
    # 100 - 15 (High) - 7 (Medium) = 78
    assert compute_skin_condition_score(concerns) == 78.0


def test_sleep_score_caps_at_100_for_oversleeping():
    assert compute_sleep_score(sleep_hours=10) == 100.0


def test_consistency_score_zero_when_no_active_routine():
    assert compute_consistency_score(completed_count=0, expected_count=0) == 0.0
