import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, JSON, Integer, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

class ConsultantProfile(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "consultant_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    bio = Column(Text, nullable=True)
    specialization = Column(String, nullable=True)
    certifications = Column(String, nullable=True)
    brand_affiliations = Column(String, nullable=True)
    
    # Relationships
    user = relationship("User", backref="consultant_profile")

class ClientAssignment(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "client_assignments"
    
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, COMPLETED, PENDING
    assigned_at = Column(DateTime, default=datetime.utcnow)
    
    consultant = relationship("User", foreign_keys=[consultant_id])
    client = relationship("User", foreign_keys=[client_id])

class ConsultantRecommendation(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "consultant_recommendations"
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    category = Column(String, nullable=False) # Face Wash, Moisturizer, Sunscreen, Serum, Toner, Face Mask
    reason = Column(Text, nullable=True)
    usage_instructions = Column(Text, nullable=True)
    time_of_day = Column(String, nullable=True) # Morning, Evening, Both, Weekly
    notes = Column(Text, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])
    consultant = relationship("User", foreign_keys=[consultant_id])

class ConsultantNote(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "consultant_notes"
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    note_type = Column(String, nullable=False) # PROGRESS, LIFESTYLE, ROUTINE, GENERAL
    content = Column(Text, nullable=False)
    is_visible_to_client = Column(Boolean, default=False)
    
    client = relationship("User", foreign_keys=[client_id])
    consultant = relationship("User", foreign_keys=[consultant_id])

class ConsultantFollowup(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "consultant_followups"
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    scheduled_date = Column(DateTime, nullable=False)
    status = Column(String, default="PENDING") # PENDING, COMPLETED, CANCELLED
    notes = Column(Text, nullable=True)
    
    client = relationship("User", foreign_keys=[client_id])
    consultant = relationship("User", foreign_keys=[consultant_id])

class RecommendationHistory(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "recommendation_history"
    
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    action = Column(String, nullable=False) # ADDED, REMOVED, MODIFIED
    details = Column(JSON, nullable=True) # Old state / New state
    
    client = relationship("User", foreign_keys=[client_id])
    consultant = relationship("User", foreign_keys=[consultant_id])
