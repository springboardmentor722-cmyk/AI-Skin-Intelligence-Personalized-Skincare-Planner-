"""Branch 6 (feature/admin-panel) — the one real function ingredients/service.py has
(models.py's own docstring: "no router/service.py yet — M3 scope"). This narrow,
paginated read backs Admin's read-only Ingredient Management view only; it isn't the
real Ingredient Intelligence API surface. Real Postgres round trip via
tests/conftest.py's rollback-wrapped `db_session` — the seeded `ingredients` table
already has real rows, so this also exercises real data, not just throwaway inserts.
"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.ingredients.service import list_all_ingredients


async def test_list_all_ingredients_paginates_over_real_seeded_data(
    db_session: AsyncSession,
) -> None:
    page_one, total = await list_all_ingredients(db_session, page=1, page_size=2)

    assert total >= len(page_one)
    assert len(page_one) <= 2
    if total > 2:
        page_two, _total = await list_all_ingredients(db_session, page=2, page_size=2)
        assert {i.ingredient_id for i in page_one}.isdisjoint({i.ingredient_id for i in page_two})
