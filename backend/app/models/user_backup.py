import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class UserRole(str, enum.Enum):
    USER = "user"
    CONSULTANT = "consultant"
    DERMATOLOGIST = "dermatologist"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-one relationships depending on role
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consultant_profile = relationship("ConsultantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    dermatologist_profile = relationship("DermatologistProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_logs = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")