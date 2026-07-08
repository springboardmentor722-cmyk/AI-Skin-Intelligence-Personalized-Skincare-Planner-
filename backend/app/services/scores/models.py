import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. Owned by the Skin Health
# Scoring service (docs/ARCHITECTURE.md §4).


class ScoringWeights(Base):
    __tablename__ = "scoring_weights"
    __table_args__ = (
        CheckConstraint(
            "skin_condition_weight + lifestyle_weight + sleep_quality_weight "
            "+ routine_adherence_weight + hydration_weight = 1.00",
            name="chk_weights_sum",
        ),
    )

    weight_id: Mapped[int] = mapped_column(primary_key=True)
    skin_condition_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.35)
    lifestyle_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.20)
    sleep_quality_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.15)
    routine_adherence_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.20)
    hydration_weight: Mapped[float] = mapped_column(Numeric(4, 2), default=0.10)
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class SkinScore(Base):
    __tablename__ = "skin_scores"
    __table_args__ = (Index("idx_skin_scores_user_time", "user_id", "calculated_at"),)

    score_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    skin_condition_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    lifestyle_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    sleep_quality_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    hydration_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    routine_adherence_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    overall_score: Mapped[float | None] = mapped_column(Numeric(5, 2), default=None)
    weight_id: Mapped[int | None] = mapped_column(
        ForeignKey("scoring_weights.weight_id"), default=None
    )
    calculated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
