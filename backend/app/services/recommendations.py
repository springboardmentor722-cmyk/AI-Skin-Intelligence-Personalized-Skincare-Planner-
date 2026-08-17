"""Rule-based product recommendations from skin profile + MongoDB catalog."""

from __future__ import annotations

import math
from typing import Any

CONCERN_SYNONYMS: dict[str, str] = {
    "redness": "sensitivity",
    "rosacea": "sensitivity",
    "irritation": "sensitivity",
    "wrinkles": "aging",
    "anti-aging": "aging",
    "anti aging": "aging",
    "dark spots": "hyperpigmentation",
    "dark spot": "hyperpigmentation",
    "pigmentation": "hyperpigmentation",
    "uneven tone": "hyperpigmentation",
    "melasma": "hyperpigmentation",
    "pimples": "acne",
    "breakouts": "acne",
    "blemishes": "acne",
    "spots": "acne",
    "pores": "enlarged pores",
    "large pores": "enlarged pores",
    "flaky skin": "dryness",
    "dehydrated": "dehydration",
    "rough skin": "texture",
    "uneven texture": "texture",
    "whiteheads": "blackheads",
}


def parse_concerns(raw: str | None) -> list[str]:
    if not raw:
        return []
    concerns: list[str] = []
    for part in raw.split(","):
        normalized = part.strip().lower()
        if not normalized:
            continue
        concerns.append(CONCERN_SYNONYMS.get(normalized, normalized))
    return concerns


def _ingredient_concerns(ingredient: dict[str, Any]) -> set[str]:
    return {c.lower() for c in ingredient.get("common_concerns_addressed", [])}


def score_product(
    product: dict[str, Any],
    skin_type: str,
    user_concerns: list[str],
    ingredient_map: dict[str, dict[str, Any]],
) -> tuple[int, list[str]] | None:
    suitable = product.get("suitable_skin_types", [])
    if skin_type not in suitable:
        return None

    score = 2  # base score for skin type match
    matched: set[str] = set()
    product_concerns: set[str] = set()

    for ing_name in product.get("key_ingredients", []):
        ingredient = ingredient_map.get(ing_name)
        if not ingredient:
            continue
        product_concerns |= _ingredient_concerns(ingredient)

    if user_concerns:
        for concern in user_concerns:
            for product_concern in product_concerns:
                if concern == product_concern or concern in product_concern or product_concern in concern:
                    score += 2
                    matched.add(product_concern)
        if not matched:
            score = 1  # skin type only — lower priority when concerns are specified
    else:
        matched = product_concerns

    return score, sorted(matched)


def get_recommendations(
    skin_type: str,
    skin_concerns: str | None,
    products: list[dict[str, Any]],
    ingredients: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    user_concerns = parse_concerns(skin_concerns)
    ingredient_map = {i["name"]: i for i in ingredients}

    results: list[dict[str, Any]] = []
    for product in products:
        scored = score_product(product, skin_type, user_concerns, ingredient_map)
        if scored is None:
            continue
        score, matched_concerns = scored
        if user_concerns and score < 2:
            continue

        results.append({
            "id": str(product["_id"]),
            "name": product["name"],
            "brand": product["brand"],
            "category": product["category"],
            "suitable_skin_types": product["suitable_skin_types"],
            "key_ingredients": product["key_ingredients"],
            "price_inr": product["price_inr"],
            "description": product["description"],
            "match_score": score,
            "matched_concerns": matched_concerns,
        })

    results.sort(key=lambda r: (-r["match_score"], r["category"], r["name"]))
    return results

def generate_embedding(
    skin_type: str,
    concerns: list[str],
    category: str = "",
    actives: list[str] = []
) -> list[float]:
    """
    Generates a deterministic 128-dimensional vector embedding.
    Indices:
    - 0-9: Skin types
    - 10-39: Skin concerns
    - 40-59: Product categories
    - 60-99: Active ingredients
    - 100-127: Normalized rating & price ranges (padded with small values)
    """
    vector = [0.0] * 128
    
    # 1. Skin types mapping
    skin_types_map = {"oily": 0, "dry": 1, "combination": 2, "sensitive": 3, "normal": 4}
    t_idx = skin_types_map.get(skin_type.lower())
    if t_idx is not None:
        vector[t_idx] = 1.0
        
    # 2. Concerns mapping
    concerns_map = {
        "acne": 10, "hyperpigmentation": 11, "dark spots": 12, "dryskin": 13,
        "oilyskin": 14, "sensitiveskin": 15, "wrinkles": 16, "fine lines": 17,
        "redness": 18, "uneven skin tone": 19
    }
    for c in concerns:
        c_idx = concerns_map.get(c.lower())
        if c_idx is not None:
            vector[c_idx] = 1.0
            
    # 3. Categories mapping
    cat_map = {"face wash": 40, "cleanser": 41, "serum": 42, "moisturizer": 43, "sunscreen": 44, "toner": 45, "face mask": 46}
    cat_idx = cat_map.get(category.lower())
    if cat_idx is not None:
        vector[cat_idx] = 1.0
        
    # 4. Actives mapping
    actives_map = {
        "retinoids": 60, "niacinamide": 61, "vitamin c": 62, "hyaluronic acid": 63,
        "salicylic acid": 64, "ceramides": 65, "peptides": 66, "ahas/bhas": 67
    }
    for a in actives:
        a_idx = actives_map.get(a.lower())
        if a_idx is not None:
            vector[a_idx] = 1.0
            
    # Normalize vector to unit length
    import math
    sq_sum = sum(v * v for v in vector)
    if sq_sum > 0:
        norm = math.sqrt(sq_sum)
        vector = [v / norm for v in vector]
        
    return vector

def cosine_similarity(v1: list[float], v2: list[float]) -> float:
    if len(v1) != len(v2) or len(v1) == 0:
        return 0.0
    dot_product = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (norm_a * norm_b)

