from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func

from services.auth_service.app.db.database import Base


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(Integer, ForeignKey("skin_assessments.id"), nullable=False, index=True)

    time_of_day = Column(String(10), nullable=False)   # AM / PM / Weekly
    step_number = Column(Integer, nullable=False)
    step_category = Column(String(50), nullable=False)  # Cleansing, Treatment, Moisturizing, Sun Protection, Night Care
    step_name = Column(String(150), nullable=False)      # e.g. "Broad Spectrum SPF 30+"

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
