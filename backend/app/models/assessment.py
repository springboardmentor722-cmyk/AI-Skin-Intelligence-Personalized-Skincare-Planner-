# app/models/assessment.py
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Numeric, Integer, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Numeric(5, 2), nullable=False)
    score_breakdown = Column(JSONB, nullable=True)
    detected_concerns = Column(JSONB, nullable=True)
    primary_concern = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], overlaps="assessments")
    routines = relationship("SkincareRoutine", back_populates="assessment", cascade="all, delete-orphan")


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("skin_assessments.id", ondelete="CASCADE"), nullable=True)
    time_of_day = Column(String(10), nullable=False)  # AM | PM | Weekly
    step_number = Column(Integer, nullable=False)
    step_category = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id], overlaps="routines")
    assessment = relationship("SkinAssessment", back_populates="routines")