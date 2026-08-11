from sqlalchemy import Column, Integer, String, Text, DECIMAL, ForeignKey
from app.database.database import Base

class Lifestyle(Base):
    __tablename__ = "lifestyle"

    lifestyle_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    sleep_duration = Column(DECIMAL(4,2))
    water_intake = Column(DECIMAL(4,2))
    exercise = Column(String(100))
    stress_level = Column(String(50))
    environmental_exposure = Column(Text)