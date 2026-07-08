from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.routines import service
from app.services.routines.schemas import RoutineRead

router = APIRouter()


@router.get("/routines/me")
async def get_my_routines(
    # Routine Planner is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[RoutineRead]:
    return await service.get_or_generate_routines(db, user["id"])
