"""app/ai/recommender.py — the stage-4 rank formula (MILESTONE 3.pdf Step 2, M3R
Phase 2): match = concern_weight*concern_overlap + skin_type_fit_weight*skin_type_fit
+ rating_weight*rating_norm, scaled to 0-100, weights passed in by the caller (the
active `recommendation_weights` row), never module constants. Pure arithmetic on
fixed fixtures — no DB/model involved, matching IngredientSuitability's
"deterministic rule, not ML" precedent (app/ai/suitability.py)."""

from app.ai.recommender import ContentBasedRecommender
from app.ai.schemas import RecommendationFeatures


def test_content_based_recommender_applies_the_literal_50_35_15_formula() -> None:
    recommender = ContentBasedRecommender()
    features = RecommendationFeatures(concern_overlap=1.0, skin_type_fit=1.0, rating_norm=1.0)

    score = recommender.score(
        features, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )

    assert score == 100.0


def test_content_based_recommender_weights_concern_match_highest() -> None:
    recommender = ContentBasedRecommender()
    concern_only = RecommendationFeatures(concern_overlap=1.0, skin_type_fit=0.0, rating_norm=0.0)
    fit_only = RecommendationFeatures(concern_overlap=0.0, skin_type_fit=1.0, rating_norm=0.0)

    concern_score = recommender.score(
        concern_only, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )
    fit_score = recommender.score(
        fit_only, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )

    assert concern_score > fit_score  # 50 > 35


def test_content_based_recommender_all_zero_features_score_zero() -> None:
    recommender = ContentBasedRecommender()
    features = RecommendationFeatures(concern_overlap=0.0, skin_type_fit=0.0, rating_norm=0.0)

    score = recommender.score(
        features, concern_weight=0.50, skin_type_fit_weight=0.35, rating_weight=0.15
    )

    assert score == 0.0
