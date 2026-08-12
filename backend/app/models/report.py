from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, Text
from sqlalchemy.sql import func
from app.database.database import Base

class Report(Base):
    __tablename__ = "reports"
    report_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False, unique=True)
    report_date = Column(Date, nullable=False)
    patient_summary = Column(Text, nullable=True)
    clinical_observations = Column(Text, nullable=True)
    skin_assessment = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    skincare_routine = Column(Text, nullable=True)
    follow_up_instructions = Column(Text, nullable=True)
    additional_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
