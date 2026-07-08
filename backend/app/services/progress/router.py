from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import get_db
from app.services.progress import service
from app.services.progress.schemas import ProgressSummaryRead

router = APIRouter()


@router.get("/progress/me/summary")
async def get_my_progress_summary(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProgressSummaryRead:
    return await service.get_progress_summary(db, user["id"])
