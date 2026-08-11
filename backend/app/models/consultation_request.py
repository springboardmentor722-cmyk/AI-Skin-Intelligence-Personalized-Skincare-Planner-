from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class ConsultationRequest(Base):

    __tablename__ = "consultation_requests"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    expert_id = Column(Integer, ForeignKey("users.id"))

    expert_role = Column(String)

    status = Column(String, default="Pending")

    created_at = Column(DateTime(timezone=True), server_default=func.now())