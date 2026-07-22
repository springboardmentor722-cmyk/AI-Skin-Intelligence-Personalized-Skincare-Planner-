import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embedder import get_embedder
from app.ai.schemas import NAMESPACE_EMBEDDING_MODELS
from app.db import vector
from app.worker.consumers.es_projection import (
    build_article_document,
    build_ingredient_document,
    build_product_document,
)

# Embedded-text formulas and metadata shapes verbatim from
# skinlytics_vector_db_schema_v3.txt. No chunking for knowledge_articles yet (the
# schema allows article_{id}_c{n} chunk ids for long text) — single embedding per
# article is a documented simplification, not silently dropped functionality; chunking
# is real future work if/when an article exceeds PubMedBERT's max sequence length.


async def embed_and_upsert(
    db: AsyncSession, mongo: Any, aggregate_type: str, aggregate_id: str
) -> None:
    """`profile` has no user_profiles_namespace consumer yet — a documented no-op
    until the recommender needs it (M3-D)."""
    if aggregate_type == "profile":
        return

    if aggregate_type == "product":
        await _embed_product(db, mongo, int(aggregate_id))
    elif aggregate_type == "ingredient":
        await _embed_ingredient(db, int(aggregate_id))
    elif aggregate_type == "article":
        await _embed_article(mongo, int(aggregate_id))
    else:
        raise ValueError(f"unknown outbox aggregate_type: {aggregate_type!r}")


async def _embed_product(db: AsyncSession, mongo: Any, product_id: int) -> None:
    doc = await build_product_document(db, product_id)
    vector_id = f"product_{product_id}"
    if doc is None:
        vector.remove("products", vector_id)
        await mongo["product_vectors_metadata"].delete_one({"product_id": product_id})
        return

    model_name, dim = NAMESPACE_EMBEDDING_MODELS["products"]
    text = " ".join(filter(None, [doc["product_name"], *doc["ingredients"]]))
    [embedding] = get_embedder("products").embed([text])

    metadata = {
        "product_id": product_id,
        "product_name": doc["product_name"],
        "brand": doc["brand_name"],
        "category": doc["category"],
        "ingredients": doc["ingredients"],
        "skin_types": doc["skin_types_supported"],
        "concerns": doc["concerns_supported"],
        "price": doc["price"],
        "currency": doc["currency"],
        "is_active": doc["is_active"],
        "embedding_model": model_name,
    }
    vector.upsert("products", vector_id, embedding, metadata, dim=dim)

    now = datetime.datetime.now(datetime.UTC)
    await mongo["product_vectors_metadata"].update_one(
        {"product_id": product_id},
        {
            "$set": {
                "product_id": product_id,
                "vector_id": vector_id,
                "ingredients": doc["ingredients"],
                "skin_types_supported": doc["skin_types_supported"],
                "concerns_supported": doc["concerns_supported"],
                "embedding_model": model_name,
                "synced_at": now,
                "updated_at": now,
            }
        },
        upsert=True,
    )


async def _embed_ingredient(db: AsyncSession, ingredient_id: int) -> None:
    doc = await build_ingredient_document(db, ingredient_id)
    vector_id = f"ingredient_{ingredient_id}"
    if doc is None:
        vector.remove("ingredients", vector_id)
        return

    model_name, dim = NAMESPACE_EMBEDDING_MODELS["ingredients"]
    text = " ".join(filter(None, [doc["ingredient_name"], doc["category"]]))
    [embedding] = get_embedder("ingredients").embed([text])

    metadata = {
        "ingredient_id": ingredient_id,
        "ingredient_name": doc["ingredient_name"],
        "category": doc["category"],
        "embedding_model": model_name,
    }
    vector.upsert("ingredients", vector_id, embedding, metadata, dim=dim)


async def _embed_article(mongo: Any, article_id: int) -> None:
    doc = await build_article_document(mongo, article_id)
    vector_id = f"article_{article_id}"
    if doc is None:
        vector.remove("knowledge_articles", vector_id)
        return

    model_name, dim = NAMESPACE_EMBEDDING_MODELS["knowledge_articles"]
    text = " ".join(filter(None, [doc["title"], doc["summary"], doc["content"]]))
    [embedding] = get_embedder("knowledge_articles").embed([text])

    metadata = {
        "article_id": article_id,
        "title": doc["title"],
        "source": doc["source"],
        "tags": doc["tags"],
        "chunk": 0,
        "embedding_model": model_name,
    }
    vector.upsert("knowledge_articles", vector_id, embedding, metadata, dim=dim)
