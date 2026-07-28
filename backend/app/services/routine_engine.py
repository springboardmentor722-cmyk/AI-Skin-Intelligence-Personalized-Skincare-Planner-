"""Personalised Routine Generation — Milestone 2, Step 4.

Takes the prioritised concern + skin type from the assessment engine, pulls the
matching template out of the seeded decision matrix, tailors it to the primary
concern, then runs a SAFETY PASS that strips harsh categories for sensitive skin —
swapping them for gentle alternatives rather than leaving a hole in the routine.
"""
from __future__ import annotations

import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from ..models import RoutineTemplate

PHASES = ("AM", "PM", "Weekly", "Seasonal")

# ---------------------------------------------------------------------------
# SAFETY: categories that must never reach sensitive / barrier-damaged skin.
# Each maps to the gentle category that REPLACES it — never a silent deletion.
# ---------------------------------------------------------------------------
HARSH_CATEGORIES: dict[str, str] = {
    "Chemical Exfoliation": "Hydrating Treatment",
    "Physical Exfoliation": "Gentle Cleansing",
    "Retinoid Treatment": "Barrier Repair",
    "Strong Acid Treatment": "Soothing Treatment",
    "Vitamin C Treatment": "Antioxidant Serum (gentle)",
    "Peel": "Hydrating Mask",
    "Astringent Toner": "Hydrating Toner",
}

# The step injected for the user's PRIMARY concern, per phase.
CONCERN_STEPS: dict[str, dict[str, str]] = {
    "Acne":              {"AM": "Treatment", "PM": "Treatment", "Weekly": "Chemical Exfoliation"},
    "Hyperpigmentation": {"AM": "Vitamin C Treatment", "PM": "Treatment", "Weekly": "Chemical Exfoliation"},
    "Dark Spots":        {"AM": "Vitamin C Treatment", "PM": "Treatment", "Weekly": "Chemical Exfoliation"},
    "Wrinkles":          {"AM": "Antioxidant Serum", "PM": "Retinoid Treatment", "Weekly": "Hydrating Mask"},
    "Fine Lines":        {"AM": "Antioxidant Serum", "PM": "Retinoid Treatment", "Weekly": "Hydrating Mask"},
    "Oiliness":          {"AM": "Oil Control", "PM": "Treatment", "Weekly": "Clay Mask"},
    "Dry Skin":          {"AM": "Hydrating Treatment", "PM": "Barrier Repair", "Weekly": "Hydrating Mask"},
    "Redness":           {"AM": "Soothing Treatment", "PM": "Soothing Treatment", "Weekly": "Calming Mask"},
    "Sensitive Skin":    {"AM": "Barrier Repair", "PM": "Barrier Repair", "Weekly": "Hydrating Mask"},
}

# Plain-language guidance shown beside each step in the dashboard checklist.
STEP_INSTRUCTIONS: dict[str, str] = {
    "Cleansing": "Wash with lukewarm water using a gentle, low-pH cleanser.",
    "Gentle Cleansing": "Use a fragrance-free, non-foaming cleanser. Do not scrub.",
    "Treatment": "Apply your targeted active to clean, dry skin and let it absorb.",
    "Soothing Treatment": "Apply a calming serum (azelaic acid or centella) to reduce redness.",
    "Hydrating Treatment": "Apply a humectant serum (hyaluronic acid) onto slightly damp skin.",
    "Vitamin C Treatment": "Apply antioxidant serum before moisturiser. Always follow with SPF.",
    "Antioxidant Serum": "A few drops, pressed into the skin. Protects against daily pollution.",
    "Antioxidant Serum (gentle)": "A low-concentration antioxidant, formulated for reactive skin.",
    "Retinoid Treatment": "Pea-sized amount at night. Start 2x per week and build up slowly.",
    "Moisturizing": "Seal in hydration with a moisturiser suited to your skin type.",
    "Barrier Repair": "Apply a ceramide-rich cream to rebuild the skin barrier.",
    "Night Care": "Apply your richer night treatment as the final step.",
    "Sun Protection": "Broad-spectrum SPF 50, every morning, rain or shine. Reapply every 2 hours outdoors.",
    "Oil Control": "Use a lightweight, oil-free formula. Do not skip moisturiser.",
    "Chemical Exfoliation": "A leave-on AHA/BHA. Never combine with retinoids on the same night.",
    "Physical Exfoliation": "A gentle scrub. Light pressure only.",
    "Clay Mask": "Apply to the T-zone for 10 minutes, then rinse.",
    "Hydrating Mask": "Leave on for 15 minutes to flood the skin with moisture.",
    "Calming Mask": "A soothing mask to settle irritation and redness.",
    "Hydrating Toner": "Pat into skin straight after cleansing, while still damp.",
    "Seasonal Adjustment": "Switch to a richer cream in winter, a lighter gel in summer.",
    "Humidity Care": "Adjust hydration to the season — lighter in summer, heavier in winter.",
    "SPF Reinforcement": "UV is present year-round, including winter and cloudy days.",
}

