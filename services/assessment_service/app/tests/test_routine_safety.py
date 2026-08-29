"""
Test 2 (Milestone 2 QA spec): sensitive skin / severe redness must never
receive harsh actives; safe alternatives are swapped in instead.
"""
from services.assessment_service.app.business.routine_engine import (
    generate_routine_steps, HARSH_ACTIVES,
)


def test_sensitive_skin_excludes_harsh_actives():
    routine = generate_routine_steps(skin_type="Sensitive", redness_severity=0)
    all_names = [name for steps in routine.values() for _, name in steps]

    for harsh in HARSH_ACTIVES:
        assert harsh not in all_names


def test_severe_redness_overrides_harsh_actives_even_on_oily_skin():
    # Oily skin's baseline includes Salicylic Acid Treatment (harsh) —
    # severe redness (>7) must override it regardless of skin type.
    routine = generate_routine_steps(skin_type="Oily", redness_severity=9)
    all_names = [name for steps in routine.values() for _, name in steps]

    assert "Salicylic Acid Treatment" not in all_names
    assert any("Azelaic Acid" in name for name in all_names)


def test_mild_redness_on_oily_skin_keeps_normal_routine():
    routine = generate_routine_steps(skin_type="Oily", redness_severity=2)
    all_names = [name for steps in routine.values() for _, name in steps]
    assert "Salicylic Acid Treatment" in all_names


def test_every_am_routine_includes_sun_protection():
    for skin_type in ["Oily", "Dry", "Combination", "Sensitive"]:
        routine = generate_routine_steps(skin_type=skin_type)
        am_categories = [cat for cat, _ in routine["AM"]]
        assert "Sun Protection" in am_categories
