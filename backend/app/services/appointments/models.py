import datetime

from sqlalchemy import DateTime, ForeignKey, Index, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class ProviderAvailability(Base):
    __tablename__ = "provider_availability"
    __table_args__ = (Index("idx_provider_availability_provider", "provider_id"),)

    availability_id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    day_of_week: Mapped[int] = mapped_column(SmallInteger)
    start_time: Mapped[datetime.time]
    end_time: Mapped[datetime.time]
    slot_duration_minutes: Mapped[int] = mapped_column(
        SmallInteger, default=30, server_default="30"
    )


class AvailabilityException(Base):
    __tablename__ = "availability_exceptions"
    __table_args__ = (
        Index("idx_availability_exceptions_provider_date", "provider_id", "exception_date"),
    )

    exception_id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    exception_date: Mapped[datetime.date]
    start_time: Mapped[datetime.time | None] = mapped_column(default=None)
    end_time: Mapped[datetime.time | None] = mapped_column(default=None)
    reason: Mapped[str | None] = mapped_column(Text, default=None)


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("idx_appointments_user", "user_id"),
        Index("idx_appointments_provider_start", "provider_id", "start_time"),
    )

    appointment_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    provider_role: Mapped[str]
    consultation_mode: Mapped[str]
    start_time: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    end_time: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(default="pending", server_default="pending")
    cancelled_by: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, default=None)
    original_start_time: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    concern: Mapped[str | None] = mapped_column(Text, default=None)
    meeting_link: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    updated_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
