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


# namespace -> (model_name, dimensions) — the exact pins from
# skinlytics_vector_db_schema_v3.txt §"Namespaces". Only the three M3-A projects (not
# user_profiles/skin_assessments, out of scope until the recommender/image models land).
NAMESPACE_EMBEDDING_MODELS: dict[str, tuple[str, int]] = {
    "products": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "ingredients": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "knowledge_articles": ("NeuML/pubmedbert-base-embeddings", 768),
}
