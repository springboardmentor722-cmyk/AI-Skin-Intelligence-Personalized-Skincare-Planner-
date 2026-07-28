import enum
import uuid
from datetime import datetime

from sqlalchemy import Column, String, DateTime, Enum, Float, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.postgres import Base


class ProductCategory(str, enum.Enum):
    FACE_WASH = "face_wash"
    MOISTURIZER = "moisturizer"
    SUNSCREEN = "sunscreen"
    SERUM = "serum"
    TONER = "toner"
    TREATMENT = "treatment"
    FACE_MASK = "face_mask"


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False, index=True)
    brand = Column(String(150), nullable=True)
    category = Column(Enum(ProductCategory), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=True)
    suitable_for_skin_types = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    rating = Column(Float, default=4.5)
    concerns = Column(String(500), nullable=True)
    usage_instructions = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    ingredient_links = relationship("ProductIngredient", back_populates="product", cascade="all, delete-orphan")


class ProductIngredient(Base):
    """Many-to-many link table between products and ingredients."""
    __tablename__ = "product_ingredients"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    ingredient_id = Column(UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), nullable=False)

    product = relationship("Product", back_populates="ingredient_links")
    ingredient = relationship("Ingredient", back_populates="product_links")