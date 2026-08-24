import datetime

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class ProgressReport(Base):
    """Maps the `progress_reports` table (already migrated, unused until now —
    same pattern as notifications/models.py's Notification docstring). Report
    registry row: one per generated PDF. `report_url` stores the S3 key (never
    a baked-in presigned URL — same rule recommendations/service.py follows for
    product images), resolved to a fresh presigned URL on every read."""

    __tablename__ = "progress_reports"
    __table_args__ = (Index("idx_progress_reports_user_generated", "user_id", "generated_at"),)

    report_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    report_type: Mapped[str] = mapped_column()
    # PDF/Excel export (M4 audit fix, PDF requirement "PDF export. Excel export.") —
    # defaults to "pdf" so every existing caller/row is unaffected.
    format: Mapped[str] = mapped_column(server_default="pdf")
    summary: Mapped[str | None] = mapped_column(default=None)
    report_url: Mapped[str | None] = mapped_column(default=None)
    generated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class ReportSchedule(Base):
    """Maps Task 1's new `report_schedules` table. Backs the Reports page's
    Scheduled Automations card — generation is real (arq cron, Task 9), actual
    email/push delivery is explicitly out of scope (no adapter exists, spec's
    scope decision)."""

    __tablename__ = "report_schedules"

    schedule_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    report_type: Mapped[str] = mapped_column()
    frequency: Mapped[str] = mapped_column()
    day_of_week: Mapped[int | None] = mapped_column(default=None)
    day_of_month: Mapped[int | None] = mapped_column(default=None)
    time_of_day: Mapped[datetime.time] = mapped_column()
    is_active: Mapped[bool] = mapped_column(server_default="true")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
