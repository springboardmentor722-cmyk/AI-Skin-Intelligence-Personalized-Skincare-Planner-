"""Real SentenceTransformers-backed TextEmbedder — separate from test_embedder.py
because it downloads and loads an actual model (~90MB, all-MiniLM-L6-v2) on first
run. Only the products/ingredients namespace's smaller model is exercised here;
knowledge_articles' NeuML/pubmedbert-base-embeddings (~400MB+) downloads lazily the
first time the worker actually projects a knowledge article, not in this suite."""

import math

from app.ai.embedder import RealTextEmbedder


def test_real_embedder_produces_unit_normalized_384d_vectors() -> None:
    embedder = RealTextEmbedder("sentence-transformers/all-MiniLM-L6-v2", 384)

    [vector] = embedder.embed(["Niacinamide Serum for oil control"])

    assert len(vector) == 384
    magnitude = math.sqrt(sum(x * x for x in vector))
    assert math.isclose(magnitude, 1.0, rel_tol=1e-3)


def test_real_embedder_ranks_semantically_similar_text_closer() -> None:
    """The actual point of a real embedder over the stub: genuine semantic
    similarity, not just deterministic hashing. Deliberately unambiguous topics
    (skincare vs. weather) — fine-grained skincare-jargon similarity is a model-
    quality question for ml/eval (M3-H), not something a unit test should assert."""
    embedder = RealTextEmbedder("sentence-transformers/all-MiniLM-L6-v2", 384)

    query, similar, different = embedder.embed(
        [
            "Niacinamide serum for oil control and brightening",
            "A brightening serum with niacinamide that controls oil",
            "The weather forecast for tomorrow calls for heavy rain",
        ]
    )

    def cosine(a: list[float], b: list[float]) -> float:
        return sum(x * y for x, y in zip(a, b, strict=True))

    assert cosine(query, similar) > cosine(query, different)
