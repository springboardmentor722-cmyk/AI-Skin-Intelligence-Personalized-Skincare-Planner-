from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Numeric, ForeignKey
from datetime import datetime
from app import Base

class DermatologistProfile(Base):
    """Dermatologist profile model"""
    __tablename__ = "dermatologist_profiles"
    
    dermatologist_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    
    license_number = Column(String(100), unique=True)
    specialization = Column(String(255))
    hospital_name = Column(String(255))
    years_experience = Column(Integer)
    bio = Column(Text)
    availability_status = Column(String(50), default="available")
    consultation_fee = Column(Numeric(10, 2))
    is_verified = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)