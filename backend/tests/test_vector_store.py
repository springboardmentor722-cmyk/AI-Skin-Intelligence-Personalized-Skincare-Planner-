"""app/db/vector.py — FAISS-backed vector store (M3-A). Dev backend only
(VECTOR_DB_PROVIDER=faiss); Pinecone is prod-only, out of scope here. Uses a
throwaway namespace per test so nothing collides with the real products/ingredients/
knowledge_articles namespaces, and cleans its own files up afterward."""

import uuid

import pytest

from app.db import vector

_DIM = 8


@pytest.fixture
def namespace() -> str:
    ns = f"test_{uuid.uuid4().hex[:12]}"
    yield ns
    vector.clear(ns)


def _vec(seed: float) -> list[float]:
    return [seed] * _DIM


def _unit(hot_index: int) -> list[float]:
    """A one-hot-ish unit vector — unlike scalar multiples of the same direction
    (which cosine similarity can't tell apart), these point genuinely differently."""
    v = [0.0] * _DIM
    v[hot_index] = 1.0
    return v


async def test_upsert_then_search_finds_the_nearest_vector(namespace: str) -> None:
    vector.upsert(namespace, "a", _unit(0), {"name": "near"}, dim=_DIM)
    vector.upsert(namespace, "b", _unit(_DIM - 1), {"name": "far"}, dim=_DIM)

    query = _unit(0)
    query[1] = 0.1  # nudged slightly off-axis, still much closer to "a" than "b"
    results = vector.search(namespace, query, k=1, dim=_DIM)

    assert len(results) == 1
    assert results[0]["vector_id"] == "a"
    assert results[0]["metadata"] == {"name": "near"}


async def test_upsert_is_idempotent_and_updates_metadata(namespace: str) -> None:
    vector.upsert(namespace, "a", _vec(1.0), {"name": "v1"}, dim=_DIM)
    vector.upsert(namespace, "a", _vec(1.0), {"name": "v2"}, dim=_DIM)

    assert vector.count(namespace) == 1
    results = vector.search(namespace, _vec(1.0), k=1, dim=_DIM)
    assert results[0]["metadata"] == {"name": "v2"}


async def test_remove_deletes_the_vector(namespace: str) -> None:
    vector.upsert(namespace, "a", _vec(1.0), {}, dim=_DIM)
    vector.remove(namespace, "a")

    assert vector.count(namespace) == 0


async def test_clear_wipes_the_namespace(namespace: str) -> None:
    vector.upsert(namespace, "a", _vec(1.0), {}, dim=_DIM)
    vector.upsert(namespace, "b", _vec(2.0), {}, dim=_DIM)

    vector.clear(namespace)

    assert vector.count(namespace) == 0
