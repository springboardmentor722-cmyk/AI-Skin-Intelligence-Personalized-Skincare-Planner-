from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.recommendations.schemas import ProductRead
from app.services.routines import service
from app.services.routines.schemas import (
    RoutineRead,
    StepCompletionUpdate,
    StepCreate,
    StepReorderUpdate,
    StepUpdate,
)
from app.services.routines.service import UnsafeProductError

router = APIRouter()


# mile_2.docx Step 5.2/Step 6 name GET /api/v1/routine and POST /api/v1/routine/generate
# as the canonical routes. /routines/me and /routines/generate are kept as deprecated
# aliases for existing frontend callers — remove once Phase 1.4's frontend pass
# confirms nothing still calls them (MASTER_PROMPT.md Phase 1.3).
@router.get("/routines/me")
@router.get("/routine")
async def get_my_routines(
    # Routine Planner is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RoutineRead]:
    return await service.get_or_generate_routines(db, user["id"])


@router.post("/routines/generate")
@router.post("/routine/generate")
async def generate_my_routines(
    # Milestone 2 Step 4.1's explicit "POST /routine/generate" — GET /routines/me
    # already generates-if-none-exist as a side effect of a read (the same real
    # get_or_generate_routines call, no duplicated logic), but the doc names a
    # dedicated action route too. Same idempotent semantics: returns the existing
    # routines if generation isn't needed, generates (or refreshes Seasonal) if it is.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RoutineRead]:
    return await service.get_or_generate_routines(db, user["id"])


@router.post("/routines/steps/{step_id}/log", status_code=204)
async def log_step_completion(
    step_id: int,
    body: StepCompletionUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
) -> None:
    # Milestone 2 Step 5.2: an interactive checklist checkbox POSTs here on toggle,
    # persisting into Mongo routine_logs (service.py) instead of resetting on reload.
    await service.toggle_step_completion(user["id"], step_id, body.completed)


@router.get("/routines/products/search")
async def search_products(
    category: str,
    q: str,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ProductRead]:
    # The routine editor's product picker — real candidates only (skin-type +
    # ingredient_skintype_avoid filtered), never the wireframe's invented match %.
    return await service.search_products_for_edit(db, user["id"], category, q)


@router.patch("/routines/{routine_id}/steps/reorder")
async def reorder_routine_steps(
    routine_id: int,
    body: StepReorderUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.reorder_steps(db, user["id"], routine_id, body.step_ids)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.post("/routines/{routine_id}/steps")
async def add_routine_step(
    routine_id: int,
    body: StepCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.add_step(db, user["id"], routine_id, body.step_name, body.product_id)
    except UnsafeProductError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.delete("/routines/steps/{step_id}")
async def delete_routine_step(
    step_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.delete_step(db, user["id"], step_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.patch("/routines/steps/{step_id}")
async def update_routine_step(
    step_id: int,
    body: StepUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> RoutineRead:
    try:
        return await service.update_step(
            db, user["id"], step_id, body.step_name, body.product_id, body.usage_notes
        )
    except UnsafeProductError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
