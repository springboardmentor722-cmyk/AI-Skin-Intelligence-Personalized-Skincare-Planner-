import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class Appointment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "appointments"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    screening_request_id = Column(UUID(as_uuid=True), ForeignKey("screening_requests.id", ondelete="SET NULL"), nullable=True)
    
    appointment_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="PENDING") # PENDING, CONFIRMED, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    meeting_link = Column(String(500), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    professional = relationship("User", foreign_keys=[professional_id])
    screening_request = relationship("ScreeningRequest")
