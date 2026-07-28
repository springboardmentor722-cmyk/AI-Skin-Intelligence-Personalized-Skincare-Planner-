# app/models/user.py
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


class UserStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SUSPENDED = "suspended"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)  # matches real DB column name
    role = Column(Enum(UserRole), nullable=False, default=UserRole.USER)

    is_active = Column(Boolean, default=True)  # kept — original column
    status = Column(String(20), nullable=False, default="approved")  # RBAC column
    is_verified = Column(Boolean, default=True)  # RBAC column

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # One-to-one relationships depending on role
    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consultant_profile = relationship(
        "ConsultantProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="ConsultantProfile.user_id",
    )
    dermatologist_profile = relationship(
        "DermatologistProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
        foreign_keys="DermatologistProfile.user_id",
    )
    lifestyle_logs = relationship("LifestyleLog", back_populates="user", cascade="all, delete-orphan")
    progress_logs = relationship("ProgressLog", back_populates="user", cascade="all, delete-orphan")

    # Assessment engine relationships
    assessments = relationship("SkinAssessment", foreign_keys="SkinAssessment.user_id", cascade="all, delete-orphan")
    routines = relationship("SkincareRoutine", foreign_keys="SkincareRoutine.user_id", cascade="all, delete-orphan")

    @staticmethod
    def default_status_for_role(role: "UserRole") -> str:
        if role in (UserRole.USER, UserRole.ADMIN):
            return "approved"
        return "pending"