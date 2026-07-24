"""Curated ingredient name/INCI synonym groups (Milestone 2 P12, PDF Module 5
"allergy detection... match against known synonyms/INCI names"). Same discipline
as app/ai/interactions.py: hand-curated, well-established common-name/INCI pairs,
never scraped, never an inferred/guessed relationship. Each group is one real
substance under its alternate names — not a drug-class or "commonly paired with"
grouping, so matching stays a factual identity claim, never a cross-reactivity
inference.
"""

_SYNONYM_GROUPS: list[frozenset[str]] = [
    frozenset({"ascorbic acid", "l-ascorbic acid", "vitamin c"}),
    frozenset({"retinol", "vitamin a"}),
    frozenset({"niacinamide", "nicotinamide", "vitamin b3"}),
    frozenset({"hyaluronic acid", "sodium hyaluronate", "hyaluronan"}),
    # "BHA" is used almost universally in consumer skincare to mean salicylic
    # acid specifically — no other beta-hydroxy acid is in common cosmetic use.
    frozenset({"salicylic acid", "beta hydroxy acid", "bha"}),
    frozenset({"ceramide np", "ceramide 3"}),
    frozenset({"ceramide ap", "ceramide 6-ii"}),
    frozenset({"palmitoyl pentapeptide-4", "matrixyl"}),
]

_GROUP_BY_NAME: dict[str, frozenset[str]] = {
    name: group for group in _SYNONYM_GROUPS for name in group
}


def same_ingredient(name_a: str | None, name_b: str | None) -> bool:
    """Case/whitespace-insensitive identity check: exact match, or both names sit
    in the same curated synonym group. `None`/empty never matches anything."""
    if not name_a or not name_b:
        return False
    a, b = name_a.strip().lower(), name_b.strip().lower()
    if a == b:
        return True
    group = _GROUP_BY_NAME.get(a)
    return group is not None and b in group
