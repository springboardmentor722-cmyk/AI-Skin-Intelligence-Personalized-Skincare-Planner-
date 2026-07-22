"""app/worker/poller.py — process_pending_outbox() is the core "worker tick": pick up
pending outbox rows, project each to ES + the vector store, mark processed. This is
the projection-lag smoke test the spec asks for — a product mutation lands in both
derived stores within one poll, not eventually-someday."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import vector
from app.db.elasticsearch import get_elasticsearch
from app.db.mongo import get_mongo_db
from app.db.outbox import Outbox, append_outbox
from app.services.recommendations.models import Product
from app.worker.poller import process_pending_outbox


async def test_process_pending_outbox_projects_a_product_to_es_and_vector_and_marks_processed(
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
    await append_outbox(db_session, "product", str(product_id), "upsert")
    await db_session.commit()

    vector_id = f"product_{product_id}"
    try:
        processed_count = await process_pending_outbox(db_session, get_mongo_db(), batch_size=1000)

        assert processed_count >= 1

        es_doc = await get_elasticsearch().get(index="products_index", id=str(product_id))
        assert es_doc["_source"]["product_name"] == product.product_name

        assert vector.get_metadata("products", vector_id) is not None

        row = (
            await db_session.execute(
                select(Outbox).where(
                    Outbox.aggregate_type == "product", Outbox.aggregate_id == str(product_id)
                )
            )
        ).scalar_one()
        assert row.processed_at is not None
    finally:
        vector.remove("products", vector_id)
        await get_mongo_db()["product_vectors_metadata"].delete_one({"product_id": product_id})
        await get_elasticsearch().options(ignore_status=404).delete(
            index="products_index", id=str(product_id)
        )


async def test_process_pending_outbox_returns_zero_once_drained(
    db_session: AsyncSession,
) -> None:
    # Doesn't assume an empty table (a real, shared dev DB may have genuinely-pending
    # rows from other work) — just drains whatever's there, then proves a second call
    # right after finds nothing left, since nothing new was appended in between.
    await process_pending_outbox(db_session, get_mongo_db(), batch_size=1000)

    processed_count = await process_pending_outbox(db_session, get_mongo_db(), batch_size=1000)

    assert processed_count == 0
