import datetime
import json
import math
from typing import NamedTuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.recommender import ContentBasedRecommender
from app.ai.schemas import RecommendationFeatures
from app.ai.suitability import RealIngredientSuitability
from app.db import vector as vector_db
from app.db.mongo import get_mongo_db
from app.db.redis import get_redis
from app.services.ingredients.models import Ingredient, IngredientSkintypeAvoid
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductRecommendation,
    ProductSkinType,
    RecommendationWeights,
)
from app.services.recommendations.schemas import (
    ProductRead,
    RecommendationFeedbackCreate,
    RecommendationRead,
)
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.schemas import SkinProfileRead

_CACHE_TTL_SECONDS = 24 * 60 * 60
_TOP_N = 3
_recommender = ContentBasedRecommender()
_suitability = RealIngredientSuitability()


async def get_active_recommendation_weights(db: AsyncSession) -> RecommendationWeights:
    result = await db.execute(
        select(RecommendationWeights).where(RecommendationWeights.is_active.is_(True))
    )
    weights = result.scalars().first()
    if weights is None:
        raise ValueError("No active recommendation_weights row — seed data is missing")
    return weights


class SuitabilityAggregate(NamedTuple):
    """Bulk sibling of products_service.py's get_product_detail per-ingredient
    evaluation loop — used by the recommendation pipeline's hard allergy filter and
    stage-4 suitability ranking signal (milestone_3.md §M3-D). `score` is "how good
    a fit" (confidence when suitable, 1-confidence when not — a high-confidence
    non-match must score low, not high, milestone_3.md §8)."""

    score: float
    any_allergy: bool
    any_unsuitable: bool


async def list_products_for_skin_type(
    db: AsyncSession, skin_type_id: int, category: str | None = None
) -> list[Product]:
    """Interface function (ADR-005) — other services (e.g. Routine Planner) read
    candidate products through this, never `products`/`product_skin_types` directly.
    Explicit `ORDER BY product_id` — routines/service.py's `_generate_routine` calls
    this with `category=None` (fetch every candidate once, filter by category in
    Python) as a real N+1 fix; without an explicit order, Postgres doesn't guarantee
    row order is identical between a category-filtered query and an unfiltered one,
    which would make `_generate_routine`'s seeded_random choice among candidates
    silently unstable depending on which query shape ran."""
    stmt = (
        select(Product)
        .join(ProductSkinType, ProductSkinType.product_id == Product.product_id)
        .where(ProductSkinType.skin_type_id == skin_type_id, Product.is_active.is_(True))
        .distinct()
        .order_by(Product.product_id)
    )
    if category:
        stmt = stmt.where(Product.category == category)
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def list_avoided_ingredient_product_ids(db: AsyncSession, skin_type_id: int) -> set[int]:
    """Interface function (ADR-005) — the hard safety filter docs/AI_ML.md's Principle
    3 requires ("allergy and avoid-ingredient exclusions are deterministic Postgres
    filters applied *before* any model ranks anything"). Joins `product_ingredients` to
    the already-seeded `ingredient_skintype_avoid` junction (backend/app/db/seed.py) —
    no new schema, just the first consumer of a table nothing previously queried."""
    stmt = (
        select(ProductIngredient.product_id)
        .join(
            IngredientSkintypeAvoid,
            IngredientSkintypeAvoid.ingredient_id == ProductIngredient.ingredient_id,
        )
        .where(IngredientSkintypeAvoid.skin_type_id == skin_type_id)
        .distinct()
    )
    result = await db.execute(stmt)
    return set(result.scalars().all())


async def list_all_products(
    db: AsyncSession, *, page: int, page_size: int
) -> tuple[list[Product], int]:
    """Interface function (ADR-005) — Admin's read-only Product Management view
    (Branch 6) reads through this, never `products` directly. Full CRUD stays M3
    scope (docs/SUGGESTIONS.md) — this is a paginated read only."""
    total = (await db.execute(select(func.count()).select_from(Product))).scalar_one()
    result = await db.execute(
        select(Product).order_by(Product.product_id).offset((page - 1) * page_size).limit(page_size)
    )
    return list(result.scalars().all()), total


async def get_product_by_name(db: AsyncSession, product_name: str) -> Product | None:
    """Interface function (ADR-005) — Milestone 2 P11's routine safety guardrail
    looks up the catalog's one seeded soothing product ("Centella Calming
    Serum") by name, independent of skin-type association (`product_skin_types`
    only links it to Sensitive skin — the guardrail must still substitute it in
    for a non-Sensitive profile with severe redness, so this can't go through
    `list_products_for_skin_type`)."""
    result = await db.execute(select(Product).where(Product.product_name == product_name))
    return result.scalars().first()


