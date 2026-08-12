"""progress_reports index

Revision ID: c2d8f5a13b91
Revises: b7c1e4f92a08
Create Date: 2026-08-13 00:00:00.000000

`reports/models.py`'s `ProgressReport` declares idx_progress_reports_user_generated
(backs GET /reports's ORDER BY generated_at DESC per user_id) but the migration that
originally introduced the table (pre-dating this branch) never created it — adding it
here so the model and the live schema stop drifting, and the query stops being a seq
scan.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "c2d8f5a13b91"
down_revision: str | Sequence[str] | None = "b7c1e4f92a08"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "idx_progress_reports_user_generated",
        "progress_reports",
        ["user_id", "generated_at"],
    )


def downgrade() -> None:
    op.drop_index("idx_progress_reports_user_generated", table_name="progress_reports")
