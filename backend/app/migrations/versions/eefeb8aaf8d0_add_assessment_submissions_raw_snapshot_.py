"""add assessment_submissions raw snapshot table

Revision ID: eefeb8aaf8d0
Revises: e8c1b4020614
Create Date: 2026-07-24 14:43:03.401587

Milestone 2 P9 (MILESTONE 2.docx "4. Core Backend API Endpoints") — the immutable
raw snapshot POST /api/v1/assessment/submit persists. `skin_profiles`/
`skin_assessments` are untouched — this is a pure addition, no destructive change
to any existing column or row.

Scoped to only this table: `alembic revision --autogenerate` also detected the
same pre-existing, unrelated drift between the live database and the models that
migration e8c1b4020614's own docstring already documented (several VARCHAR->Text
column types, a few dropped indexes, accumulated before this branch) — none of
that belongs in a migration whose only real job is adding one new table, so it
was stripped back out here rather than folded in as a side effect.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "eefeb8aaf8d0"
down_revision: str | Sequence[str] | None = "e8c1b4020614"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assessment_submissions",
        sa.Column("submission_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Text(), nullable=False),
        sa.Column("schema_version", sa.Integer(), nullable=False),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("score_id", sa.Integer(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(["score_id"], ["skin_assessments.score_id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("submission_id"),
    )
    op.create_index(
        "idx_assessment_submissions_user",
        "assessment_submissions",
        ["user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_assessment_submissions_user", table_name="assessment_submissions")
    op.drop_table("assessment_submissions")
