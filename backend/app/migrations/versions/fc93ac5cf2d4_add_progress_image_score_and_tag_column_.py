"""add progress image score and tag column already exists

Revision ID: fc93ac5cf2d4
Revises: 6d05f726e558
Create Date: 2026-07-28 12:03:02.169997

`image_stage` already exists (this is the "tag" column, no schema change needed).
This migration only adds `skin_health_score_at_upload`, frozen at upload time by
progress/service.py::upload_progress_photo — never recomputed later.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "fc93ac5cf2d4"
down_revision: str | Sequence[str] | None = "6d05f726e558"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "progress_images",
        sa.Column("skin_health_score_at_upload", sa.Numeric(5, 2), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("progress_images", "skin_health_score_at_upload")
