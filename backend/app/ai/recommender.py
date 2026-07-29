from app.ai.schemas import RecommendationFeatures


class ContentBasedRecommender:
    """The stage-4 rank step (MILESTONE 3.pdf Step 2) - see app/ai/schemas.py's
    `Recommender` Protocol docstring for why this has no stub/ranker split. Weights
    are passed in by the caller (recommendations/service.py, reading the active
    `recommendation_weights` row), never imported as module constants - same
    pattern scores/scoring_engine.py already documents for its own weighted sum."""

    def score(
        self,
        features: RecommendationFeatures,
        *,
        concern_weight: float,
        skin_type_fit_weight: float,
        rating_weight: float,
    ) -> float:
        raw = (
            concern_weight * features.concern_overlap
            + skin_type_fit_weight * features.skin_type_fit
            + rating_weight * features.rating_norm
        )
        return round(raw * 100, 1)
