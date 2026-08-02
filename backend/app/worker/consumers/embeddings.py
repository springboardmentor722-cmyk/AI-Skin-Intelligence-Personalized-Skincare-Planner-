import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embedder import get_embedder
from app.ai.schemas import NAMESPACE_EMBEDDING_MODELS
from app.db import vector
from app.services.skin_profile.models import SkinConcern, SkinProfile, SkinType
from app.services.skin_profile.models import SkinProfileConcern as SkinProfileConcernModel
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
    if aggregate_type == "product":
        await _embed_product(db, mongo, int(aggregate_id))
    elif aggregate_type == "ingredient":
        await _embed_ingredient(db, int(aggregate_id))
    elif aggregate_type == "article":
        await _embed_article(mongo, int(aggregate_id))
    elif aggregate_type == "profile":
        await _embed_profile(db, mongo, aggregate_id)
    elif aggregate_type == "assessment":
        # Milestone 2 P9's `submit_assessment` outbox event — a permanent no-op.
        # skinlytics_vector_db_schema_v3.txt documents a *different*,
        # never-implemented `skin_assessments_namespace` (an EfficientNet-B0
        # image-scan embedding keyed by a Mongo scan_id — no CV model exists
        # anywhere in this codebase, AGENTS.md's "no computer-vision model
        # needed" design intent). P9's real, rule-based assessment has no
        # embedding use case of its own.
        return
    else:
        raise ValueError(f"unknown outbox aggregate_type: {aggregate_type!r}")


async def _embed_product(db: AsyncSession, mongo: Any, product_id: int) -> None:
    doc = await build_product_document(db, product_id)
    vector_id = f"product_{product_id}"
    if doc is None:
        await vector.remove("products", vector_id)
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
    await vector.upsert("products", vector_id, embedding, metadata, dim=dim)

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
        await vector.remove("ingredients", vector_id)
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
    await vector.upsert("ingredients", vector_id, embedding, metadata, dim=dim)


async def _embed_article(mongo: Any, article_id: int) -> None:
    doc = await build_article_document(mongo, article_id)
    vector_id = f"article_{article_id}"
    if doc is None:
        await vector.remove("knowledge_articles", vector_id)
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
    await vector.upsert("knowledge_articles", vector_id, embedding, metadata, dim=dim)


async def _embed_profile(db: AsyncSession, mongo: Any, user_id: str) -> None:
    """user_profiles_namespace (M3-D) — the recommender's stage-2 query vector
    (service.py's get_recommendations). Re-embeds on every profile save (skin_profile/
    service.py's create_profile appends this outbox row already, since M3-A)."""
    vector_id = f"user_{user_id}"
    profile = (
        await db.execute(
            select(SkinProfile).where(
                SkinProfile.user_id == user_id,
                SkinProfile.is_current.is_(True),
                SkinProfile.is_deleted.is_(False),
            )
        )
    ).scalar_one_or_none()
    if profile is None:
        await vector.remove("user_profiles", vector_id)
        return

    skin_type = await db.get(SkinType, profile.skin_type_id)
    skin_type_name = skin_type.skin_type_name if skin_type else None
    concern_names = (
        (
            await db.execute(
                select(SkinConcern.concern_name)
                .join(
                    SkinProfileConcernModel,
                    SkinProfileConcernModel.concern_id == SkinConcern.concern_id,
                )
                .where(SkinProfileConcernModel.skin_profile_id == profile.skin_profile_id)
            )
        )
        .scalars()
        .all()
    )

    # user_preferences (schema #4) is a real documented collection with no writer yet
    # anywhere in the app (M3-D is only its first *reader*) — absent gracefully, not
    # fabricated (AGENTS.md §0.2), same as the recommender's price_fit signal below.
    preferences_doc = await mongo["user_preferences"].find_one({"user_id": user_id})
    routine_preference = preferences_doc.get("preferred_routine_type") if preferences_doc else None

    text = " ".join(
        filter(
            None,
            [
                f"{skin_type_name} skin" if skin_type_name else None,
                *[f"concern {name}" for name in concern_names if name],
                f"allergic to {profile.allergies}" if profile.allergies else None,
                f"sensitive to {profile.sensitivities}" if profile.sensitivities else None,
                f"prefers {routine_preference} routine" if routine_preference else None,
            ],
        )
    )
    model_name, dim = NAMESPACE_EMBEDDING_MODELS["user_profiles"]
    [embedding] = get_embedder("user_profiles").embed([text])

    metadata = {
        "user_id": user_id,
        "skin_type": skin_type_name,
        "concerns": [name for name in concern_names if name],
        "allergies": profile.allergies,
        "preferences": [routine_preference] if routine_preference else [],
        "embedding_model": model_name,
    }
    await vector.upsert("user_profiles", vector_id, embedding, metadata, dim=dim)
