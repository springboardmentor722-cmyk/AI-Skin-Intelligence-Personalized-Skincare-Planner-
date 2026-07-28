# app/models/engagement.py
"""
New tables for the real (non-mock) Consultant/Dermatologist/Admin dashboards:
appointments, user<->consultant links, user<->dermatologist links,
skin assessment reviews, consultations, consultation messages,
AI recommendation history, notifications.
"""
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    professional_type = Column(String(20), nullable=False)  # "consultant" | "dermatologist"

    scheduled_at = Column(DateTime, nullable=False)
    reason = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False, default="pending")  # pending, confirmed, completed, cancelled

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    professional = relationship("User", foreign_keys=[professional_id])


class UserConsultantLink(Base):
    __tablename__ = "user_consultant_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")  # pending, active, ended
    assigned_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    consultant = relationship("User", foreign_keys=[consultant_id])


class UserDermatologistLink(Base):
    __tablename__ = "user_dermatologist_links"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dermatologist_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    assigned_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    dermatologist = relationship("User", foreign_keys=[dermatologist_id])


class SkinAssessmentReview(Base):
    __tablename__ = "skin_assessment_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    skin_profile_id = Column(UUID(as_uuid=True), ForeignKey("skin_profiles.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reviewer_type = Column(String(20), nullable=True)  # "consultant" | "dermatologist"

    status = Column(String(20), nullable=False, default="pending")  # pending, reviewed
    reviewer_notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    reviewer = relationship("User", foreign_keys=[reviewer_id])


class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    professional_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    professional_type = Column(String(20), nullable=False)

    status = Column(String(20), nullable=False, default="ongoing")  # ongoing, completed
    summary = Column(Text, nullable=True)

    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])
    professional = relationship("User", foreign_keys=[professional_id])
    messages = relationship("ConsultationMessage", back_populates="consultation", cascade="all, delete-orphan")


class ConsultationMessage(Base):
    __tablename__ = "consultation_messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultation_id = Column(UUID(as_uuid=True), ForeignKey("consultations.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    consultation = relationship("Consultation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id])


class AIRecommendationHistory(Base):
    __tablename__ = "ai_recommendation_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recommendation_text = Column(Text, nullable=False)
    source = Column(String(50), nullable=True)  # e.g. "skin_assessment", "consultant_review"
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    type = Column(String(50), nullable=True)  # e.g. "appointment", "approval", "message"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])