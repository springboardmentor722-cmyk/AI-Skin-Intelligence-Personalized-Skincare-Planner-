"""add ingredient safety config

Revision ID: 75e0940c0f36
Revises: c6e4d32b96b3
Create Date: 2026-07-27 14:27:34.830314

M3R Phase 1 (MILESTONE 3.pdf Step 1, "Safety Score Endpoint") — a config-driven
thresholds table for the safety-score formula, same philosophy as scoring_weights.
Seeds one active row with the current default deductions/thresholds.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "75e0940c0f36"
down_revision: str | Sequence[str] | None = "c6e4d32b96b3"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "ingredient_safety_config",
        sa.Column("config_id", sa.Integer(), primary_key=True),
        sa.Column("avoid_deduction", sa.Numeric(5, 2), nullable=False, server_default="40.0"),
        sa.Column("caution_deduction", sa.Numeric(5, 2), nullable=False, server_default="15.0"),
        sa.Column("allergy_deduction", sa.Numeric(5, 2), nullable=False, server_default="50.0"),
        sa.Column("safe_threshold", sa.Numeric(5, 2), nullable=False, server_default="80.0"),
        sa.Column("warning_threshold", sa.Numeric(5, 2), nullable=False, server_default="50.0"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.CheckConstraint(
            "safe_threshold > warning_threshold", name="chk_safety_thresholds_ordered"
        ),
    )
    op.create_index(
        "uq_ingredient_safety_config_one_active",
        "ingredient_safety_config",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.execute(
        "INSERT INTO ingredient_safety_config "
        "(avoid_deduction, caution_deduction, allergy_deduction, safe_threshold, "
        "warning_threshold, is_active) VALUES (40.0, 15.0, 50.0, 80.0, 50.0, TRUE)"
    )


def downgrade() -> None:
    op.drop_index("uq_ingredient_safety_config_one_active", table_name="ingredient_safety_config")
    op.drop_table("ingredient_safety_config")
