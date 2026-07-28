# app/models/recommendation.py
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Float
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.db.postgres import Base


class ProfessionalRecommendation(Base):
    __tablename__ = "professional_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    author_role = Column(String(20), nullable=False)  # "consultant" | "dermatologist"

    diagnosis = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    recommended_products = Column(JSONB, nullable=True)  # list of dicts: {id, name, brand, category, instructions}
    prescription = Column(JSONB, nullable=True)  # list of dicts: {medicine, dosage, instructions, duration, warnings}
    lifestyle_changes = Column(JSONB, nullable=True)  # list of strings
    morning_routine = Column(JSONB, nullable=True)  # list of morning steps
    evening_routine = Column(JSONB, nullable=True)  # list of evening steps
    follow_up_date = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    author = relationship("User", foreign_keys=[author_id])


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    assessment_id = Column(UUID(as_uuid=True), ForeignKey("skin_assessments.id", ondelete="CASCADE"), nullable=True)
    reason = Column(Text, nullable=True)
    confidence_score = Column(Float, default=0.8)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    product = relationship("Product", foreign_keys=[product_id])
