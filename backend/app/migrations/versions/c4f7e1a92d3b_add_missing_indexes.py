"""add missing indexes: routine_products, products.category

Revision ID: c4f7e1a92d3b
Revises: a9c3d2f81b47
Create Date: 2026-07-14 14:00:00.000000

Production-readiness audit finding: `routine_products` had zero indexes beyond
its own PK, despite `routines/service.py` querying it by `step_id` on every
`GET /routines/me` call (confirmed live via `EXPLAIN ANALYZE`: a real `Seq Scan`,
not an index scan — invisible at today's tiny seed-data scale, a real cost once
this table's row count actually grows with usage). `routine_id` indexed too, for
the `ON DELETE CASCADE` FK's own lookup efficiency (standard practice for any FK
column, independent of whether app code queries it directly).

`products.category` (used by `list_products_for_skin_type`, called on every
routine generation and recommendation fetch) has no supporting index either —
masked today by the ~16-row seed catalog, but the real Kaggle Sephora ingestion
pipeline (`backend/app/services/admin/ingest/products.py`, code-complete,
credential-blocked — see `training_dataset/README.md`) would bring in thousands
of real rows the moment real credentials exist. Proactive, but for a query path
and a data-volume increase this project has already built, not a hypothetical.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "c4f7e1a92d3b"
down_revision: str | Sequence[str] | None = "a9c3d2f81b47"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index("idx_routine_products_step", "routine_products", ["step_id"])
    op.create_index("idx_routine_products_routine", "routine_products", ["routine_id"])
    op.create_index("idx_products_category", "products", ["category"])


def downgrade() -> None:
    op.drop_index("idx_products_category", table_name="products")
    op.drop_index("idx_routine_products_routine", table_name="routine_products")
    op.drop_index("idx_routine_products_step", table_name="routine_products")
