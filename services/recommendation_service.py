"""
Product Recommendation Engine — Milestone 3, Step 2.

Weighted suitability score:
    Target Concern Match  (50%) — overlap between the user's concerns and product.concern_tags
    Skin Type Fit         (35%) — is the user's skin type in product.skin_type_tags
    Rating                (15%) — product.rating normalized to 0-100

Hard-filtered first: any product containing an ingredient the user is
allergic to (via the Ingredient Intelligence Engine's allergy matcher)
never enters the pool, regardless of how well it would otherwise score.
"""

import uuid

from sqlalchemy.orm import Session

from models.product import Product
from services import ingredient_service

CONCERN_WEIGHT = 0.50
SKIN_TYPE_WEIGHT = 0.35
RATING_WEIGHT = 0.15


def _is_hard_filtered(db: Session, product: Product, allergy_text: str | None) -> bool:
    if not allergy_text:
        return False
    categories = sorted({ing.category for ing in product.ingredients})
    if not categories:
        return False
    return len(ingredient_service.match_allergens(db, allergy_text, categories)) > 0


def _score_product(product: Product, user_concerns: set[str], skin_type: str | None) -> dict:
    product_concerns = set(product.concern_tags or [])
    concern_overlap = len(user_concerns & product_concerns)
    concern_score = (concern_overlap / len(user_concerns) * 100) if user_concerns else 0

    skin_type_score = 100 if skin_type and skin_type in (product.skin_type_tags or []) else 0

    rating_score = (float(product.rating) / 5.0) * 100

    overall = (
        concern_score * CONCERN_WEIGHT + skin_type_score * SKIN_TYPE_WEIGHT + rating_score * RATING_WEIGHT
    )
    return {"match_percentage": round(overall, 1), "concern_score": concern_score, "skin_type_score": skin_type_score}


def get_recommendations(
    db: Session,
    user_concerns: list[str],
    skin_type: str | None,
    allergy_text: str | None,
    max_price: float | None = None,
) -> dict:
    """
    Returns {"categories": {category: [scored products]}, "excluded_count": n}
    Each scored product includes match_percentage, ingredient_tags, and a
    budget flag / cheaper alternative when it exceeds max_price.
    """
    all_products = db.query(Product).filter(Product.is_active.is_(True)).all()
    concern_set = set(user_concerns or [])

    eligible = []
    excluded_count = 0
    for product in all_products:
        if _is_hard_filtered(db, product, allergy_text):
            excluded_count += 1
            continue
        eligible.append(product)

    scored = []
    for product in eligible:
        result = _score_product(product, concern_set, skin_type)
        scored.append((product, result))

    scored.sort(key=lambda pair: pair[1]["match_percentage"], reverse=True)

    def _build_item(product, result, alternative_to=None):
        within_budget = max_price is None or float(product.price) <= max_price
        return {
            "id": product.id,
            "name": product.name,
            "brand": product.brand,
            "category": product.category,
            "price": float(product.price),
            "currency": product.currency,
            "rating": float(product.rating),
            "match_percentage": result["match_percentage"],
            "ingredient_tags": sorted({ing.category for ing in product.ingredients}),
            "within_budget": within_budget,
            "alternative_to": alternative_to,
        }

    categories: dict[str, list[dict]] = {}
    for product, result in scored:
        item = _build_item(product, result)

        # Budget optimization: if this top match is over budget, look for a
        # cheaper same-category product with overlapping concern tags.
        if max_price is not None and not item["within_budget"]:
            alt = next(
                (
                    p
                    for p, r in scored
                    if p.category == product.category
                    and float(p.price) <= max_price
                    and p.id != product.id
                    and set(p.concern_tags or []) & set(product.concern_tags or [])
                ),
                None,
            )
            if alt:
                alt_result = next(r for p, r in scored if p.id == alt.id)
                categories.setdefault(product.category, []).append(
                    _build_item(alt, alt_result, alternative_to=product.name)
                )
                continue

        categories.setdefault(product.category, []).append(item)

    return {"categories": categories, "excluded_count": excluded_count}
