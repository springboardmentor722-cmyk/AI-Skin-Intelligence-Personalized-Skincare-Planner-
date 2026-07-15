import uuid
from typing import Optional
from sqlalchemy import Integer, ForeignKey, Float, String, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class SkinScore(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "skin_scores"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    screening_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skin_screenings.id", ondelete="SET NULL"), nullable=True
    )
    
    overall_score: Mapped[float] = mapped_column(Float, default=0.0)
    skin_condition_score: Mapped[float] = mapped_column(Float, default=0.0)
    lifestyle_score: Mapped[float] = mapped_column(Float, default=0.0)
    sleep_score: Mapped[float] = mapped_column(Float, default=0.0)
    routine_score: Mapped[float] = mapped_column(Float, default=0.0)
    hydration_score: Mapped[float] = mapped_column(Float, default=0.0)
    risk_level: Mapped[str] = mapped_column(String(50), nullable=True) # Low, Medium, High

    # Relationships
    user = relationship("User", backref="skin_scores")
    screening = relationship("SkinScreening", backref="scores")
    breakdown = relationship("ScoreBreakdown", back_populates="score", uselist=False, cascade="all, delete-orphan")


class ScoreBreakdown(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "score_breakdowns"

    score_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skin_scores.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    
    details: Mapped[dict] = mapped_column(JSON, nullable=False, default={})

    # Relationships
    score = relationship("SkinScore", back_populates="breakdown")
