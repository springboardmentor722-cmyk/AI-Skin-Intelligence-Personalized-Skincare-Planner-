"""outbox table for ADR-010 derived-store projection

Revision ID: 2d9fcee3b312
Revises: 5e91a4c7d2b8
Create Date: 2026-07-22 14:11:09.052708

ADR-010's outbox, made real (M3-A): writes to products/ingredients/knowledge_articles/
skin_profiles append a row here in the same Postgres transaction as the source mutation
(knowledge_articles is Mongo-owned, so its append is best-effort immediately after the
Mongo write commits, not truly atomic — documented in app/db/outbox.py). The arq worker
polls `processed_at IS NULL` and projects to Elasticsearch + the vector DB; nothing else
ever writes those derived stores directly.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "2d9fcee3b312"
down_revision: str | Sequence[str] | None = "5e91a4c7d2b8"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "outbox",
        sa.Column("outbox_id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("aggregate_type", sa.String(length=50), nullable=False),
        sa.Column("aggregate_id", sa.Text(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(), server_default=sa.func.current_timestamp()),
        sa.Column("processed_at", sa.TIMESTAMP(), nullable=True),
        sa.PrimaryKeyConstraint("outbox_id"),
    )
    op.create_index("idx_outbox_processed_id", "outbox", ["processed_at", "outbox_id"])


def downgrade() -> None:
    op.drop_index("idx_outbox_processed_id", table_name="outbox")
    op.drop_table("outbox")
