"""professional verification: consultant/dermatologist profiles, documents, audit log

Revision ID: 0f62a9b1cdf4
Revises: c21b3568fc1a
Create Date: 2026-07-09 20:36:34.346851

Milestone 1 foundation expansion — matches the new "PROFESSIONAL VERIFICATION"
section of database_schemas/skinlytics_postgresql_schema_v3.sql exactly, same
discipline as every migration before it. Verified against a genuinely fresh scratch
database before being considered done, same convention this session already
established for every migration.
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

revision: str = "0f62a9b1cdf4"
down_revision: str | Sequence[str] | None = "c21b3568fc1a"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_STATUS_VALUES = (
    "('pending', 'approved', 'rejected', 'more_info_requested', 'suspended', 'deactivated')"
)


def upgrade() -> None:
    op.create_table(
        "consultant_profiles",
        sa.Column("consultant_profile_id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("profile_image_url", sa.String(), nullable=True),
        sa.Column("qualifications", sa.Text(), nullable=True),
        sa.Column("years_of_experience", sa.Integer(), nullable=True),
        sa.Column("current_organization", sa.String(), nullable=True),
        sa.Column("license_number", sa.String(), nullable=True),
        sa.Column("specializations", ARRAY(sa.Text()), nullable=True),
        sa.Column("areas_of_expertise", ARRAY(sa.Text()), nullable=True),
        sa.Column("languages", ARRAY(sa.Text()), nullable=True),
        sa.Column("consultation_modes", ARRAY(sa.Text()), nullable=True),
        sa.Column("availability", sa.Text(), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("portfolio_url", sa.String(), nullable=True),
        sa.Column("clinic_address", sa.Text(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.String(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(
            f"verification_status IN {_STATUS_VALUES}", name="ck_consultant_profiles_status"
        ),
    )
    op.create_index(
        "idx_consultant_profiles_status", "consultant_profiles", ["verification_status"]
    )

    op.create_table(
        "dermatologist_profiles",
        sa.Column("dermatologist_profile_id", sa.Integer(), primary_key=True),
        sa.Column(
            "user_id",
            sa.String(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
            unique=True,
        ),
        sa.Column("profile_image_url", sa.String(), nullable=True),
        sa.Column("medical_registration_number", sa.String(), nullable=True),
        sa.Column("medical_council", sa.String(), nullable=True),
        sa.Column("hospital_clinic", sa.String(), nullable=True),
        sa.Column("years_of_practice", sa.Integer(), nullable=True),
        sa.Column("degrees", ARRAY(sa.Text()), nullable=True),
        sa.Column("board_certifications", ARRAY(sa.Text()), nullable=True),
        sa.Column("specializations", ARRAY(sa.Text()), nullable=True),
        sa.Column("research_interests", sa.Text(), nullable=True),
        sa.Column("professional_biography", sa.Text(), nullable=True),
        sa.Column("phone", sa.String(), nullable=True),
        sa.Column("location", sa.String(), nullable=True),
        sa.Column("verification_status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("reviewed_by", sa.String(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("submitted_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.CheckConstraint(
            f"verification_status IN {_STATUS_VALUES}", name="ck_dermatologist_profiles_status"
        ),
    )
    op.create_index(
        "idx_dermatologist_profiles_status", "dermatologist_profiles", ["verification_status"]
    )

    op.create_table(
        "verification_documents",
        sa.Column("document_id", sa.Integer(), primary_key=True),
        sa.Column(
            "owner_user_id",
            sa.String(),
            sa.ForeignKey("user.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("document_type", sa.String(30), nullable=False),
        sa.Column("storage_key", sa.String(500), nullable=False),
        sa.Column("original_filename", sa.String(255), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(), server_default=sa.text("now()")),
        sa.Column("verified_by", sa.String(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.CheckConstraint(
            "document_type IN "
            "('government_id', 'professional_certificate', "
            "'medical_license', 'supporting_document')",
            name="ck_verification_documents_type",
        ),
    )
    op.create_index("idx_verification_documents_owner", "verification_documents", ["owner_user_id"])

    op.create_table(
        "audit_logs",
        sa.Column("audit_log_id", sa.Integer(), primary_key=True),
        sa.Column("actor_user_id", sa.String(), sa.ForeignKey("user.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("target_type", sa.String(50), nullable=True),
        sa.Column("target_id", sa.String(), nullable=True),
        sa.Column("metadata", JSONB(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.text("now()")),
    )
    op.create_index("idx_audit_logs_actor", "audit_logs", ["actor_user_id"])
    op.create_index("idx_audit_logs_target", "audit_logs", ["target_type", "target_id"])
    op.create_index("idx_audit_logs_created", "audit_logs", ["created_at"])


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("verification_documents")
    op.drop_table("dermatologist_profiles")
    op.drop_table("consultant_profiles")
