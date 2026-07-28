"""
Booking models — Milestone 3.

Consultants and dermatologists are booked differently, matching how each
relationship actually works in the real world:

- ConsultantAssignment: an ongoing relationship. The user picks a
  consultant and it starts immediately (status="Active") — no schedule
  involved, since consulting is continuous check-ins, not a single visit.

- DermatologistAppointment: a one-off scheduled visit. The user picks a
  date/time/reason, it starts as "Pending", and the dermatologist moves
  it through Confirmed -> Completed (or Cancelled) from their dashboard.
"""

import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Column, Date, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

# Status vocab kept as plain strings (not a DB enum) so new statuses can be
# added later without a migration — matches the rest of this codebase's
# preference for VARCHAR + application-level validation over DB enums.
ASSIGNMENT_STATUSES = ["Active", "Completed", "Cancelled"]
APPOINTMENT_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"]


class ConsultantAssignment(Base):
    __tablename__ = "consultant_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    status = Column(String(20), nullable=False, default="Active")
    message = Column(String(500), nullable=True)  # optional note the user leaves when booking

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    consultant = relationship("User", foreign_keys=[consultant_id])
    client = relationship("User", foreign_keys=[client_id])


class DermatologistAppointment(Base):
    __tablename__ = "dermatologist_appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dermatologist_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    appointment_date = Column(Date, nullable=False)
    appointment_time = Column(String(10), nullable=False)  # "HH:MM", 24h — avoids TIME-type driver quirks
    reason = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="Pending")

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    dermatologist = relationship("User", foreign_keys=[dermatologist_id])
    patient = relationship("User", foreign_keys=[patient_id])
