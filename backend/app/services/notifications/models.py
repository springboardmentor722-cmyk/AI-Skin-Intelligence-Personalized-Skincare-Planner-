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
