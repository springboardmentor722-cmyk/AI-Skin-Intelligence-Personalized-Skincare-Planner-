from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app import Base

class UserProfile(Base):
    """User skin profile model"""
    __tablename__ = "user_profiles"
    
    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    
    # Skin Information
    skin_type = Column(String(50))  # Dry, Oily, Combination, Normal, Sensitive
    skin_tone = Column(String(50))
    
    # Health Information
    allergies = Column(Text)  # Comma-separated or JSON
    sensitivities = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)