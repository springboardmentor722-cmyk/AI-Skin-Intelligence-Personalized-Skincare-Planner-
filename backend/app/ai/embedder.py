import hashlib
import math
from functools import cache

from app.ai.schemas import NAMESPACE_EMBEDDING_MODELS, TextEmbedder
from app.core.config import settings


def _normalize(vector: list[float]) -> list[float]:
    magnitude = math.sqrt(sum(x * x for x in vector))
    if magnitude == 0:
        return vector
    return [x / magnitude for x in vector]


class StubTextEmbedder:
    """Deterministic, hash-seeded — same ADR-007 spirit as every other stub in this
    codebase (routines/scores/recommendations). No model load, so the test suite
    default (`AI_IMPL_EMBEDDER=stub`) stays fast."""

    model_name = "stub-hash-embedder"

    def __init__(self, dimensions: int) -> None:
        self.dimensions = dimensions

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._embed_one(text) for text in texts]

    def _embed_one(self, text: str) -> list[float]:
        # hashlib.sha256 rather than Python's `hash()` — hash() is randomized per
        # process (PYTHONHASHSEED), which would make this non-deterministic across
        # runs, defeating the whole point of a stub embedder.
        digest = hashlib.sha256(text.encode()).digest()
        raw = [digest[i % len(digest)] / 255.0 for i in range(self.dimensions)]
        return _normalize(raw)


class RealTextEmbedder:
    """SentenceTransformers-backed, lazy-loaded (no model load at import time — only
    the worker process, which actually calls .embed(), pays that cost)."""

    def __init__(self, model_name: str, dimensions: int) -> None:
        self.model_name = model_name
        self.dimensions = dimensions
        self._model: object | None = None

    def _load(self) -> object:
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed(self, texts: list[str]) -> list[list[float]]:
        model = self._load()
        vectors = model.encode(texts, normalize_embeddings=True)  # type: ignore[attr-defined]
        return [vector.tolist() for vector in vectors]


@cache
def get_embedder(namespace: str) -> TextEmbedder:
    model_name, dimensions = NAMESPACE_EMBEDDING_MODELS[namespace]
    if settings.ai_impl_embedder == "real":
        return RealTextEmbedder(model_name, dimensions)
    return StubTextEmbedder(dimensions)
