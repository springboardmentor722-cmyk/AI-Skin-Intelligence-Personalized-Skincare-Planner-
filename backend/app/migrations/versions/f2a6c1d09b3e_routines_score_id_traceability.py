"""routines.score_id — assessment-to-routine traceability

Revision ID: f2a6c1d09b3e
Revises: a1e009276345
Create Date: 2026-07-14 12:00:00.000000

Milestone 2 Step 1.1's "assessment_id" FK on the routine table, closing the M1 gap
PROGRESS.md already tracked ("routines has no skin_profile_id column to key off").
Nullable and best-effort: set to whichever skin_scores row was the most recently
computed one when a routine was generated (routines/service.py::get_or_generate_routines)
— never forces a fresh score computation as a side effect of routine generation, so a
user who generates routines before ever computing a score gets score_id=NULL, not a
fabricated score.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "f2a6c1d09b3e"
down_revision: str | Sequence[str] | None = "a1e009276345"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "routines",
        sa.Column(
            "score_id",
            sa.Integer(),
            sa.ForeignKey("skin_scores.score_id"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("routines", "score_id")
