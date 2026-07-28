import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), unique=True, nullable=False, index=True)  # e.g. "Niacinamide"
    category = Column(String(100), nullable=True)  # e.g. "Retinoids", "Vitamin C"
    benefits = Column(Text, nullable=True)  # e.g. "Brightens skin, reduces pigmentation"
    common_side_effects = Column(Text, nullable=True)
    suitable_for_skin_types = Column(String(255), nullable=True)  # comma-separated for Milestone 1 simplicity
    risk_level = Column(String(50), default="low")

    created_at = Column(DateTime, default=datetime.utcnow)

    product_links = relationship("ProductIngredient", back_populates="ingredient", cascade="all, delete-orphan")