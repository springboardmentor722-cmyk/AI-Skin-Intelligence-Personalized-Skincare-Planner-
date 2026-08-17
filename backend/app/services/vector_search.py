"""
Vector Search Engine for generating and indexing 128-dimensional vector embeddings
for high-dimensional similarity matching between user skin profiles and skincare products.
"""

import math
from typing import List, Dict, Any, Optional

# Dimension Allocation (Total = 128):
# 0-9: Skin Types (oily, dry, combination, sensitive, normal)
# 10-39: Skin Concerns (acne, hyperpigmentation, dark spots, dryness, oiliness, sensitivity, wrinkles, fine lines, redness, texture)
# 40-59: Product Categories (face wash, cleanser, serum, moisturizer, sunscreen, toner, face mask)
# 60-99: Active Ingredients (retinoids, niacinamide, vitamin c, hyaluronic acid, salicylic acid, ceramides, peptides, ahas/bhas, etc.)
# 100-127: Scaled Metadata (Normalized Rating, Price Index)

SKIN_TYPE_DIM_MAP = {"oily": 0, "dry": 1, "combination": 2, "sensitive": 3, "normal": 4}

CONCERN_DIM_MAP = {
    "acne": 10, "hyperpigmentation": 11, "dark spots": 12, "dryness": 13,
    "oiliness": 14, "sensitivity": 15, "wrinkles": 16, "fine lines": 17,
    "redness": 18, "texture": 19, "dullness": 20, "enlarged pores": 21,
    "blackheads": 22, "barrier damage": 23, "aging": 24, "dehydration": 25
}

CATEGORY_DIM_MAP = {
    "face wash": 40, "cleanser": 41, "serum": 42, "moisturizer": 43,
    "sunscreen": 44, "toner": 45, "face mask": 46, "exfoliator": 47
}

ACTIVE_DIM_MAP = {
    "retinoids": 60, "niacinamide": 61, "vitamin c": 62, "hyaluronic acid": 63,
    "salicylic acid": 64, "ceramides": 65, "peptides": 66, "ahas/bhas": 67,
    "zinc oxide": 68, "centella asiatica": 69, "alpha arbutin": 70,
    "glycolic acid": 71, "tea tree oil": 72, "squalane": 73, "azelaic acid": 74
}


class VectorSearchEngine:
    @staticmethod
    def generate_user_vector(
        skin_type: str,
        concerns: List[str],
        sensitivity_level: Optional[str] = None
    ) -> List[float]:
        """
        Generates a normalized 128-dimensional embedding vector for a user skin profile.
        """
        vector = [0.0] * 128

        # Map skin type
        st_idx = SKIN_TYPE_DIM_MAP.get(skin_type.lower())
        if st_idx is not None:
            vector[st_idx] = 1.0

        # Map concerns
        for c in concerns:
            c_idx = CONCERN_DIM_MAP.get(c.lower())
            if c_idx is not None:
                vector[c_idx] = 1.0

        # Map sensitivity boost
        if sensitivity_level and sensitivity_level.lower() == "high":
            vector[SKIN_TYPE_DIM_MAP["sensitive"]] = 1.0

        # Normalize vector
        sq_sum = sum(v * v for v in vector)
        if sq_sum > 0:
            norm = math.sqrt(sq_sum)
            vector = [v / norm for v in vector]

        return vector

    @staticmethod
    def generate_product_vector(
        suitable_skin_types: List[str],
        category: str,
        key_ingredients: List[str],
        rating: float = 4.5,
        price_inr: float = 500.0
    ) -> List[float]:
        """
        Generates a normalized 128-dimensional embedding vector for a product catalog item.
        """
        vector = [0.0] * 128

        # Map suitable skin types
        for st in suitable_skin_types:
            st_idx = SKIN_TYPE_DIM_MAP.get(st.lower())
            if st_idx is not None:
                vector[st_idx] = 1.0

        # Map category
        cat_idx = CATEGORY_DIM_MAP.get(category.lower())
        if cat_idx is not None:
            vector[cat_idx] = 1.0

        # Map active ingredients
        for ing in key_ingredients:
            ing_lower = ing.lower()
            for active_key, dim_idx in ACTIVE_DIM_MAP.items():
                if active_key in ing_lower or ing_lower in active_key:
                    vector[dim_idx] = 1.0

        # Scaled rating & price feature embedding (indices 100 & 101)
        vector[100] = min(1.0, rating / 5.0)
        vector[101] = min(1.0, price_inr / 3000.0)

        # Normalize vector
        sq_sum = sum(v * v for v in vector)
        if sq_sum > 0:
            norm = math.sqrt(sq_sum)
            vector = [v / norm for v in vector]

        return vector

    @staticmethod
    def cosine_similarity(v1: List[float], v2: List[float]) -> float:
        """
        Computes cosine similarity score between two 128-dimensional vectors.
        """
        if len(v1) != 128 or len(v2) != 128:
            return 0.0
        dot_product = sum(a * b for a, b in zip(v1, v2))
        norm_a = math.sqrt(sum(a * a for a in v1))
        norm_b = math.sqrt(sum(b * b for b in v2))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))
