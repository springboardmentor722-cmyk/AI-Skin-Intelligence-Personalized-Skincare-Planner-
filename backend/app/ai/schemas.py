from typing import Protocol

from pydantic import BaseModel

# The single AI contract module (ADR-007) — every interface's Protocol lives here,
# config-selected implementations live alongside it in app/ai/*.py. TextEmbedder is
# the first one made real (M3-A); IngredientSuitability/Recommender/
# ProgressTrendAnalyzer follow in M3-B/D/E behind the same pattern.


class TextEmbedder(Protocol):
    """One embedding model per namespace, pinned (mixing versions corrupts
    similarity — skinlytics_vector_db_schema_v3.txt). Output MUST be
    unit-normalized (app/db/vector.py's IndexFlatIP is cosine similarity)."""

    model_name: str
    dimensions: int

    def embed(self, texts: list[str]) -> list[list[float]]: ...


class SuitabilityResult(BaseModel):
    """Every field here is a real, auditable claim — never a probability that just
    "feels right". `allergy_flag` is specifically an allergy-tag match (prominent UI
    warning, PDF Module 5); `avoid_flag` is a curated skin-type-avoid junction hit."""

    suitable: bool
    confidence: float
    reasons: list[str]
    allergy_flag: bool
    avoid_flag: bool


class IngredientSuitability(Protocol):
    """Rule-based, not ML (M3-B) — the zero-missed-allergy hard requirement
    (AI_ML.md model card) needs an auditable rule, not a trained model's
    probability. Confidence per rule is fixed and documented in
    app/ai/suitability.py, not learned."""

    def evaluate(
        self,
        *,
        ingredient_name: str,
        inci_name: str | None,
        skin_type_name: str | None,
        allergies: str | None,
        sensitivities: str | None,
        avoid_reason: str | None,
    ) -> SuitabilityResult: ...


class RecommendationFeatures(BaseModel):
    """Stage-4 rank inputs (milestone_3.md §8) — every field pre-normalized to
    [0, 1] by the caller (service.py), so the formula itself stays pure arithmetic
    with no unit-conversion logic hidden inside it."""

    suitability: float
    concern_overlap: float
    vector_similarity: float
    rating_norm: float
    price_fit: float
    popularity_norm: float


class Recommender(Protocol):
    """The stage-4 rank step (milestone_3.md §2/§8). Deliberately no stub/real
    `AI_IMPL` split — same reasoning as `IngredientSuitability` (app/ai/suitability.py):
    this is fixed arithmetic over pre-computed features, not a model load, so there's
    no cost tradeoff a stub would buy. `ContentBasedRecommender` is the only
    implementation and is always the operational engine; the spec's optional
    flag-gated LightGBM ranker (`AI_IMPL_RECOMMENDER=ranker`) is deliberately not
    built this milestone — no real `recommendation_feedback` labels exist yet to
    train it on (this milestone is the first writer of that collection), and
    milestone_3.md §3 explicitly permits shipping content-based-only until real
    feedback accumulates (AGENTS.md §0.2 — never train on fabricated labels)."""

    def score(self, features: RecommendationFeatures) -> float: ...


# namespace -> (model_name, dimensions) — the exact pins from
# skinlytics_vector_db_schema_v3.txt §"Namespaces", with one documented divergence:
# user_profiles reuses products/ingredients' all-MiniLM-L6-v2 (M3-D) rather than the
# schema txt's aspirational "custom-profile-v1" — no such custom model exists or is
# specified anywhere beyond that one name, and training a bespoke profile-feature
# model is out of scope here; embedding a profile's plain-text summary with the same
# general-purpose sentence encoder used for products/ingredients is the honest
# substitute (flagged in skinlytics_vector_db_schema_v3.txt and PROGRESS.md, not
# silently swapped). skin_assessments stays unlisted (image models are still stubs).
NAMESPACE_EMBEDDING_MODELS: dict[str, tuple[str, int]] = {
    "products": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "ingredients": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "knowledge_articles": ("NeuML/pubmedbert-base-embeddings", 768),
    "user_profiles": ("sentence-transformers/all-MiniLM-L6-v2", 384),
}
