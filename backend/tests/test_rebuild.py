"""app/worker/rebuild.py — full re-projection from PG/Mongo (M3-A). Runs for real
against the live seeded catalog (repo pattern, no mocks) — this is the acceptance
criterion itself: "dropping the ES index + FAISS files and running the rebuild
restores them byte-equivalent in counts." Not cleaned up afterward — this populates
the real derived stores, which is the intended steady state, not test pollution."""

from sqlalchemy import func, select

from app.db import vector
from app.db.elasticsearch import get_elasticsearch
from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import Product
from app.worker.rebuild import rebuild_all


async def _source_counts() -> dict[str, int]:
    async with async_session_factory() as db:
        products = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
        ingredients = (
            await db.execute(select(func.count()).select_from(Ingredient))
        ).scalar_one()
    articles = await get_mongo_db()["knowledge_articles"].count_documents({})
    return {"products": products, "ingredients": ingredients, "knowledge_articles": articles}


async def test_rebuild_all_matches_source_counts() -> None:
    expected = await _source_counts()

    counts = await rebuild_all()

    assert counts == expected
    assert vector.count("products") == expected["products"]
    assert vector.count("ingredients") == expected["ingredients"]
    assert vector.count("knowledge_articles") == expected["knowledge_articles"]

    es = get_elasticsearch()
    await es.indices.refresh(index="products_index")
    await es.indices.refresh(index="ingredients_index")
    es_products = (await es.count(index="products_index"))["count"]
    es_ingredients = (await es.count(index="ingredients_index"))["count"]
    assert es_products == expected["products"]
    assert es_ingredients == expected["ingredients"]


async def test_rebuild_all_is_idempotent_in_counts() -> None:
    first = await rebuild_all()
    second = await rebuild_all()

    assert first == second
