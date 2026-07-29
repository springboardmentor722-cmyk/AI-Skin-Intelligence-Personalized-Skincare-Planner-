from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.suitability import RealIngredientSuitability
from app.db import vector as vector_db
from app.db.elasticsearch import get_elasticsearch, is_elasticsearch_available
from app.services.ingredients.models import Ingredient, IngredientSkintypeAvoid
from app.services.recommendations.models import (
    Product,
    ProductConcern,
    ProductIngredient,
    ProductSkinType,
)
from app.services.recommendations.schemas import (
    ProductAlternativesRead,
    ProductCompareItem,
    ProductCompareRead,
    ProductDetail,
    ProductIngredientAnnotation,
    ProductListMeta,
    ProductListPage,
    ProductRead,
)
from app.services.recommendations.service import (
    evaluate_products_suitability,
    list_avoided_ingredient_product_ids,
    list_concern_ids_for_products,
)
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.models import SkinConcern, SkinType

_suitability = RealIngredientSuitability()
_BUDGET_BAND = 0.3  # +/-30% of the target's price — "budget-band aware" (milestone_3.md §3)
_MAX_ALTERNATIVES = 10


async def list_products(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    q: str | None,
    category: str | None,
    brand: str | None,
    budget_min: float | None,
    budget_max: float | None,
    skin_type: str | None,
) -> ProductListPage:
    """ES-backed search + category/brand/budget/skin-type filters, `is_active` only.
    Degrades to a PG fallback when ES is down (stated in `meta.source`, never
    silent — same pattern as ingredients, M3-B)."""
    if await is_elasticsearch_available():
        try:
            return await _list_via_es(
                page=page,
                page_size=page_size,
                q=q,
                category=category,
                brand=brand,
                budget_min=budget_min,
                budget_max=budget_max,
                skin_type=skin_type,
            )
        except Exception:
            pass
    return await _list_via_pg(
        db,
        page=page,
        page_size=page_size,
        q=q,
        category=category,
        brand=brand,
        budget_min=budget_min,
        budget_max=budget_max,
        skin_type=skin_type,
    )


def _product_read_from_es_source(source: dict[str, Any]) -> ProductRead:
    return ProductRead(
        product_id=source["product_id"],
        brand_name=source.get("brand_name"),
        product_name=source.get("product_name"),
        category=source.get("category"),
        image_url=None,  # not part of products_index's documented mapping
        price=source.get("price"),
        currency=source.get("currency"),
        spf_rating=source.get("spf_rating"),
        rating=source.get("rating"),
        review_count=source.get("review_count"),
    )


async def _list_via_es(
    *,
    page: int,
    page_size: int,
    q: str | None,
    category: str | None,
    brand: str | None,
    budget_min: float | None,
    budget_max: float | None,
    skin_type: str | None,
) -> ProductListPage:
    es = get_elasticsearch()
    must: list[dict[str, Any]] = (
        [{"multi_match": {"query": q, "fields": ["product_name", "brand_name", "ingredients"]}}]
        if q
        else [{"match_all": {}}]
    )
    filter_: list[dict[str, Any]] = [{"term": {"is_active": True}}]
    if category:
        filter_.append({"term": {"category": category}})
    if brand:
        filter_.append({"term": {"brand_name.raw": brand}})
    if skin_type:
        filter_.append({"term": {"skin_types_supported": skin_type}})
    if budget_min is not None or budget_max is not None:
        price_range: dict[str, float] = {}
        if budget_min is not None:
            price_range["gte"] = budget_min
        if budget_max is not None:
            price_range["lte"] = budget_max
        filter_.append({"range": {"price": price_range}})

    result = await es.search(
        index="products_index",
        query={"bool": {"must": must, "filter": filter_}},
        from_=(page - 1) * page_size,
        size=page_size,
        sort=[{"product_name.raw": "asc"}],
    )
    total = result["hits"]["total"]["value"]
    items = [_product_read_from_es_source(hit["_source"]) for hit in result["hits"]["hits"]]
    return ProductListPage(
        items=items,
        meta=ProductListMeta(page=page, page_size=page_size, total=total, source="elasticsearch"),
    )


