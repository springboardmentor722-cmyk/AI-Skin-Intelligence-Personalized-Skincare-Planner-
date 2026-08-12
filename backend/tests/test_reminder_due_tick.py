"""No push/email send here — no adapter exists (same scope decision as the
report-schedule cron). This only writes the real notification row."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.schemas import ReminderCreate
from app.services.notifications.service import list_my_notifications, upsert_reminder
from app.worker.consumers.reminders import run_due_reminders

# A fixed instant, injected via run_due_reminders' `now` param — the consumer
# scans every user's reminders (a cron job legitimately must), so pinning `now`
# and asserting on this test's own user's notifications (not the raw due count)
# keeps this test correct regardless of what other reminders exist in the shared
# dev Postgres this suite runs against.
_NOW = datetime.datetime(2026, 1, 1, 8, 0, tzinfo=datetime.UTC)


async def test_run_due_reminders_writes_a_notification_for_a_due_reminder(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_morning",
            title="Morning Routine",
            message="Time for your AM routine",
            reminder_time=_NOW.time(),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    await run_due_reminders(db_session, now=_NOW)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "reminder" for n in notifications)


async def test_run_due_reminders_skips_inactive_reminders(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="Drink water",
            reminder_time=_NOW.time(),
            frequency="daily",
            is_active=False,
        ),
    )
    await db_session.flush()

    await run_due_reminders(db_session, now=_NOW)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert notifications == []


async def test_run_due_reminders_fires_an_interval_hydration_reminder_on_the_hour(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="Drink water",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    # _NOW is 08:00 UTC — an even hour, so every_2h should fire.
    await run_due_reminders(db_session, now=_NOW)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "reminder" for n in notifications)


async def test_run_due_reminders_skips_an_interval_reminder_off_its_hour(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="Drink water",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    off_hour = _NOW.replace(hour=9)  # odd hour — every_2h shouldn't fire
    await run_due_reminders(db_session, now=off_hour)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert notifications == []
