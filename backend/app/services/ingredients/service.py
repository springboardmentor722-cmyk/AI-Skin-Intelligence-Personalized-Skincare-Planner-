from typing import Any

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.interactions import get_interaction
from app.ai.suitability import RealIngredientSuitability
from app.db.elasticsearch import get_elasticsearch, is_elasticsearch_available
from app.services.ingredients.models import (
    Ingredient,
    IngredientConcernTreats,
    IngredientSkintypeAvoid,
)
from app.services.ingredients.schemas import (
    AvoidForSkinType,
    ConcernTreated,
    EducationSnippet,
    IngredientDetail,
    IngredientListMeta,
    IngredientListPage,
    IngredientRead,
    InteractionPair,
    InteractionsRead,
    SuitabilityRead,
)
from app.services.recommendations.models import Product, ProductIngredient
from app.services.recommendations.schemas import ProductRead
from app.services.skin_profile import service as skin_profile_service
from app.services.skin_profile.models import SkinConcern, SkinType

_suitability = RealIngredientSuitability()


async def list_all_ingredients(
    db: AsyncSession, *, page: int, page_size: int
) -> tuple[list[Ingredient], int]:
    """First real function this service ever had (models.py's own docstring). A
    narrow, paginated read for Admin's read-only Ingredient Management view — not
    the real Ingredient Intelligence API surface (no suitability/interaction/
    allergy logic here)."""
    total = (await db.execute(select(func.count()).select_from(Ingredient))).scalar_one()
    result = await db.execute(
        select(Ingredient)
        .order_by(Ingredient.ingredient_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total


async def list_ingredients(
    db: AsyncSession, *, page: int, page_size: int, category: str | None, q: str | None
) -> IngredientListPage:
    """ES-backed search + category filter; degrades to a PG ILIKE fallback when ES is
    down (the fallback is stated in the response envelope's `meta.source`, never
    silent — milestone_3.md §6)."""
    if await is_elasticsearch_available():
        try:
            return await _list_via_es(page=page, page_size=page_size, category=category, q=q)
        except Exception:
            pass
    return await _list_via_pg(db, page=page, page_size=page_size, category=category, q=q)


async def _list_via_es(
    *, page: int, page_size: int, category: str | None, q: str | None
) -> IngredientListPage:
    es = get_elasticsearch()
    must: list[dict[str, Any]] = (
        [{"multi_match": {"query": q, "fields": ["ingredient_name", "inci_name"]}}]
        if q
        else [{"match_all": {}}]
    )
    filter_: list[dict[str, Any]] = [{"term": {"category": category}}] if category else []
    result = await es.search(
        index="ingredients_index",
        query={"bool": {"must": must, "filter": filter_}},
        from_=(page - 1) * page_size,
        size=page_size,
        sort=[{"ingredient_name.raw": "asc"}],
    )
    total = result["hits"]["total"]["value"]
    items = [
        IngredientRead(
            ingredient_id=hit["_source"]["ingredient_id"],
            ingredient_name=hit["_source"]["ingredient_name"],
            inci_name=hit["_source"].get("inci_name"),
            category=hit["_source"].get("category"),
            is_active=None,  # not part of ingredients_index's documented mapping
            created_at=None,
        )
        for hit in result["hits"]["hits"]
    ]
    return IngredientListPage(
        items=items,
        meta=IngredientListMeta(
            page=page, page_size=page_size, total=total, source="elasticsearch"
        ),
    )


async def _list_via_pg(
    db: AsyncSession, *, page: int, page_size: int, category: str | None, q: str | None
) -> IngredientListPage:
    query = select(Ingredient)
    if category:
        query = query.where(Ingredient.category == category)
    if q:
        pattern = f"%{q}%"
        query = query.where(
            or_(Ingredient.ingredient_name.ilike(pattern), Ingredient.inci_name.ilike(pattern))
        )

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar_one()
    result = await db.execute(
        query.order_by(Ingredient.ingredient_name).offset((page - 1) * page_size).limit(page_size)
    )
    items = [IngredientRead.model_validate(i) for i in result.scalars().all()]
    return IngredientListPage(
        items=items,
        meta=IngredientListMeta(page=page, page_size=page_size, total=total, source="fallback"),
    )


async def get_ingredient_detail(
    db: AsyncSession, mongo: Any, ingredient_id: int
) -> IngredientDetail | None:
    ingredient = await db.get(Ingredient, ingredient_id)
    if ingredient is None:
        return None

    treats_rows = (
        await db.execute(
            select(
                IngredientConcernTreats.concern_id,
                SkinConcern.concern_name,
                IngredientConcernTreats.evidence_strength,
            )
            .join(SkinConcern, SkinConcern.concern_id == IngredientConcernTreats.concern_id)
            .where(IngredientConcernTreats.ingredient_id == ingredient_id)
        )
    ).all()
    avoid_rows = (
        await db.execute(
            select(
                IngredientSkintypeAvoid.skin_type_id,
                SkinType.skin_type_name,
                IngredientSkintypeAvoid.reason,
            )
            .join(SkinType, SkinType.skin_type_id == IngredientSkintypeAvoid.skin_type_id)
            .where(IngredientSkintypeAvoid.ingredient_id == ingredient_id)
        )
    ).all()
    products = (
        (
            await db.execute(
                select(Product)
                .join(ProductIngredient, ProductIngredient.product_id == Product.product_id)
                .where(
                    ProductIngredient.ingredient_id == ingredient_id,
                    Product.is_active.is_(True),
                )
                .limit(12)
            )
        )
        .scalars()
        .all()
    )

    education: list[EducationSnippet] = []
    if mongo is not None:
        cursor = mongo["knowledge_articles"].find(
            {"related_ingredients": ingredient.ingredient_name}
        ).limit(5)
        async for article in cursor:
            education.append(
                EducationSnippet(
                    article_id=article["article_id"],
                    title=article.get("title"),
                    summary=article.get("summary"),
                    source=article.get("source"),
                )
            )

    return IngredientDetail(
        ingredient_id=ingredient.ingredient_id,
        ingredient_name=ingredient.ingredient_name,
        inci_name=ingredient.inci_name,
        category=ingredient.category,
        is_active=ingredient.is_active,
        treats_concerns=[
            ConcernTreated(concern_id=r[0], concern_name=r[1], evidence_strength=r[2])
            for r in treats_rows
        ],
        avoid_for_skin_types=[
            AvoidForSkinType(skin_type_id=r[0], skin_type_name=r[1], reason=r[2])
            for r in avoid_rows
        ],
        products=[ProductRead.model_validate(p) for p in products],
        education=education,
    )


async def get_suitability_for_user(
    db: AsyncSession, ingredient_id: int, user_id: str
) -> SuitabilityRead | None:
    ingredient = await db.get(Ingredient, ingredient_id)
    if ingredient is None:
        return None

    profile = await skin_profile_service.get_current_profile(db, user_id)
    skin_type_name: str | None = None
    avoid_reason: str | None = None
    allergies: str | None = None
    sensitivities: str | None = None

    if profile is not None:
        allergies = profile.allergies
        sensitivities = profile.sensitivities
        if profile.skin_type_id is not None:
            skin_type = await db.get(SkinType, profile.skin_type_id)
            skin_type_name = skin_type.skin_type_name if skin_type else None
            avoid_reason = (
                await db.execute(
                    select(IngredientSkintypeAvoid.reason).where(
                        IngredientSkintypeAvoid.ingredient_id == ingredient_id,
                        IngredientSkintypeAvoid.skin_type_id == profile.skin_type_id,
                    )
                )
            ).scalar_one_or_none()

    result = _suitability.evaluate(
        ingredient_name=ingredient.ingredient_name,
        inci_name=ingredient.inci_name,
        skin_type_name=skin_type_name,
        allergies=allergies,
        sensitivities=sensitivities,
        avoid_reason=avoid_reason,
    )
    return SuitabilityRead(ingredient_id=ingredient_id, **result.model_dump())


async def get_interactions_for_ids(db: AsyncSession, ids: list[int]) -> InteractionsRead:
    rows = (
        (await db.execute(select(Ingredient).where(Ingredient.ingredient_id.in_(ids))))
        .scalars()
        .all()
    )
    by_id = {row.ingredient_id: row for row in rows}

    pairs: list[InteractionPair] = []
    for index, id_a in enumerate(ids):
        for id_b in ids[index + 1 :]:
            ingredient_a, ingredient_b = by_id.get(id_a), by_id.get(id_b)
            if ingredient_a is None or ingredient_b is None:
                continue
            interaction = get_interaction(
                ingredient_a.ingredient_name, ingredient_b.ingredient_name
            )
            pairs.append(
                InteractionPair(
                    ingredient_id_a=id_a,
                    ingredient_id_b=id_b,
                    ingredient_name_a=ingredient_a.ingredient_name,
                    ingredient_name_b=ingredient_b.ingredient_name,
                    verdict=interaction["verdict"] if interaction else "unknown",
                    reason=interaction["reason"] if interaction else None,
                )
            )
    return InteractionsRead(pairs=pairs)