# ---------------------------------------------------------------------------
# The seeded decision matrix (spec Step 1.3) — 5 skin types x 4 phases.
# ---------------------------------------------------------------------------
DECISION_MATRIX: dict[str, dict[str, list[str]]] = {
    "oily": {
        "AM": ["Cleansing", "Treatment", "Oil Control", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Night Care"],
        "Weekly": ["Chemical Exfoliation", "Clay Mask"],
        "Seasonal": ["Seasonal Adjustment", "SPF Reinforcement"],
    },
    "dry": {
        "AM": ["Cleansing", "Hydrating Treatment", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Hydrating Treatment", "Barrier Repair", "Night Care"],
        "Weekly": ["Hydrating Mask"],
        "Seasonal": ["Seasonal Adjustment", "Humidity Care"],
    },
    "combination": {
        "AM": ["Cleansing", "Treatment", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing", "Night Care"],
        "Weekly": ["Chemical Exfoliation", "Hydrating Mask"],
        "Seasonal": ["Seasonal Adjustment", "SPF Reinforcement"],
    },
    "sensitive": {
        # Deliberately minimal: no actives, no acids, no exfoliation.
        "AM": ["Gentle Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Gentle Cleansing", "Moisturizing"],
        "Weekly": ["Calming Mask"],
        "Seasonal": ["Humidity Care"],
    },
    "normal": {
        "AM": ["Cleansing", "Moisturizing", "Sun Protection"],
        "PM": ["Cleansing", "Treatment", "Moisturizing"],
        "Weekly": ["Chemical Exfoliation", "Hydrating Mask"],
        "Seasonal": ["Seasonal Adjustment", "SPF Reinforcement"],
    },
}


def is_sensitive(skin_type: str | None, concerns: list[dict],
                 sensitivities: str | None = None) -> bool:
    """Does this user need the safety pass?

    True when the skin type is sensitive, OR any sensitivity was declared, OR a
    sensitivity/redness concern is flagged at HIGH severity.
    """
    if (skin_type or "").strip().lower() == "sensitive":
        return True
    if (sensitivities or "").strip():
        return True
    for c in concerns:
        if c.get("name") in ("Sensitive Skin", "Redness") and c.get("severity") == "high":
            return True
    return False


def apply_safety_rules(steps: list[str]) -> list[str]:
    """SAFETY PASS: swap every harsh category for its gentle alternative.

    Nothing is dropped without a replacement — a routine with a hole in it is
    worse than one with a gentle substitute.
    """
    safe: list[str] = []
    for step in steps:
        replacement = HARSH_CATEGORIES.get(step)
        if replacement:
            if replacement not in safe:
                safe.append(replacement)
        elif step not in safe:
            safe.append(step)
    return safe


def _load_template(db: Session | None, skin_type: str, phase: str) -> list[str]:
    """Pull the phase template from the seeded table; fall back to the in-code matrix."""
    if db is not None:
        row = db.scalar(select(RoutineTemplate).where(
            RoutineTemplate.skin_type == skin_type,
            RoutineTemplate.time_of_day == phase,
        ))
        if row:
            try:
                return list(json.loads(row.steps))
            except (ValueError, TypeError):
                pass
    return list(DECISION_MATRIX.get(skin_type, DECISION_MATRIX["normal"]).get(phase, []))


def generate_routine(
    skin_type: str | None,
    concerns: list[dict],
    sensitivities: str | None = None,
    db: Session | None = None,
) -> dict[str, list[dict]]:
    """Build the full AM / PM / Weekly / Seasonal plan.

    Returns {"AM": [{step_number, step_category, instruction}, ...], "PM": [...], ...}
    Pass db=None to run it purely in-memory (which is how the unit tests drive it).
    """
    st = (skin_type or "normal").strip().lower()
    if st not in DECISION_MATRIX:
        st = "normal"

    primary = concerns[0]["name"] if concerns else None
    sensitive = is_sensitive(st, concerns, sensitivities)

    plan: dict[str, list[dict]] = {}

    for phase in PHASES:
        steps = _load_template(db, st, phase)

        # Tailor to the primary concern by injecting its targeted step.
        if primary and primary in CONCERN_STEPS:
            extra = CONCERN_STEPS[primary].get(phase)
            if extra and extra not in steps:
                # Treatments belong after cleansing, before moisturiser and SPF.
                insert_at = 1 if len(steps) > 1 else len(steps)
                steps.insert(insert_at, extra)

        # SAFETY PASS — the hard requirement from the specification.
        if sensitive:
            steps = apply_safety_rules(steps)

        plan[phase] = [
            {"step_number": i,
             "step_category": category,
             "instruction": STEP_INSTRUCTIONS.get(category, "")}
            for i, category in enumerate(steps, start=1)
        ]

    return plan
