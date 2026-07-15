import uuid
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class SkinProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "skin_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="skin_profile")
    # Onboarding Fields
    skin_type: Mapped[str] = mapped_column(String(50), nullable=True)
    age_group: Mapped[str] = mapped_column(String(50), nullable=True)
    skin_concerns: Mapped[str] = mapped_column(String(500), nullable=True)
    allergies: Mapped[str] = mapped_column(String(500), nullable=True)
    sensitivities: Mapped[str] = mapped_column(String(500), nullable=True)

class LifestyleProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "lifestyle_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="lifestyle_profile")
    # Onboarding Fields
    sleep_quality: Mapped[str] = mapped_column(String(50), nullable=True)
    water_intake: Mapped[str] = mapped_column(String(50), nullable=True)

class EnvironmentProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "environment_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    
    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="environment_profile")
    
    # Future environment-specific columns will go here in later weeks
