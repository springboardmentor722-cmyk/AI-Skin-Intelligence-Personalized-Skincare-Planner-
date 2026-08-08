import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class ScreeningRequest(Base):
    __tablename__ = "screening_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dermatologist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    # AI generated payload & uploaded files
    preliminary_routine_id = Column(UUID(as_uuid=True), ForeignKey("skincare_routines.id", ondelete="SET NULL"), nullable=True)
    image_url = Column(String, nullable=True)
    
    status = Column(String, default="SUBMITTED", nullable=False) # SUBMITTED, ASSIGNED, UNDER_REVIEW, ACCEPTED, REJECTED, COMPLETED
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ClinicalReview(Base):
    __tablename__ = "clinical_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    screening_request_id = Column(UUID(as_uuid=True), ForeignKey("screening_requests.id", ondelete="CASCADE"), nullable=False)
    dermatologist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    
    clinical_notes = Column(Text, nullable=True)
    modifications_made = Column(String, nullable=True) # JSON dump of changes
    
    action_taken = Column(String, nullable=False) # ACCEPTED, REJECTED, MODIFIED, REQUESTED_INFO
    reviewed_at = Column(DateTime, default=datetime.utcnow)
