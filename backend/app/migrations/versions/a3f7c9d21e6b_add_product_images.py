"""product_images

Revision ID: a3f7c9d21e6b
Revises: fc93ac5cf2d4
Create Date: 2026-08-03 00:00:00.000000

`products.image_url` is a single column and can't hold the multiple images a
carousel needs (yamqwe/sephora-products' `images` column has 2+ URLs per row —
ADR-043, docs/DECISIONS.md). New table rather than a JSON/array column, to match
this schema's existing style for one-product-to-many facts (product_ingredients,
product_skin_types) — sorted via `sort_order`, cascade-deleted with the product.
`products.image_url` is untouched and keeps its existing meaning (an S3 key for
enrich_product_images.py-backfilled rows, ADR-040/041) — this table is additive,
for a separate class of product (direct external URLs, never re-hosted, per
owner decision 2026-08-03) that a single-image column was never going to fit.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a3f7c9d21e6b"
down_revision: str | Sequence[str] | None = "fc93ac5cf2d4"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_images",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "product_id",
            sa.Integer(),
            sa.ForeignKey("products.product_id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("product_id", "image_url"),
    )
    op.create_index(
        "ix_product_images_product_id", "product_images", ["product_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_product_images_product_id", table_name="product_images")
    op.drop_table("product_images")
