import datetime

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.service import create_notification
from app.services.reports.models import ReportSchedule
from app.services.reports.service import generate_report

# No email/push send here on purpose — no adapter exists yet (docs/superpowers/
# specs/2026-08-12-reports-reminders-design.md's explicit scope decision).
# Generation is real; delivery is a separate, later feature.

logger = structlog.get_logger()


async def run_due_report_schedules(db: AsyncSession, now: datetime.datetime | None = None) -> int:
    now = now or datetime.datetime.now(datetime.UTC)
    current_time = now.time().replace(second=0, microsecond=0)

    result = await db.execute(
        select(ReportSchedule).where(
            ReportSchedule.is_active.is_(True),
            ReportSchedule.time_of_day == current_time,
        )
    )
    due_schedules = [
        s
        for s in result.scalars().all()
        if (s.frequency == "weekly" and s.day_of_week == now.weekday())
        or (s.frequency == "monthly" and s.day_of_month == now.day)
    ]

    generated = 0
    for schedule in due_schedules:
        # One bad row (S3 down, a malformed profile) must not starve every
        # remaining user's schedule on this tick or every tick after it.
        try:
            await generate_report(
                db,
                schedule.user_id,
                schedule.report_type,  # type: ignore[arg-type]
                include_profile_header=True,
            )
            await create_notification(
                db,
                schedule.user_id,
                title="Your scheduled report is ready",
                message=f"{schedule.report_type.title()} report generated.",
                notification_type="report_ready",
            )
            generated += 1
        except Exception:
            # A DB-layer failure (constraint violation, connection blip) leaves the
            # session's transaction unusable — without rolling back, every
            # subsequent row in this loop fails with PendingRollbackError, silently
            # defeating the per-row isolation this try/except exists for.
            await db.rollback()
            logger.exception(
                "report_schedule_failed",
                schedule_id=schedule.schedule_id,
                user_id=schedule.user_id,
            )
    return generated
