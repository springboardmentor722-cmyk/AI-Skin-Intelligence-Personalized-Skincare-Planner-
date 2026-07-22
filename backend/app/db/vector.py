import hashlib
import json
from pathlib import Path
from typing import Any

import faiss
import numpy as np

from app.core.config import settings

# FAISS-backed vector store (dev backend; Pinecone is prod-only — same namespace +
# metadata contract both sides, skinlytics_vector_db_schema_v3.txt). One index per
# namespace on disk under FAISS_INDEX_DIR/{namespace}.index, plus a sidecar
# {namespace}.meta.json (FAISS itself stores only vectors, not metadata or string
# ids). Only app/worker/ ever calls upsert/remove/clear (ADR-005 single-writer rule);
# everything is rebuildable from PG/Mongo by re-running the projection from scratch.


def _dir() -> Path:
    path = Path(settings.faiss_index_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _index_path(namespace: str) -> Path:
    return _dir() / f"{namespace}.index"


def _meta_path(namespace: str) -> Path:
    return _dir() / f"{namespace}.meta.json"


def _faiss_id(vector_id: str) -> int:
    # Deterministic — the same vector_id always maps to the same int64 FAISS id, so a
    # from-scratch rebuild reproduces byte-identical ids without a persistent counter.
    return int(hashlib.sha256(vector_id.encode()).hexdigest()[:15], 16)


def _load_meta(namespace: str) -> dict[str, dict[str, Any]]:
    path = _meta_path(namespace)
    if not path.exists():
        return {}
    return json.loads(path.read_text(encoding="utf-8"))  # type: ignore[no-any-return]


def _save_meta(namespace: str, meta: dict[str, dict[str, Any]]) -> None:
    _meta_path(namespace).write_text(json.dumps(meta), encoding="utf-8")


def _load_index(namespace: str, dim: int) -> faiss.IndexIDMap2:
    path = _index_path(namespace)
    if path.exists():
        return faiss.read_index(str(path))  # type: ignore[return-value]
    return faiss.IndexIDMap2(faiss.IndexFlatIP(dim))


def _save_index(namespace: str, index: faiss.IndexIDMap2) -> None:
    faiss.write_index(index, str(_index_path(namespace)))


def upsert(
    namespace: str, vector_id: str, embedding: list[float], metadata: dict[str, Any], dim: int
) -> None:
    """Idempotent — re-upserting the same vector_id replaces both its embedding and
    metadata (removes then re-adds, since FAISS has no in-place update).

    Similarity is inner-product (`IndexFlatIP`), i.e. cosine similarity — callers
    MUST pass unit-normalized embeddings (`TextEmbedder` normalizes before returning,
    app/ai/embedder.py) or "nearest" stops meaning anything directional."""
    index = _load_index(namespace, dim)
    meta = _load_meta(namespace)
    faiss_id = _faiss_id(vector_id)

    if vector_id in meta:
        # faiss's own stubs type remove_ids as wanting an IDSelector, but its actual
        # runtime implementation accepts a plain ndarray of ids directly (the
        # documented, common usage) — a stub imprecision, not a real type error.
        index.remove_ids(np.array([faiss_id], dtype=np.int64))  # type: ignore[arg-type]

    embedding_array = np.array([embedding], dtype=np.float32)
    id_array = np.array([faiss_id], dtype=np.int64)
    index.add_with_ids(embedding_array, id_array)
    meta[vector_id] = {"faiss_id": faiss_id, "metadata": metadata}

    _save_index(namespace, index)
    _save_meta(namespace, meta)


def remove(namespace: str, vector_id: str) -> None:
    meta = _load_meta(namespace)
    if vector_id not in meta:
        return
    faiss_id = meta.pop(vector_id)["faiss_id"]
    index = _load_index(namespace, dim=1)  # dim unused on an existing loaded index
    index.remove_ids(np.array([faiss_id], dtype=np.int64))  # type: ignore[arg-type]
    _save_index(namespace, index)
    _save_meta(namespace, meta)


def search(namespace: str, query_embedding: list[float], k: int, dim: int) -> list[dict[str, Any]]:
    """Metadata-filtering happens at the caller (stage 1's PG pre-filter narrows
    candidates before this ever runs, per the recommendation pipeline, §2)."""
    meta = _load_meta(namespace)
    if not meta:
        return []
    index = _load_index(namespace, dim)
    by_faiss_id = {v["faiss_id"]: (vector_id, v["metadata"]) for vector_id, v in meta.items()}

    scores, ids = index.search(np.array([query_embedding], dtype=np.float32), min(k, len(meta)))
    results = []
    for score, faiss_id in zip(scores[0], ids[0], strict=True):
        if faiss_id == -1 or faiss_id not in by_faiss_id:
            continue
        vector_id, metadata = by_faiss_id[faiss_id]
        results.append({"vector_id": vector_id, "score": float(score), "metadata": metadata})
    return results


def count(namespace: str) -> int:
    return len(_load_meta(namespace))


def get_metadata(namespace: str, vector_id: str) -> dict[str, Any] | None:
    entry = _load_meta(namespace).get(vector_id)
    return entry["metadata"] if entry else None


def clear(namespace: str) -> None:
    """Wipes a namespace entirely — used before a full rebuild so stale vectors from
    since-deleted rows never linger."""
    _index_path(namespace).unlink(missing_ok=True)
    _meta_path(namespace).unlink(missing_ok=True)
