"""user appearance preferences

Revision ID: a1e009276345
Revises: 0f62a9b1cdf4
Create Date: 2026-07-10 11:43:12.567382

Theme system (Phase 3) — one row per user, any role (a Consultant/Dermatologist/Admin
account needs a theme just as much as a User does), matching
database_schemas/skinlytics_postgresql_schema_v3.sql's new "APPEARANCE PREFERENCES"
section exactly. `palette` is the *token-value* set (docs/DESIGN.md's locked Frosted
Lab Glass system — spacing/radius/typography/glass rules — stays fixed; only the
semantic color tokens a palette defines vary); `theme_mode` is orthogonal
light/dark/system, mirroring next-themes' own three-value model so the two dimensions
combine independently. `accent_color`/`font_size`/`density`/`motion_preference` are
genuine future-ready placeholders (nullable, unused by the v1 UI) — not implemented
speculatively, just columns that don't need a second migration to add later.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a1e009276345"
down_revision: str | Sequence[str] | None = "0f62a9b1cdf4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_PALETTE_VALUES = (
    "('default', 'emerald', 'ocean', 'lavender', 'sunset', 'slate', 'rose', 'forest')"
)
_MODE_VALUES = "('light', 'dark', 'system')"


def upgrade() -> None:
    op.create_table(
        "user_appearance_preferences",
        sa.Column("preference_id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("palette", sa.String(20), nullable=False, server_default="default"),
        sa.Column("theme_mode", sa.String(10), nullable=False, server_default="system"),
        sa.Column("accent_color", sa.String(20), nullable=True),
        sa.Column("font_size", sa.String(10), nullable=True),
        sa.Column("density", sa.String(10), nullable=True),
        sa.Column("motion_preference", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(f"palette IN {_PALETTE_VALUES}", name="ck_appearance_prefs_palette"),
        sa.CheckConstraint(f"theme_mode IN {_MODE_VALUES}", name="ck_appearance_prefs_mode"),
    )


def downgrade() -> None:
    op.drop_table("user_appearance_preferences")
