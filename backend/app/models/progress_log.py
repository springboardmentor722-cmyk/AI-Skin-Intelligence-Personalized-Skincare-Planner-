import uuid
from datetime import date, datetime

from sqlalchemy import Column, String, DateTime, Date, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    log_date = Column(Date, default=date.today, nullable=False)
    skin_condition_notes = Column(Text, nullable=True)
    routine_adherence_percent = Column(Integer, nullable=True)  # 0-100
    photo_url = Column(String(500), nullable=True)  # placeholder for before/after images (later milestone)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress_logs")