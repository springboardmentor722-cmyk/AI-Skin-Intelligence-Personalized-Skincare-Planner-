import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.outbox import Outbox
from app.worker.consumers.cache_invalidation import (
    invalidate_recommendation_cache_for_catalog_change,
)
from app.worker.consumers.embeddings import embed_and_upsert
from app.worker.consumers.es_projection import project_to_elasticsearch


async def process_pending_outbox(db: AsyncSession, mongo: Any, batch_size: int = 100) -> int:
    """One worker "tick" (ADR-010): pick up pending rows in FIFO order (the
    `idx_outbox_processed_id` index), project each to ES + the vector store, mark
    processed. Both projections run for every row — if ES succeeds but the
    embedding fails (or vice versa), the row stays pending and both are retried on
    the next tick, since neither is marked done independently. Any `product` row in
    the batch also flushes the recommendation cache (M3-D) — once per tick, not once
    per row, since a full flush is already the coarsest possible invalidation."""
    rows = (
        await db.execute(
            select(Outbox)
            .where(Outbox.processed_at.is_(None))
            .order_by(Outbox.outbox_id)
            .limit(batch_size)
        )
    ).scalars().all()

    catalog_changed = False
    for row in rows:
        await project_to_elasticsearch(db, mongo, row.aggregate_type, row.aggregate_id)
        await embed_and_upsert(db, mongo, row.aggregate_type, row.aggregate_id)
        row.processed_at = datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
        catalog_changed = catalog_changed or row.aggregate_type == "product"

    await db.commit()
    if catalog_changed:
        await invalidate_recommendation_cache_for_catalog_change()
    return len(rows)
