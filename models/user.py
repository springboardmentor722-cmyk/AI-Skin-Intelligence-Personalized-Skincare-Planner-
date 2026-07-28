"""User model — core account record shared by all four roles."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone_number = Column(String(20), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    gender = Column(String(20), nullable=True)
    age = Column(Integer, nullable=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    country = Column(String(100), nullable=True)
    profile_photo_url = Column(String(255), nullable=True)

    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    role = relationship("Role", back_populates="users")

    terms_accepted = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)  # soft delete

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    skin_profile = relationship(
        "SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    lifestyle_logs = relationship(
        "LifestyleLog", back_populates="user", cascade="all, delete-orphan"
    )
