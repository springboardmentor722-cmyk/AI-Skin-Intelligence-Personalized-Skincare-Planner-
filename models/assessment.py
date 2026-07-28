"""
SkinAssessment model — Milestone 2.

Stores one historical snapshot every time the scoring engine runs, so the
app can chart a user's skin-health trajectory over time (Milestone 3).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from core.database import Base


class SkinAssessment(Base):
    __tablename__ = "skin_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    # --- Required by the Milestone 2 spec ---
    overall_score = Column(Float, nullable=False)
    detected_concerns = Column(JSONB, nullable=False, default=list)  # [{"name": "Acne", "severity": "High"}, ...]
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # --- Additions beyond the minimal spec, kept because the frontend score
    #     dashboard (Step 5) needs the per-component breakdown, and storing
    #     it avoids recomputing historical breakdowns after the fact. ---
    primary_concern = Column(String(100), nullable=True)
    skin_condition_score = Column(Float, nullable=True)   # S_cond  (35%)
    lifestyle_score = Column(Float, nullable=True)        # L_habits (20%)
    sleep_score = Column(Float, nullable=True)            # S_sleep (15%)
    consistency_score = Column(Float, nullable=True)      # R_consist (20%)
    hydration_score = Column(Float, nullable=True)        # H_hydro (10%)

    skin_type = Column(String(50), nullable=True)
    is_highly_sensitive = Column(Boolean, nullable=False, default=False)

    user = relationship("User")
    routines = relationship("SkincareRoutine", back_populates="assessment")
