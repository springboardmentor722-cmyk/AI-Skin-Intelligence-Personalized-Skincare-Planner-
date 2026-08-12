import datetime

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class Notification(Base):
    """Maps onto the `notifications` table already migrated in a7e9f4e50c45
    (schema-only until now, per that migration's own docstring). Nothing in the app
    writes a row here yet — this service is a read path only; write support (a real
    producer: routine reminders, verification-decision pings, etc.) is a separate,
    later feature, not invented here."""

    __tablename__ = "notifications"
    __table_args__ = (Index("idx_notifications_user_unread", "user_id", "is_read"),)

    notification_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    title: Mapped[str | None] = mapped_column(default=None)
    message: Mapped[str | None] = mapped_column(default=None)
    notification_type: Mapped[str | None] = mapped_column(default=None)
    is_read: Mapped[bool] = mapped_column(server_default="false")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class Reminder(Base):
    """Maps the `reminders` table (migrated alongside `notifications` in
    a7e9f4e50c45, unused until now). Backs the /reminders page's Reminder
    Settings tab — three reminder_type values in v1: 'routine_morning',
    'routine_evening', 'hydration' (docs/superpowers/specs/
    2026-08-12-reports-reminders-design.md)."""

    __tablename__ = "reminders"

    reminder_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    # reminder_type/title/frequency are nullable in the live DDL (schema_v3.sql) —
    # ReminderCreate requires them at the API boundary, but the ORM type must match
    # what the column actually allows, not what every current writer happens to send.
    reminder_type: Mapped[str | None] = mapped_column(default=None)
    title: Mapped[str | None] = mapped_column(default=None)
    message: Mapped[str | None] = mapped_column(default=None)
    reminder_time: Mapped[datetime.time | None] = mapped_column(default=None)
    frequency: Mapped[str | None] = mapped_column(default=None)
    is_active: Mapped[bool] = mapped_column(server_default="true")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
