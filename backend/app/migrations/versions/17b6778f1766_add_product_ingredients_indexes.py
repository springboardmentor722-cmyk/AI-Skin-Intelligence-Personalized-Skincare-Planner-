"""add missing indexes: product_ingredients

Revision ID: 17b6778f1766
Revises: 4785672e2300
Create Date: 2026-08-24 00:00:00.000002

M4 audit finding: database_schemas/skinlytics_postgresql_schema_v3.sql declares
`idx_product_ingredients_product` and `idx_product_ingredients_ingredient` on
`product_ingredients`, but ccb49f9b0f47 (the migration that created the table)
only added the table's UniqueConstraint, never these two indexes — despite its
own docstring claiming to mirror v3.sql's literal DDL. A real, uncompensated
query-cost gap on a heavily-joined table (ingredients/recommendations lookups
both join through it). Only this table's indexes are in scope here — the
audit's other index/nullable-drift findings were explicitly classified
low-severity and are handled separately, if at all.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "17b6778f1766"
down_revision: str | Sequence[str] | None = "4785672e2300"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("idx_product_ingredients_product", "product_ingredients", ["product_id"])
    op.create_index("idx_product_ingredients_ingredient", "product_ingredients", ["ingredient_id"])


def downgrade() -> None:
    op.drop_index("idx_product_ingredients_ingredient", table_name="product_ingredients")
    op.drop_index("idx_product_ingredients_product", table_name="product_ingredients")
