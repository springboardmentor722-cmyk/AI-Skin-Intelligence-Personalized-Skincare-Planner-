"""
Decision matrix — Milestone 2, Step 1.3.

The spec calls for "a temporary internal lookup schema (or table) mapping
specific user skin types to standard skincare steps" since real product
data doesn't arrive until Milestone 3. A plain Python dict is used here
rather than a database table: it's read-only, ships with the code, needs
no migration, and is trivial to swap for a database-backed table later
without changing any calling code (routine_service only ever calls
`get_routine_template()` below).

Categories used here match the skincare_routines.step_category column:
Cleansing, Treatment, Moisturizing, Sun Protection, Night Care.
"""

from utils.constants import SKIN_TYPES

# Mapping Entry A & B are exactly as specified; every other skin type in
# SKIN_TYPES gets a sensible default so the app never has a skin type with
# no routine at all.
SKIN_TYPE_ROUTINE_MATRIX: dict[str, dict[str, list[str]]] = {
    "Oily": {
        "AM": ["Cleansing", "Treatment", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Night Care"],
    },
    "Sensitive": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Moisturizing"],
    },
    "Dry": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing", "Night Care"],
    },
    "Combination": {
        "AM": ["Cleansing", "Treatment", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing"],
    },
    "Normal": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Moisturizing", "Night Care"],
    },
}

# Weekly steps layered on top of the AM/PM template, before any safety filter runs.
DEFAULT_WEEKLY_STEPS: list[str] = ["Exfoliation", "Hydrating Mask"]

# Categories considered harsh/aggressive for highly sensitive skin.
HARSH_STEP_CATEGORIES: set[str] = {"Exfoliation", "Retinoid Treatment", "Chemical Peel"}

# What a harsh category gets swapped for when the safety filter triggers.
SAFE_REPLACEMENT_CATEGORY: str = "Gentle Moisturizing"

# Simple seasonal guidance surfaced alongside the generated routine. Not a
# structured set of steps (the schema in the spec has no "season" column),
# just a short tip returned in the API response.
SEASONAL_TIPS: dict[str, str] = {
    "Oily": "In hot/humid months, switch to a gel-based moisturizer and reapply sunscreen midday.",
    "Sensitive": "In cold/dry months, add a barrier-repair cream and avoid hot water cleansing.",
    "Dry": "In cold/dry months, layer a richer night cream; in summer, lighten to a lotion.",
    "Combination": "Adjust zone-by-zone: more hydration on cheeks, oil control on the T-zone in summer.",
    "Normal": "A light seasonal adjustment to moisturizer richness is usually enough.",
}


def get_routine_template(skin_type: str) -> dict[str, list[str]]:
    """
    Return the AM/PM/Weekly step-category template for a skin type.

    Falls back to the "Normal" template for any skin type not explicitly
    seeded above (including unrecognized/empty input), so routine
    generation never fails outright for an unusual profile.
    """
    template = SKIN_TYPE_ROUTINE_MATRIX.get(skin_type, SKIN_TYPE_ROUTINE_MATRIX["Normal"])
    return {
        "AM": list(template["AM"]),
        "PM": list(template["PM"]),
        "Weekly": list(DEFAULT_WEEKLY_STEPS),
    }


def apply_sensitivity_safety_filter(steps: list[str], is_highly_sensitive: bool) -> list[str]:
    """
    Step 4.1 safety check: if the user's skin is flagged as highly
    sensitive, intercept the step array and swap harsh categories for a
    gentle alternative, de-duplicating so the safe category doesn't
    appear twice in the same list.
    """
    if not is_highly_sensitive:
        return list(steps)

    filtered: list[str] = []
    for step in steps:
        if step in HARSH_STEP_CATEGORIES:
            if SAFE_REPLACEMENT_CATEGORY not in filtered:
                filtered.append(SAFE_REPLACEMENT_CATEGORY)
        else:
            filtered.append(step)
    return filtered


def get_seasonal_tip(skin_type: str) -> str:
    return SEASONAL_TIPS.get(skin_type, SEASONAL_TIPS["Normal"])


assert set(SKIN_TYPES) <= set(SKIN_TYPE_ROUTINE_MATRIX), (
    "Every skin type in utils.constants.SKIN_TYPES must have a routine template."
)
