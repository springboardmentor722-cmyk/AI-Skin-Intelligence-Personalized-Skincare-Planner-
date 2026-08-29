from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func

from services.auth_service.app.db.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    skin_type = Column(String(50), nullable=False)
    skin_tone = Column(String(50), nullable=False)
    skin_concerns = Column(String(255), nullable=False)
    allergies = Column(String(255), nullable=True)
    goals = Column(String(255), nullable=True)

    water_intake = Column(Float, nullable=False)
    sleep_hours = Column(Float, nullable=False)

    exercise_frequency = Column(String(50), nullable=False)
    stress_level = Column(String(50), nullable=False)
    sun_exposure = Column(String(50), nullable=False)

    consultant_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())