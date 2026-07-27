from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.mongo import get_mongo_db
from app.db.postgres import get_db
from app.services.clinical_review import service as clinical_review_service
from app.services.ingredients import service
from app.services.ingredients.schemas import (
    IngredientDetail,
    IngredientListPage,
    InteractionsRead,
    SafetyScoreRead,
    SafetyScoreRequest,
    SuitabilityRead,
)

router = APIRouter()

# Browsing/education is open to every signed-in role (PDF Module 5 serves
# professionals too); only the per-profile suitability read is user-scoped.
_ANY_SIGNED_IN = ("user", "consultant", "dermatologist", "admin")


@router.get("/ingredients")
async def list_ingredients(
    user: Annotated[dict[str, Any], Depends(require_role(*_ANY_SIGNED_IN))],
    db: Annotated[AsyncSession, Depends(get_db)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    category: str | None = None,
    q: str | None = None,
) -> IngredientListPage:
    return await service.list_ingredients(
        db, page=page, page_size=page_size, category=category, q=q
    )


@router.get("/ingredients/interactions")
async def get_interactions(
    user: Annotated[dict[str, Any], Depends(require_role(*_ANY_SIGNED_IN))],
    db: Annotated[AsyncSession, Depends(get_db)],
    ids: Annotated[str, Query()],
) -> InteractionsRead:
    try:
        parsed_ids = [int(part) for part in ids.split(",") if part.strip()]
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "ids must be integers") from exc

    if not 2 <= len(parsed_ids) <= 5:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_CONTENT, "ids must contain between 2 and 5 values"
        )

    return await service.get_interactions_for_ids(db, parsed_ids)


@router.get("/ingredients/{ingredient_id}/suitability/me")
async def get_my_suitability(
    ingredient_id: int,
    # Per-profile suitability is a `user`-role feature (ARCHITECTURE.md §2) —
    # consultant/dermatologist/admin accounts have no skin profile of their own.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> SuitabilityRead:
    result = await service.get_suitability_for_user(db, ingredient_id, user["id"])
    if result is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ingredient not found")
    return result


@router.post("/ingredients/safety-score")
async def get_safety_score(
    payload: SafetyScoreRequest,
    user: Annotated[
        dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))
    ],
    db: Annotated[AsyncSession, Depends(get_db)],
    client_user_id: Annotated[str | None, Query()] = None,
) -> SafetyScoreRead:
    if user["role"] in ("consultant", "dermatologist"):
        if client_user_id is None:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_CONTENT,
                "client_user_id is required for professional access",
            )
        try:
            await clinical_review_service.verify_assignment(db, user["id"], client_user_id)
        except ValueError as exc:
            raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
        target_user_id = client_user_id
    else:
        target_user_id = user["id"]

    try:
        return await service.compute_safety_score(
            db, payload.ingredient_ids, payload.routine_time, target_user_id
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc


@router.get("/ingredients/{ingredient_id}")
async def get_ingredient(
    ingredient_id: int,
    user: Annotated[dict[str, Any], Depends(require_role(*_ANY_SIGNED_IN))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> IngredientDetail:
    detail = await service.get_ingredient_detail(db, get_mongo_db(), ingredient_id)
    if detail is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Ingredient not found")
    return detail
