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
from app.services.recommendations.service import resolve_fallback_gallery_urls
from app.services.skin_profile.models import SkinConcern, SkinType

# Mappings verbatim from skinlytics_elasticsearch_schema_v2.txt — ES documents are
# DERIVED, never authored here directly (that's the whole point of the outbox +
# worker, ADR-010). Fields the current schema simply has no data for yet
# (description, popularity_score — no real formula defined, would mean inventing
# one) stay omitted rather than fabricated. `rating`/`review_count` are real as of
# M3-C (products.rating/review_count, migration 103dadbc13ce).
_PRODUCTS_MAPPING = {
    "properties": {
        "product_id": {"type": "integer"},
        "brand_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "product_name": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "category": {"type": "keyword"},
        "description": {"type": "text"},
        # Two fields, not one, because they need different read-time handling
        # (products_service.py's _product_read_from_es_source): image_key is an S3
        # object key (ADR-040) that must be presigned fresh on every read — a
        # presigned URL baked in here would go stale within its 1h expiry, since ES
        # documents are only rebuilt on outbox events, not every read.
        # fallback_image_url (ADR-043's product_images exception) is already a live,
        # non-expiring external URL — safe to store and return as-is.
        "image_key": {"type": "keyword"},
        "fallback_image_url": {"type": "keyword"},
        "ingredients": {"type": "text", "fields": {"raw": {"type": "keyword"}}},
        "skin_types_supported": {"type": "keyword"},
        "concerns_supported": {"type": "keyword"},
        "price": {"type": "float"},
        "currency": {"type": "keyword"},
        "spf_rating": {"type": "integer"},
        "rating": {"type": "float"},
        "review_count": {"type": "integer"},
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
    live, regression-tested in test_es_projection.py).

    `create` is wrapped with `ignore_status=400` for the same reason `project_to_
    elasticsearch`'s delete below already ignores 404: this function is called from
    more than one OS process against the same live cluster (the `worker` container's
    own outbox poller calls it too, on its own cron tick — docker-compose.yml's
    bind-mounted, not isolated, by design). Two processes can both see an index
    missing and both call create — the loser gets `resource_already_exists_exception`
    for an index that now exists with the correct mapping either way, so ignoring it
    is correct, not a swallowed bug."""
    es = get_elasticsearch()
    for name, mapping in INDEX_MAPPINGS.items():
        if not await es.indices.exists(index=name):
            await es.options(ignore_status=400).indices.create(index=name, mappings=mapping)


async def build_product_document(db: AsyncSession, product_id: int) -> dict[str, Any] | None:
    product = (
        await db.execute(select(Product).where(Product.product_id == product_id))
    ).scalar_one_or_none()
    if product is None:
        return None

    skin_types = (
        (
            await db.execute(
                select(SkinType.skin_type_name)
                .join(ProductSkinType, ProductSkinType.skin_type_id == SkinType.skin_type_id)
                .where(ProductSkinType.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )
    concerns = (
        (
            await db.execute(
                select(SkinConcern.concern_name)
                .join(ProductConcern, ProductConcern.concern_id == SkinConcern.concern_id)
                .where(ProductConcern.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )
    ingredients = (
        (
            await db.execute(
                select(Ingredient.ingredient_name)
                .join(
                    ProductIngredient, ProductIngredient.ingredient_id == Ingredient.ingredient_id
                )
                .where(ProductIngredient.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )

    fallback_image_url = None
    if product.image_url is None:
        fallback_image_url = (await resolve_fallback_gallery_urls(db, [product_id])).get(product_id)

    return {
        "product_id": product.product_id,
        "brand_name": product.brand_name,
        "product_name": product.product_name,
        "category": product.category,
        "image_key": product.image_url,
        "fallback_image_url": fallback_image_url,
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
    since-removed row), upserts otherwise. `profile` is permanently a no-op here —
    profiles are never searched via Elasticsearch, only via vector similarity
    (app/worker/consumers/embeddings.py's user_profiles_namespace, M3-D).
    `assessment` (Milestone 2 P9's `submit_assessment` outbox event) is also a
    permanent no-op — a skin assessment is a personal, time-series score record,
    not a searchable catalog item; no assessments index exists in
    database_schemas/skinlytics_elasticsearch_schema_v2.txt and none is planned."""
    if aggregate_type in ("profile", "assessment"):
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
