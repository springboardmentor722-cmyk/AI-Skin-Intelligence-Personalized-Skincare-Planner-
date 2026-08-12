"""Deterministic, conservative ingredient safety helpers.

This service intentionally uses only saved catalog and profile information. It does
not diagnose conditions or call an AI provider.
"""
from __future__ import annotations

import ast
import re


CONFLICT_RULES = (
    (("retinol", "benzoyl peroxide"), "Retinol and benzoyl peroxide may be irritating when used together."),
    (("retinol", "glycolic acid"), "Retinol and exfoliating acids may be irritating when used together."),
    (("retinol", "salicylic acid"), "Retinol and exfoliating acids may be irritating when used together."),
    (("benzoyl peroxide", "glycolic acid"), "Benzoyl peroxide and exfoliating acids may be irritating when used together."),
)


def normalize(value: str | None) -> str:
    return re.sub(r"\s+", " ", (value or "").lower()).strip()


def terms(value: str | None) -> list[str]:
    return [item.strip() for item in re.split(r"[,;/\n]+", normalize(value)) if item.strip()]


def product_ingredients(value: str | None) -> list[str]:
    """Read either imported Python-like ingredient lists or plain text safely."""
    if not value:
        return []
    try:
        parsed = ast.literal_eval(value)
        if isinstance(parsed, (list, tuple)):
            return [normalize(str(item)) for item in parsed if normalize(str(item))]
    except (SyntaxError, ValueError):
        pass
    return terms(value)


def analyze_ingredient(ingredient, skin_type: str | None, skin_concerns: str | None, allergies: str | None, sensitivities: str | None) -> dict:
    name = ingredient.ingredient_name or "Unknown ingredient"
    normalized_name = normalize(name)
    user_terms = terms(allergies) + terms(sensitivities)
    profile_text = " ".join((normalize(skin_type), normalize(skin_concerns)))
    warnings, concerns = [], []
    allergy_match = next((term for term in user_terms if term and (term in normalized_name or normalized_name in term)), None)
    if allergy_match:
        warnings.append(f"Matches your saved allergy or sensitivity: {allergy_match}.")
        status, score = "UNSAFE", 0
    elif ingredient.side_effects and normalize(ingredient.side_effects) not in {"none", "n/a", "na"}:
        warnings.append(f"Catalog caution: {ingredient.side_effects}")
        status, score = "WARNING", 70
    elif not ingredient.benefits and not ingredient.description and not ingredient.short_description:
        status, score = "UNKNOWN", 50
    else:
        status, score = "SAFE", 100
    if ingredient.suitable_skin and normalize(ingredient.suitable_skin) not in {"all", "any"} and normalize(ingredient.suitable_skin) not in profile_text:
        concerns.append(f"Catalog suitability is {ingredient.suitable_skin}; profile fit is not confirmed.")
    benefits = [text for text in (ingredient.benefits, ingredient.short_description, ingredient.description) if text]
    return {"ingredient_id": ingredient.ingredient_id, "ingredient_name": name, "safety_status": status, "safety_score": score, "benefits": benefits, "concerns": concerns, "warnings": warnings, "conflicts": [], "reason": benefits[0] if benefits else "The catalog has limited information for this ingredient."}


def detect_conflicts(ingredient_names: list[str]) -> list[str]:
    joined = " | ".join(normalize(name) for name in ingredient_names)
    return [message for required, message in CONFLICT_RULES if all(name in joined for name in required)]
