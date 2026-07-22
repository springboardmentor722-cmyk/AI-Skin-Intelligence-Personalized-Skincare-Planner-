"""app/ai/suitability.py — RealIngredientSuitability (M3-B). Rule-based, not ML: the
zero-missed-allergy requirement (AI_ML.md model card, a release-blocking test per
milestone_3.md §8) needs an auditable rule, not a trained model's probability.
Confidence values are fixed per rule (documented in suitability.py itself), asserted
here so a future edit can't silently change them without a test noticing."""

import pytest

from app.ai.suitability import RealIngredientSuitability

suitability = RealIngredientSuitability()


def _evaluate(
    ingredient_name: str = "Retinol",
    inci_name: str | None = "Retinol",
    skin_type_name: str | None = "Oily",
    allergies: str | None = None,
    sensitivities: str | None = None,
    avoid_reason: str | None = None,
):
    return suitability.evaluate(
        ingredient_name=ingredient_name,
        inci_name=inci_name,
        skin_type_name=skin_type_name,
        allergies=allergies,
        sensitivities=sensitivities,
        avoid_reason=avoid_reason,
    )


# --- Zero-missed-allergy matrix (hard requirement) ---------------------------------

_ALLERGY_HIT_CASES = [
    ("Retinol", "Retinol", "retinol"),  # exact match, same casing
    ("Retinol", "Retinol", "RETINOL"),  # exact match, different casing
    ("Retinol", "Retinol", "fragrance, retinol, sulfates"),  # exact match among tags
    ("Ascorbic Acid", "Ascorbic Acid", "vitamin c, ascorbic acid"),
    ("Salicylic Acid", "Salicylic Acid", "salicylic"),  # substring match (prefix)
    ("Retinol", "Retinol", "retin"),  # substring match (partial tag)
]


@pytest.mark.parametrize("ingredient_name,inci_name,allergies", _ALLERGY_HIT_CASES)
def test_allergy_hit_is_never_missed(ingredient_name, inci_name, allergies) -> None:
    result = _evaluate(ingredient_name=ingredient_name, inci_name=inci_name, allergies=allergies)

    assert result.allergy_flag is True
    assert result.suitable is False


def test_allergy_exact_match_has_the_documented_confidence() -> None:
    result = _evaluate(allergies="retinol")

    assert result.confidence == 0.95


def test_allergy_substring_match_has_the_documented_confidence() -> None:
    result = _evaluate(ingredient_name="Salicylic Acid", inci_name=None, allergies="salicylic")

    assert result.confidence == 0.7


def test_no_allergy_match_for_an_unrelated_tag() -> None:
    result = _evaluate(allergies="fragrance, sulfates")

    assert result.allergy_flag is False


# --- Sensitivities (softer, still flagged, not the hard "allergy" case) ------------


def test_sensitivity_match_is_flagged_but_not_as_an_allergy() -> None:
    result = _evaluate(sensitivities="retinol")

    assert result.suitable is False
    assert result.allergy_flag is False


# --- Avoid-for-skin-type junction (curated fact) -----------------------------------


def test_avoid_flag_when_a_curated_avoid_record_exists() -> None:
    result = _evaluate(avoid_reason="Can worsen barrier sensitivity in very dry skin.")

    assert result.avoid_flag is True
    assert result.suitable is False
    assert result.confidence == 0.85


# --- Clean case ---------------------------------------------------------------------


def test_no_conflicts_is_suitable_with_baseline_confidence() -> None:
    result = _evaluate()

    assert result.suitable is True
    assert result.allergy_flag is False
    assert result.avoid_flag is False
    assert result.confidence == 0.6


def test_allergy_check_wins_over_an_avoid_flag() -> None:
    """Allergy is the hard requirement — it must never be shadowed by a lower-priority
    signal being checked first and returning early."""
    result = _evaluate(allergies="retinol", avoid_reason="unrelated avoid reason")

    assert result.allergy_flag is True
