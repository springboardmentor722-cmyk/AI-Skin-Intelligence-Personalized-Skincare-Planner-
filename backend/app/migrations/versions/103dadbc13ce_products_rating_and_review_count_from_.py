"""products rating and review_count from real Sephora columns

Revision ID: 103dadbc13ce
Revises: 2d9fcee3b312
Create Date: 2026-07-22 16:19:33.912989

M3-C (milestone_3.md §5): backed by the real Sephora `product_info.csv` columns
`rating`/`reviews` (nadyinky/sephora-products-and-skincare-reviews on Kaggle) — not
invented. Nullable: curated seed rows (backend/app/db/seed.py) have neither; only the
real Kaggle ingest (backend/app/services/admin/ingest/products.py) populates them.
This finally makes AI_ML.md's "sorts by rating" stub semantics and the recommendation
rank formula's `rating_norm` signal schema-true.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "103dadbc13ce"
down_revision: str | Sequence[str] | None = "2d9fcee3b312"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("products", sa.Column("rating", sa.DECIMAL(3, 2), nullable=True))
    op.add_column("products", sa.Column("review_count", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("products", "review_count")
    op.drop_column("products", "rating")
