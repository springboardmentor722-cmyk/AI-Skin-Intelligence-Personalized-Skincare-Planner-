"""drop user_profiles identity drift, unique active scoring weight

Revision ID: c21b3568fc1a
Revises: a7e9f4e50c45
Create Date: 2026-07-09 13:23:54.855263

Two independent cleanups found in the Milestone 1 audit:

1. `user_profiles.email`/`.role`/`.is_active` aren't in the documented v3 schema
   (`database_schemas/skinlytics_postgresql_schema_v3.sql`) and duplicate columns
   Better Auth's own `"user"` table already owns (ADR-003: role/identity live there,
   never duplicated). Confirmed live, for both real rows in this table, that
   `user_profiles.email`/`.role` are byte-identical to `"user".email`/`.role` for the
   same `user_id` — dropping loses no information. Confirmed nothing in the codebase
   reads these three columns off `UserProfile` (`UserProfileRead`,
   `app/services/user/schemas.py`, never included them) — safe to drop, not just
   document as accepted drift.
2. `scoring_weights` had two identical active rows (`weight_id` 1 and 2, inserted 40ms
   apart — almost certainly the seed INSERT ran twice against this database at some
   point) with nothing preventing a third. `weight_id=1` is the one an existing
   `skin_scores` row already references, so `weight_id=2` (unreferenced) is the one
   removed here, then a partial unique index makes a repeat impossible.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "c21b3568fc1a"
down_revision: str | Sequence[str] | None = "a7e9f4e50c45"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_user_profiles_email", table_name="user_profiles")
    op.drop_index("user_profiles_email_key", table_name="user_profiles")
    op.drop_column("user_profiles", "email")
    op.drop_column("user_profiles", "role")
    op.drop_column("user_profiles", "is_active")

    # Remove the unreferenced duplicate before the constraint can be added — a real
    # fresh database (created by this migration chain) never has this row, so this is
    # a no-op there; on the actual project database it removes weight_id=2.
    op.execute(
        "DELETE FROM scoring_weights WHERE is_active = true "
        "AND weight_id NOT IN "
        "(SELECT DISTINCT weight_id FROM skin_scores WHERE weight_id IS NOT NULL) "
        "AND weight_id != (SELECT MIN(weight_id) FROM scoring_weights WHERE is_active = true)"
    )
    op.create_index(
        "uq_scoring_weights_one_active",
        "scoring_weights",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_scoring_weights_one_active", table_name="scoring_weights")
    op.add_column(
        "user_profiles", sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"))
    )
    op.add_column("user_profiles", sa.Column("role", sa.String(20), server_default="user"))
    op.add_column("user_profiles", sa.Column("email", sa.String(255), nullable=True))
    op.create_index("user_profiles_email_key", "user_profiles", ["email"], unique=True)
    op.create_index("ix_user_profiles_email", "user_profiles", ["email"])
