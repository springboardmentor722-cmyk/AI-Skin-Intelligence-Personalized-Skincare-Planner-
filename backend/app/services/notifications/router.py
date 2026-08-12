from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role, require_user
from app.db.postgres import get_db
from app.services.notifications import service
from app.services.notifications.schemas import (
    NotificationRead,
    ReminderCreate,
    ReminderRead,
    ReminderUpdate,
)

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


@router.get("/reminders")
async def get_my_reminders(
    # Reminder Settings is a `user`-role feature only (nav-config.ts) — unlike
    # /notifications/me's shared bell, no other role's nav exposes this.
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReminderRead]:
    rows = await service.list_my_reminders(db, user["id"])
    return [ReminderRead.model_validate(r) for r in rows]


@router.post("/reminders")
async def create_my_reminder(
    body: ReminderCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReminderRead:
    created = await service.upsert_reminder(db, user["id"], body)
    return ReminderRead.model_validate(created)


@router.patch("/reminders/{reminder_id}")
async def update_my_reminder(
    reminder_id: int,
    body: ReminderUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReminderRead:
    try:
        updated = await service.update_reminder(db, user["id"], reminder_id, body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return ReminderRead.model_validate(updated)


@router.delete("/reminders/{reminder_id}", status_code=204)
async def delete_my_reminder(
    reminder_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_reminder(db, user["id"], reminder_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
