"""
Concern analysis workflows — Milestone 2, Step 2.2.

Deterministic rule-based prioritization (the spec offers scikit-learn OR
a custom rule-based framework — a rule-based approach is used here because
it's exactly reproducible, which is what Step 6's assertions need; a
scikit-learn classifier would need training data we don't have yet and
would make "assert this profile always prioritizes Acne" a flaky test).
"""

SEVERITY_WEIGHT = {"high": 3, "medium": 2, "low": 1}

# Tie-break order when two concerns land on the same priority score —
# earlier entries win. Matches the spec's own example (an active acne
# flare-up should outrank wrinkles even if both are reported).
TIE_BREAK_ORDER = ["Acne", "Hyperpigmentation", "Dark Spots", "Oiliness", "Redness", "Wrinkles", "Fine Lines"]


def _priority_score(concern: dict) -> tuple[int, int]:
    severity = (concern.get("severity") or "").strip().lower()
    weight = SEVERITY_WEIGHT.get(severity, 0)
    flare_boost = 1 if concern.get("is_active_flare") else 0
    return (weight + flare_boost, flare_boost)


def identify_skin_concerns(skin_concerns: list[dict]) -> tuple[list[dict], str | None]:
    """
    identify_skin_concerns(profile_data) per the spec.

    Takes the user's self-reported concerns (each a dict with `name`,
    `severity`, and optionally `is_active_flare`), sorts them by priority
    (severity + active-flare boost, with a fixed tie-break order for
    genuine ties), and returns:

        (sorted_concerns_with_priority_rank, primary_concern_name)

    `sorted_concerns_with_priority_rank` is the same list of concerns,
    each annotated with a `priority_rank` (1 = highest), ready to be
    stored in skin_assessments.detected_concerns.
    """
    if not skin_concerns:
        return [], None

    def sort_key(concern: dict) -> tuple:
        score, flare_boost = _priority_score(concern)
        name = concern.get("name", "")
        tie_break_index = TIE_BREAK_ORDER.index(name) if name in TIE_BREAK_ORDER else len(TIE_BREAK_ORDER)
        # Higher score and flare_boost should sort first -> negate for ascending sort.
        return (-score, -flare_boost, tie_break_index)

    ordered = sorted(skin_concerns, key=sort_key)

    annotated = []
    for rank, concern in enumerate(ordered, start=1):
        annotated.append({**concern, "priority_rank": rank})

    primary_concern = annotated[0]["name"] if annotated else None
    return annotated, primary_concern
