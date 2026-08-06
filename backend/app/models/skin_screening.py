from sqlalchemy import Column, Integer, String, Text, DateTime, Numeric, ForeignKey
from datetime import datetime
from app import Base

class SkinScreening(Base):
    """Skin screening/AI photo analysis model"""
    __tablename__ = "skin_screening"
    
    screening_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    image_url = Column(Text)  # Path to stored image
    analysis_result = Column(Text)  # AI analysis result
    confidence_score = Column(Numeric(5, 2))  # 0-100
    screening_date = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)