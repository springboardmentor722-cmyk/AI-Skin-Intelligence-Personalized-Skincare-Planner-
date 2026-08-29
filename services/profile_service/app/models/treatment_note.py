from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func

from services.auth_service.app.db.database import Base


class TreatmentNote(Base):
    __tablename__ = "treatment_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    dermatologist_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    text = Column(String(2000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())