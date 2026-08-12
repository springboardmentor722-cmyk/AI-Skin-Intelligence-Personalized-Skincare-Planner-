from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Notification, Reminder
from app.services.notifications.schemas import ReminderCreate, ReminderUpdate


async def list_my_notifications(
    db: AsyncSession, user_id: str, limit: int = 20
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def create_notification(
    db: AsyncSession, user_id: str, *, title: str, message: str, notification_type: str
) -> Notification:
    notification = Notification(
        user_id=user_id, title=title, message=message, notification_type=notification_type
    )
    db.add(notification)
    await db.flush()
    return notification


async def list_my_reminders(db: AsyncSession, user_id: str) -> list[Reminder]:
    result = await db.execute(
        select(Reminder).where(Reminder.user_id == user_id).order_by(Reminder.reminder_id)
    )
    return list(result.scalars().all())


async def upsert_reminder(db: AsyncSession, user_id: str, data: ReminderCreate) -> Reminder:
    reminder = Reminder(user_id=user_id, **data.model_dump())
    db.add(reminder)
    await db.flush()
    return reminder


async def _get_owned_reminder(db: AsyncSession, user_id: str, reminder_id: int) -> Reminder:
    result = await db.execute(
        select(Reminder).where(
            Reminder.reminder_id == reminder_id, Reminder.user_id == user_id
        )
    )
    reminder = result.scalar_one_or_none()
    if reminder is None:
        raise ValueError(f"Reminder {reminder_id} not found for this user")
    return reminder


async def update_reminder(
    db: AsyncSession, user_id: str, reminder_id: int, data: ReminderUpdate
) -> Reminder:
    reminder = await _get_owned_reminder(db, user_id, reminder_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    await db.flush()
    return reminder


async def delete_reminder(db: AsyncSession, user_id: str, reminder_id: int) -> None:
    reminder = await _get_owned_reminder(db, user_id, reminder_id)
    await db.delete(reminder)
    await db.flush()