async def get_products_by_ids(db: AsyncSession, product_ids: list[int]) -> dict[int, Product]:
    """Interface function (ADR-005) — other services resolve product_id -> Product
    through this, never by importing this service's `Product` model directly."""
    if not product_ids:
        return {}
    result = await db.execute(select(Product).where(Product.product_id.in_(product_ids)))
    return {p.product_id: p for p in result.scalars().all()}


async def list_concern_ids_for_products(
    db: AsyncSession, product_ids: list[int]
) -> dict[int, list[int]]:
    """Interface function (ADR-005) — product_id -> the concern_ids it targets."""
    if not product_ids:
        return {}
    stmt = select(ProductConcern.product_id, ProductConcern.concern_id).where(
        ProductConcern.product_id.in_(product_ids)
    )
    result = await db.execute(stmt)
    mapping: dict[int, list[int]] = {}
    for product_id, concern_id in result.all():
        mapping.setdefault(product_id, []).append(concern_id)
    return mapping


async def list_ingredient_categories_for_products(
    db: AsyncSession, product_ids: list[int]
) -> dict[int, list[str]]:
    """Interface function (ADR-005) — product_id -> the `ingredients.category`
    values it contains (Retinoids, AHAs/BHAs, ...). Milestone 2 P11's routine
    safety guardrail (`routines/guardrails.py`) reads this to detect a
    harsh-actives product (Retinoids/AHAs-BHAs category) needing a soothing
    substitution — never queries `product_ingredients`/`ingredients` directly."""
    if not product_ids:
        return {}
    stmt = (
        select(ProductIngredient.product_id, Ingredient.category)
        .join(Ingredient, Ingredient.ingredient_id == ProductIngredient.ingredient_id)
        .where(ProductIngredient.product_id.in_(product_ids))
    )
    result = await db.execute(stmt)
    mapping: dict[int, list[str]] = {}
    for product_id, category in result.all():
        if category is not None:
            mapping.setdefault(product_id, []).append(category)
    return mapping


async def list_ingredient_names_for_products(
    db: AsyncSession, product_ids: list[int]
) -> dict[int, list[str]]:
    """Interface function (ADR-005) — product_id -> the `ingredients.ingredient_name`
    values it contains. Milestone 2 P12's routine interaction guardrail
    (`routines/guardrails.py`) reads this to check every generated step's product
    against the curated interaction matrix (`app/ai/interactions.py`) by real
    ingredient name — never queries `product_ingredients`/`ingredients` directly."""
    if not product_ids:
        return {}
    stmt = (
        select(ProductIngredient.product_id, Ingredient.ingredient_name)
        .join(Ingredient, Ingredient.ingredient_id == ProductIngredient.ingredient_id)
        .where(ProductIngredient.product_id.in_(product_ids))
    )
    result = await db.execute(stmt)
    mapping: dict[int, list[str]] = {}
    for product_id, ingredient_name in result.all():
        mapping.setdefault(product_id, []).append(ingredient_name)
    return mapping


async def evaluate_products_suitability(
    db: AsyncSession,
    product_ids: list[int],
    profile: SkinProfileRead,
    skin_type_name: str | None,
) -> dict[int, SuitabilityAggregate]:
    """Interface function — bulk `RealIngredientSuitability` evaluation over every
    ingredient of every candidate product in one round trip (never N+1). A product
    with no mapped ingredients gets the same 0.6 baseline confidence
    app/ai/suitability.py's "no known conflicts" case returns."""
    if not product_ids:
        return {}

    rows = (
        await db.execute(
            select(ProductIngredient.product_id, Ingredient)
            .join(Ingredient, Ingredient.ingredient_id == ProductIngredient.ingredient_id)
            .where(ProductIngredient.product_id.in_(product_ids))
        )
    ).all()
    ingredients_by_product: dict[int, list[Ingredient]] = {}
    for product_id, ingredient in rows:
        ingredients_by_product.setdefault(product_id, []).append(ingredient)

    avoid_rows = await db.execute(
        select(IngredientSkintypeAvoid.ingredient_id, IngredientSkintypeAvoid.reason).where(
            IngredientSkintypeAvoid.skin_type_id == profile.skin_type_id
        )
    )
    avoid_reason_by_ingredient = {row[0]: row[1] for row in avoid_rows.all()}

    results: dict[int, SuitabilityAggregate] = {}
    for product_id in product_ids:
        ingredients = ingredients_by_product.get(product_id, [])
        if not ingredients:
            results[product_id] = SuitabilityAggregate(
                score=0.6, any_allergy=False, any_unsuitable=False
            )
            continue

        any_allergy = False
        any_unsuitable = False
        goodness_scores: list[float] = []
        structured_allergy_ingredients = [
            (a.ingredient_id, a.ingredient_name) for a in profile.allergy_ingredients
        ]
        for ingredient in ingredients:
            result = _suitability.evaluate(
                ingredient_name=ingredient.ingredient_name,
                inci_name=ingredient.inci_name,
                skin_type_name=skin_type_name,
                allergies=profile.allergies,
                sensitivities=profile.sensitivities,
                avoid_reason=avoid_reason_by_ingredient.get(ingredient.ingredient_id),
                structured_allergy_ingredients=structured_allergy_ingredients,
                candidate_ingredient_id=ingredient.ingredient_id,
            )
            any_allergy = any_allergy or result.allergy_flag
            any_unsuitable = any_unsuitable or not result.suitable
            goodness = result.confidence if result.suitable else (1 - result.confidence)
            goodness_scores.append(goodness)

        results[product_id] = SuitabilityAggregate(
            score=min(goodness_scores), any_allergy=any_allergy, any_unsuitable=any_unsuitable
        )
    return results


