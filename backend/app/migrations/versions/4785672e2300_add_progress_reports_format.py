"""progress_reports.format (PDF/Excel export)

Revision ID: 4785672e2300
Revises: 8f3c1a6d9e42
Create Date: 2026-08-24 00:00:00.000001

M4 audit finding: the requirements PDF asks for "PDF export. Excel export." but
reports/service.py only ever generated PDFs — no column existed to record which
format a given report row is. Adds `progress_reports.format`, NOT NULL DEFAULT
'pdf' so every existing caller/row keeps behaving exactly as before. Mirrors
database_schemas/skinlytics_postgresql_schema_v3.sql's
`format VARCHAR(10) NOT NULL DEFAULT 'pdf'`.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "4785672e2300"
down_revision: str | Sequence[str] | None = "8f3c1a6d9e42"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "progress_reports",
        sa.Column("format", sa.String(10), nullable=False, server_default="pdf"),
    )


def downgrade() -> None:
    op.drop_column("progress_reports", "format")
