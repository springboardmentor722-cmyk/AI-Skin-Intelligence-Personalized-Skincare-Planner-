"""add routine step category rationale safety flag and routine skin profile id

Revision ID: c6e4d32b96b3
Revises: eefeb8aaf8d0
Create Date: 2026-07-24 15:43:37.261177

Milestone 2 P11 (MILESTONE 2.docx "Dynamic Routine Generator") — "each step
carrying its category, product/ingredient recommendation, rationale, and any
safety flag that fired" needs three new nullable columns on routine_steps
(category/rationale/safety_flag), and skincare_routines.skin_profile_id lets
get_or_generate_routines detect a real re-assessment (a new profile version)
and regenerate — the "adaptive routine updates" mile_2.docx §4 asks for. Pure
additions, no destructive change to any existing column or row.

Scoped to only these four columns: `alembic revision --autogenerate` also
detected the same pre-existing, unrelated drift between the live database and
the models that migrations e8c1b4020614/eefeb8aaf8d0's own docstrings already
documented (several VARCHAR->Text column types, a few dropped indexes) — none
of that belongs in a migration whose only real job is these additions, so it
was stripped back out here rather than folded in as a side effect.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c6e4d32b96b3"
down_revision: str | Sequence[str] | None = "eefeb8aaf8d0"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("routine_steps", sa.Column("category", sa.String(), nullable=True))
    op.add_column("routine_steps", sa.Column("rationale", sa.Text(), nullable=True))
    op.add_column("routine_steps", sa.Column("safety_flag", sa.String(), nullable=True))
    op.add_column(
        "skincare_routines", sa.Column("skin_profile_id", sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        "skincare_routines_skin_profile_id_fkey",
        "skincare_routines",
        "skin_profiles",
        ["skin_profile_id"],
        ["skin_profile_id"],
    )


def downgrade() -> None:
    op.drop_constraint(
        "skincare_routines_skin_profile_id_fkey", "skincare_routines", type_="foreignkey"
    )
    op.drop_column("skincare_routines", "skin_profile_id")
    op.drop_column("routine_steps", "safety_flag")
    op.drop_column("routine_steps", "rationale")
    op.drop_column("routine_steps", "category")
