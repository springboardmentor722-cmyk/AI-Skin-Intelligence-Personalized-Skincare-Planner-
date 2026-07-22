import datetime

from sqlalchemy import ForeignKey, Index, Numeric, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. This service (Product
# Recommendation, docs/ARCHITECTURE.md §4) owns `products` and its `product_*` junction
# tables, including `product_ingredients` (mapped below — the M1 "prepare initial
# database" seeding task needs it to link seeded products to seeded ingredients; no
# recommendation-ranking code path reads it yet, that's M3 scope).


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
    # M3-C: real Sephora product_info.csv columns (rating, reviews) — nullable,
    # curated seed rows have neither (database_schemas README_v3_changes.md).
    rating: Mapped[float | None] = mapped_column(Numeric(3, 2), default=None)
    review_count: Mapped[int | None] = mapped_column(default=None)
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
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id", ondelete="CASCADE"))
    skin_type_id: Mapped[int] = mapped_column(ForeignKey("skin_types.skin_type_id"))


class ProductConcern(Base):
    __tablename__ = "product_concerns"
    __table_args__ = (
        UniqueConstraint("product_id", "concern_id"),
        Index("idx_product_concerns_product", "product_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id", ondelete="CASCADE"))
    concern_id: Mapped[int] = mapped_column(ForeignKey("skin_concerns.concern_id"))


class ProductIngredient(Base):
    __tablename__ = "product_ingredients"
    __table_args__ = (UniqueConstraint("product_id", "ingredient_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id", ondelete="CASCADE"))
    ingredient_id: Mapped[int] = mapped_column(ForeignKey("ingredients.ingredient_id"))
    concentration_notes: Mapped[str | None] = mapped_column(default=None)


class ProductRecommendation(Base):
    """No DDL change (M3-D, milestone_3.md §5) — this is simply the table's first
    real writer. One row per product per *served* recommendation set (an audit
    trail for consultants/admin, not an upsert-replaced "current state" row) — the
    same append-only spirit as `audit_logs`. `recommendation_reason` is `reasons[]`
    joined with "; " since the column is a single TEXT, not an array."""

    __tablename__ = "product_recommendations"
    __table_args__ = (Index("idx_product_recommendations_user", "user_id"),)

    recommendation_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"))
    recommendation_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    recommendation_reason: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
