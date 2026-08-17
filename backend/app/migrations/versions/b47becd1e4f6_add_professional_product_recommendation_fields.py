"""add professional product recommendation fields

Revision ID: b47becd1e4f6
Revises: 5f6e0ea439c6
Create Date: 2026-08-17 00:00:00.000000

ADR-051 — same pattern as ADR-050, applied to `product_recommendations`.
That table was AI-only and append-only (every row auto-written by
`get_recommendations()`'s serving pipeline, no consultant write path, no
usage/frequency/status fields at all). Adds: `recommended_by_professional_id`
(nullable FK, NULL = system-served, non-NULL = consultant-assigned),
`usage_instructions`, `frequency`, `is_active`. Pure addition — no existing
column, row, or constraint changes.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b47becd1e4f6"
down_revision: str | Sequence[str] | None = "5f6e0ea439c6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "product_recommendations",
        sa.Column("recommended_by_professional_id", sa.Text(), nullable=True),
    )
    op.add_column(
        "product_recommendations", sa.Column("usage_instructions", sa.Text(), nullable=True)
    )
    op.add_column(
        "product_recommendations", sa.Column("frequency", sa.String(length=50), nullable=True)
    )
    op.add_column(
        "product_recommendations",
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.true()),
    )
    op.create_foreign_key(
        "product_recommendations_recommended_by_professional_id_fkey",
        "product_recommendations",
        "user",
        ["recommended_by_professional_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_product_recommendations_professional",
        "product_recommendations",
        ["recommended_by_professional_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_product_recommendations_professional", table_name="product_recommendations")
    op.drop_constraint(
        "product_recommendations_recommended_by_professional_id_fkey",
        "product_recommendations",
        type_="foreignkey",
    )
    op.drop_column("product_recommendations", "is_active")
    op.drop_column("product_recommendations", "frequency")
    op.drop_column("product_recommendations", "usage_instructions")
    op.drop_column("product_recommendations", "recommended_by_professional_id")
