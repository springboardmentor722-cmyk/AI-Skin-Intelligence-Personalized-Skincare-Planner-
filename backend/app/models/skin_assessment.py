from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.sql import func

from app.database.database import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"
    __table_args__ = (UniqueConstraint("user_id", "assessment_date", name="uq_skin_assessment_user_date"),)

    assessment_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    assessment_date = Column(Date, nullable=False)
    condition_score = Column(Float, nullable=False)
    lifestyle_score = Column(Float, nullable=False)
    routine_score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)
    hydration_score = Column(Float, nullable=False)
    final_score = Column(Float, nullable=False)
    severity = Column(String(20), nullable=False)
    risk_level = Column(String(20), nullable=False)
    primary_concerns = Column(Text, nullable=True)
    condition_summary = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    morning_routine = Column(Text, nullable=True)
    night_routine = Column(Text, nullable=True)
    ingredients_to_look_for = Column(Text, nullable=True)
    ingredients_to_avoid = Column(Text, nullable=True)
    disclaimer = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
