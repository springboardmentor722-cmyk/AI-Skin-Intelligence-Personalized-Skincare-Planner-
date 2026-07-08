from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.db.postgres import get_db
from app.services.progress import service
from app.services.progress.schemas import ProgressSummaryRead

router = APIRouter()


@router.get("/progress/me/summary")
async def get_my_progress_summary(
    # Progress Tracking is a `user`-role feature (ARCHITECTURE.md §2).
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    days: Annotated[int, Query(ge=1, le=365)] = 30,
) -> ProgressSummaryRead:
    # service.get_progress_summary already took a `days` param (default 30) — it just
    # wasn't reachable from the API yet. The Progress Tracking screen's week/range
    # selector (docs/WIREFRAMES.md screen 7) needs 7/30/90-day windows.
    return await service.get_progress_summary(db, user["id"], days=days)
