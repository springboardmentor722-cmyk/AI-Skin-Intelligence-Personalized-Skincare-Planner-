"""app/worker/consumers/embeddings.py — embeds current PG/Mongo state and upserts
into the FAISS vector store + Mongo product_vectors_metadata bookkeeping (M3-A).
AI_IMPL_EMBEDDER=stub in tests (repo default, .env) — no model load, deterministic."""

import uuid
from pathlib import Path

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db import vector
from app.db.mongo import get_mongo_db
from app.services.recommendations.models import Product
from app.services.skin_profile.models import SkinProfile
from app.worker.consumers.embeddings import embed_and_upsert


@pytest.fixture(autouse=True)
def _isolated_faiss_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """`app/db/vector.py` has no cross-process locking around its FAISS
    read-modify-write cycle — by design, per its own module docstring, on the
    assumption that only `app/worker/` ever writes there (ADR-005 single-writer
    rule). These tests call `embed_and_upsert` directly, in-process, against the
    *same* `ml/faiss/{namespace}.index`/`.meta.json` files the real docker-compose
    `worker` container (or any other test process invoking the same worker code) is
    also free to write concurrently — a real lost-update race, not a mere transient
    lock: this test's own `vector.upsert()` can complete cleanly and then have its
    just-written key vanish, clobbered by another writer's own unlocked
    read-modify-write landing in between. Redirecting to a private tmp dir per test
    gives these tests the same isolation `db_session`'s rollback gives Postgres."""
    monkeypatch.setattr(settings, "faiss_index_dir", str(tmp_path))


async def test_embed_and_upsert_product_lands_in_the_vector_store_and_mongo(
    db_session: AsyncSession,
) -> None:
    product = Product(
        brand_name="Test Brand",
        product_name=f"Test Serum {uuid.uuid4().hex[:8]}",
        category="Serum",
        price=999.0,
        currency="INR",
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()
    product_id = product.product_id
    vector_id = f"product_{product_id}"

    try:
        await embed_and_upsert(db_session, get_mongo_db(), "product", str(product_id))

        metadata = vector.get_metadata("products", vector_id)
        assert metadata is not None
        assert metadata["product_id"] == product_id
        assert metadata["product_name"] == product.product_name

        sync_doc = await get_mongo_db()["product_vectors_metadata"].find_one(
            {"product_id": product_id}
        )
        assert sync_doc is not None
        assert sync_doc["vector_id"] == vector_id
        assert sync_doc["embedding_model"]
    finally:
        await vector.remove("products", vector_id)
        await get_mongo_db()["product_vectors_metadata"].delete_one({"product_id": product_id})


async def test_embed_and_upsert_profile_lands_in_the_user_profiles_namespace(
    db_session: AsyncSession, test_user_id: str
) -> None:
    """M3-D: the recommender's stage-2 query vector (service.py) is this namespace's
    entry, never computed on the request path."""
    profile = SkinProfile(
        user_id=test_user_id,
        skin_type_id=1,
        allergies="Fragrance",
        sensitivities="Retinol",
        is_current=True,
    )
    db_session.add(profile)
    await db_session.flush()
    vector_id = f"user_{test_user_id}"

    try:
        await embed_and_upsert(db_session, get_mongo_db(), "profile", test_user_id)

        metadata = vector.get_metadata("user_profiles", vector_id)
        assert metadata is not None
        assert metadata["user_id"] == test_user_id
        assert metadata["skin_type"]
        assert "Fragrance" in metadata["allergies"]
        assert metadata["embedding_model"]

        embedding = vector.get_vector("user_profiles", vector_id)
        assert embedding is not None
        assert len(embedding) == 384
    finally:
        await vector.remove("user_profiles", vector_id)


async def test_embed_and_upsert_profile_removes_the_vector_when_no_current_profile_exists(
    db_session: AsyncSession, test_user_id: str
) -> None:
    vector_id = f"user_{test_user_id}"
    await vector.upsert("user_profiles", vector_id, [0.1] * 384, {"user_id": test_user_id}, dim=384)

    await embed_and_upsert(db_session, get_mongo_db(), "profile", test_user_id)

    assert vector.get_metadata("user_profiles", vector_id) is None
