"""app/ai/embedder.py — TextEmbedder (ADR-007, config-selected AI_IMPL_EMBEDDER).
Stub is deterministic hash-based (fast, no model load — the test-suite default).
Real (SentenceTransformers) is covered separately in test_embedder_real.py since it
downloads/loads an actual model."""

import math

from app.ai.embedder import StubTextEmbedder, get_embedder


def test_stub_embedder_is_deterministic() -> None:
    embedder = StubTextEmbedder(dimensions=16)

    first = embedder.embed(["Niacinamide Serum"])
    second = embedder.embed(["Niacinamide Serum"])

    assert first == second


def test_stub_embedder_differs_for_different_text() -> None:
    embedder = StubTextEmbedder(dimensions=16)

    a, b = embedder.embed(["Niacinamide Serum", "Retinol Night Cream"])

    assert a != b


def test_stub_embedder_output_is_unit_normalized() -> None:
    embedder = StubTextEmbedder(dimensions=16)

    [vector] = embedder.embed(["Niacinamide Serum"])

    magnitude = math.sqrt(sum(x * x for x in vector))
    assert math.isclose(magnitude, 1.0, rel_tol=1e-6)


def test_stub_embedder_respects_configured_dimensions() -> None:
    embedder = StubTextEmbedder(dimensions=384)

    [vector] = embedder.embed(["anything"])

    assert len(vector) == 384


def test_get_embedder_returns_stub_by_default(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    from app.core.config import settings

    monkeypatch.setattr(settings, "ai_impl_embedder", "stub")

    embedder = get_embedder("products")

    assert isinstance(embedder, StubTextEmbedder)
    assert embedder.dimensions == 384
