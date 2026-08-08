from typing import List
from sqlalchemy import String, Text, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base, UUIDMixin, TimestampMixin

# Many-to-many relationship table between Product and Ingredient
product_ingredients = Table(
    "product_ingredients",
    Base.metadata,
    Column("product_id", UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), primary_key=True),
    Column("ingredient_id", UUID(as_uuid=True), ForeignKey("ingredients.id", ondelete="CASCADE"), primary_key=True),
)

class Ingredient(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "ingredients"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    benefits: Mapped[str] = mapped_column(Text, nullable=True)
    concerns_targeted: Mapped[str] = mapped_column(Text, nullable=True)
    base_conflicts: Mapped[str] = mapped_column(Text, nullable=True)
    allergy_triggers: Mapped[str] = mapped_column(Text, nullable=True)

    products: Mapped[List["Product"]] = relationship(
        "Product", secondary=product_ingredients, back_populates="ingredients"
    )

class Product(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "products"

    name: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=True)
    product_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., Cleanser, Serum
    description: Mapped[str] = mapped_column(Text, nullable=True)
    skin_types: Mapped[str] = mapped_column(String(255), nullable=True) # e.g., "Oily, Combination"
    price: Mapped[float] = mapped_column(nullable=True, default=0.0)
    rating: Mapped[float] = mapped_column(nullable=True, default=0.0)
    image_url: Mapped[str] = mapped_column(String(500), nullable=True)

    ingredients: Mapped[List["Ingredient"]] = relationship(
        "Ingredient", secondary=product_ingredients, back_populates="products"
    )
