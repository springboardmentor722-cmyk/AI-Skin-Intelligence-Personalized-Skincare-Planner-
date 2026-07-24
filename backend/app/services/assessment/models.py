import datetime
from typing import Any

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class AssessmentSubmission(Base):
    """Milestone 2 P9 — the immutable raw snapshot POST /api/v1/assessment/submit
    persists (database_schemas/README_v3_changes.md's own dated entry). Append-only:
    a re-assessment always inserts a new row here, never updates one. `score_id` is
    a best-effort link to the SkinScore row this submission produced (nullable —
    scoring is a separate step, not a property of the submission itself)."""

    __tablename__ = "assessment_submissions"
    __table_args__ = (Index("idx_assessment_submissions_user", "user_id"),)

    submission_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    schema_version: Mapped[int] = mapped_column(default=1)
    raw_payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    score_id: Mapped[int | None] = mapped_column(
        ForeignKey("skin_assessments.score_id"), default=None
    )
    submitted_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
