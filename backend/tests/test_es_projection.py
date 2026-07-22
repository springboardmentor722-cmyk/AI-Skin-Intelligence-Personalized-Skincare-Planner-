"""app/worker/consumers/es_projection.py — builds ES documents from the current
Postgres/Mongo state and indexes them (M3-A). Tested against the live Docker ES
cluster (repo pattern) — no mocks. Each test cleans up its own ES doc since ES writes
aren't part of the Postgres test transaction rollback."""

import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.elasticsearch import get_elasticsearch
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import Product
from app.worker.consumers.es_projection import (
    ensure_indices,
    project_to_elasticsearch,
)


async def test_project_product_indexes_a_real_document(db_session: AsyncSession) -> None:
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

    try:
        await project_to_elasticsearch(
            db_session, mongo=None, aggregate_type="product", aggregate_id=str(product_id)
        )

        es = get_elasticsearch()
        doc = await es.get(index="products_index", id=str(product_id))
        assert doc["_source"]["product_name"] == product.product_name
        assert doc["_source"]["category"] == "Serum"
        assert doc["_source"]["is_active"] is True
    finally:
        await get_elasticsearch().options(ignore_status=404).delete(
            index="products_index", id=str(product_id)
        )


async def test_project_ingredient_indexes_a_real_document(db_session: AsyncSession) -> None:
    ingredient = Ingredient(
        ingredient_name=f"Test Ingredient {uuid.uuid4().hex[:8]}",
        inci_name="Testum Ingredientum",
        category="Brightening agent",
    )
    db_session.add(ingredient)
    await db_session.flush()
    ingredient_id = ingredient.ingredient_id

    try:
        await project_to_elasticsearch(
            db_session, mongo=None, aggregate_type="ingredient", aggregate_id=str(ingredient_id)
        )

        es = get_elasticsearch()
        doc = await es.get(index="ingredients_index", id=str(ingredient_id))
        assert doc["_source"]["ingredient_name"] == ingredient.ingredient_name
        assert doc["_source"]["inci_name"] == "Testum Ingredientum"
    finally:
        await get_elasticsearch().options(ignore_status=404).delete(
            index="ingredients_index", id=str(ingredient_id)
        )


async def test_project_profile_is_a_documented_noop(db_session: AsyncSession) -> None:
    """user_profiles has no ES index at all — this just must not raise."""
    await project_to_elasticsearch(
        db_session, mongo=None, aggregate_type="profile", aggregate_id="some-user-id"
    )


async def test_ensure_indices_is_idempotent() -> None:
    await ensure_indices()
    await ensure_indices()  # must not raise on a second call

    es = get_elasticsearch()
    assert await es.indices.exists(index="products_index")
    assert await es.indices.exists(index="ingredients_index")
    assert await es.indices.exists(index="knowledge_articles_index")
