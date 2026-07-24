import datetime

from sqlalchemy import CheckConstraint, ForeignKey, Index, Numeric, func, text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base
from app.services.scores import constants

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
        # Migration c21b3568fc1a — found two active rows live (an accidental double
        # seed), which made "the active weights" non-deterministic. At most one
        # is_active=true row can exist now.
        Index(
            "uq_scoring_weights_one_active",
            "is_active",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )

    weight_id: Mapped[int] = mapped_column(primary_key=True)
    skin_condition_weight: Mapped[float] = mapped_column(
        Numeric(4, 2), default=constants.SKIN_CONDITION_WEIGHT
    )
    lifestyle_weight: Mapped[float] = mapped_column(
        Numeric(4, 2), default=constants.LIFESTYLE_WEIGHT
    )
    sleep_quality_weight: Mapped[float] = mapped_column(
        Numeric(4, 2), default=constants.SLEEP_QUALITY_WEIGHT
    )
    routine_adherence_weight: Mapped[float] = mapped_column(
        Numeric(4, 2), default=constants.ROUTINE_ADHERENCE_WEIGHT
    )
    hydration_weight: Mapped[float] = mapped_column(
        Numeric(4, 2), default=constants.HYDRATION_WEIGHT
    )
    is_active: Mapped[bool | None] = mapped_column(default=True)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class SkinScore(Base):
    # Renamed from skin_scores to skin_assessments (2026-07-14) to match
    # mile_2.docx's literal table name — see docs/milestones/milestone_2/MASTER_PROMPT.md
    # Phase 1. Class name kept as SkinScore; only the DB-facing table name changed.
    __tablename__ = "skin_assessments"
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