async def _list_via_pg(
    db: AsyncSession,
    *,
    page: int,
    page_size: int,
    q: str | None,
    category: str | None,
    brand: str | None,
    budget_min: float | None,
    budget_max: float | None,
    skin_type: str | None,
) -> ProductListPage:
    query = select(Product).where(Product.is_active.is_(True))
    if category:
        query = query.where(Product.category == category)
    if brand:
        query = query.where(Product.brand_name == brand)
    if budget_min is not None:
        query = query.where(Product.price >= budget_min)
    if budget_max is not None:
        query = query.where(Product.price <= budget_max)
    if skin_type:
        query = (
            query.join(ProductSkinType, ProductSkinType.product_id == Product.product_id)
            .join(SkinType, SkinType.skin_type_id == ProductSkinType.skin_type_id)
            .where(SkinType.skin_type_name == skin_type)
        )
    if q:
        pattern = f"%{q}%"
        query = query.where(
            or_(Product.product_name.ilike(pattern), Product.brand_name.ilike(pattern))
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(Product.product_name).offset((page - 1) * page_size).limit(page_size)
    )
    items = [ProductRead.model_validate(p) for p in result.scalars().all()]
    return ProductListPage(
        items=items,
        meta=ProductListMeta(page=page, page_size=page_size, total=total, source="fallback"),
    )


async def get_product_detail(
    db: AsyncSession, product_id: int, user_id: str
) -> ProductDetail | None:
    product = await db.get(Product, product_id)
    if product is None:
        return None

    ingredient_rows = (
        (
            await db.execute(
                select(Ingredient)
                .join(
                    ProductIngredient,
                    ProductIngredient.ingredient_id == Ingredient.ingredient_id,
                )
                .where(ProductIngredient.product_id == product_id)
            )
        )
        .scalars()
        .all()
    )

    profile = await skin_profile_service.get_current_profile(db, user_id)
    skin_type_name: str | None = None
    allergies: str | None = None
    sensitivities: str | None = None
    avoid_reason_by_ingredient: dict[int, str | None] = {}

    if profile is not None:
        allergies = profile.allergies
        sensitivities = profile.sensitivities
        if profile.skin_type_id is not None:
            skin_type = await db.get(SkinType, profile.skin_type_id)
            skin_type_name = skin_type.skin_type_name if skin_type else None
            avoid_rows = await db.execute(
                select(IngredientSkintypeAvoid.ingredient_id, IngredientSkintypeAvoid.reason).where(
                    IngredientSkintypeAvoid.skin_type_id == profile.skin_type_id
                )
            )
            avoid_reason_by_ingredient = {row[0]: row[1] for row in avoid_rows.all()}

    annotations: list[ProductIngredientAnnotation] = []
    any_allergy = False
    any_avoid = False
    confidences: list[float] = []
    for ingredient in ingredient_rows:
        result = _suitability.evaluate(
            ingredient_name=ingredient.ingredient_name,
            inci_name=ingredient.inci_name,
            skin_type_name=skin_type_name,
            allergies=allergies,
            sensitivities=sensitivities,
            avoid_reason=avoid_reason_by_ingredient.get(ingredient.ingredient_id),
        )
        any_allergy = any_allergy or result.allergy_flag
        any_avoid = any_avoid or result.avoid_flag
        confidences.append(result.confidence)
        annotations.append(
            ProductIngredientAnnotation(
                ingredient_id=ingredient.ingredient_id,
                ingredient_name=ingredient.ingredient_name,
                avoid_flag=result.avoid_flag,
                allergy_flag=result.allergy_flag,
                reason=(
                    result.reasons[0]
                    if result.reasons and (result.allergy_flag or result.avoid_flag)
                    else None
                ),
            )
        )

    suitable = None if profile is None else not (any_allergy or any_avoid)
    suitability_confidence = None if profile is None else (min(confidences) if confidences else 0.6)

    return ProductDetail(
        product_id=product.product_id,
        brand_name=product.brand_name,
        product_name=product.product_name,
        category=product.category,
        product_url=product.product_url,
        image_url=product.image_url,
        price=float(product.price) if product.price is not None else None,
        currency=product.currency,
        volume_ml=product.volume_ml,
        spf_rating=product.spf_rating,
        rating=float(product.rating) if product.rating is not None else None,
        review_count=product.review_count,
        is_active=product.is_active,
        ingredients=annotations,
        suitable=suitable,
        suitability_confidence=suitability_confidence,
    )


