"""LifestyleLog model — time-stamped lifestyle tracking entries per user."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    stress_level = Column(String(50), nullable=True)  # Low, Moderate, High
    smoking = Column(Boolean, default=False, nullable=False)
    alcohol = Column(Boolean, default=False, nullable=False)
    diet_quality = Column(String(50), nullable=True)
    outdoor_exposure_hours = Column(Float, nullable=True)
    screen_time_hours = Column(Float, nullable=True)

    is_deleted = Column(Boolean, default=False, nullable=False)
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="lifestyle_logs")
