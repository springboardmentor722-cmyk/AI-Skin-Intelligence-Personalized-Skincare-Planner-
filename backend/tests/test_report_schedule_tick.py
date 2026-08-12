"""The report-schedule cron generates real reports on schedule and notifies —
it never sends email/push (no adapter exists, spec's explicit scope decision)."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.service import list_my_notifications
from app.services.reports.schemas import ReportScheduleCreate
from app.services.reports.service import create_schedule
from app.worker.consumers.report_schedules import run_due_report_schedules

# A fixed instant, injected via run_due_report_schedules' `now` param — the
# consumer scans every user's schedules (a cron job legitimately must), so pinning
# `now` and asserting on this test's own user's notifications (not the raw
# generated-count return value) keeps this test correct regardless of what other
# schedules exist in the shared dev Postgres this suite runs against.
_NOW = datetime.datetime(2026, 1, 1, 8, 0, tzinfo=datetime.UTC)  # a Thursday


async def test_run_due_report_schedules_generates_a_report_and_notifies(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=_NOW.weekday(),
            time_of_day=_NOW.time(),
        ),
    )
    await db_session.flush()

    await run_due_report_schedules(db_session, now=_NOW)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "report_ready" for n in notifications)


async def test_run_due_report_schedules_skips_inactive_schedules(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=_NOW.weekday(),
            time_of_day=_NOW.time(),
            is_active=False,
        ),
    )
    await db_session.flush()

    await run_due_report_schedules(db_session, now=_NOW)

    notifications = await list_my_notifications(db_session, test_user_id)
    assert notifications == []
