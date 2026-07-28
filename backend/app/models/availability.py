# app/models/availability.py
"""
ProfessionalAvailability – stores the available time slots for each
approved consultant / dermatologist.  Slots are generated automatically
(seeded) for the coming 14 days when the server starts, and are marked
is_booked=True once an appointment is confirmed against them.
"""
import uuid
from datetime import date, time, datetime

from sqlalchemy import Column, String, Date, Time, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class ProfessionalAvailability(Base):
    __tablename__ = "professional_availability"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The professional (consultant OR dermatologist – both stored in users table)
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    professional_type = Column(
        String(20), nullable=False
    )  # "consultant" | "dermatologist"

    slot_date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # True once an Appointment row is linked to this slot
    is_booked = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    professional = relationship("User", foreign_keys=[professional_id])
