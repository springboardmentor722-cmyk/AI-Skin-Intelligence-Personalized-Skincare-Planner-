"""
Ingredient Intelligence Engine — Milestone 3, Step 1.

Three independent checks feed the safety score:
  1. Allergy matching   — cross-reference the user's free-text allergy
                           profile against ingredient names/categories/aliases.
  2. Chemical conflicts  — look up the seeded conflict matrix for any pair
                           of categories present in the same routine step.
  3. Weighted score      — combine both into a single 0-100 score + label.
"""

import uuid

from sqlalchemy import or_
from sqlalchemy.orm import Session

from models.ingredient import Ingredient, IngredientConflict
from models.product import Product

ALLERGY_PENALTY = 30
CONFLICT_PENALTY = {"Unsafe": 40, "Warning": 15}


def get_all_ingredients(db: Session) -> list[Ingredient]:
    return db.query(Ingredient).order_by(Ingredient.category).all()


def get_categories_for_product(db: Session, product_id: uuid.UUID) -> list[str]:
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        return []
    return sorted({ing.category for ing in product.ingredients})


def match_allergens(db: Session, allergy_text: str | None, categories: list[str]) -> list[dict]:
    """
    Cross-reference free-text allergies (from SkinProfile.allergies) against
    every ingredient in the given categories — by name, category, or any
    known alias. Case-insensitive substring match in both directions so
    "Salicylic Acid" matches a profile that just says "salicylic".
    """
    if not allergy_text or not categories:
        return []

    tokens = [t.strip().lower() for t in allergy_text.replace(";", ",").split(",") if t.strip()]
    if not tokens:
        return []

    ingredients = db.query(Ingredient).filter(Ingredient.category.in_(categories)).all()

    alerts = []
    for ingredient in ingredients:
        searchable = [ingredient.name.lower(), ingredient.category.lower()] + [
            a.lower() for a in (ingredient.aliases or [])
        ]
        for token in tokens:
            if any(token in term or term in token for term in searchable):
                alerts.append(
                    {
                        "ingredient": ingredient.name,
                        "category": ingredient.category,
                        "matched_allergy_term": token,
                    }
                )
                break
    return alerts


def get_conflicts(db: Session, categories: list[str]) -> list[dict]:
    """Every conflict-matrix rule where BOTH sides are present in `categories` (same routine step)."""
    if len(set(categories)) < 2:
        return []

    rules = (
        db.query(IngredientConflict)
        .filter(
            or_(
                IngredientConflict.category_a.in_(categories),
                IngredientConflict.category_b.in_(categories),
            )
        )
        .all()
    )

    category_set = set(categories)
    warnings = []
    for rule in rules:
        if rule.category_a in category_set and rule.category_b in category_set:
            warnings.append(
                {
                    "category_a": rule.category_a,
                    "category_b": rule.category_b,
                    "severity": rule.severity,
                    "reason": rule.reason,
                }
            )
    return warnings


def compute_safety_score(db: Session, categories: list[str], allergy_text: str | None) -> dict:
    """
    The Safety Score Endpoint's core calculation: 0-100 score, a status
    label, allergy alerts, and conflict warnings for a set of ingredient
    categories used together in one routine step.
    """
    categories = [c for c in categories if c]
    allergy_alerts = match_allergens(db, allergy_text, categories)
    conflicts = get_conflicts(db, categories)

    score = 100
    for alert in allergy_alerts:
        score -= ALLERGY_PENALTY
    for conflict in conflicts:
        score -= CONFLICT_PENALTY.get(conflict["severity"], 15)
    score = max(0, score)

    has_unsafe_conflict = any(c["severity"] == "Unsafe" for c in conflicts)
    if allergy_alerts or has_unsafe_conflict:
        status = "Unsafe"
    elif score >= 80:
        status = "Safe"
    elif score >= 50:
        status = "Warning"
    else:
        status = "Unsafe"

    return {
        "safety_score": score,
        "status": status,
        "allergy_alerts": allergy_alerts,
        "conflict_warnings": conflicts,
        "categories_checked": categories,
    }
