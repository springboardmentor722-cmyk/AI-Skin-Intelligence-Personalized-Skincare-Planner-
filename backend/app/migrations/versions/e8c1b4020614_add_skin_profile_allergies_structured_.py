"""add skin_profile_allergies structured allergy list

Revision ID: e8c1b4020614
Revises: 103dadbc13ce
Create Date: 2026-07-24 11:50:55.849019

Milestone 2 P7 (docs/DECISIONS.md ADR-026) — the allergy list as structured
ingredient ids, not free text, so P12's allergy detection can match against it
directly. `skin_profiles.allergies` (TEXT) is untouched — this is a pure addition,
no destructive change to any existing column or row.

Scoped to only this table: `alembic revision --autogenerate` also detected a large
amount of pre-existing, unrelated drift between the live database and the models
(several VARCHAR->Text column types, a few dropped indexes) accumulated before this
branch — none of that belongs in a migration whose only real job is adding one new
table, so it was stripped back out here rather than folded in as a side effect.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "e8c1b4020614"
down_revision: str | Sequence[str] | None = "103dadbc13ce"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "skin_profile_allergies",
        sa.Column("profile_allergy_id", sa.Integer(), nullable=False),
        sa.Column("skin_profile_id", sa.Integer(), nullable=False),
        sa.Column("ingredient_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()"), nullable=True),
        sa.ForeignKeyConstraint(
            ["ingredient_id"], ["ingredients.ingredient_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(
            ["skin_profile_id"], ["skin_profiles.skin_profile_id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("profile_allergy_id"),
        sa.UniqueConstraint("skin_profile_id", "ingredient_id"),
    )
    op.create_index(
        "idx_skin_profile_allergies_profile",
        "skin_profile_allergies",
        ["skin_profile_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_skin_profile_allergies_profile", table_name="skin_profile_allergies")
    op.drop_table("skin_profile_allergies")
