"""Progress photo timeline model — Milestone 3, Step 3.

Deliberately separate from SkinProfile.skin_photo_url (the single
"current" profile photo from Milestone 1). This is a append-only timeline
of dated, tagged snapshots ("Baseline", "Week 4", ...) used for
before/after comparison — matches the spec's photo pipeline exactly,
just backed by local disk storage instead of AWS S3 / Azure Blob for now
(see README for the swap-over notes once cloud credentials are available).
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base


class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    photo_url = Column(String(255), nullable=False)
    tag = Column(String(50), nullable=True)  # "Baseline", "Week 4", or any custom label
    skin_health_score_at_upload = Column(Float, nullable=True)

    uploaded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
