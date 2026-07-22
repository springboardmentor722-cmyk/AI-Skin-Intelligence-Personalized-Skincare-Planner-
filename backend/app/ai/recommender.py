from app.ai.schemas import RecommendationFeatures

# Weights are module constants with this docstring, per milestone_3.md §8 — tuned
# only with recorded reasoning, never adjusted silently. Sum to 1.0 (validated by
# test_weights_match_the_documented_formula, which isolates each weight in turn).
_WEIGHT_SUITABILITY = 0.35
_WEIGHT_CONCERN_OVERLAP = 0.25
_WEIGHT_VECTOR_SIMILARITY = 0.15
_WEIGHT_RATING_NORM = 0.10
_WEIGHT_PRICE_FIT = 0.10
_WEIGHT_POPULARITY_NORM = 0.05


class ContentBasedRecommender:
    """The stage-4 rank step (milestone_3.md §2/§8) — see app/ai/schemas.py's
    `Recommender` Protocol docstring for why this has no stub/ranker split."""

    def score(self, features: RecommendationFeatures) -> float:
        raw = (
            _WEIGHT_SUITABILITY * features.suitability
            + _WEIGHT_CONCERN_OVERLAP * features.concern_overlap
            + _WEIGHT_VECTOR_SIMILARITY * features.vector_similarity
            + _WEIGHT_RATING_NORM * features.rating_norm
            + _WEIGHT_PRICE_FIT * features.price_fit
            + _WEIGHT_POPULARITY_NORM * features.popularity_norm
        )
        return round(raw * 100, 1)
