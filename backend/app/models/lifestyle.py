from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from datetime import datetime, date
from app import Base

class LifestyleTracking(Base):
    """Lifestyle tracking model"""
    __tablename__ = "lifestyle_tracking"
    
    tracking_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    # Daily data
    tracking_date = Column(Date, nullable=False)
    
    # Sleep
    sleep_duration = Column(Float)  # Hours (e.g., 7.5)
    sleep_quality = Column(String(20))  # Poor, Fair, Good, Excellent
    
    # Hydration
    water_intake = Column(Integer)  # Glasses per day
    
    # Exercise
    exercise_duration = Column(Integer)  # Minutes
    exercise_type = Column(String(100))  # Running, Yoga, Gym, etc.
    
    # Stress
    stress_level = Column(Integer)  # 1-10 scale
    
    # Environment
    environmental_exposure = Column(Text)  # Comma-separated (Sun, Pollution, AC, etc.)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)