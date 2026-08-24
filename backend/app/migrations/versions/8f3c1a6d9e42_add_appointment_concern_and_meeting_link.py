"""appointments.concern and appointments.meeting_link

Revision ID: 8f3c1a6d9e42
Revises: b47becd1e4f6
Create Date: 2026-08-24 00:00:00.000000

Simplified consultation-communication flow (docs/superpowers/plans/
2026-08-24-appointment-consultation-flow.md): a user-entered concern captured at
booking time, and a consultant-entered external meeting link (Google Meet/Zoom/etc,
pasted manually — no video SDK integration). Both nullable free text on the existing
appointments table; no new table.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "8f3c1a6d9e42"
down_revision: str | Sequence[str] | None = "b47becd1e4f6"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("appointments", sa.Column("concern", sa.Text(), nullable=True))
    op.add_column("appointments", sa.Column("meeting_link", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("appointments", "meeting_link")
    op.drop_column("appointments", "concern")