async def compare_products(db: AsyncSession, product_ids: list[int]) -> ProductCompareRead:
    products = (
        (await db.execute(select(Product).where(Product.product_id.in_(product_ids))))
        .scalars()
        .all()
    )
    by_id = {p.product_id: p for p in products}

    items: list[ProductCompareItem] = []
    for product_id in product_ids:
        product = by_id.get(product_id)
        if product is None:
            continue
        ingredient_names = (
            (
                await db.execute(
                    select(Ingredient.ingredient_name)
                    .join(
                        ProductIngredient,
                        ProductIngredient.ingredient_id == Ingredient.ingredient_id,
                    )
                    .where(ProductIngredient.product_id == product_id)
                )
            )
            .scalars()
            .all()
        )
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
        items.append(
            ProductCompareItem(
                product=ProductRead.model_validate(product),
                ingredient_names=[name for name in ingredient_names if name is not None],
                skin_types_supported=[name for name in skin_types if name is not None],
                concerns_supported=[name for name in concerns if name is not None],
            )
        )
    return ProductCompareRead(items=items)


async def get_alternatives(
    db: AsyncSession, product_id: int, user_id: str
) -> ProductAlternativesRead:
    """Same category + budget-band (+/-30%) hard filters, overlapping-concerns
    primary sort, vector-nearest secondary sort/tiebreak, avoid-flagged products
    hard-excluded for the current user's skin type. Uses the *already-projected*
    embedding (app/db/vector.py's get_vector) as the query vector — never computes
    one on the request path (M3-A/M3 spec §8)."""
    target = await db.get(Product, product_id)
    if target is None:
        return ProductAlternativesRead(alternatives=[])

    query = select(Product).where(
        Product.category == target.category,
        Product.product_id != product_id,
        Product.is_active.is_(True),
    )
    if target.price is not None:
        price = float(target.price)
        query = query.where(
            Product.price.between(price * (1 - _BUDGET_BAND), price * (1 + _BUDGET_BAND))
        )
    candidates = (await db.execute(query)).scalars().all()
    if not candidates:
        return ProductAlternativesRead(alternatives=[])

    profile = await skin_profile_service.get_current_profile(db, user_id)
    if profile is not None:
        avoided_ids = await list_avoided_ingredient_product_ids(db, profile.skin_type_id)
        candidates = [c for c in candidates if c.product_id not in avoided_ids]
        if candidates:
            suitability = await evaluate_products_suitability(
                db, [c.product_id for c in candidates], profile, None
            )
            candidates = [c for c in candidates if not suitability[c.product_id].any_allergy]
    if not candidates:
        return ProductAlternativesRead(alternatives=[])

    concerns_by_product = await list_concern_ids_for_products(
        db, [target.product_id, *[c.product_id for c in candidates]]
    )
    target_concern_ids = set(concerns_by_product.get(target.product_id, []))

    vector_rank: dict[int, int] = {}
    query_vector = vector_db.get_vector("products", f"product_{product_id}")
    if query_vector is not None:
        results = vector_db.search(
            "products", query_vector, k=len(candidates) + 1, dim=len(query_vector)
        )
        for rank, result in enumerate(results):
            vector_id = result["vector_id"]
            if vector_id.startswith("product_"):
                vector_rank[int(vector_id.removeprefix("product_"))] = rank

    def sort_key(candidate: Product) -> tuple[int, int]:
        overlap = len(target_concern_ids & set(concerns_by_product.get(candidate.product_id, [])))
        rank = vector_rank.get(candidate.product_id, len(candidates))
        return (-overlap, rank)

    ordered = sorted(candidates, key=sort_key)[:_MAX_ALTERNATIVES]
    return ProductAlternativesRead(alternatives=[ProductRead.model_validate(p) for p in ordered])
