"""seed reference data: scoring_weights, skin_types, skin_concerns

Revision ID: a9c3d2f81b47
Revises: f2a6c1d09b3e
Create Date: 2026-07-14 13:00:00.000000

Production-readiness audit finding: `database_schemas/skinlytics_postgresql_schema_v3.sql`
has its own "SEED DATA" section (three INSERT statements: scoring_weights, skin_types,
skin_concerns) that nothing in Alembic, the Makefile, or setup.sh ever actually ran
anywhere. The one environment this session has used all along was bootstrapped once,
manually, outside of any tracked automation (confirmed by migration 50e82a643bf9's own
docstring: "Applied here via `alembic stamp`... the live database already had these
tables, loaded directly from database_schemas/...sql"). A genuinely fresh database
(CI, a new developer's machine, a new environment) had no way to get this
foundational reference data at all — confirmed live: a from-scratch database run
through `alembic upgrade head` alone left `scoring_weights` empty too
(`ValueError: No active scoring_weights row — seed data is missing`,
scores/service.py::get_active_weights), the same class of gap as skin_types/
skin_concerns, just not yet noticed because every environment used so far already had
it. `scoring_weights` has no natural-key UNIQUE constraint, but migration
c21b3568fc1a already added a partial unique index (`uq_scoring_weights_one_active`,
`is_active` WHERE `is_active = true`) — used as the ON CONFLICT target here, same
idempotent-no-op-if-already-seeded property as skin_types/skin_concerns' real UNIQUE
constraints. Row values copied verbatim from
database_schemas/skinlytics_postgresql_schema_v3.sql's own INSERT statements — not
re-derived or invented. Verified against a genuinely fresh, from-scratch Postgres
database (not just the one already-seeded dev environment): all three tables populate
correctly, a second `alembic upgrade head` and a manual re-run of the same INSERTs are
both true no-ops, and the full backend test suite (`app.db.seed` run afterward for
the separate products/ingredients catalog) passes end-to-end.
"""

from collections.abc import Sequence
from decimal import Decimal

import sqlalchemy as sa
from alembic import op

revision: str = "a9c3d2f81b47"
down_revision: str | Sequence[str] | None = "f2a6c1d09b3e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_SKIN_TYPES = [
    ("Normal", "Balanced oil and hydration"),
    ("Dry", "Low sebum, prone to flaking"),
    ("Oily", "Excess sebum production"),
    ("Combination", "Oily T-zone, dry cheeks"),
    ("Sensitive", "Reacts easily to products and environment"),
]

_SKIN_CONCERNS = [
    ("Acne", "Blemish"),
    ("Hyperpigmentation", "Tone"),
    ("Dark Spots", "Tone"),
    ("Dry Skin", "Hydration"),
    ("Oily Skin", "Sebum"),
    ("Sensitive Skin", "Sensitivity"),
    ("Wrinkles", "Aging"),
    ("Fine Lines", "Aging"),
    ("Redness", "Sensitivity"),
    ("Uneven Skin Tone", "Tone"),
]

# skin_condition/lifestyle/sleep_quality/routine_adherence/hydration — must match
# scoring_weights' own chk_weights_sum CHECK constraint (sums to 1.00). Decimal, not
# float: a plain Python float (0.35 is not exactly representable in binary
# floating-point) compared against the DECIMAL(4,2) column silently failed to match
# in downgrade()'s WHERE clause — found live, not by inspection, running this
# migration's own downgrade against a real database and seeing the row survive.
_DEFAULT_WEIGHTS = (
    Decimal("0.35"),
    Decimal("0.20"),
    Decimal("0.15"),
    Decimal("0.20"),
    Decimal("0.10"),
)


def upgrade() -> None:
    conn = op.get_bind()

    conn.execute(
        sa.text(
            "INSERT INTO scoring_weights "
            "(skin_condition_weight, lifestyle_weight, sleep_quality_weight, "
            " routine_adherence_weight, hydration_weight, is_active) "
            "VALUES (:cond, :life, :sleep, :routine, :hydro, TRUE) "
            "ON CONFLICT (is_active) WHERE is_active = true DO NOTHING"
        ),
        {
            "cond": _DEFAULT_WEIGHTS[0],
            "life": _DEFAULT_WEIGHTS[1],
            "sleep": _DEFAULT_WEIGHTS[2],
            "routine": _DEFAULT_WEIGHTS[3],
            "hydro": _DEFAULT_WEIGHTS[4],
        },
    )
    for name, description in _SKIN_TYPES:
        conn.execute(
            sa.text(
                "INSERT INTO skin_types (skin_type_name, description) "
                "VALUES (:name, :description) "
                "ON CONFLICT (skin_type_name) DO NOTHING"
            ),
            {"name": name, "description": description},
        )
    for name, category in _SKIN_CONCERNS:
        conn.execute(
            sa.text(
                "INSERT INTO skin_concerns (concern_name, category) "
                "VALUES (:name, :category) "
                "ON CONFLICT (concern_name) DO NOTHING"
            ),
            {"name": name, "category": category},
        )


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "DELETE FROM scoring_weights WHERE "
            "skin_condition_weight = :cond AND lifestyle_weight = :life "
            "AND sleep_quality_weight = :sleep AND routine_adherence_weight = :routine "
            "AND hydration_weight = :hydro"
        ),
        {
            "cond": _DEFAULT_WEIGHTS[0],
            "life": _DEFAULT_WEIGHTS[1],
            "sleep": _DEFAULT_WEIGHTS[2],
            "routine": _DEFAULT_WEIGHTS[3],
            "hydro": _DEFAULT_WEIGHTS[4],
        },
    )
    for name, _ in _SKIN_TYPES:
        conn.execute(sa.text("DELETE FROM skin_types WHERE skin_type_name = :name"), {"name": name})
    for name, _ in _SKIN_CONCERNS:
        conn.execute(
            sa.text("DELETE FROM skin_concerns WHERE concern_name = :name"), {"name": name}
        )
