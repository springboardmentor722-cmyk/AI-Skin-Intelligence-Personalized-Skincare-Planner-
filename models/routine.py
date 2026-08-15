"""
SkincareRoutine model — Milestone 2.

Each row is a single step (e.g. "Cleansing", step_number 1, time_of_day
"AM") in a generated routine. A full routine for a user is the collection
of active rows for that user. Regenerating a routine deactivates
(is_active = False) the previous rows rather than deleting them, so
routine history is preserved.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class SkincareRoutine(Base):
    __tablename__ = "skincare_routines"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("skin_assessments.id"), nullable=False)

    time_of_day = Column(String(10), nullable=False)   # "AM", "PM", or "Weekly"
    step_number = Column(Integer, nullable=False)
    step_category = Column(String(50), nullable=False)  # Cleansing, Treatment, Moisturizing, Sun Protection, ...
    is_active = Column(Boolean, nullable=False, default=True)

    # --- Milestone 3: provider routine overwrite ---
    source = Column(String(20), nullable=False, default="auto")  # "auto" (decision matrix) or "provider"
    set_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # consultant/dermatologist, if source="provider"
    note = Column(String(300), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", foreign_keys=[user_id])
    set_by = relationship("User", foreign_keys=[set_by_id])
    assessment = relationship("SkinAssessment", back_populates="routines")
