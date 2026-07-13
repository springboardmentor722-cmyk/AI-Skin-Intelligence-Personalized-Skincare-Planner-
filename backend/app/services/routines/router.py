from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.routines import service
from app.services.routines.schemas import RoutineRead, StepCompletionUpdate

router = APIRouter()


@router.get("/routines/me")
async def get_my_routines(
    # Routine Planner is a `user`-role feature (ARCHITECTURE.md §2).
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
