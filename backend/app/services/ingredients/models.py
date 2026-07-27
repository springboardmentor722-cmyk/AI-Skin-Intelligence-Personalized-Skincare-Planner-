import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, UniqueConstraint, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. Ingredient Intelligence
# (docs/ARCHITECTURE.md §4, service #5) owns `ingredients` and its two junctions; only
# these three tables are mapped here — no router/service.py yet (the service's API
# surface is M3 scope, not M1's "prepare initial database" seeding task).


class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_name: Mapped[str] = mapped_column(unique=True)
    inci_name: Mapped[str | None] = mapped_column(default=None)
    category: Mapped[str | None] = mapped_column(default=None)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class IngredientConcernTreats(Base):
    __tablename__ = "ingredient_concern_treats"
    __table_args__ = (UniqueConstraint("ingredient_id", "concern_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.ingredient_id", ondelete="CASCADE")
    )
    concern_id: Mapped[int] = mapped_column(
        ForeignKey("skin_concerns.concern_id", ondelete="CASCADE")
    )
    evidence_strength: Mapped[str | None] = mapped_column(default="moderate")


class IngredientSkintypeAvoid(Base):
    __tablename__ = "ingredient_skintype_avoid"
    __table_args__ = (UniqueConstraint("ingredient_id", "skin_type_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    ingredient_id: Mapped[int] = mapped_column(
        ForeignKey("ingredients.ingredient_id", ondelete="CASCADE")
    )
    skin_type_id: Mapped[int] = mapped_column(
        ForeignKey("skin_types.skin_type_id", ondelete="CASCADE")
    )
    reason: Mapped[str | None] = mapped_column(default=None)


class IngredientSafetyConfig(Base):
    """Tunable numeric parameters for the Safety Score endpoint (MILESTONE 3.pdf
    Step 1) — same config-driven philosophy as scores/models.py's ScoringWeights
    (AGENTS.md §2 rule 7): retuning is a DB update, not a deploy. The pairwise
    chemistry facts themselves stay in app/ai/interactions.py's hand-curated dict
    (its own docstring explains why — vetted facts, not tunable weights); only the
    score-formula's deductions/thresholds live here."""

    __tablename__ = "ingredient_safety_config"
    __table_args__ = (
        CheckConstraint(
            "safe_threshold > warning_threshold", name="chk_safety_thresholds_ordered"
        ),
        Index(
            "uq_ingredient_safety_config_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    config_id: Mapped[int] = mapped_column(primary_key=True)
    avoid_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=40.0)
    caution_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=15.0)
    allergy_deduction: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
    safe_threshold: Mapped[float] = mapped_column(Numeric(5, 2), default=80.0)
    warning_threshold: Mapped[float] = mapped_column(Numeric(5, 2), default=50.0)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
