import datetime
import re

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Reminder
from app.services.notifications.service import create_notification

logger = structlog.get_logger()

# No push/email send here on purpose — same scope decision as the report-schedule
# cron (docs/superpowers/specs/2026-08-12-reports-reminders-design.md).

_EVERY_N_HOURS = re.compile(r"^every_(\d+)h$")


def _is_due(reminder: Reminder, now: datetime.datetime) -> bool:
    if reminder.reminder_time is not None:
        return reminder.reminder_time == now.time().replace(second=0, microsecond=0)
    # Interval-based reminders (e.g. hydration) carry no reminder_time — fire on the
    # hour, every N hours, per "frequency": "every_Nh".
    match = _EVERY_N_HOURS.match(reminder.frequency)
    if match is None:
        return False
    interval_hours = int(match.group(1))
    return now.minute == 0 and now.hour % interval_hours == 0


async def run_due_reminders(db: AsyncSession, now: datetime.datetime | None = None) -> int:
    now = now or datetime.datetime.now(datetime.UTC)

    result = await db.execute(select(Reminder).where(Reminder.is_active.is_(True)))
    due = [r for r in result.scalars().all() if _is_due(r, now)]

    notified = 0
    for reminder in due:
        try:
            await create_notification(
                db,
                reminder.user_id,
                title=reminder.title,
                message=reminder.message or reminder.title,
                notification_type="reminder",
            )
            notified += 1
        except Exception:
            logger.exception(
                "reminder_notification_failed",
                reminder_id=reminder.reminder_id,
                user_id=reminder.user_id,
            )
    return notified
