from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    """User model for database"""
    __tablename__ = "users"
    
    # Primary Key
    user_id = Column(Integer, primary_key=True, index=True)
    
    # Account Information
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    username = Column(String(100), nullable=False)
    
    # Personal Information
    first_name = Column(String(100))
    last_name = Column(String(100))
    age = Column(Integer)
    gender = Column(String(20))
    phone = Column(String(15))
    
    # Role
    role_id = Column(Integer, nullable=False, default=1)  # 1 = User, 2 = Dermatologist, 3 = Consultant, 4 = Admin
    
    # Status
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # ✅ Admin approval required
    
    # Health Metrics
    health_score = Column(Numeric(3, 1), default=7.0)  # 0.0 to 99.9
    compliance_percentage = Column(Numeric(5, 2), default=0.00)  # 0.00 to 999.99
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)