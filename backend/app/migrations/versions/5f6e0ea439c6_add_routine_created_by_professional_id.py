"""add skincare_routines.created_by_professional_id

Revision ID: 5f6e0ea439c6
Revises: d4a8f2c17b93
Create Date: 2026-08-17 00:00:00.000000

ADR-050 — extends the existing single-writer routine engine (routines/service.py)
to support consultant-authored routines alongside the AI-generated ones, rather
than a parallel routine system. Nullable FK to "user"(id): NULL means AI-generated
(the existing AM/PM/Weekly/Seasonal routines, untouched), non-NULL is the
consultant/dermatologist who authored it. Pure addition — no existing column,
row, or constraint changes.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "5f6e0ea439c6"
down_revision: str | Sequence[str] | None = "d4a8f2c17b93"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "skincare_routines",
        sa.Column("created_by_professional_id", sa.Text(), nullable=True),
    )
    op.create_foreign_key(
        "skincare_routines_created_by_professional_id_fkey",
        "skincare_routines",
        "user",
        ["created_by_professional_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(
        "idx_routines_created_by_professional",
        "skincare_routines",
        ["created_by_professional_id"],
    )


def downgrade() -> None:
    op.drop_index("idx_routines_created_by_professional", table_name="skincare_routines")
    op.drop_constraint(
        "skincare_routines_created_by_professional_id_fkey",
        "skincare_routines",
        type_="foreignkey",
    )
    op.drop_column("skincare_routines", "created_by_professional_id")
