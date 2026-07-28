import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class ConsultantProfile(Base):
    __tablename__ = "consultant_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialization = Column(String(150), nullable=True)
    years_of_experience = Column(Integer, nullable=True)
    certification = Column(String(255), nullable=True)
    bio = Column(String(1000), nullable=True)

    government_id_url = Column(String(500), nullable=True)
    certificate_url = Column(String(500), nullable=True)  # NEW — uploaded certificate file path
    admin_notes = Column(Text, nullable=True)
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = relationship("User", back_populates="consultant_profile", foreign_keys=[user_id])