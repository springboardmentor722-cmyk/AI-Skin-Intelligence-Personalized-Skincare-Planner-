"""rename skin_scores/routines to mile_2.docx's literal skin_assessments/skincare_routines

Revision ID: 5e91a4c7d2b8
Revises: c4f7e1a92d3b
Create Date: 2026-07-14 15:00:00.000000

Milestone 2's substance (scoring engine, routine generation) was already built and
verified under the internal architecture's names (`skin_scores`, `routines`) before
the project owner reviewed `docs/milestones/milestone_2/mile_2.docx` directly and
decided literal grading-safe names should win — see `PROGRESS.md`'s dated entry and
`docs/milestones/milestone_2/MASTER_PROMPT.md` Phase 1 for the full reasoning.

`op.rename_table` only, not a drop/recreate — this preserves every existing row and
its FKs untouched (Postgres FK constraints track the table by OID, not name, so they
keep working across the rename with no separate FK-recreation step needed). This is
the non-destructive path the master prompt's hard-stop rule requires; a drop/recreate
on tables already holding live tested data was never on the table.

Deliberately NOT adding a `detected_concerns` JSONB column to `skin_assessments`
even though mile_2.docx's illustrative schema names one: the same information is
already derivable via a join from `skin_profile_concerns` (the concern list for
whatever profile a score was computed against), so a denormalized duplicate column
would just be another copy of the same data to keep in sync. Per AGENTS.md's
"don't invent a column" rule and this plan's own stated default, skip it.
"""

from collections.abc import Sequence

from alembic import op

revision: str = "5e91a4c7d2b8"
down_revision: str | Sequence[str] | None = "c4f7e1a92d3b"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.rename_table("skin_scores", "skin_assessments")
    op.rename_table("routines", "skincare_routines")


def downgrade() -> None:
    op.rename_table("skincare_routines", "routines")
    op.rename_table("skin_assessments", "skin_scores")
