"""add recommendation weights

Revision ID: 6d05f726e558
Revises: 75e0940c0f36
Create Date: 2026-07-27 16:12:28.869600

M3R Phase 2 (MILESTONE 3.pdf Step 2, "Recommendation Suitability Weights") — a config-driven
weights table for the product recommendation suitability scoring formula (50% Concern / 35%
Skin-Type Fit / 15% Rating), same philosophy as scoring_weights. Seeds one active row with
the default weights.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "6d05f726e558"
down_revision: str | Sequence[str] | None = "75e0940c0f36"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "recommendation_weights",
        sa.Column("weight_id", sa.Integer(), primary_key=True),
        sa.Column("concern_weight", sa.Numeric(4, 2), nullable=False, server_default="0.50"),
        sa.Column("skin_type_fit_weight", sa.Numeric(4, 2), nullable=False, server_default="0.35"),
        sa.Column("rating_weight", sa.Numeric(4, 2), nullable=False, server_default="0.15"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.CheckConstraint(
            "concern_weight + skin_type_fit_weight + rating_weight = 1.00",
            name="chk_recommendation_weights_sum",
        ),
    )
    op.create_index(
        "uq_recommendation_weights_one_active",
        "recommendation_weights",
        ["is_active"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )
    op.execute(
        "INSERT INTO recommendation_weights "
        "(concern_weight, skin_type_fit_weight, rating_weight, is_active) "
        "VALUES (0.50, 0.35, 0.15, TRUE)"
    )


def downgrade() -> None:
    op.drop_index("uq_recommendation_weights_one_active", table_name="recommendation_weights")
    op.drop_table("recommendation_weights")
