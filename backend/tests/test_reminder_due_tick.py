"""No push/email send here — no adapter exists (same scope decision as the
report-schedule cron). This only writes the real notification row."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.schemas import ReminderCreate
from app.services.notifications.service import list_my_notifications, upsert_reminder
from app.worker.consumers.reminders import run_due_reminders


async def test_run_due_reminders_writes_a_notification_for_a_due_reminder(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_morning",
            title="Morning Routine",
            message="Time for your AM routine",
            reminder_time=now.time().replace(second=0, microsecond=0),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    notified_count = await run_due_reminders(db_session)

    assert notified_count == 1
    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "reminder" for n in notifications)


async def test_run_due_reminders_skips_inactive_reminders(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="Drink water",
            reminder_time=now.time().replace(second=0, microsecond=0),
            frequency="daily",
            is_active=False,
        ),
    )
    await db_session.flush()

    assert await run_due_reminders(db_session) == 0