async def _get_budget_preference(user_id: str) -> tuple[float, float] | None:
    """Mongo `user_preferences` (schema #4) — a real documented collection with no
    writer anywhere in this app yet (M3-D is only its first *reader*); absent
    gracefully rather than fabricated (AGENTS.md §0.2), same spirit as a cold-start
    user with no interaction history."""
    doc = await get_mongo_db()["user_preferences"].find_one({"user_id": user_id})
    if not doc:
        return None
    budget = doc.get("preferred_budget")
    if not budget or budget.get("min") is None or budget.get("max") is None:
        return None
    return float(budget["min"]), float(budget["max"])


def _price_fit(price: float | None, budget: tuple[float, float] | None) -> float:
    """0.5 (neutral, no signal either way) when there's no price or no registered
    budget preference — not a penalty or a boost, since neither fact was observed."""
    if price is None or budget is None:
        return 0.5
    budget_min, budget_max = budget
    if budget_min <= price <= budget_max:
        return 1.0
    distance = budget_min - price if price < budget_min else price - budget_max
    span = max(budget_max - budget_min, budget_max, 1.0)
    return max(0.0, 1.0 - distance / span)


async def _persist_recommendations(
    db: AsyncSession, user_id: str, served: list[tuple[float, Product, list[str]]]
) -> None:
    """`product_recommendations` (no DDL change, M3-D's first real writer,
    milestone_3.md §5) — append-only per served set, an audit trail for
    consultants/admin, not an upsert-replaced "current" row."""
    for score, product, reasons in served:
        db.add(
            ProductRecommendation(
                user_id=user_id,
                product_id=product.product_id,
                recommendation_score=score,
                recommendation_reason="; ".join(reasons),
            )
        )
    await db.commit()


