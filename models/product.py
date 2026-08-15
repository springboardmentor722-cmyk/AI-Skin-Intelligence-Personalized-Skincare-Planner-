"""Product e-store models — Milestone 3."""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship

from core.database import Base

PRODUCT_CATEGORIES = ["Cleanser", "Serum", "Moisturizer", "Sunscreen", "Toner", "Mask", "Treatment"]


class Product(Base):
    """
    Real, named skincare products (brand + product name are public facts,
    not reproduced marketing copy). Product photography is deliberately
    NOT scraped from brand sites — see ProductImage.jsx on the frontend,
    which renders a clean generated icon per category instead.
    """

    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    brand = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(500), nullable=True)

    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    rating = Column(Numeric(2, 1), nullable=False, default=4.0)
    review_count = Column(Integer, nullable=False, default=0)

    # --- Recommendation Engine inputs (Milestone 3) ---
    concern_tags = Column(JSONB, nullable=False, default=list)  # e.g. ["Acne", "Oily Skin"]
    skin_type_tags = Column(JSONB, nullable=False, default=list)  # e.g. ["Oily", "Combination"]

    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    ingredients = relationship(
        "Ingredient", secondary="product_ingredients", back_populates="products"
    )


class ProductRecommendation(Base):
    """A consultant recommending a specific product to a specific client."""

    __tablename__ = "product_recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consultant_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    client_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)

    note = Column(String(300), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    product = relationship("Product")
    consultant = relationship("User", foreign_keys=[consultant_id])
    client = relationship("User", foreign_keys=[client_id])


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    status = Column(String(20), nullable=False, default="Placed")  # Placed, Shipped, Delivered, Cancelled

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product")
