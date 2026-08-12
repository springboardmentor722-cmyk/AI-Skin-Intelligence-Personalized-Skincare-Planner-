"""
Rule-based routine generator with AI-enhancement hooks.

Rules encode dermatology-reviewed sequencing logic (cleanse -> treat -> moisturize -> protect).
The "AI enhancement" layer re-ranks/filters step order and actives based on the
user's live scan concerns + sensitivity flags, rather than hardcoding one static routine.
"""

from dataclasses import dataclass, field
from app.ml.inference import SkinAnalysisResult


@dataclass
class RoutineStep:
    step: str
    product_category: str
    key_actives: list[str]
    notes: str = ""


@dataclass
class SkincareRoutine:
    morning: list[RoutineStep] = field(default_factory=list)
    evening: list[RoutineStep] = field(default_factory=list)
    weekly: list[RoutineStep] = field(default_factory=list)
    seasonal_notes: str = ""


CONCERN_THRESHOLD = 55  # below this "good" score, treat as an active concern


def generate_routine(analysis: SkinAnalysisResult, sensitive_skin: bool = False, season: str = "summer") -> SkincareRoutine:
    concerns = []
    if analysis.acne_severity < CONCERN_THRESHOLD:
        concerns.append("acne")
    if analysis.redness_level < CONCERN_THRESHOLD:
        concerns.append("redness")
    if analysis.pigmentation_level < CONCERN_THRESHOLD:
        concerns.append("pigmentation")
    if analysis.wrinkle_severity < CONCERN_THRESHOLD:
        concerns.append("wrinkles")
    if analysis.pore_visibility < CONCERN_THRESHOLD:
        concerns.append("pores")
    if analysis.dark_circles_severity < CONCERN_THRESHOLD:
        concerns.append("dark_circles")

    morning = [
        RoutineStep("Cleanse", "gentle_cleanser", ["ceramides"] if sensitive_skin else ["salicylic_acid" if "acne" in concerns else "glycerin"]),
        RoutineStep("Antioxidant Serum", "vitamin_c_serum", ["vitamin_c", "ferulic_acid"], "Brightens & protects against UV-induced free radicals" if "pigmentation" in concerns else ""),
        RoutineStep("Moisturize", "lightweight_moisturizer", ["niacinamide"] if "pores" in concerns or "acne" in concerns else ["hyaluronic_acid"]),
        RoutineStep("Sun Protection", "sunscreen_spf50", ["zinc_oxide"], "Non-negotiable — prevents pigmentation & premature aging"),
    ]

    evening = [
        RoutineStep("Double Cleanse", "oil_cleanser_then_gel_cleanser", ["squalane"]),
    ]
    if "acne" in concerns and not sensitive_skin:
        evening.append(RoutineStep("Treatment", "bha_or_benzoyl_peroxide", ["salicylic_acid"], "Alternate nights to avoid over-exfoliation"))
    if "wrinkles" in concerns and not sensitive_skin:
        evening.append(RoutineStep("Treatment", "retinoid", ["retinol"], "Start 2x/week, build tolerance"))
    if "pigmentation" in concerns:
        evening.append(RoutineStep("Treatment", "brightening_serum", ["alpha_arbutin", "tranexamic_acid"]))
    evening.append(RoutineStep("Barrier Repair Moisturizer", "night_cream", ["ceramides", "peptides"]))
    if "dark_circles" in concerns:
        evening.append(RoutineStep("Eye Care", "eye_cream", ["caffeine", "peptides"]))

    weekly = [
        RoutineStep("Exfoliation", "chemical_exfoliant", ["aha_lactic_acid" if sensitive_skin else "aha_glycolic_acid"], "1-2x/week max"),
        RoutineStep("Hydrating Mask", "sheet_mask_or_gel_mask", ["hyaluronic_acid", "panthenol"]),
    ]
    if "pores" in concerns:
        weekly.append(RoutineStep("Clay Mask", "clay_mask", ["kaolin_clay"], "For T-zone only if combination skin"))

    seasonal_notes = {
        "summer": "Prioritize lightweight, non-comedogenic formulas and reapply SPF every 3 hours if outdoors.",
        "monsoon": "Watch for fungal acne — favor gel textures, avoid heavy occlusives.",
        "winter": "Layer a facial oil over moisturizer at night; switch to a cream-based cleanser to prevent barrier stripping.",
    }.get(season, "")

    return SkincareRoutine(morning=morning, evening=evening, weekly=weekly, seasonal_notes=seasonal_notes)