async def get_recommendations(db: AsyncSession, user_id: str) -> list[RecommendationRead]:
    """Recommender v2 (M3-D, milestone_3.md §2/§8) — the five-stage pipeline:
    1. Relational pre-filter (skin-type match + two hard safety filters: the
       skin-type-avoid junction, then per-ingredient free-text allergy match —
       an allergy/avoid-flagged product can never reach ranking, regardless of how
       well it would otherwise score).
    2. Vector similarity — FAISS `user_profiles` namespace query vector (the
       worker's already-projected profile embedding, never computed request-path)
       against the `products` namespace, restricted to stage-1 survivors. Skipped
       (all candidates get a neutral 0 signal) if no profile vector is indexed yet
       — a documented degrade, not an error (milestone_3.md §8).
    3. Budget preference from Mongo `user_preferences` (absent gracefully — no
       writer exists for it yet anywhere in the app).
    4. Rank — `ContentBasedRecommender`'s documented weighted formula
       (app/ai/recommender.py).
    5. Serve + Redis cache (`recommendation:cache:{user_id}`, TTL 24h; invalidated
       on profile save, skin_profile/service.py) + persist the served set to PG
       `product_recommendations` (M3-D's first real writer, milestone_3.md §5)."""
    redis = get_redis()
    cache_key = f"recommendation:cache:{user_id}"
    cached = await redis.get(cache_key)
    if cached:
        return [RecommendationRead.model_validate(item) for item in json.loads(cached)]

    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is None:
        return []

    all_skin_types = await skin_profile_service.list_skin_types(db)
    skin_types = {t.skin_type_id: t.skin_type_name for t in all_skin_types}
    all_concerns = await skin_profile_service.list_skin_concerns(db)
    concern_names = {c.concern_id: c.concern_name for c in all_concerns}
    skin_type_name = skin_types.get(profile.skin_type_id, "your")
    concern_ids = {c.concern_id for c in profile.concerns}

    # --- Stage 1: relational pre-filter (hard filters first) ---
    products = await list_products_for_skin_type(db, profile.skin_type_id)
    if not products:
        return []

    avoided_product_ids = await list_avoided_ingredient_product_ids(db, profile.skin_type_id)
    products = [p for p in products if p.product_id not in avoided_product_ids]
    if not products:
        return []

    suitability = await evaluate_products_suitability(
        db, [p.product_id for p in products], profile, skin_type_name
    )
    # An allergy match can never appear, however well it would otherwise score
    # (milestone_3.md §M3-D acceptance criteria — a release-blocking property, not
    # a metric).
    products = [p for p in products if not suitability[p.product_id].any_allergy]
    if not products:
        return []

    product_concerns = await list_concern_ids_for_products(db, [p.product_id for p in products])

    # --- Stage 2: vector similarity (metadata-filtered to stage-1 survivors) ---
    stage1_ids = {p.product_id for p in products}
    vector_similarity: dict[int, float] = {}
    query_vector = vector_db.get_vector("user_profiles", f"user_{user_id}")
    if query_vector is not None:
        search_results = vector_db.search(
            "products", query_vector, k=max(len(products) * 2, 50), dim=len(query_vector)
        )
        for result in search_results:
            vector_id = result["vector_id"]
            if not vector_id.startswith("product_"):
                continue
            product_id = int(vector_id.removeprefix("product_"))
            if product_id in stage1_ids:
                vector_similarity[product_id] = max(0.0, min(1.0, result["score"]))
    # else: no profile vector indexed yet (e.g. the worker hasn't processed the
    # profile's outbox row) — every candidate gets a neutral 0 vector_similarity,
    # stage 2 simply contributes nothing rather than blocking the pipeline.

    # --- Stage 3: budget preference (Mongo user_preferences) ---
    budget = await _get_budget_preference(user_id)

    # --- Stage 4: rank ---
    max_review_count = max((p.review_count or 0 for p in products), default=0)
    ranked: list[tuple[float, Product, list[str]]] = []
    for product in products:
        agg = suitability[product.product_id]
        product_concern_ids = product_concerns.get(product.product_id, [])
        matched = [cid for cid in product_concern_ids if cid in concern_ids]
        concern_overlap = len(matched) / len(concern_ids) if concern_ids else 0.0

        price = float(product.price) if product.price is not None else None
        rating_norm = float(product.rating) / 5.0 if product.rating is not None else 0.5
        popularity_norm = (
            math.log1p(product.review_count) / math.log1p(max_review_count)
            if product.review_count and max_review_count
            else 0.0
        )

        features = RecommendationFeatures(
            suitability=agg.score,
            concern_overlap=concern_overlap,
            vector_similarity=vector_similarity.get(product.product_id, 0.0),
            rating_norm=rating_norm,
            price_fit=_price_fit(price, budget),
            popularity_norm=popularity_norm,
        )
        match_score = _recommender.score(features)

        reasons = [f"Suits your {skin_type_name} skin type"]
        reasons += [f"Targets {concern_names[cid]}" for cid in matched if cid in concern_names]
        if agg.any_unsuitable:
            reasons.append(
                "Contains an ingredient flagged for your sensitivities — check before use."
            )
        ranked.append((match_score, product, reasons))

    # jitter-free, deterministic tiebreak on product_id (stable, unlike ADR-007's
    # hash(user_id) jitter the old stub used — real signals no longer need one).
    ranked.sort(key=lambda row: (row[0], -row[1].product_id), reverse=True)
    served = ranked[:_TOP_N]

    # --- Stage 5: serve + cache + persist ---
    results = [
        RecommendationRead(
            product=ProductRead.model_validate(product), match_score=score, reasons=reasons
        )
        for score, product, reasons in served
    ]

    await redis.set(cache_key, json.dumps([r.model_dump() for r in results]), ex=_CACHE_TTL_SECONDS)
    await _persist_recommendations(db, user_id, served)
    return results


async def submit_feedback(user_id: str, feedback: RecommendationFeedbackCreate) -> None:
    """Mongo `recommendation_feedback` (schema #9, M3-D) — the future ranking-label
    stream (AI_ML.md "Feedback loop"). Single writer: this service. No cross-store
    validation of `product_id`/`recommendation_id` — a label stream tolerates
    referencing an id that's since aged out, the same way `audit_logs` doesn't
    re-verify a target still exists."""
    await get_mongo_db()["recommendation_feedback"].insert_one(
        {
            "user_id": user_id,
            "product_id": feedback.product_id,
            "recommendation_id": feedback.recommendation_id,
            "action": feedback.action,
            "created_at": datetime.datetime.now(datetime.UTC),
        }
    )
