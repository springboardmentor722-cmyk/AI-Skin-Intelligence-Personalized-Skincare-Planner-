from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Notification


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
