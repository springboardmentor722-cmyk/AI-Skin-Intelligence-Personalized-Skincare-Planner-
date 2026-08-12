from sqlalchemy import Boolean, Column, DateTime, Integer, String, ForeignKey, Text
from sqlalchemy.sql import func
from app.database.database import Base

class Consultation(Base):

    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    expert_id = Column(Integer, ForeignKey("users.id"))

    status = Column(String(40), default="Pending")

    recommendation = Column(Text, nullable=True)
    consultant_notes = Column(Text, nullable=True)
    progress_observations = Column(Text, nullable=True)
    routine_suggestions = Column(Text, nullable=True)
    follow_up_suggestion = Column(Text, nullable=True)
    requires_dermatologist = Column(Boolean, nullable=False, default=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
