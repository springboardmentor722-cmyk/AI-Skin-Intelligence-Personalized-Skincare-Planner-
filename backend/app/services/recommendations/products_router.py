from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.recommendations import products_service
from app.services.recommendations.schemas import (
    ProductAlternativesRead,
    ProductCompareRead,
    ProductDetail,
    ProductListPage,
)

router = APIRouter()

# Catalog browsing is open to every signed-in role; detail/compare/alternatives carry
# per-user annotations (avoid/allergy/suitability) so they're user-scoped
# (milestone_3.md §6's API table — literal per-endpoint role column).
_ANY_SIGNED_IN = ("user", "consultant", "dermatologist", "admin")

_MIN_COMPARE_IDS = 2
_MAX_COMPARE_IDS = 3


def _parse_ids(ids: str, *, min_count: int, max_count: int) -> list[int]:
    try:
        parsed = [int(part) for part in ids.split(",") if part.strip()]
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "ids must be integers") from exc
    if not min_count <= len(parsed) <= max_count:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT,
            f"ids must contain between {min_count} and {max_count} values",
        )
    return parsed


@router.get("/products")
async def list_products(
    user: Annotated[dict[str, Any], Depends(require_role(*_ANY_SIGNED_IN))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    q: str | None = None,
    category: str | None = None,
    brand: str | None = None,
    budget_min: float | None = None,
    budget_max: float | None = None,
    skin_type: str | None = None,
) -> ProductListPage:
    return await products_service.list_products(
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


@router.get("/products/compare")
async def compare_products(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    ids: Annotated[str, Query()],
) -> ProductCompareRead:
    parsed_ids = _parse_ids(ids, min_count=_MIN_COMPARE_IDS, max_count=_MAX_COMPARE_IDS)
    result = await products_service.compare_products(db, parsed_ids)
    if len(result.items) != len(parsed_ids):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "One or more products not found")
    return result


@router.get("/products/{product_id}/alternatives")
async def get_alternatives(
    product_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductAlternativesRead:
    return await products_service.get_alternatives(db, product_id, user["id"])


@router.get("/products/{product_id}")
async def get_product(
    product_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProductDetail:
    detail = await products_service.get_product_detail(db, product_id, user["id"])
    if detail is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return detail
