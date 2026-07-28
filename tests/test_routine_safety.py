"""
Milestone 2, Step 6.1 — Test 2: Routine Safety Boundaries.

Goal: ensure the system never gives harsh products/steps to sensitive skin.
"""

from utils.decision_matrix import (
    HARSH_STEP_CATEGORIES,
    SAFE_REPLACEMENT_CATEGORY,
    apply_sensitivity_safety_filter,
    get_routine_template,
)


def test_harsh_steps_excluded_for_highly_sensitive_profile():
    """
    Mimics a user profile with severe skin sensitivity. The generated
    routine must exclude harsh categories (Exfoliation, Retinoid
    Treatment, Chemical Peel) and replace them with a safe alternative.
    """
    template = get_routine_template("Sensitive")
    weekly_steps = template["Weekly"]  # seeded with ["Exfoliation", "Hydrating Mask"]

    safe_weekly = apply_sensitivity_safety_filter(weekly_steps, is_highly_sensitive=True)

    for harsh_category in HARSH_STEP_CATEGORIES:
        assert harsh_category not in safe_weekly

    assert SAFE_REPLACEMENT_CATEGORY in safe_weekly


def test_non_sensitive_profile_keeps_harsh_steps_untouched():
    """A non-flagged profile should NOT have its steps altered by the safety filter."""
    template = get_routine_template("Oily")
    weekly_steps = template["Weekly"]

    result = apply_sensitivity_safety_filter(weekly_steps, is_highly_sensitive=False)

    assert result == weekly_steps


def test_safety_filter_never_produces_duplicate_safe_replacement():
    """Multiple harsh steps in the same list should collapse into one safe replacement, not many."""
    steps = ["Cleansing", "Exfoliation", "Retinoid Treatment", "Moisturizing"]
    result = apply_sensitivity_safety_filter(steps, is_highly_sensitive=True)

    assert result.count(SAFE_REPLACEMENT_CATEGORY) == 1
    assert "Exfoliation" not in result
    assert "Retinoid Treatment" not in result
    assert "Cleansing" in result and "Moisturizing" in result


def test_every_skin_type_has_a_routine_template():
    from utils.constants import SKIN_TYPES

    for skin_type in SKIN_TYPES:
        template = get_routine_template(skin_type)
        assert "AM" in template and "PM" in template and "Weekly" in template
        assert len(template["AM"]) > 0
        assert len(template["PM"]) > 0
