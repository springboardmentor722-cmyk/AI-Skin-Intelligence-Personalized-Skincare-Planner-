"""Role model — the four supported roles in the platform."""

import uuid

from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(String(255), nullable=True)

    users = relationship("User", back_populates="role")

    # Canonical role names used throughout the application
    USER = "User"
    CONSULTANT = "Skincare Consultant"
    DERMATOLOGIST = "Dermatologist"
    ADMINISTRATOR = "Administrator"

    ALL_ROLES = [USER, CONSULTANT, DERMATOLOGIST, ADMINISTRATOR]
