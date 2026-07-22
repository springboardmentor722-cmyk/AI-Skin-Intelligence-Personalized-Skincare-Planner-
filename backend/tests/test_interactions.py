"""app/ai/interactions.py — curated pairwise ingredient interaction rules (M3-B).
Hand-curated per docs/DATASETS_AND_APIS.md §3 ("use these sites as a human reference
to manually curate... quality over quantity") — never scraped from INCIDecoder/COSDNA."""

from app.ai.interactions import get_interaction


def test_known_conflicting_pair_returns_avoid_verdict() -> None:
    result = get_interaction("Retinol", "Glycolic Acid")

    assert result is not None
    assert result["verdict"] == "avoid"
    assert result["reason"]


def test_lookup_is_case_insensitive_and_order_independent() -> None:
    forward = get_interaction("retinol", "glycolic acid")
    backward = get_interaction("GLYCOLIC ACID", "RETINOL")

    assert forward == backward
    assert forward is not None


def test_known_synergistic_pair_returns_synergy_verdict() -> None:
    result = get_interaction("Hyaluronic Acid", "Retinol")

    assert result is not None
    assert result["verdict"] == "synergy"


def test_unknown_pair_returns_none_not_a_fabricated_verdict() -> None:
    result = get_interaction("Hyaluronic Acid", "Some Made Up Ingredient")

    assert result is None


def test_same_ingredient_paired_with_itself_returns_none() -> None:
    result = get_interaction("Retinol", "Retinol")

    assert result is None
