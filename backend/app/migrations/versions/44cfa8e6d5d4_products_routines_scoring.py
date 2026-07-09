"""products, routines, scoring — closes the fresh-DB gap ccb49f9b0f47 flagged

Revision ID: 44cfa8e6d5d4
Revises: 50e82a643bf9
Create Date: 2026-07-09 13:18:47.450199

Hand-written, matching database_schemas/skinlytics_postgresql_schema_v3.sql and
app/services/{recommendations,routines,scores}/models.py exactly — same discipline as
the two migrations before it. Spliced in *before* `ccb49f9b0f47` (not appended after it)
because that migration's own docstring already documents the bug this closes:
`ccb49f9b0f47.upgrade()` creates `product_ingredients` with a FK to `products`, but no
earlier migration created `products` — a genuinely fresh `alembic upgrade head` would
crash there. `ccb49f9b0f47.down_revision` is repointed at this revision instead of
`50e82a643bf9` in the same commit. Safe to splice rather than append: `ccb49f9b0f47` has
never actually been executed via `alembic upgrade`/`stamp` on any database (confirmed —
`alembic_version` everywhere is still `50e82a643bf9`; the live project database has these
tables only because it was loaded directly from the SQL file), so there is no applied
history to preserve by appending after it instead.

Covers every table from the SQL file's "ROUTINES & PRODUCTS" and "SCORING & PROGRESS"
sections that already has a real SQLAlchemy model and live service code reading/writing
it: `products`, `routines`, `routine_steps`, `routine_products`, `scoring_weights`,
`skin_scores`, plus the two product junction tables `product_skin_types`/
`product_concerns` (used by the seed script and the recommendation filter). Tables from
those same SQL sections with no owning service/model yet (`progress_reports`,
`progress_images`, `product_recommendations`) are deferred to `a7e9f4e50c45`, alongside
the other not-yet-built services' tables — kept separate so it's obvious which tables are
live application dependencies vs. schema-only provisioning ahead of the owning service.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "44cfa8e6d5d4"
down_revision: str | Sequence[str] | None = "50e82a643bf9"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("product_id", sa.Integer(), primary_key=True),
        sa.Column("brand_name", sa.String(), nullable=True),
        sa.Column("product_name", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("product_url", sa.String(), nullable=True),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(), nullable=True),
        sa.Column("volume_ml", sa.Integer(), nullable=True),
        sa.Column("spf_rating", sa.Integer(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    op.create_table(
        "routines",
        sa.Column("routine_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("routine_name", sa.String(), nullable=True),
        sa.Column("routine_type", sa.String(), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("generated_by_ai", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_routines_user", "routines", ["user_id"])
    op.create_index("idx_routines_user_active", "routines", ["user_id", "is_active"])

    op.create_table(
        "routine_steps",
        sa.Column("step_id", sa.Integer(), primary_key=True),
        sa.Column(
            "routine_id",
            sa.Integer(),
            sa.ForeignKey("routines.routine_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("step_order", sa.Integer(), nullable=True),
        sa.Column("step_name", sa.String(), nullable=True),
        sa.Column("instruction", sa.Text(), nullable=True),
        sa.Column("duration_minutes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_routine_steps_routine", "routine_steps", ["routine_id"])

    op.create_table(
        "routine_products",
        sa.Column("routine_product_id", sa.Integer(), primary_key=True),
        sa.Column(
            "routine_id",
            sa.Integer(),
            sa.ForeignKey("routines.routine_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id"), nullable=False),
        sa.Column("step_id", sa.Integer(), sa.ForeignKey("routine_steps.step_id"), nullable=True),
        sa.Column("usage_notes", sa.Text(), nullable=True),
    )

    op.create_table(
        "scoring_weights",
        sa.Column("weight_id", sa.Integer(), primary_key=True),
        sa.Column("skin_condition_weight", sa.Numeric(4, 2), nullable=False, server_default="0.35"),
        sa.Column("lifestyle_weight", sa.Numeric(4, 2), nullable=False, server_default="0.20"),
        sa.Column("sleep_quality_weight", sa.Numeric(4, 2), nullable=False, server_default="0.15"),
        sa.Column(
            "routine_adherence_weight", sa.Numeric(4, 2), nullable=False, server_default="0.20"
        ),
        sa.Column("hydration_weight", sa.Numeric(4, 2), nullable=False, server_default="0.10"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(
            "skin_condition_weight + lifestyle_weight + sleep_quality_weight "
            "+ routine_adherence_weight + hydration_weight = 1.00",
            name="chk_weights_sum",
        ),
    )

    op.create_table(
        "skin_scores",
        sa.Column("score_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("skin_condition_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("lifestyle_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("sleep_quality_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("hydration_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("routine_adherence_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("overall_score", sa.Numeric(5, 2), nullable=True),
        sa.Column(
            "weight_id", sa.Integer(), sa.ForeignKey("scoring_weights.weight_id"), nullable=True
        ),
        sa.Column("calculated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_skin_scores_user_time", "skin_scores", ["user_id", "calculated_at"])

    op.create_table(
        "product_skin_types",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.product_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "skin_type_id", sa.Integer(), sa.ForeignKey("skin_types.skin_type_id"), nullable=False
        ),
        sa.UniqueConstraint("product_id", "skin_type_id"),
    )
    op.create_index("idx_product_skin_types_product", "product_skin_types", ["product_id"])

    op.create_table(
        "product_concerns",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.product_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "concern_id", sa.Integer(), sa.ForeignKey("skin_concerns.concern_id"), nullable=False
        ),
        sa.UniqueConstraint("product_id", "concern_id"),
    )
    op.create_index("idx_product_concerns_product", "product_concerns", ["product_id"])


def downgrade() -> None:
    op.drop_table("product_concerns")
    op.drop_table("product_skin_types")
    op.drop_table("skin_scores")
    op.drop_table("scoring_weights")
    op.drop_table("routine_products")
    op.drop_table("routine_steps")
    op.drop_table("routines")
    op.drop_table("products")
