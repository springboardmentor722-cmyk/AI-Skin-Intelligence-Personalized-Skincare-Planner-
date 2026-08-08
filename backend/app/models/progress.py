import uuid
from typing import Optional
from sqlalchemy import String, ForeignKey, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timezone

from app.db.base import Base, UUIDMixin, TimestampMixin

class ProgressPhoto(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "progress_photos"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    tag: Mapped[Optional[str]] = mapped_column(String(100), nullable=True) # e.g., "Baseline", "Week 4"
    skin_health_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
