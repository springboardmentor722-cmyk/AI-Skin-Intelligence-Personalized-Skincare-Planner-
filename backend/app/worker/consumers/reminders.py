import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Reminder
from app.services.notifications.service import create_notification

# No push/email send here on purpose — same scope decision as the report-schedule
# cron (docs/superpowers/specs/2026-08-12-reports-reminders-design.md).


async def run_due_reminders(db: AsyncSession) -> int:
    now = datetime.datetime.now(datetime.UTC)
    current_time = now.time().replace(second=0, microsecond=0)

    result = await db.execute(
        select(Reminder).where(Reminder.is_active.is_(True), Reminder.reminder_time == current_time)
    )
    due = list(result.scalars().all())

    for reminder in due:
        await create_notification(
            db,
            reminder.user_id,
            title=reminder.title,
            message=reminder.message or reminder.title,
            notification_type="reminder",
        )
    return len(due)
