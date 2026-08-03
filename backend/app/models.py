import enum
import uuid
from datetime import datetime, date

from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Date, DateTime,
    ForeignKey, Enum, Text, UniqueConstraint, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class RoleEnum(str, enum.Enum):
    user = "user"
    skincare_consultant = "skincare_consultant"
    dermatologist = "dermatologist"
    administrator = "administrator"


class AppointmentStatusEnum(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class SkinTypeEnum(str, enum.Enum):
    oily = "oily"
    dry = "dry"
    combination = "combination"
    normal = "normal"
    sensitive = "sensitive"
    acne_prone = "acne_prone"
    dehydrated = "dehydrated"
    aging = "aging"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    full_name = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.user)
    is_active = Column(Boolean, default=True)
    assigned_dermatologist_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    skin_profile = relationship("SkinProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    lifestyle_entries = relationship("LifestyleEntry", back_populates="user", cascade="all, delete-orphan")
    progress_entries = relationship("ProgressEntry", back_populates="user", cascade="all, delete-orphan")
    dermatologist_profile = relationship("DermatologistProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    consultant_profile = relationship("ConsultantProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    assigned_dermatologist = relationship("User", remote_side=[id], foreign_keys=[assigned_dermatologist_id])
    sent_appointment_requests = relationship(
        "AppointmentRequest",
        back_populates="patient",
        foreign_keys="AppointmentRequest.patient_user_id",
        cascade="all, delete-orphan",
    )
    received_appointment_requests = relationship(
        "AppointmentRequest",
        back_populates="dermatologist",
        foreign_keys="AppointmentRequest.dermatologist_user_id",
        cascade="all, delete-orphan",
    )
    sent_messages = relationship(
        "PatientMessage",
        back_populates="sender",
        foreign_keys="PatientMessage.sender_user_id",
        cascade="all, delete-orphan",
    )
    received_messages = relationship(
        "PatientMessage",
        back_populates="recipient",
        foreign_keys="PatientMessage.recipient_user_id",
        cascade="all, delete-orphan",
    )


class DermatologistProfile(Base):
    __tablename__ = "dermatologist_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(30), nullable=True)
    clinic_name = Column(String(200), nullable=True)
    specialty = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    website = Column(String(500), nullable=True)
    accepting_new_patients = Column(Boolean, default=True)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="dermatologist_profile")


class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    phone = Column(String(30), nullable=True)
    organization_name = Column(String(200), nullable=True)
    specialization = Column(String(150), nullable=True)
    bio = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="consultant_profile")


class SkinProfile(Base):
    __tablename__ = "skin_profiles"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)

    age = Column(Integer, nullable=True)
    gender = Column(String(30), nullable=True)
    skin_type = Column(Enum(SkinTypeEnum), nullable=True)
    skin_concerns = Column(Text, nullable=True)       # comma-separated or JSON string
    allergies = Column(Text, nullable=True)           # comma-separated or JSON string
    skin_sensitivities = Column(Text, nullable=True)  # comma-separated or JSON string

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="skin_profile")


class LifestyleEntry(Base):
    __tablename__ = "lifestyle_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    entry_date = Column(Date, default=date.today, nullable=False)
    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    exercise_minutes = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)   # 1 (low) - 5 (high)
    environmental_exposure = Column(String(255), nullable=True)  # e.g. "high pollution, sun exposure"

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="lifestyle_entries")

    __table_args__ = (
        UniqueConstraint("user_id", "entry_date", name="uq_user_lifestyle_date"),
    )


class ProgressEntry(Base):
    """Tracks skin progress over time (photos/notes/metrics) - populated more heavily in later milestones."""
    __tablename__ = "progress_entries"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    entry_date = Column(Date, default=date.today, nullable=False)
    notes = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    hydration_score = Column(Integer, nullable=True)
    breakout_count = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_entries")


class AppointmentRequest(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    patient_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dermatologist_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(Enum(AppointmentStatusEnum), nullable=False, default=AppointmentStatusEnum.pending)
    request_message = Column(Text, nullable=True)
    response_message = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    patient = relationship("User", back_populates="sent_appointment_requests", foreign_keys=[patient_user_id])
    dermatologist = relationship(
        "User",
        back_populates="received_appointment_requests",
        foreign_keys=[dermatologist_user_id],
    )


class PatientMessage(Base):
    __tablename__ = "patient_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    dermatologist_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    patient_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_user_id])
    recipient = relationship("User", back_populates="received_messages", foreign_keys=[recipient_user_id])


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Float, nullable=False)
    skin_condition_score = Column(Float, nullable=False)
    lifestyle_score = Column(Float, nullable=False)
    sleep_score = Column(Float, nullable=False)
    consistency_score = Column(Float, nullable=False)
    hydration_score = Column(Float, nullable=False)
    detected_concerns = Column(JSON, nullable=True)  # List of concerns, e.g. ["Acne", "Dry Skin"]
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="skin_assessments")


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(UUID(as_uuid=False), ForeignKey("skin_assessments.id", ondelete="SET NULL"), nullable=True)
    time_of_day = Column(String(50), nullable=False)  # "AM", "PM", or "Weekly"
    step_number = Column(Integer, nullable=False)
    step_category = Column(String(100), nullable=False)  # Cleansing, Treatment, Moisturizing, Sun Protection, etc.
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", backref="skincare_routines")
    assessment = relationship("SkinAssessment", backref="skincare_routines")


class ProfessionalMessage(Base):
    __tablename__ = "professional_messages"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    consultant_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dermatologist_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    body = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sender = relationship("User", foreign_keys=[sender_user_id])
    consultant = relationship("User", foreign_keys=[consultant_id])
    dermatologist = relationship("User", foreign_keys=[dermatologist_id])


class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    cloud_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    skin_health_score = Column(Integer, nullable=True)
    tag = Column(String(50), nullable=True)  # "Baseline", "Week 4", etc.

    user = relationship("User", backref="progress_photos")


