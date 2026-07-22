from typing import Protocol

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


# namespace -> (model_name, dimensions) — the exact pins from
# skinlytics_vector_db_schema_v3.txt §"Namespaces". Only the three M3-A projects (not
# user_profiles/skin_assessments, out of scope until the recommender/image models land).
NAMESPACE_EMBEDDING_MODELS: dict[str, tuple[str, int]] = {
    "products": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "ingredients": ("sentence-transformers/all-MiniLM-L6-v2", 384),
    "knowledge_articles": ("NeuML/pubmedbert-base-embeddings", 768),
}
