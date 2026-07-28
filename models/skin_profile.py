"""SkinProfile model — one-to-one skin profile per user."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)

    skin_type = Column(String(50), nullable=True)  # Normal, Dry, Oily, Combination, Sensitive
    skin_concerns = Column(String(255), nullable=True)  # comma-separated tags
    allergies = Column(String(255), nullable=True)
    sensitivity_level = Column(String(50), nullable=True)
    current_products = Column(String(255), nullable=True)
    hydration_level = Column(String(50), nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    sun_exposure = Column(String(50), nullable=True)
    occupation = Column(String(100), nullable=True)
    environment = Column(String(100), nullable=True)
    skin_photo_url = Column(String(255), nullable=True)  # served from /uploads

    is_deleted = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="skin_profile")
