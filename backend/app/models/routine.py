import uuid
from typing import Optional, List
from sqlalchemy import Integer, ForeignKey, String, JSON, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.db.base import Base, UUIDMixin, TimestampMixin

class SkincareRoutine(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "skincare_routines"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    screening_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skin_screenings.id", ondelete="SET NULL"), nullable=True
    )
    
    status: Mapped[str] = mapped_column(String, default="PRELIMINARY", nullable=False) # PRELIMINARY, ACTIVE, ARCHIVED
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    user = relationship("User", backref="routines")
    screening = relationship("SkinScreening", backref="routines")
    steps = relationship("RoutineStep", back_populates="routine", cascade="all, delete-orphan")


class RoutineStep(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "routine_steps"

    routine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skincare_routines.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    time_of_day: Mapped[str] = mapped_column(String(50), nullable=False) # Morning, Evening, Weekly
    step_number: Mapped[int] = mapped_column(Integer, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False) # Cleanser, Serum, etc.
    product_suggestion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ingredient_suggestion: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    instructions: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    routine = relationship("SkincareRoutine", back_populates="steps")
    logs = relationship("RoutineLog", back_populates="step", cascade="all, delete-orphan")


class RoutineLog(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "routine_logs"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    step_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("routine_steps.id", ondelete="CASCADE"), nullable=False
    )
    
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    is_completed: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    step = relationship("RoutineStep", back_populates="logs")
    user = relationship("User")


class RoutineHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "routine_history"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    routine_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skincare_routines.id", ondelete="CASCADE"), nullable=False
    )
    
    snapshot_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    routine_data: Mapped[dict] = mapped_column(JSON, nullable=False) # Store the serialized routine at that point

    # Relationships
    user = relationship("User")
