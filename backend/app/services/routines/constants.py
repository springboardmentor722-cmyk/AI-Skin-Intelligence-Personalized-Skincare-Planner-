"""Milestone 2 P11 (MILESTONE 2.docx §"Dynamic Routine Generator" / §4
"Personalized Routine Generator") — canonical categories and pipelines, mapped
line-by-line to the doc. No literal category/pipeline name is duplicated
elsewhere in this service."""

from typing import NamedTuple

# Canonical, exactly these six.
CLEANSING = "Cleansing"
EXFOLIATION = "Exfoliation"
TREATMENT = "Treatment"
MOISTURIZING = "Moisturizing"
SUN_PROTECTION = "Sun Protection"
NIGHT_CARE = "Night Care"

CATEGORIES: list[str] = [
    CLEANSING,
    EXFOLIATION,
    TREATMENT,
    MOISTURIZING,
    SUN_PROTECTION,
    NIGHT_CARE,
]

# The seed catalog (backend/app/db/seed.py) has only 4 product categories
# (Cleanser/Treatment/Moisturizer/Sunscreen) — no dedicated Exfoliation/Night Care
# product category exists. Candidates for a canonical category are drawn from its
# mapped real product category; Exfoliation and Night Care share Treatment/
# Moisturizer respectively (same real actives, different cadence/positioning) —
# mirrors this service's own pre-P11 "Night Care -> Moisturizer" precedent.
CATEGORY_TO_PRODUCT_CATEGORY: dict[str, str] = {
    CLEANSING: "Cleanser",
    EXFOLIATION: "Treatment",
    TREATMENT: "Treatment",
    MOISTURIZING: "Moisturizer",
    SUN_PROTECTION: "Sunscreen",
    NIGHT_CARE: "Moisturizer",
}


class PipelineStep(NamedTuple):
    category: str
    step_name: str  # the doc's own literal step description
    rationale: str


# AM pipeline (MILESTONE 2.docx, literal order and names).
AM_PIPELINE: list[PipelineStep] = [
    PipelineStep(
        CLEANSING,
        "Gentle/Gel Cleanser",
        "Clears overnight buildup without stripping the skin barrier.",
    ),
    PipelineStep(
        TREATMENT,
        "Antioxidant/Brightening Active",
        "Protects against daytime oxidative stress and evens tone.",
    ),
    PipelineStep(
        MOISTURIZING,
        "Lightweight Hydrator",
        "Seals in hydration without weighing down under sunscreen or makeup.",
    ),
    PipelineStep(SUN_PROTECTION, "Broad Spectrum SPF 30+", "Non-negotiable daily UV protection."),
]

# PM pipeline (MILESTONE 2.docx, literal order and names).
PM_PIPELINE: list[PipelineStep] = [
    PipelineStep(
        CLEANSING,
        "Double Cleanse (Oil/Micellar + Water-based)",
        "Removes sunscreen/makeup, then residual oil and impurities.",
    ),
    PipelineStep(
        TREATMENT,
        "Targeted Active Treatment",
        "Concentrated actives work uninterrupted overnight.",
    ),
    PipelineStep(
        NIGHT_CARE,
        "Ceramide Barrier Cream",
        "Repairs and reinforces the skin barrier overnight.",
    ),
]

# Weekly Care — Exfoliation is a lower-cadence category, not a daily AM/PM step
# (real-world skincare guidance; this catalog's exfoliating actives are Treatment-
# category products used less often, not a separate product line).
WEEKLY_PIPELINE: list[PipelineStep] = [
    PipelineStep(
        EXFOLIATION,
        "Weekly Exfoliating Treatment",
        "2-3x/week chemical exfoliation — daily use over-strips the skin barrier.",
    ),
]

# Seasonal Care — a calendar-quarter swap of which canonical categories a
# season's routine emphasizes (the same real, schema-backed field the AM/PM/
# Weekly pipelines use, just re-weighted per season — no invented "heavy vs
# light" product-weight tagging, since no such field exists in the real schema).
SEASON_CATEGORIES: dict[str, list[str]] = {
    "Winter": [CLEANSING, MOISTURIZING, TREATMENT],
    "Spring": [CLEANSING, MOISTURIZING, SUN_PROTECTION],
    "Summer": [CLEANSING, SUN_PROTECTION, TREATMENT],
    "Fall": [CLEANSING, MOISTURIZING, SUN_PROTECTION],
}
SEASON_BY_MONTH: dict[int, str] = {
    12: "Winter",
    1: "Winter",
    2: "Winter",
    3: "Spring",
    4: "Spring",
    5: "Spring",
    6: "Summer",
    7: "Summer",
    8: "Summer",
    9: "Fall",
    10: "Fall",
    11: "Fall",
}
