import uuid
from typing import Optional
from sqlalchemy import String, Float, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class LifestyleLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lifestyle_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    
    sleep_duration: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    water_intake: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    exercise: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    stress: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pregnancy_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    smoking: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    alcohol_consumption: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    diet: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    working_hours: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    outdoor_time: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    sun_exposure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    uv_exposure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pollution_exposure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    humidity_exposure: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    screen_time: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    night_shift: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=False)
    hydration_level: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="lifestyle_logs")
