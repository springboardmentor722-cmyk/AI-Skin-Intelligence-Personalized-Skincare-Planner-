from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from services.auth_service.app.db.database import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    overall_score = Column(Float, nullable=False)
    condition_score = Column(Float, nullable=False)
    lifestyle_score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)
    consistency_score = Column(Float, nullable=False)
    hydration_score = Column(Float, nullable=False)

    skin_type = Column(String(50), nullable=False)
    # Raw severities (0-10) + the prioritized/labeled concern list, kept as
    # JSON so we don't need a new table per concern type.
    severities = Column(JSON, nullable=False)
    detected_concerns = Column(JSON, nullable=False)  # e.g. [{"name": "Acne", "severity": 7, "level": "High"}]
    primary_concern = Column(String(100), nullable=True)

    sleep_hours = Column(Float, nullable=False)
    water_intake_liters = Column(Float, nullable=False)
    sun_exposure = Column(String(20), nullable=False)  # Low / Medium / High

    created_at = Column(DateTime(timezone=True), server_default=func.now())
