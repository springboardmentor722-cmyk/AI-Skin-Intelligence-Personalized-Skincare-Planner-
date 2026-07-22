"""Full re-projection from PG/Mongo — `make rebuild-derived` /
`python -m app.worker.rebuild`. Drops every ES index + FAISS namespace this worker
owns and rebuilds them from the current source-of-truth rows, bypassing outbox
history entirely (that's the point: derived stores are always reconstructible even
if the outbox itself were lost or its history diverged). NOT run against outbox rows
— every current product/ingredient/knowledge_article is re-projected, active or not,
so a rebuild's counts are directly comparable to the source tables' row counts."""

import asyncio

from sqlalchemy import select

from app.db import vector
from app.db.elasticsearch import get_elasticsearch
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import Product
from app.worker.consumers.embeddings import embed_and_upsert
from app.worker.consumers.es_projection import INDEX_MAPPINGS, project_to_elasticsearch

_NAMESPACES = ("products", "ingredients", "knowledge_articles")


async def _clear_all() -> None:
    es = get_elasticsearch()
    for index_name in INDEX_MAPPINGS:
        await es.options(ignore_status=404).indices.delete(index=index_name)
    for namespace in _NAMESPACES:
        # vector.clear() only removes files for a namespace it already knows the name
        # of — no per-vector_id loop needed, the whole namespace's files are dropped.
        vector.clear(namespace)


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

        ingredient_ids = (await db.execute(select(Ingredient.ingredient_id))).scalars().all()
        for ingredient_id in ingredient_ids:
            await project_to_elasticsearch(db, mongo, "ingredient", str(ingredient_id))
            await embed_and_upsert(db, mongo, "ingredient", str(ingredient_id))
            counts["ingredients"] += 1

    article_ids = [
        doc["article_id"]
        async for doc in mongo["knowledge_articles"].find({}, {"article_id": 1})
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
