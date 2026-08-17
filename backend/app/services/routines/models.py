import datetime

from sqlalchemy import ForeignKey, Index, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base

# Nullability/types match database_schemas/skinlytics_postgresql_schema_v3.sql's literal
# DDL exactly, same discipline as skin_profile/models.py. Owned by the Routine Planner
# service (docs/ARCHITECTURE.md §4).


class Routine(Base):
    # Renamed from routines to skincare_routines (2026-07-14) to match mile_2.docx's
    # literal table name — see docs/milestones/milestone_2/MASTER_PROMPT.md Phase 1.
    # Class name kept as Routine; only the DB-facing table name changed.
    __tablename__ = "skincare_routines"
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
    # Milestone 2 Step 1.1's "assessment_id" — best-effort link to whichever
    # skin_assessments row was the most recently computed one when this routine was
    # generated (nullable: a user can generate routines before ever computing a
    # score). Never force-computes a score as a side effect of routine generation —
    # see routines/service.py::get_or_generate_routines.
    score_id: Mapped[int | None] = mapped_column(
        ForeignKey("skin_assessments.score_id"), default=None
    )
    # M2-P11: which profile *version* this routine was generated against — lets
    # get_or_generate_routines detect a re-assessment (a new profile version) and
    # regenerate, the same way a season change already regenerates Seasonal Care.
    skin_profile_id: Mapped[int | None] = mapped_column(
        ForeignKey("skin_profiles.skin_profile_id"), default=None
    )
    # ADR-050 — NULL: AI-generated (the existing engine, untouched). Non-NULL: the
    # consultant/dermatologist who authored this routine. Author, not owner —
    # `user_id` above stays the client the routine belongs to either way.
    created_by_professional_id: Mapped[str | None] = mapped_column(
        ForeignKey("user.id"), default=None
    )
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class RoutineStep(Base):
    __tablename__ = "routine_steps"
    __table_args__ = (Index("idx_routine_steps_routine", "routine_id"),)

    step_id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(
        ForeignKey("skincare_routines.routine_id", ondelete="CASCADE")
    )
    step_order: Mapped[int | None] = mapped_column(default=None)
    step_name: Mapped[str | None] = mapped_column(default=None)
    # M2-P11 — one of routines/constants.py's 6 canonical categories, distinct from
    # products.category (the real, smaller product taxonomy).
    category: Mapped[str | None] = mapped_column(default=None)
    instruction: Mapped[str | None] = mapped_column(Text, default=None)
    rationale: Mapped[str | None] = mapped_column(Text, default=None)
    # Which guardrail fired for this step, if any (e.g. "soothing_substitution") —
    # None when no guardrail intervened.
    safety_flag: Mapped[str | None] = mapped_column(default=None)
    duration_minutes: Mapped[int | None] = mapped_column(default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class RoutineProduct(Base):
    __tablename__ = "routine_products"

    routine_product_id: Mapped[int] = mapped_column(primary_key=True)
    routine_id: Mapped[int] = mapped_column(
        ForeignKey("skincare_routines.routine_id", ondelete="CASCADE")
    )
    product_id: Mapped[int] = mapped_column(ForeignKey("products.product_id"))
    step_id: Mapped[int | None] = mapped_column(ForeignKey("routine_steps.step_id"), default=None)
    usage_notes: Mapped[str | None] = mapped_column(Text, default=None)
