"""Notification & Reminder System — completing the project spec's §10."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from core.database import Base

# Kept as plain strings (not a DB enum) — matches this codebase's existing
# preference for VARCHAR + application-level validation.
NOTIFICATION_TYPES = [
    "routine_reminder",
    "hydration_reminder",
    "sleep_reminder",
    "progress_alert",
    "product_replenishment",
    "recommendation",
    "referral",
    "appointment_update",
    "routine_updated",
    "platform",
]


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    type = Column(String(30), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(String(500), nullable=False)
    link_to = Column(String(100), nullable=True)  # frontend route to deep-link to, e.g. "/planner"

    # Dedupe key so contextual reminders (hydration, sleep, routine) aren't
    # recreated every time the generator runs — one per user per day per kind.
    dedupe_key = Column(String(150), nullable=True, index=True)

    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User")
