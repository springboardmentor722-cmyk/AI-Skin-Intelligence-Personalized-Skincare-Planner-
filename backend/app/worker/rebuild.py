"""Full re-projection from PG/Mongo — `make rebuild-derived` /
`python -m app.worker.rebuild`. Drops every ES index + FAISS namespace this worker
owns and rebuilds them from the current source-of-truth rows, bypassing outbox
history entirely (that's the point: derived stores are always reconstructible even
if the outbox itself were lost or its history diverged). NOT run against outbox rows
— every current product/ingredient/knowledge_article is re-projected, active or not,
so a rebuild's counts are directly comparable to the source tables' row counts."""

import asyncio
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embedder import get_embedder
from app.ai.schemas import NAMESPACE_EMBEDDING_MODELS
from app.db import vector
from app.db.elasticsearch import get_elasticsearch
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import Product
from app.worker.consumers.embeddings import embed_and_upsert
from app.worker.consumers.es_projection import (
    INDEX_MAPPINGS,
    build_ingredient_document,
    ensure_indices,
    project_to_elasticsearch,
)

_NAMESPACES = ("products", "ingredients", "knowledge_articles")

# Ingredients specifically get a batched embedding path (see _embed_ingredients_batch)
# — found live, 2026-08-12: with 16,100 real ingredient rows, the one-item-at-a-time
# path (embed_and_upsert, still used below for products/articles) never finished a
# full rebuild in over 2.5 hours. Two compounding costs, both scoped to bulk rebuilds
# only, neither touching the real-time single-item outbox path: (1) one model.encode()
# call per ingredient instead of one call per batch (RealTextEmbedder.embed already
# accepts a list — app/ai/embedder.py — nothing stopped batching except no caller ever
# did), and (2) vector.upsert() reloads and rewrites the *entire* on-disk FAISS index
# on every single call, so 16,100 ingredients means 16,100 full-file rewrites of an
# ever-growing file. vector.bulk_upsert() (app/db/vector.py) loads/saves once per
# batch instead. Products aren't touched here (already populated, not the reported
# problem, and their embed path also writes Mongo product_vectors_metadata bookkeeping
# _embed_ingredient doesn't have — not worth duplicating for a store that isn't
# broken); articles have zero source rows in Mongo today, so batching them wouldn't
# do anything.
_INGREDIENT_BATCH_SIZE = 64


async def _embed_ingredients_batch(db: AsyncSession, mongo: Any, ingredient_ids: list[int]) -> int:
    model_name, dim = NAMESPACE_EMBEDDING_MODELS["ingredients"]
    # Builds each ingredient's document once and reuses it for both the ES write and
    # the embedding text/metadata below — calling project_to_elasticsearch here too
    # would build_ingredient_document() a second time per ingredient (2 SELECTs
    # instead of 1), the exact per-item DB round-trip this batching was written to
    # cut down on. ensure_indices() (cheap HEAD checks) still runs, matching
    # project_to_elasticsearch's own per-write guarantee that ingredients_index
    # exists with the documented mapping before anything is indexed into it.
    es = get_elasticsearch()
    await ensure_indices()
    processed = 0
    for start in range(0, len(ingredient_ids), _INGREDIENT_BATCH_SIZE):
        batch_ids = ingredient_ids[start : start + _INGREDIENT_BATCH_SIZE]
        docs: list[tuple[int, dict[str, Any]]] = []
        for ingredient_id in batch_ids:
            doc = await build_ingredient_document(db, ingredient_id)
            if doc is None:
                await es.options(ignore_status=404).delete(
                    index="ingredients_index", id=str(ingredient_id)
                )
            else:
                await es.index(index="ingredients_index", id=str(ingredient_id), document=doc)
                docs.append((ingredient_id, doc))
            processed += 1

        if not docs:
            continue
        texts = [
            " ".join(filter(None, [doc["ingredient_name"], doc["category"]])) for _, doc in docs
        ]
        embeddings = get_embedder("ingredients").embed(texts)
        items = [
            (
                f"ingredient_{ingredient_id}",
                embedding,
                {
                    "ingredient_id": ingredient_id,
                    "ingredient_name": doc["ingredient_name"],
                    "category": doc["category"],
                    "embedding_model": model_name,
                },
            )
            for (ingredient_id, doc), embedding in zip(docs, embeddings, strict=True)
        ]
        # ponytail: this embed+FAISS write is atomic per-batch, not per-item — a
        # failure partway through (e.g. batch 200 of ~252) leaves up to
        # _INGREDIENT_BATCH_SIZE ingredients with a fresh ES doc but no FAISS vector
        # yet, vs. the old per-item path's 1-item window. rebuild_all() is already
        # documented as idempotent and meant to be rerun (module docstring), so this
        # self-heals on the next run; upgrade path if that's ever not good enough:
        # catch/log per-batch and continue instead of letting the exception
        # propagate out of rebuild_all() entirely.
        await vector.bulk_upsert("ingredients", items, dim=dim)
    return processed


async def _clear_all() -> None:
    es = get_elasticsearch()
    for index_name in INDEX_MAPPINGS:
        await es.options(ignore_status=404).indices.delete(index=index_name)
    for namespace in _NAMESPACES:
        # vector.clear() only removes files for a namespace it already knows the name
        # of — no per-vector_id loop needed, the whole namespace's files are dropped.
        await vector.clear(namespace)


async def rebuild_all() -> dict[str, int]:
    mongo = get_mongo_db()
    counts = {"products": 0, "ingredients": 0, "knowledge_articles": 0}

    await _clear_all()

    async with async_session_factory() as db:
        product_ids = (await db.execute(select(Product.product_id))).scalars().all()
        for product_id in product_ids:
            await project_to_elasticsearch(db, mongo, "product", str(product_id))
            await embed_and_upsert(db, mongo, "product", str(product_id))
            counts["products"] += 1

        ingredient_ids = list((await db.execute(select(Ingredient.ingredient_id))).scalars().all())
        counts["ingredients"] += await _embed_ingredients_batch(db, mongo, ingredient_ids)

    article_ids = [
        doc["article_id"] async for doc in mongo["knowledge_articles"].find({}, {"article_id": 1})
    ]
    async with async_session_factory() as db:
        for article_id in article_ids:
            await project_to_elasticsearch(db, mongo, "article", str(article_id))
            await embed_and_upsert(db, mongo, "article", str(article_id))
            counts["knowledge_articles"] += 1

    return counts


async def main() -> None:
    counts = await rebuild_all()
    print(
        f"Rebuilt derived stores: {counts['products']} product(s), "
        f"{counts['ingredients']} ingredient(s), "
        f"{counts['knowledge_articles']} knowledge article(s)."
    )


if __name__ == "__main__":
    asyncio.run(main())
