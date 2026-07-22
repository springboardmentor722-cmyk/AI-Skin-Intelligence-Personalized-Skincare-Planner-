from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.elasticsearch import get_elasticsearch
from app.services.ingredients.models import Ingredient
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.skin_profile.models import SkinConcern, SkinType

# Mappings verbatim from skinlytics_elasticsearch_schema_v2.txt — ES documents are
# DERIVED, never authored here directly (that's the whole point of the outbox +
# worker, ADR-010). Fields the current schema simply has no data for yet
# (description, rating, popularity_score — products.rating lands M3-C, §5) are
# omitted rather than fabricated (AGENTS.md's "don't invent a column" rule extends
# to "don't invent a value").
_PRODUCTS_MAPPING = {
    "properties": {
        "product_id": {"type": "integer"},
        "brand_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "product_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "category": {"type": "keyword"},
        "description": {"type": "text"},
        "ingredients": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "skin_types_supported": {"type": "keyword"},
        "concerns_supported": {"type": "keyword"},
        "price": {"type": "float"},
        "currency": {"type": "keyword"},
        "spf_rating": {"type": "integer"},
        "rating": {"type": "float"},
        "popularity_score": {"type": "float"},
        "is_active": {"type": "boolean"},
        "created_at": {"type": "date"},
        "updated_at": {"type": "date"},
    }
}
_INGREDIENTS_MAPPING = {
    "properties": {
        "ingredient_id": {"type": "integer"},
        "ingredient_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "inci_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "aliases": {"type": "text"},
        "category": {"type": "keyword"},
        "benefits": {"type": "text"},
        "side_effects": {"type": "text"},
        "suitable_for": {"type": "keyword"},
        "avoid_for": {"type": "keyword"},
        "interaction_warnings": {"type": "text"},
        "research_refs": {"type": "keyword"},
        "updated_at": {"type": "date"},
    }
}
_KNOWLEDGE_ARTICLES_MAPPING = {
    "properties": {
        "article_id": {"type": "integer"},
        "title": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "source": {"type": "keyword"},
        "tags": {"type": "keyword"},
        "summary": {"type": "text"},
        "content": {"type": "text"},
        "related_conditions": {"type": "keyword"},
        "related_ingredients": {"type": "keyword"},
        "embedding_id": {"type": "keyword"},
        "topic": {"type": "keyword"},
        "published_at": {"type": "date"},
    }
}
INDEX_MAPPINGS = {
    "products_index": _PRODUCTS_MAPPING,
    "ingredients_index": _INGREDIENTS_MAPPING,
    "knowledge_articles_index": _KNOWLEDGE_ARTICLES_MAPPING,
}

async def ensure_indices() -> None:
    """Creates the 3 indices from their documented mappings if absent — idempotent,
    safe to call before every projection. Always re-checks existence rather than
    caching "already ensured" in memory: a prior version cached that flag, and
    rebuild.py's full-rebuild path deletes these indices out from under a
    long-running process, which left the cache believing an index existed when it
    didn't — the next `es.index()` call then silently let Elasticsearch
    auto-create it with an inferred mapping instead of the documented one (found
    live, regression-tested in test_es_projection.py)."""
    es = get_elasticsearch()
    for name, mapping in INDEX_MAPPINGS.items():
        if not await es.indices.exists(index=name):
            await es.indices.create(index=name, mappings=mapping)


async def build_product_document(db: AsyncSession, product_id: int) -> dict[str, Any] | None:
    product = (
        await db.execute(select(Product).where(Product.product_id == product_id))
    ).scalar_one_or_none()
    if product is None:
        return None

    skin_types = (
        await db.execute(
            select(SkinType.skin_type_name)
            .join(ProductSkinType, ProductSkinType.skin_type_id == SkinType.skin_type_id)
            .where(ProductSkinType.product_id == product_id)
        )
    ).scalars().all()
    concerns = (
        await db.execute(
            select(SkinConcern.concern_name)
            .join(ProductConcern, ProductConcern.concern_id == SkinConcern.concern_id)
            .where(ProductConcern.product_id == product_id)
        )
    ).scalars().all()
    ingredients = (
        await db.execute(
            select(Ingredient.ingredient_name)
            .join(ProductIngredient, ProductIngredient.ingredient_id == Ingredient.ingredient_id)
            .where(ProductIngredient.product_id == product_id)
        )
    ).scalars().all()

    return {
        "product_id": product.product_id,
        "brand_name": product.brand_name,
        "product_name": product.product_name,
        "category": product.category,
        "ingredients": list(ingredients),
        "skin_types_supported": list(skin_types),
        "concerns_supported": list(concerns),
        "price": float(product.price) if product.price is not None else None,
        "currency": product.currency,
        "spf_rating": product.spf_rating,
        "is_active": product.is_active,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "updated_at": product.updated_at.isoformat() if product.updated_at else None,
    }


async def build_ingredient_document(db: AsyncSession, ingredient_id: int) -> dict[str, Any] | None:
    ingredient = (
        await db.execute(select(Ingredient).where(Ingredient.ingredient_id == ingredient_id))
    ).scalar_one_or_none()
    if ingredient is None:
        return None

    return {
        "ingredient_id": ingredient.ingredient_id,
        "ingredient_name": ingredient.ingredient_name,
        "inci_name": ingredient.inci_name,
        "category": ingredient.category,
        "updated_at": ingredient.updated_at.isoformat() if ingredient.updated_at else None,
    }


async def build_article_document(mongo: Any, article_id: int) -> dict[str, Any] | None:
    article = await mongo["knowledge_articles"].find_one({"article_id": article_id})
    if article is None:
        return None

    return {
        "article_id": article["article_id"],
        "title": article.get("title"),
        "source": article.get("source"),
        "tags": article.get("tags", []),
        "summary": article.get("summary"),
        "content": article.get("content"),
        "related_conditions": article.get("related_conditions", []),
        "related_ingredients": article.get("related_ingredients", []),
        "embedding_id": article.get("embedding_id"),
        "published_at": (
            article["published_at"].isoformat() if article.get("published_at") else None
        ),
    }


async def project_to_elasticsearch(
    db: AsyncSession, mongo: Any, aggregate_type: str, aggregate_id: str
) -> None:
    """Deletes the ES doc if the source row is gone (a real delete event or a
    since-removed row), upserts otherwise. `profile` has no ES index yet — a
    documented no-op until the recommender's user_profiles_namespace lands (M3-D)."""
    if aggregate_type == "profile":
        return

    await ensure_indices()
    es = get_elasticsearch()

    if aggregate_type == "product":
        index, doc = "products_index", await build_product_document(db, int(aggregate_id))
    elif aggregate_type == "ingredient":
        index, doc = "ingredients_index", await build_ingredient_document(db, int(aggregate_id))
    elif aggregate_type == "article":
        index = "knowledge_articles_index"
        doc = await build_article_document(mongo, int(aggregate_id))
    else:
        raise ValueError(f"unknown outbox aggregate_type: {aggregate_type!r}")

    if doc is None:
        await es.options(ignore_status=404).delete(index=index, id=aggregate_id)
    else:
        await es.index(index=index, id=aggregate_id, document=doc)
