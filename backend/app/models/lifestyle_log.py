import enum
import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, DateTime, Date, Enum, Float, Integer, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class StressLevel(str, enum.Enum):
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"


class LifestyleLog(Base):
    __tablename__ = "lifestyle_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    log_date = Column(Date, default=date.today, nullable=False)

    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    stress_level = Column(Enum(StressLevel), nullable=True)
    environmental_exposure = Column(String(255), nullable=True)

    # New Milestone 2 lifestyle fields
    smoking = Column(Boolean, nullable=True)
    alcohol = Column(Boolean, nullable=True)
    alcohol_mls = Column(Float, nullable=True)
    screen_time_hours = Column(Float, nullable=True)      # late-night screen time in hours
    sun_protection_used = Column(Boolean, nullable=True)
    sun_exposure_minutes = Column(Integer, nullable=True)
    uv_index = Column(Float, nullable=True)
    pollution_exposure = Column(String(50), nullable=True)  # "low" | "moderate" | "high"
    diet_quality = Column(Integer, nullable=True) # 1-5 scale

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lifestyle_logs")