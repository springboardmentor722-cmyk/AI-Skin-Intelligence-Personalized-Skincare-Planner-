"""app/worker/consumers/embeddings.py — embeds current PG/Mongo state and upserts
into the FAISS vector store + Mongo product_vectors_metadata bookkeeping (M3-A).
AI_IMPL_EMBEDDER=stub in tests (repo default, .env) — no model load, deterministic."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db import vector
from app.db.mongo import get_mongo_db
from app.services.recommendations.models import Product
from app.worker.consumers.embeddings import embed_and_upsert


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
        vector.remove("products", vector_id)
        await get_mongo_db()["product_vectors_metadata"].delete_one({"product_id": product_id})


async def test_embed_and_upsert_profile_is_a_documented_noop(db_session: AsyncSession) -> None:
    """user_profiles_namespace doesn't exist yet (lands with the recommender, M3-D)."""
    await embed_and_upsert(db_session, get_mongo_db(), "profile", "some-user-id")
