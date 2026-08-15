"""
Ingredient Intelligence Engine models — Milestone 3, Step 1.

Ingredients are modeled by CATEGORY (Retinoid, AHA/BHA, Vitamin C,
Niacinamide, Hyaluronic Acid, Ceramide, Peptide, ...) because the chemical
conflict matrix operates at the category level (e.g. "any Retinoid clashes
with any strong AHA/BHA"), matching the spec's knowledge-base examples.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Table
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from core.database import Base

# Association table: many-to-many between products and ingredients.
product_ingredients = Table(
    "product_ingredients",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id"), primary_key=True),
    Column("ingredient_id", UUID(as_uuid=True), ForeignKey("ingredients.id"), primary_key=True),
)


class Ingredient(Base):
    """One entry in the ingredient knowledge base."""

    __tablename__ = "ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False, unique=True)
    category = Column(String(50), nullable=False, index=True)  # Retinoid, AHA/BHA, Vitamin C, ...
    aliases = Column(JSONB, nullable=False, default=list)  # other names this ingredient/allergen is known by
    irritation_risk = Column(String(20), nullable=False, default="Low")  # Low, Medium, High
    description = Column(String(300), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    products = relationship("Product", secondary=product_ingredients, back_populates="ingredients")


class IngredientConflict(Base):
    """
    A rule in the Chemical Conflict Matrix: category A is unsafe (or should
    be used cautiously) alongside category B in the same routine step.
    Stored as an unordered pair — lookups check both orderings.
    """

    __tablename__ = "ingredient_conflicts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_a = Column(String(50), nullable=False)
    category_b = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False, default="Warning")  # Warning, Unsafe
    reason = Column(String(300), nullable=False)
