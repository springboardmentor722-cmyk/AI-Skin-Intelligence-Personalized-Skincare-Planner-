from sqlalchemy import Column, Integer, String, ForeignKey, Text
from app.database.database import Base

class Consultation(Base):

    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    expert_id = Column(Integer, ForeignKey("users.id"))

    status = Column(String(20), default="Pending")

    recommendation = Column(Text, nullable=True)