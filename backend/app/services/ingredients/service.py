from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ingredients.models import Ingredient

# First real function this service has ever had (models.py's own docstring: "no
# router/service.py yet — the service's API surface is M3 scope"). This one function
# doesn't change that — it's a narrow, paginated read for Admin's read-only Ingredient
# Management view (Branch 6), not the real Ingredient Intelligence API surface (no
# suitability/interaction/allergy logic here). Full CRUD + that real API stays M3.


async def list_all_ingredients(
    db: AsyncSession, *, page: int, page_size: int
) -> tuple[list[Ingredient], int]:
    total = (await db.execute(select(func.count()).select_from(Ingredient))).scalar_one()
    result = await db.execute(
        select(Ingredient)
        .order_by(Ingredient.ingredient_id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    return list(result.scalars().all()), total
