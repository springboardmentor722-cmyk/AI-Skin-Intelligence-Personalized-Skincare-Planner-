"""The report-schedule cron generates real reports on schedule and notifies —
it never sends email/push (no adapter exists, spec's explicit scope decision)."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.service import list_my_notifications
from app.services.reports.schemas import ReportScheduleCreate
from app.services.reports.service import create_schedule
from app.worker.consumers.report_schedules import run_due_report_schedules


async def test_run_due_report_schedules_generates_a_report_and_notifies(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=now.weekday(),
            time_of_day=now.time().replace(second=0, microsecond=0),
        ),
    )
    await db_session.flush()

    generated_count = await run_due_report_schedules(db_session)

    assert generated_count == 1
    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "report_ready" for n in notifications)


async def test_run_due_report_schedules_skips_inactive_schedules(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=now.weekday(),
            time_of_day=now.time().replace(second=0, microsecond=0),
            is_active=False,
        ),
    )
    await db_session.flush()

    generated_count = await run_due_report_schedules(db_session)
    assert generated_count == 0
