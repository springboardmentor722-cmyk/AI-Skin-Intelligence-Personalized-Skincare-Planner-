from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app import Base

class Consultation(Base):
    """Consultation model for tracking expert consultations"""
    __tablename__ = "consultations"
    
    consultation_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    dermatologist_id = Column(Integer, ForeignKey("dermatologist_profiles.dermatologist_id"), nullable=True)
    consultant_id = Column(Integer, ForeignKey("consultant_profiles.consultant_id"), nullable=True)
    
    status = Column(String(50), default="pending")  # pending, approved, completed, cancelled
    title = Column(String(255))
    description = Column(Text)
    scheduled_date = Column(DateTime)
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)