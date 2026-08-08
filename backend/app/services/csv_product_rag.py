"""
CSV Product RAG (Retrieval-Augmented Generation via Rule Filtering).
NO LLM involved — pure deterministic filtering and scoring against the
product_info.csv dataset.

Loads the 8,494-row Sephora product dataset and applies:
1. Category filtering (Skincare only)
2. Concern → category/ingredient keyword matching
3. Skin type compatibility scoring
4. Rating + popularity weighting
"""
import os
import logging
from typing import List, Optional, Dict, Any
import pandas as pd

logger = logging.getLogger(__name__)

# Path to the CSV dataset (relative to the backend root)
_CSV_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),
    "datasets",
    "product dataset",
    "product_info.csv",
)


class CSVProductRAG:
    """
    Singleton-cached CSV product retrieval engine.
    Loads the CSV once and keeps it in memory for fast filtering.
    """

    _instance: Optional["CSVProductRAG"] = None
    _df: Optional[pd.DataFrame] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if CSVProductRAG._df is None:
            self._load_csv()

    def _load_csv(self):
        try:
            df = pd.read_csv(_CSV_PATH)
            # Filter to Skincare products only and reset index
            df = df[df["primary_category"] == "Skincare"].copy()
            # Clean up columns
            df["ingredients"] = df["ingredients"].fillna("")
            df["highlights"] = df["highlights"].fillna("")
            df["rating"] = pd.to_numeric(df["rating"], errors="coerce").fillna(0.0)
            df["loves_count"] = pd.to_numeric(df["loves_count"], errors="coerce").fillna(0)
            df["price_usd"] = pd.to_numeric(df["price_usd"], errors="coerce").fillna(0.0)
            df["reviews"] = pd.to_numeric(df["reviews"], errors="coerce").fillna(0)
            df["secondary_category"] = df["secondary_category"].fillna("")
            df["tertiary_category"] = df["tertiary_category"].fillna("")
            df["product_name"] = df["product_name"].fillna("")
            df["brand_name"] = df["brand_name"].fillna("")
            df["out_of_stock"] = pd.to_numeric(df["out_of_stock"], errors="coerce").fillna(0)
            # Remove out-of-stock items
            df = df[df["out_of_stock"] == 0].copy()
            df = df.reset_index(drop=True)

            CSVProductRAG._df = df
            logger.info(f"CSV Product RAG loaded: {len(df)} skincare products")
        except Exception as e:
            logger.error(f"Failed to load product CSV: {e}")
            CSVProductRAG._df = pd.DataFrame()

    # ── Concern → Category & Ingredient Mappings ─────────────────────────

    CONCERN_CATEGORY_MAP: Dict[str, List[str]] = {
        "acne": ["Blemish & Acne Treatments", "Face Wash & Cleansers", "Toners", "Face Serums", "Exfoliators"],
        "breakouts": ["Blemish & Acne Treatments", "Face Wash & Cleansers", "Toners"],
        "redness": ["Moisturizers", "Face Serums", "Face Masks", "Mists & Essences"],
        "rosacea": ["Moisturizers", "Face Serums", "Mists & Essences"],
        "dryness": ["Moisturizers", "Face Oils", "Face Masks", "Night Creams", "Face Serums"],
        "dehydration": ["Moisturizers", "Mists & Essences", "Face Serums", "Sheet Masks"],
        "aging": ["Anti-Aging", "Face Serums", "Night Creams", "Eye Creams & Treatments", "Moisturizers"],
        "wrinkles": ["Anti-Aging", "Face Serums", "Night Creams", "Eye Creams & Treatments"],
        "fine lines": ["Anti-Aging", "Face Serums", "Eye Creams & Treatments"],
        "pigmentation": ["Face Serums", "Facial Peels", "Exfoliators", "Moisturizers"],
        "dark spots": ["Face Serums", "Facial Peels", "Exfoliators"],
        "hyperpigmentation": ["Face Serums", "Facial Peels", "Exfoliators", "Moisturizers"],
        "sun damage": ["Face Sunscreen", "Face Serums", "Moisturizers"],
        "oily": ["Face Wash & Cleansers", "Toners", "Moisturizers", "Face Masks"],
        "enlarged pores": ["Toners", "Face Serums", "Face Masks", "Exfoliators"],
        "uneven texture": ["Exfoliators", "Facial Peels", "Face Serums", "Toners"],
        "sensitivity": ["Moisturizers", "Face Serums", "Mists & Essences", "Face Wash & Cleansers"],
    }

    CONCERN_INGREDIENT_KEYWORDS: Dict[str, List[str]] = {
        "acne": ["salicylic", "niacinamide", "benzoyl", "tea tree", "bha", "zinc", "sulfur", "retinol"],
        "breakouts": ["salicylic", "niacinamide", "bha", "zinc", "tea tree"],
        "redness": ["niacinamide", "centella", "azelaic", "aloe", "cica", "green tea", "chamomile", "bisabolol"],
        "rosacea": ["niacinamide", "centella", "azelaic", "aloe", "cica", "licorice"],
        "dryness": ["ceramide", "hyaluronic", "glycerin", "squalane", "shea", "jojoba", "colloidal oat"],
        "dehydration": ["hyaluronic", "glycerin", "aloe", "squalane", "panthenol"],
        "aging": ["retinol", "peptide", "vitamin c", "ascorbic", "bakuchiol", "collagen", "coq10", "resveratrol"],
        "wrinkles": ["retinol", "peptide", "vitamin c", "bakuchiol", "collagen"],
        "fine lines": ["retinol", "peptide", "vitamin c", "hyaluronic"],
        "pigmentation": ["vitamin c", "ascorbic", "arbutin", "niacinamide", "aha", "glycolic", "kojic", "tranexamic", "licorice"],
        "dark spots": ["vitamin c", "arbutin", "niacinamide", "kojic", "tranexamic"],
        "hyperpigmentation": ["vitamin c", "arbutin", "niacinamide", "aha", "glycolic", "kojic"],
        "sun damage": ["vitamin c", "niacinamide", "spf", "zinc oxide", "titanium dioxide"],
        "oily": ["niacinamide", "salicylic", "bha", "clay", "charcoal", "tea tree", "zinc"],
        "enlarged pores": ["niacinamide", "salicylic", "bha", "clay", "retinol"],
        "uneven texture": ["aha", "glycolic", "lactic", "salicylic", "retinol", "enzyme"],
        "sensitivity": ["centella", "cica", "aloe", "chamomile", "oat", "ceramide", "bisabolol"],
    }

    SKIN_TYPE_HIGHLIGHT_KEYWORDS: Dict[str, List[str]] = {
        "oily": ["oil-free", "mattifying", "oil control", "lightweight", "pore minimizing"],
        "dry": ["hydrating", "moisturizing", "nourishing", "rich", "barrier"],
        "sensitive": ["fragrance-free", "gentle", "calming", "soothing", "hypoallergenic"],
        "combination": ["balancing", "lightweight", "oil-free", "hydrating"],
        "normal": ["balancing", "hydrating", "daily"],
    }

    # ── Public API ───────────────────────────────────────────────────────

    def search(
        self,
        concern: str = "",
        skin_type: str = "",
        max_price: Optional[float] = None,
        category: Optional[str] = None,
        limit: int = 20,
    ) -> List[Dict[str, Any]]:
        """
        Search and rank products from the CSV dataset.
        Returns a list of product dicts sorted by match score.
        """
        if CSVProductRAG._df is None or CSVProductRAG._df.empty:
            return []

        df = CSVProductRAG._df.copy()

        # ── Hard Filters ─────────────────────────────────────────────────
        if max_price is not None and max_price > 0:
            df = df[df["price_usd"] <= max_price]

        if category and category != "All":
            df = df[
                df["secondary_category"].str.contains(category, case=False, na=False)
                | df["tertiary_category"].str.contains(category, case=False, na=False)
            ]

        if df.empty:
            return []

        # ── Scoring ──────────────────────────────────────────────────────
        concern_lower = concern.lower().strip() if concern else ""
        skin_lower = skin_type.lower().strip() if skin_type else ""

        # Pre-compute lowercase columns for matching (vectorised)
        ingredients_lower = df["ingredients"].str.lower()
        highlights_lower = df["highlights"].str.lower()
        tertiary_lower = df["tertiary_category"].str.lower()
        secondary_lower = df["secondary_category"].str.lower()

        # 1. Concern → Category Relevance (40%)
        concern_cat_score = pd.Series(0.0, index=df.index)
        if concern_lower:
            target_categories = self.CONCERN_CATEGORY_MAP.get(concern_lower, [])
            if not target_categories:
                # Partial match
                for key, cats in self.CONCERN_CATEGORY_MAP.items():
                    if key in concern_lower:
                        target_categories = cats
                        break
            if target_categories:
                for cat in target_categories:
                    cat_lower = cat.lower()
                    concern_cat_score += (
                        tertiary_lower.str.contains(cat_lower, na=False).astype(float) * 20
                        + secondary_lower.str.contains(cat_lower, na=False).astype(float) * 15
                    )
                concern_cat_score = concern_cat_score.clip(upper=40)

        # 2. Ingredient Keyword Match (30%)
        ingredient_score = pd.Series(0.0, index=df.index)
        if concern_lower:
            keywords = self.CONCERN_INGREDIENT_KEYWORDS.get(concern_lower, [])
            if not keywords:
                for key, kws in self.CONCERN_INGREDIENT_KEYWORDS.items():
                    if key in concern_lower:
                        keywords = kws
                        break
            for kw in keywords:
                ingredient_score += ingredients_lower.str.contains(kw, na=False).astype(float) * (30 / max(len(keywords), 1))
            ingredient_score = ingredient_score.clip(upper=30)

        # 3. Rating (20%)
        max_rating = df["rating"].max() if df["rating"].max() > 0 else 5.0
        rating_score = (df["rating"] / max_rating) * 20

        # 4. Popularity (10%) — normalized loves_count
        max_loves = df["loves_count"].max() if df["loves_count"].max() > 0 else 1
        popularity_score = (df["loves_count"] / max_loves) * 10

        # ── Bonus: Skin type compatibility from highlights ────────────────
        skin_bonus = pd.Series(0.0, index=df.index)
        if skin_lower:
            skin_keywords = self.SKIN_TYPE_HIGHLIGHT_KEYWORDS.get(skin_lower, [])
            for kw in skin_keywords:
                skin_bonus += highlights_lower.str.contains(kw, na=False).astype(float) * 2
            skin_bonus = skin_bonus.clip(upper=10)

        # ── Total Score ──────────────────────────────────────────────────
        total_score = concern_cat_score + ingredient_score + rating_score + popularity_score + skin_bonus
        total_score = total_score.clip(upper=100)

        df = df.assign(match_score=total_score)
        df = df.sort_values("match_score", ascending=False).head(limit)

        # ── Build response ───────────────────────────────────────────────
        results = []
        for _, row in df.iterrows():
            results.append(
                {
                    "product_id": row.get("product_id", ""),
                    "name": row.get("product_name", ""),
                    "brand": row.get("brand_name", ""),
                    "category": row.get("tertiary_category", row.get("secondary_category", "")),
                    "price": round(float(row.get("price_usd", 0)), 2),
                    "rating": round(float(row.get("rating", 0)), 1),
                    "reviews": int(row.get("reviews", 0)),
                    "loves_count": int(row.get("loves_count", 0)),
                    "match": int(round(float(row.get("match_score", 0)))),
                    "highlights": row.get("highlights", ""),
                }
            )
        return results


# Singleton instance
csv_product_rag = CSVProductRAG()
