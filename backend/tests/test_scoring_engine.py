# tests/test_scoring_engine.py
"""
Milestone 2, Step 6.1 — Automated Unit Tests.
Run from backend/ with:  py -m pytest tests/test_scoring_engine.py -v
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.scoring_engine import (
    identify_skin_concerns,
    calculate_skin_health_score,
    generate_routine_steps,
    score_consistency_from_logs,
)


def test_perfect_inputs_yield_perfect_score():
    """Test 1: Math & Score Precision — ideal metrics must output exactly 100.0."""
    prioritized_concerns = identify_skin_concerns({"skin_concerns": []})  # zero concerns
    consistency_score = score_consistency_from_logs(
        routine_logs=[{"completed_steps": [1, 2, 3]} for _ in range(7)],
        scheduled_steps_per_day=3,  # 100% completion for 7 straight days
    )

    result = calculate_skin_health_score(
        prioritized_concerns=prioritized_concerns,   # no deductions -> condition = 100
        sleep_hours=8.0,                              # exactly the 8-hour target -> sleep = 100
        water_intake_liters=2.5,                       # meets recommendation exactly -> hydration = 100
        uv_index=0,                                    # no UV exposure risk -> lifestyle = 100
        sun_protection_used=True,
        pollution_exposure="low",
        consistency_score=consistency_score,           # 100% -> consistency = 100
    )

    assert result["overall_score"] == 100.0, f"Expected perfect score of 100.0, got {result['overall_score']}"
    assert result["breakdown"]["condition"] == 100.0
    assert result["breakdown"]["sleep"] == 100.0
    assert result["breakdown"]["hydration"] == 100.0
    assert result["breakdown"]["consistency"] == 100.0
    assert result["breakdown"]["lifestyle"] == 100.0


def test_severe_sensitivity_excludes_harsh_steps():
    """Test 2: Routine Safety Boundaries — sensitive skin must never receive harsh treatment steps."""
    routine = generate_routine_steps(skin_type="sensitive", is_highly_sensitive=True)

    all_categories = []
    for steps in routine.values():
        all_categories.extend(s["step_category"] for s in steps)

    harsh_terms = ["acid", "retinoid", "retinol", "exfoliat", "peel"]
    for category in all_categories:
        for term in harsh_terms:
            assert term not in category.lower(), (
                f"Harsh step '{category}' leaked into a highly-sensitive user's routine."
            )

    # "Treatment" must have been swapped to the gentle alternative wherever it appeared
    assert "Treatment" not in all_categories, "Raw 'Treatment' step should have been replaced for highly sensitive skin."


def test_high_severity_concern_deducts_more_than_medium():
    """Sanity check on the weighting logic itself: High severity must cost more than Medium."""
    high = identify_skin_concerns({"skin_concerns": ["Acne"], "severity_overrides": {"acne": "high"}})
    medium = identify_skin_concerns({"skin_concerns": ["Acne"], "severity_overrides": {"acne": "medium"}})

    result_high = calculate_skin_health_score(
        prioritized_concerns=high, sleep_hours=8, water_intake_liters=2.5,
        uv_index=0, sun_protection_used=True, pollution_exposure="low", consistency_score=100,
    )
    result_medium = calculate_skin_health_score(
        prioritized_concerns=medium, sleep_hours=8, water_intake_liters=2.5,
        uv_index=0, sun_protection_used=True, pollution_exposure="low", consistency_score=100,
    )

    assert result_high["overall_score"] < result_medium["overall_score"]


def test_flare_up_escalates_to_high_severity():
    """A concern flagged as an active flare-up should always be treated as High severity
    and become the primary concern, per the spec's acne-vs-wrinkles example."""
    prioritized = identify_skin_concerns({
        "skin_concerns": ["Wrinkles", "Acne"],
        "flare_ups": ["Acne"],
    })
    assert prioritized[0]["concern"] == "Acne"
    assert prioritized[0]["severity"] == "high"


def test_mandatory_am_sunscreen_included():
    """Test 3: Routine Output Test — Verifies that mandatory steps (like morning sunscreen) are included in every generated AM routine."""
    for stype in ["oily", "dry", "combination", "sensitive", "normal"]:
        routine = generate_routine_steps(skin_type=stype, is_highly_sensitive=(stype == "sensitive"))
        am_categories = [s["step_category"].lower() for s in routine.get("AM", [])]
        assert any("sun" in c or "spf" in c for c in am_categories), (
            f"Mandatory AM Sun Protection step missing for skin type '{stype}'."
        )


if __name__ == "__main__":
    test_perfect_inputs_yield_perfect_score()
    test_severe_sensitivity_excludes_harsh_steps()
    test_high_severity_concern_deducts_more_than_medium()
    test_flare_up_escalates_to_high_severity()
    test_mandatory_am_sunscreen_included()
    print("All tests passed.")