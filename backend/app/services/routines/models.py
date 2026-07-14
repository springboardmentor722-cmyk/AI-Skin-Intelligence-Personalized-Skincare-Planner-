import datetime

from sqlalchemy import ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. Owned by the Routine Planner
# service (docs/ARCHITECTURE.md §4).


class Routine(Base):
    __tablename__ = "routines"
    __table_args__ = (
        Index("idx_routines_user", "user_id"),
        Index("idx_routines_user_active", "user_id", "is_active"),
    )

    routine_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    routine_name: Mapped[str | None] = mapped_column(default=None)
    routine_type: Mapped[str | None] = mapped_column(default=None)
    # "AM" | "PM" | "Weekly" | "Seasonal"
    description: Mapped[str | None] = mapped_column(Text, default=None)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    generated_by_ai: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class RoutineStep(Base):
    __tablename__ = "routine_steps"
    __table_args__ = (Index("idx_routine_steps_routine", "routine_id"),)

    step_id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.routine_id", ondelete="CASCADE"))
    step_order: Mapped[int | None] = mapped_column(default=None)
    step_name: Mapped[str | None] = mapped_column(default=None)
    instruction: Mapped[str | None] = mapped_column(Text, default=None)
    duration_minutes: Mapped[int | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class RoutineProduct(Base):
    __tablename__ = "routine_products"

    routine_product_id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(ForeignKey("routines.routine_id", ondelete="CASCADE"))
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"))
    step_id: Mapped[int | None] = mapped_column(ForeignKey("routine_steps.step_id"), default=None)
    usage_notes: Mapped[str | None] = mapped_column(Text, default=None)
