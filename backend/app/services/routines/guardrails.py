"""Milestone 2 P11 (MILESTONE 2.docx "SAFETY GUARDRAILS — non-negotiable") — a
distinct, independently-testable layer applied AFTER routine generation
(`routines/service.py`'s `_generate_routine` builds the raw candidate-based
steps; this module is the second, unbypassable pass over them), per the doc's
own reasoning: "so a future change to the generator cannot quietly bypass
them." Pure — no DB/network I/O, no clock reads; every input is already-fetched
plain data.

Two rules:
1. A sensitive skin profile, OR redness severity > 7/10, overrides harsh
   exfoliants and strong retinoids in favour of soothing actives.
2. Every generated AM routine contains a Sun Protection step. No exceptions, no
   configuration that can disable it.
"""

from dataclasses import dataclass, replace

from app.services.routines.constants import SUN_PROTECTION

# ">7/10" per the doc — redness severity of exactly 7 is NOT yet an override;
# 8 is. Tested at both boundaries (the mandated Safety Exclusion Test).
REDNESS_SEVERITY_OVERRIDE_THRESHOLD = 7

# Ingredient categories treated as "harsh" for this guardrail (backend/app/db/
# seed.py's curated ingredient master, docs/DATASETS_AND_APIS.md §3's 8 named
# categories): Retinoids (strong retinoid), Salicylic Acid and AHAs/BHAs (harsh
# chemical exfoliants — the seed catalog has no physical-scrub product to guard
# against, so this doesn't claim to cover one). Deliberately narrower than "every
# ingredient avoid-flagged for Sensitive skin" (that set also includes Vitamin C,
# which is neither an exfoliant nor a retinoid) — this guardrail's job is
# specifically the doc's "harsh exfoliants and strong retinoids" category, not a
# second copy of the broader skin-type avoid-flag table.
HARSH_INGREDIENT_CATEGORIES = frozenset({"Retinoids", "Salicylic Acid", "AHAs/BHAs"})

# The real soothing product this catalog seeds for Sensitive skin (backend/app/
# db/seed.py's "Centella Calming Serum", Redness/Sensitive Skin concerns) — the
# doc's own named example (Centella Asiatica); no Azelaic Acid product exists in
# this catalog.
SOOTHING_PRODUCT_NAME = "Centella Calming Serum"

SAFETY_FLAG_SOOTHING_SUBSTITUTION = "soothing_substitution"


@dataclass
class GeneratedStep:
    """An in-memory, not-yet-persisted routine step — routines/service.py
    builds a list of these per routine, guardrails.py may replace a step's
    product and set safety_flag, then service.py persists the final list."""

    category: str
    step_name: str
    rationale: str
    product_id: int
    safety_flag: str | None = None


def requires_soothing_substitution(
    skin_type_name: str | None, redness_severity: int | None
) -> bool:
    """Sensitive skin type OR redness severity strictly greater than
    `REDNESS_SEVERITY_OVERRIDE_THRESHOLD` (7) — 7 itself does not trigger it."""
    return skin_type_name == "Sensitive" or (
        redness_severity is not None and redness_severity > REDNESS_SEVERITY_OVERRIDE_THRESHOLD
    )


def is_harsh_product(ingredient_categories: list[str]) -> bool:
    return any(category in HARSH_INGREDIENT_CATEGORIES for category in ingredient_categories)


def apply_safety_guardrails(
    steps: list[GeneratedStep],
    *,
    skin_type_name: str | None,
    redness_severity: int | None,
    product_ingredient_categories: dict[int, list[str]],
    soothing_product_id: int | None,
) -> list[GeneratedStep]:
    """Replaces (never appends alongside) any step whose chosen product is harsh
    with the soothing product, when `requires_soothing_substitution` is true.
    Returns a new list — does not mutate `steps` — so a caller holding the
    pre-guardrail list for comparison (as the mandated tests do) sees the
    original untouched."""
    if not requires_soothing_substitution(skin_type_name, redness_severity):
        return list(steps)
    if soothing_product_id is None:
        # No real soothing product available for this catalog/candidate set —
        # nothing to substitute in; leave steps as generation produced them
        # rather than silently dropping a step.
        return list(steps)

    result: list[GeneratedStep] = []
    for step in steps:
        categories = product_ingredient_categories.get(step.product_id, [])
        if is_harsh_product(categories) and step.product_id != soothing_product_id:
            result.append(
                replace(
                    step,
                    product_id=soothing_product_id,
                    rationale="Substituted for a soothing active — your profile flags a"
                    " sensitivity risk for stronger actives here.",
                    safety_flag=SAFETY_FLAG_SOOTHING_SUBSTITUTION,
                )
            )
        else:
            result.append(step)
    return result


class MissingSunscreenError(RuntimeError):
    """Raised, never silently swallowed, if an AM routine would otherwise ship
    without a Sun Protection step — this guardrail has no bypass, per the doc's
    "no configuration that can disable it." Should never actually fire against
    the real seed catalog (a Sunscreen product exists for every skin type); if
    it ever does, that's a real candidate-pool bug to fix, not paper over."""


def assert_sunscreen_present(steps: list[GeneratedStep], routine_type: str) -> None:
    if routine_type != "AM":
        return
    if not any(step.category == SUN_PROTECTION for step in steps):
        raise MissingSunscreenError(
            "Generated AM routine has no Sun Protection step — this must never happen."
        )
