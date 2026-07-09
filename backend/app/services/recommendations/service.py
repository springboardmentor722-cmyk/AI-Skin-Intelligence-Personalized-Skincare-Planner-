import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.seeding import seeded_random
from app.db.redis import get_redis
from app.services.recommendations.models import Product, ProductConcern, ProductSkinType
from app.services.recommendations.schemas import ProductRead, RecommendationRead
from app.services.skin_profile import service as skin_profile_service

_CACHE_TTL_SECONDS = 24 * 60 * 60
_TOP_N = 3


async def list_products_for_skin_type(
    db: AsyncSession, skin_type_id: int, category: str | None = None
) -> list[Product]:
    """Interface function (ADR-005) — other services (e.g. Routine Planner) read
    candidate products through this, never `products`/`product_skin_types` directly."""
    stmt = (
        select(Product)
        .join(ProductSkinType, ProductSkinType.product_id == Product.product_id)
        .where(ProductSkinType.skin_type_id == skin_type_id, Product.is_active.is_(True))
        .distinct()
    )
    if category:
        stmt = stmt.where(Product.category == category)
    result = await db.execute(stmt)
    return list(result.scalars().all())


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


async def get_recommendations(db: AsyncSession, user_id: str) -> list[RecommendationRead]:
    """Stub Recommender (ADR-007, docs/AI_ML.md): filters by skin type + concern
    junctions, emits real reasons[]. docs/AI_ML.md's stub semantics say "sorts by
    rating" — the live `products` table (database_schemas/...sql) has no rating
    column, so ranking instead uses concern-overlap count (a real relational signal)
    with a `hash(user_id)`-seeded tiebreak, matching ADR-007's determinism
    requirement without inventing a schema column. Cached in Redis
    (`recommendation:cache:{user_id}`, TTL 24h) per docs/AI_ML.md's recommendation
    pipeline; invalidated on profile save (skin_profile/service.py)."""
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

    products = await list_products_for_skin_type(db, profile.skin_type_id)
    if not products:
        return []

    product_concerns = await list_concern_ids_for_products(db, [p.product_id for p in products])

    ranked: list[tuple[float, Product, list[str]]] = []
    for product in products:
        product_concern_ids = product_concerns.get(product.product_id, [])
        matched = [cid for cid in product_concern_ids if cid in concern_ids]
        jitter = seeded_random(user_id, "recommendations", str(product.product_id)).uniform(0, 5)
        match_score = round(min(95.0, 55.0 + len(matched) * 12.0 + jitter), 1)
        reasons = [f"Suits your {skin_type_name} skin type"]
        reasons += [f"Targets {concern_names[cid]}" for cid in matched if cid in concern_names]
        ranked.append((match_score, product, reasons))

    ranked.sort(key=lambda row: row[0], reverse=True)

    results = [
        RecommendationRead(
            product=ProductRead.model_validate(product), match_score=score, reasons=reasons
        )
        for score, product, reasons in ranked[:_TOP_N]
    ]

    await redis.set(cache_key, json.dumps([r.model_dump() for r in results]), ex=_CACHE_TTL_SECONDS)
    return results
