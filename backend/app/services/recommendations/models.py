import datetime

from sqlalchemy import ForeignKey, Index, Numeric, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. This service (Product
# Recommendation, docs/ARCHITECTURE.md §4) owns `products` and its junction tables;
# `product_ingredients` isn't mapped here — no dashboard/recommendation code path reads
# it yet, and mapping unused tables ahead of need isn't this task's job.


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[int] = mapped_column(primary_key=True)
    brand_name: Mapped[str | None] = mapped_column(default=None)
    product_name: Mapped[str | None] = mapped_column(default=None)
    category: Mapped[str | None] = mapped_column(default=None)
    product_url: Mapped[str | None] = mapped_column(default=None)
    image_url: Mapped[str | None] = mapped_column(default=None)
    price: Mapped[float | None] = mapped_column(Numeric(10, 2), default=None)
    currency: Mapped[str | None] = mapped_column(default=None)
    volume_ml: Mapped[int | None] = mapped_column(default=None)
    spf_rating: Mapped[int | None] = mapped_column(default=None)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class ProductSkinType(Base):
    __tablename__ = "product_skin_types"
    __table_args__ = (
        UniqueConstraint("product_id", "skin_type_id"),
        Index("idx_product_skin_types_product", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE")
    )
    skin_type_id: Mapped[int] = mapped_column(ForeignKey("skin_types.skin_type_id"))


class ProductConcern(Base):
    __tablename__ = "product_concerns"
    __table_args__ = (
        UniqueConstraint("product_id", "concern_id"),
        Index("idx_product_concerns_product", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE")
    )
    concern_id: Mapped[int] = mapped_column(ForeignKey("skin_concerns.concern_id"))
