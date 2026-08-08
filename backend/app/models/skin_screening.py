import uuid
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class SkinScreening(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "skin_screenings"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    
    skin_type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    primary_concern: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    secondary_concern: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    skin_goals: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    skin_sensitivity: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    image_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    allergies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    previous_treatments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    current_routine: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    dermatologist_consultation_history: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pregnancy_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    smoking: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    alcohol: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    current_medications: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stress_level: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", backref="skin_screenings")

class ScreeningHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "screening_history"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    screening_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("skin_screenings.id", ondelete="CASCADE"), nullable=False
    )
    
    snapshot_date: Mapped[str] = mapped_column(String(50), nullable=True)
    screening_data: Mapped[dict] = mapped_column(JSON, nullable=False) # Serialized screening data

    # Relationships
    user = relationship("User")
