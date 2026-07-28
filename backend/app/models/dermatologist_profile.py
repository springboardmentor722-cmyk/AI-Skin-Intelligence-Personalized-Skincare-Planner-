import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class DermatologistProfile(Base):
    __tablename__ = "dermatologist_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    medical_license_number = Column(String(100), nullable=True)
    hospital_or_clinic_name = Column(String(255), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    specialization = Column(String(150), nullable=True)  # e.g. "Cosmetic Dermatology"
    bio = Column(String(1000), nullable=True)

    # --- NEW: admin approval tracking (added for RBAC approval workflow) ---
    medical_council_registration = Column(String(150), nullable=True)
    government_id_url = Column(String(500), nullable=True)
    medical_degree_certificate_url = Column(String(500), nullable=True)
    medical_license_upload_url = Column(String(500), nullable=True)
    profile_photo_url = Column(String(500), nullable=True)
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    # --- end new columns ---

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="dermatologist_profile", foreign_keys=[user_id])