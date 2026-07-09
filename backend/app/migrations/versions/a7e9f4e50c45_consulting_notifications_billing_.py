"""consulting, notifications, billing, progress, product_recommendations

Revision ID: a7e9f4e50c45
Revises: ccb49f9b0f47
Create Date: 2026-07-09 13:18:43.096759

Closes the rest of the fresh-DB gap found in the Milestone 1 audit (see `44cfa8e6d5d4`'s
docstring for the first half). These 9 tables — `progress_reports`, `progress_images`,
`product_recommendations`, `consultant_clients`, `consultant_notes`, `notifications`,
`reminders`, `subscriptions`, `payments` — exist on the live project database (loaded
directly from `database_schemas/skinlytics_postgresql_schema_v3.sql`, same as every table
before this one) but have **no owning service, router, or SQLAlchemy model yet** — Progress
Tracking, Consulting, Notification, and Billing are M2+ scope per
`docs/ARCHITECTURE.md` §4 and `project_docs/milestone_1/03-api-endpoints.md`'s
"Not yet built" list; `product_recommendations` specifically is unused because the
Product Recommendation service caches ranked results in Redis instead
(`app/services/recommendations/service.py`), not this table. Migrated here anyway,
schema-only, so a genuinely fresh database matches the documented v3 schema exactly and
`alembic upgrade head` produces every table the SQL file defines — not just the ones with
application code today. Each owning service adds its own `models.py` mapping onto these
already-existing tables when it's actually built; this migration does not need to change
when that happens.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "a7e9f4e50c45"
down_revision: str | Sequence[str] | None = "ccb49f9b0f47"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "progress_reports",
        sa.Column("report_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("report_type", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("report_url", sa.String(), nullable=True),
        sa.Column("generated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )

    op.create_table(
        "progress_images",
        sa.Column("progress_image_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("image_url", sa.String(), nullable=True),
        sa.Column("image_stage", sa.String(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_progress_images_user", "progress_images", ["user_id"])

    op.create_table(
        "product_recommendations",
        sa.Column("recommendation_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("product_id", sa.Integer(), sa.ForeignKey("products.product_id"), nullable=False),
        sa.Column("recommendation_score", sa.Numeric(5, 2), nullable=True),
        sa.Column("recommendation_reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_product_recommendations_user", "product_recommendations", ["user_id"])

    op.create_table(
        "consultant_clients",
        sa.Column("assignment_id", sa.Integer(), primary_key=True),
        sa.Column("consultant_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("assigned_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status IN ('active', 'paused', 'ended')", name="ck_consultant_clients_status"
        ),
        sa.UniqueConstraint("consultant_id", "user_id"),
    )
    op.create_index("idx_consultant_clients_consultant", "consultant_clients", ["consultant_id"])

    op.create_table(
        "consultant_notes",
        sa.Column("note_id", sa.Integer(), primary_key=True),
        sa.Column("consultant_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("note_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_consultant_notes_user", "consultant_notes", ["user_id"])

    op.create_table(
        "notifications",
        sa.Column("notification_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("title", sa.String(150), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("notification_type", sa.String(), nullable=True),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_notifications_user_unread", "notifications", ["user_id", "is_read"])

    op.create_table(
        "reminders",
        sa.Column("reminder_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("reminder_type", sa.String(), nullable=True),
        sa.Column("title", sa.String(150), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("reminder_time", sa.Time(), nullable=True),
        sa.Column("frequency", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_reminders_user_active", "reminders", ["user_id", "is_active"])

    op.create_table(
        "subscriptions",
        sa.Column("subscription_id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id", ondelete="CASCADE")),
        sa.Column("plan_name", sa.String(), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("billing_cycle", sa.String(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_subscriptions_user_status", "subscriptions", ["user_id", "status"])

    op.create_table(
        "payments",
        sa.Column("payment_id", sa.Integer(), primary_key=True),
        sa.Column(
            "subscription_id",
            sa.Integer(),
            sa.ForeignKey("subscriptions.subscription_id"),
            nullable=True,
        ),
        sa.Column("user_id", sa.String(), sa.ForeignKey("user.id"), nullable=False),
        sa.Column("gateway", sa.String(20), nullable=True),
        sa.Column("gateway_transaction_id", sa.String(255), nullable=True, unique=True),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint("gateway IN ('stripe', 'razorpay')", name="ck_payments_gateway"),
        sa.CheckConstraint(
            "status IN ('pending', 'succeeded', 'failed', 'refunded')",
            name="ck_payments_status",
        ),
    )
    op.create_index("idx_payments_user", "payments", ["user_id"])


def downgrade() -> None:
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_table("reminders")
    op.drop_table("notifications")
    op.drop_table("consultant_notes")
    op.drop_table("consultant_clients")
    op.drop_table("product_recommendations")
    op.drop_table("progress_images")
    op.drop_table("progress_reports")
