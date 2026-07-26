from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import get_db
from app.services.notifications import service
from app.services.notifications.schemas import NotificationRead

router = APIRouter()


@router.get("/notifications/me")
async def get_my_notifications(
    # Any authenticated role — the bell is in every role's shared topbar
    # (glass-topbar.tsx), not one role's nav.
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NotificationRead]:
    rows = await service.list_my_notifications(db, user["id"])
    return [NotificationRead.model_validate(r) for r in rows]
