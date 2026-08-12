"""report_schedules

Revision ID: b7c1e4f92a08
Revises: a3f7c9d21e6b
Create Date: 2026-08-12 00:00:00.000000

Backs the Reports page's "Scheduled Automations" card (docs/superpowers/specs/
2026-08-12-reports-reminders-design.md) — recurring report generation via a new
arq cron job. `report_type` mirrors report_generate's own literal set
('assessment' | 'progress' | 'routine'); `frequency` is 'weekly' (uses
day_of_week) or 'monthly' (uses day_of_month), never both set. No email/push
column here on purpose — actual delivery has no adapter yet (spec's explicit
scope decision), the schedule only controls generation.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "b7c1e4f92a08"
down_revision: str | Sequence[str] | None = "a3f7c9d21e6b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "report_schedules",
        sa.Column("schedule_id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.Text(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("report_type", sa.String(50), nullable=False),
        sa.Column("frequency", sa.String(20), nullable=False),
        sa.Column("day_of_week", sa.SmallInteger(), nullable=True),
        sa.Column("day_of_month", sa.SmallInteger(), nullable=True),
        sa.Column("time_of_day", sa.Time(), nullable=False, server_default="08:00:00"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "frequency IN ('weekly', 'monthly')", name="ck_report_schedules_frequency"
        ),
    )
    op.create_index("ix_report_schedules_user_id", "report_schedules", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_report_schedules_user_id", table_name="report_schedules")
    op.drop_table("report_schedules")
