# app/services/recommendation_engine.py
"""
Personalized Recommendation Engine (Milestone 2/3 boundary item, per the
master requirements list). Deterministic rule-based matching — same
approach as the scoring engine — mapping a user's real prioritized
concerns to real seeded ingredients, then to real products that contain
those ingredients and fit the user's real skin type.
"""

# Maps a concern key (matches scoring_engine.DEFAULT_SEVERITY keys) to the
# real ingredient names seeded in the database that target it.
CONCERN_INGREDIENT_MAP = {
    "acne": ["Salicylic Acid", "Niacinamide", "Benzoyl Peroxide", "Azelaic Acid", "Green Tea Extract"],
    "oily_skin": ["Niacinamide", "Salicylic Acid", "Witch Hazel", "Green Tea Extract"],
    "dry_skin": ["Hyaluronic Acid", "Ceramides", "Squalane", "Shea Butter", "Glycerin"],
    "hyperpigmentation": ["Alpha Arbutin", "Vitamin C (Ascorbic Acid)", "Niacinamide", "Azelaic Acid"],
    "dark_spots": ["Alpha Arbutin", "Vitamin C (Ascorbic Acid)", "Mandelic Acid"],
    "wrinkles": ["Retinol", "Peptides", "Bakuchiol", "Vitamin C (Ascorbic Acid)"],
    "fine_lines": ["Retinol", "Peptides", "Hyaluronic Acid", "Bakuchiol"],
    "redness": ["Centella Asiatica (Cica)", "Azelaic Acid", "Allantoin", "Oat Extract (Avena Sativa)", "Aloe Vera"],
    "uneven_skin_tone": ["Vitamin C (Ascorbic Acid)", "Alpha Arbutin", "Lactic Acid", "Glycolic Acid"],
}


def get_target_ingredient_names(concern_keys: list[str]) -> set[str]:
    """Given a list of concern keys (e.g. from a user's detected_concerns),
    returns the union of real ingredient names that target any of them."""
    names = set()
    for key in concern_keys:
        names.update(CONCERN_INGREDIENT_MAP.get(key, []))
    return names


def score_product_match(product_ingredient_names: set[str], target_ingredient_names: set[str], product_skin_types: str, user_skin_type: str) -> int:
    """
    Real, explainable relevance score:
    +2 per matching ingredient, +3 if the product explicitly lists the
    user's skin type as suitable. No randomness, no fabricated numbers.
    """
    score = 2 * len(product_ingredient_names & target_ingredient_names)
    if user_skin_type and product_skin_types and user_skin_type.lower() in product_skin_types.lower():
        score += 3
    return score