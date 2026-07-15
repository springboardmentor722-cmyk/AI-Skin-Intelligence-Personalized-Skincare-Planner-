import uuid
from typing import Optional
from sqlalchemy import String, Integer, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class ProfessionalProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "professional_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True
    )
    
    qualifications: Mapped[str] = mapped_column(String(255), nullable=False)
    registration_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    hospital_affiliation: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    years_of_experience: Mapped[int] = mapped_column(Integer, default=0)
    specialization: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    consultation_mode: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    available_days: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    available_time: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    contact_email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    medical_license_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    degree_certificate_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    verification_status: Mapped[str] = mapped_column(String(50), default="Pending") # Pending, Verified, Rejected
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    user = relationship("User", backref="professional_profile")
