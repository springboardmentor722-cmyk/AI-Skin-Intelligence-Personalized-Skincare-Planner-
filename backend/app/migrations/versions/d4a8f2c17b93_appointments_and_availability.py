"""appointments, provider_availability, availability_exceptions

Revision ID: d4a8f2c17b93
Revises: c2d8f5a13b91
Create Date: 2026-08-15 10:00:00.000000

New appointments subsystem (docs/superpowers/specs/2026-08-15-appointment-system-design.md).
No appointment/scheduling concept existed anywhere before this (confirmed absent from
docs/DECISIONS.md). EXCLUDE USING gist on (provider_id, time range) is the sole
double-booking guard — Postgres rejects an overlapping INSERT/UPDATE at the DB layer,
no app-level lock needed.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "d4a8f2c17b93"
down_revision: str | Sequence[str] | None = "c2d8f5a13b91"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist")

    op.add_column(
        "dermatologist_profiles",
        sa.Column("consultation_modes", sa.ARRAY(sa.Text()), nullable=True),
    )

    op.create_table(
        "provider_availability",
        sa.Column("availability_id", sa.Integer(), primary_key=True),
        sa.Column(
            "provider_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("day_of_week", sa.SmallInteger(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("slot_duration_minutes", sa.SmallInteger(), nullable=False, server_default="30"),
        sa.CheckConstraint("day_of_week BETWEEN 0 AND 6", name="ck_provider_availability_dow"),
        sa.CheckConstraint("end_time > start_time", name="ck_provider_availability_time_order"),
    )
    op.create_index(
        "idx_provider_availability_provider", "provider_availability", ["provider_id"]
    )

    op.create_table(
        "availability_exceptions",
        sa.Column("exception_id", sa.Integer(), primary_key=True),
        sa.Column(
            "provider_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("exception_date", sa.Date(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=True),
        sa.Column("end_time", sa.Time(), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.CheckConstraint(
            "(start_time IS NULL) = (end_time IS NULL)",
            name="ck_availability_exceptions_partial_pair",
        ),
    )
    op.create_index(
        "idx_availability_exceptions_provider_date",
        "availability_exceptions",
        ["provider_id", "exception_date"],
    )

    op.create_table(
        "appointments",
        sa.Column("appointment_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("provider_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("provider_role", sa.String(length=20), nullable=False),
        sa.Column("consultation_mode", sa.String(length=20), nullable=False),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("cancelled_by", sa.String(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("original_start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(
            "provider_role IN ('consultant','dermatologist')", name="ck_appointments_provider_role"
        ),
        sa.CheckConstraint(
            "status IN ('pending','confirmed','completed','cancelled','no_show')",
            name="ck_appointments_status",
        ),
    )
    op.create_index("idx_appointments_user", "appointments", ["user_id"])
    op.create_index("idx_appointments_provider_start", "appointments", ["provider_id", "start_time"])
    # Raw SQL: no Alembic/SQLAlchemy op helper for EXCLUDE constraints.
    op.execute(
        """
        ALTER TABLE appointments
        ADD CONSTRAINT excl_appointments_provider_overlap
        EXCLUDE USING gist (
            provider_id WITH =,
            tstzrange(start_time, end_time) WITH &&
        )
        WHERE (status IN ('pending', 'confirmed'))
        """
    )


def downgrade() -> None:
    op.drop_table("appointments")
    op.drop_table("availability_exceptions")
    op.drop_table("provider_availability")
    op.drop_column("dermatologist_profiles", "consultation_modes")
