"""app/ai/recommender.py — the stage-4 rank formula (milestone_3.md §8):
match = 0.35*suitability + 0.25*concern_overlap + 0.15*vector_similarity +
0.10*rating_norm + 0.10*price_fit + 0.05*popularity_norm, scaled to 0-100. Pure
arithmetic on fixed fixtures — no DB/model involved, matching IngredientSuitability's
"deterministic rule, not ML" precedent (app/ai/suitability.py)."""

from app.ai.recommender import ContentBasedRecommender
from app.ai.schemas import RecommendationFeatures


def test_all_zero_features_score_zero() -> None:
    recommender = ContentBasedRecommender()
    features = RecommendationFeatures(
        suitability=0,
        concern_overlap=0,
        vector_similarity=0,
        rating_norm=0,
        price_fit=0,
        popularity_norm=0,
    )
    assert recommender.score(features) == 0.0


def test_all_perfect_features_score_one_hundred() -> None:
    recommender = ContentBasedRecommender()
    features = RecommendationFeatures(
        suitability=1,
        concern_overlap=1,
        vector_similarity=1,
        rating_norm=1,
        price_fit=1,
        popularity_norm=1,
    )
    assert recommender.score(features) == 100.0


def test_weights_match_the_documented_formula() -> None:
    """Isolating one feature at a time proves the exact weight, not just the sum."""
    recommender = ContentBasedRecommender()
    base = {
        "suitability": 0.0,
        "concern_overlap": 0.0,
        "vector_similarity": 0.0,
        "rating_norm": 0.0,
        "price_fit": 0.0,
        "popularity_norm": 0.0,
    }
    assert recommender.score(RecommendationFeatures(**{**base, "suitability": 1})) == 35.0
    assert recommender.score(RecommendationFeatures(**{**base, "concern_overlap": 1})) == 25.0
    assert recommender.score(RecommendationFeatures(**{**base, "vector_similarity": 1})) == 15.0
    assert recommender.score(RecommendationFeatures(**{**base, "rating_norm": 1})) == 10.0
    assert recommender.score(RecommendationFeatures(**{**base, "price_fit": 1})) == 10.0
    assert recommender.score(RecommendationFeatures(**{**base, "popularity_norm": 1})) == 5.0


def test_suitability_dominates_a_high_concern_overlap_low_suitability_candidate() -> None:
    """0.35 suitability weight beats 0.25 concern_overlap — a product that's a poor
    fit for the skin type should never outrank a genuinely suitable one just because
    it targets more concerns (milestone_3.md's hard-filter-first spirit extended into
    the soft-ranking signal)."""
    recommender = ContentBasedRecommender()
    low_suitability_high_overlap = RecommendationFeatures(
        suitability=0.2,
        concern_overlap=1.0,
        vector_similarity=0.5,
        rating_norm=0.5,
        price_fit=0.5,
        popularity_norm=0.5,
    )
    high_suitability_low_overlap = RecommendationFeatures(
        suitability=1.0,
        concern_overlap=0.2,
        vector_similarity=0.5,
        rating_norm=0.5,
        price_fit=0.5,
        popularity_norm=0.5,
    )
    assert recommender.score(high_suitability_low_overlap) > recommender.score(
        low_suitability_high_overlap
    )
