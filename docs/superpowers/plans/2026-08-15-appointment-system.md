# Appointment Booking & Scheduling System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the appointments subsystem end-to-end — DB model, backend service, and
booking/management UI for all three roles (user, consultant, dermatologist) — replacing
the "No scheduling system yet." placeholder and wiring the two nav slots already
subtitled for it.

**Architecture:** New `backend/app/services/appointments/` service (fixed anatomy:
`models.py · schemas.py · service.py · router.py`, mounted `/api/v1`) backed by a
Postgres `EXCLUDE USING gist` constraint for double-booking prevention, computed (never
materialized) availability slots. Frontend adds one new User nav item and reuses two
existing consultant/dermatologist nav stubs, sharing `AppointmentList`/
`AppointmentDetailDialog`/`AvailabilitySettings` components across roles.

**Tech Stack:** FastAPI + SQLAlchemy (async) + Alembic + Postgres (`btree_gist`); Next.js
App Router + TanStack Query + `openapi-fetch` + shadcn/ui (Base UI style).

**Spec:** `docs/superpowers/specs/2026-08-15-appointment-system-design.md`

## Global Constraints

- Single generic appointment slot per provider (no `AppointmentType` table).
- Availability = recurring weekly pattern + date exceptions; slots computed on read,
  never materialized, never a background job.
- Double-booking prevented by a DB `EXCLUDE USING gist` constraint — no app-level lock,
  no Redis lock.
- Cancel/reschedule cutoff: 24h fixed, enforced server-side, user-only (provider exempt).
- `consultation_mode` recorded as metadata only — no video-call integration.
- Booking is open (any user can book any approved provider); booking creates/activates
  `consultant_clients` via the existing `clinical_review.service.create_assignment`
  interface function — never writes that table directly (single-writer rule).
- No new nav items for consultant/dermatologist — reuse `consultant/reminders` and
  `dermatologist/consultations`, both already subtitled for this. Reminders tab stays
  `ComingSoon`. Add exactly one new User nav item: "Appointments" (`/appointments`).
- `provider_role` and `consultation_mode` are derived server-side on booking, never
  trusted from the client request body.
- Frontend route guards are UX only — backend `require_role`/`require_verified_professional`
  + per-row ownership checks are the real security boundary.
- After any backend router change: run `make openapi` to regenerate
  `web/lib/api-types.ts` before writing frontend code against it.
- `database_schemas/skinlytics_postgresql_schema_v3.sql` must be updated in the same
  commit as the Alembic migration (AGENTS.md §5) — never left to drift.

---

## Task 1: Migration — appointment tables + dermatologist consultation_modes

**Files:**
- Create: `backend/app/migrations/versions/d4a8f2c17b93_appointments_and_availability.py`
- Modify: `database_schemas/skinlytics_postgresql_schema_v3.sql` (append new tables,
  add `consultation_modes TEXT[]` to `dermatologist_profiles`)
- Test: `backend/tests/test_appointments_migration.py`

**Interfaces:**
- Produces: tables `provider_availability`, `availability_exceptions`, `appointments`
  (exact columns per the spec's Data Model section); `dermatologist_profiles` gains
  `consultation_modes TEXT[]`.

- [ ] **Step 1: Write the migration**

Current head revision is `c2d8f5a13b91` (`backend/app/migrations/versions/c2d8f5a13b91_progress_reports_index.py`) — confirmed via `grep -h "^revision:\|^down_revision:" backend/app/migrations/versions/*.py` (no other file names it as a down_revision).

```python
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
```

- [ ] **Step 2: Append the same tables to the canonical schema file**

Add to `database_schemas/skinlytics_postgresql_schema_v3.sql` (near the `CONSULTING`
section, `consultant_clients`/`consultant_notes`): the identical `CREATE EXTENSION`,
three `CREATE TABLE` statements, indexes, and `EXCLUDE` constraint from Step 1, plus
`ALTER TABLE dermatologist_profiles ADD COLUMN consultation_modes TEXT[];` right after
its `consultation_modes`-shaped sibling column in `consultant_profiles` for readability
— or inline it directly into the `dermatologist_profiles` DDL block if the file defines
tables as one CREATE (matches this file's existing style; check the live file structure
before choosing which form, `CREATE TABLE` inline addition is preferred since the file
defines full DDL per table, not migration-style ALTERs).

- [ ] **Step 3: Write a migration smoke test**

```python
"""backend/app/migrations/versions/d4a8f2c17b93 — new appointments tables actually
land with the exclusion constraint intact. Real Postgres (same discipline as every
other service's tests, no mocks)."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def test_appointments_exclusion_constraint_exists(db_session: AsyncSession) -> None:
    result = await db_session.execute(
        text(
            "SELECT conname FROM pg_constraint WHERE conname = "
            "'excl_appointments_provider_overlap'"
        )
    )
    assert result.scalar_one_or_none() == "excl_appointments_provider_overlap"


async def test_dermatologist_profiles_has_consultation_modes_column(
    db_session: AsyncSession,
) -> None:
    result = await db_session.execute(
        text(
            "SELECT column_name FROM information_schema.columns "
            "WHERE table_name = 'dermatologist_profiles' AND column_name = 'consultation_modes'"
        )
    )
    assert result.scalar_one_or_none() == "consultation_modes"
```

- [ ] **Step 4: Run the migration and the test**

Run: `cd backend && uv run alembic upgrade head`
Expected: applies cleanly, no errors.

Run: `cd backend && uv run pytest tests/test_appointments_migration.py -v`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/migrations/versions/d4a8f2c17b93_appointments_and_availability.py \
        database_schemas/skinlytics_postgresql_schema_v3.sql \
        backend/tests/test_appointments_migration.py
git commit -m "feat(appointments): add appointment and availability tables"
```

---

## Task 2: Models + schemas

**Files:**
- Create: `backend/app/services/appointments/__init__.py` (empty)
- Create: `backend/app/services/appointments/models.py`
- Create: `backend/app/services/appointments/schemas.py`
- Modify: `backend/app/migrations/env.py` (register the new models for autogenerate)
- Test: covered by Task 3+ (model/schema correctness is exercised through the service
  functions, not tested standalone — matches this codebase's convention, e.g.
  `progress/models.py` has no dedicated model test file)

**Interfaces:**
- Produces: `ProviderAvailability`, `AvailabilityException`, `Appointment` ORM models;
  `AvailabilityRuleCreate/Read`, `AvailabilityExceptionCreate/Read`, `AppointmentRead`,
  `AppointmentCreate`, `AppointmentRescheduleUpdate`, `AppointmentCancelUpdate`,
  `AppointmentCompleteUpdate`, `ProviderSummaryRead`, `SlotRead` — consumed by Tasks 3-6.

- [ ] **Step 1: Write `models.py`**

```python
import datetime

from sqlalchemy import ForeignKey, Index, SmallInteger, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class ProviderAvailability(Base):
    __tablename__ = "provider_availability"
    __table_args__ = (Index("idx_provider_availability_provider", "provider_id"),)

    availability_id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    day_of_week: Mapped[int] = mapped_column(SmallInteger)
    start_time: Mapped[datetime.time]
    end_time: Mapped[datetime.time]
    slot_duration_minutes: Mapped[int] = mapped_column(SmallInteger, default=30, server_default="30")


class AvailabilityException(Base):
    __tablename__ = "availability_exceptions"
    __table_args__ = (
        Index("idx_availability_exceptions_provider_date", "provider_id", "exception_date"),
    )

    exception_id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    exception_date: Mapped[datetime.date]
    start_time: Mapped[datetime.time | None] = mapped_column(default=None)
    end_time: Mapped[datetime.time | None] = mapped_column(default=None)
    reason: Mapped[str | None] = mapped_column(Text, default=None)


class Appointment(Base):
    __tablename__ = "appointments"
    __table_args__ = (
        Index("idx_appointments_user", "user_id"),
        Index("idx_appointments_provider_start", "provider_id", "start_time"),
    )

    appointment_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    provider_id: Mapped[str] = mapped_column(ForeignKey("user.id"))
    provider_role: Mapped[str]
    consultation_mode: Mapped[str]
    start_time: Mapped[datetime.datetime]
    end_time: Mapped[datetime.datetime]
    status: Mapped[str] = mapped_column(default="pending", server_default="pending")
    cancelled_by: Mapped[str | None] = mapped_column(ForeignKey("user.id"), default=None)
    cancellation_reason: Mapped[str | None] = mapped_column(Text, default=None)
    original_start_time: Mapped[datetime.datetime | None] = mapped_column(default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)
    created_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
    updated_at: Mapped[datetime.datetime | None] = mapped_column(default=None)
```

- [ ] **Step 2: Write `schemas.py`**

```python
import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ProviderRole = Literal["consultant", "dermatologist"]
ConsultationMode = Literal["video", "in_person", "chat"]
AppointmentStatus = Literal["pending", "confirmed", "completed", "cancelled", "no_show"]


class AvailabilityRule(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    day_of_week: int = Field(ge=0, le=6)
    start_time: datetime.time
    end_time: datetime.time
    slot_duration_minutes: int = Field(default=30, ge=5, le=240)


class AvailabilityRead(BaseModel):
    rules: list[AvailabilityRule]


class AvailabilityUpdate(BaseModel):
    rules: list[AvailabilityRule]


class AvailabilityExceptionCreate(BaseModel):
    exception_date: datetime.date
    start_time: datetime.time | None = None
    end_time: datetime.time | None = None
    reason: str | None = None


class AvailabilityExceptionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exception_id: int
    exception_date: datetime.date
    start_time: datetime.time | None
    end_time: datetime.time | None
    reason: str | None


class ProviderSummaryRead(BaseModel):
    provider_id: str
    name: str | None
    role: ProviderRole
    biography: str | None
    specializations: list[str] | None
    consultation_modes: list[str] | None
    years_experience: int | None


class SlotRead(BaseModel):
    start_time: datetime.datetime
    end_time: datetime.datetime


class AppointmentCreate(BaseModel):
    provider_id: str
    start_time: datetime.datetime
    consultation_mode: ConsultationMode


class AppointmentRead(BaseModel):
    appointment_id: int
    user_id: str
    provider_id: str
    provider_role: ProviderRole
    consultation_mode: str
    start_time: datetime.datetime
    end_time: datetime.datetime
    status: AppointmentStatus
    cancellation_reason: str | None
    original_start_time: datetime.datetime | None
    notes: str | None
    other_party_name: str | None


class AppointmentCancelUpdate(BaseModel):
    reason: str | None = None


class AppointmentRescheduleUpdate(BaseModel):
    start_time: datetime.datetime


class AppointmentCompleteUpdate(BaseModel):
    notes: str | None = None
```

- [ ] **Step 3: Register models for Alembic autogenerate**

In `backend/app/migrations/env.py`, add alongside the other `# noqa: F401` model
imports (after the existing block, keeping alphabetical order per the file's own
convention):

```python
from app.services.appointments import models as _appointments_models  # noqa: F401
```

- [ ] **Step 4: Verify import wiring**

Run: `cd backend && uv run python -c "from app.services.appointments import models, schemas"`
Expected: no import errors.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/appointments/__init__.py \
        backend/app/services/appointments/models.py \
        backend/app/services/appointments/schemas.py \
        backend/app/migrations/env.py
git commit -m "feat(appointments): add appointment models and schemas"
```

---

## Task 3: Availability service — weekly hours + exceptions

**Files:**
- Create: `backend/app/services/appointments/service.py` (this task adds the
  availability half; Tasks 4-6 append to the same file)
- Test: `backend/tests/test_appointments_service.py` (this task's tests; Tasks 4-6
  append to the same file)

**Interfaces:**
- Consumes: `ProviderAvailability`, `AvailabilityException` (Task 2), `db_session`/
  `test_user_id` fixtures (`tests/conftest.py`).
- Produces: `get_availability(db, provider_id) -> list[ProviderAvailability]`,
  `replace_availability(db, provider_id, rules: list[AvailabilityRule]) -> list[ProviderAvailability]`
  (raises `ValueError` on overlap within the same day), `list_exceptions(db, provider_id) -> list[AvailabilityException]`,
  `add_exception(db, provider_id, data: AvailabilityExceptionCreate) -> AvailabilityException`,
  `delete_exception(db, provider_id, exception_id) -> None` (raises `ValueError` if not
  owned) — consumed by Task 7 (router) and Task 4 (slot computation reads
  `get_availability`/`list_exceptions`).

- [ ] **Step 1: Write the failing tests**

```python
"""backend/app/services/appointments/service.py — availability CRUD, slot
computation, booking, and status-transition logic. Real Postgres round trips via
tests/conftest.py's rollback-wrapped db_session/test_user_id, same discipline as
every other service (test_clinical_review_service.py's professional_id fixture
pattern for a second, non-`user`-role identity)."""

import datetime
import uuid
from collections.abc import AsyncGenerator

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.appointments.schemas import AvailabilityExceptionCreate, AvailabilityRule
from app.services.appointments.service import (
    add_exception,
    delete_exception,
    get_availability,
    list_exceptions,
    replace_availability,
)
from app.services.consultant_profile.models import ConsultantProfile


@pytest.fixture
async def provider_id(db_session: AsyncSession) -> AsyncGenerator[str, None]:
    user_id = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Dr. Provider", emailVerified=False
        )
    )
    db_session.add(ConsultantProfile(user_id=user_id, verification_status="approved"))
    await db_session.flush()
    yield user_id


async def test_replace_availability_stores_the_full_weekly_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    rules = [
        AvailabilityRule(
            day_of_week=1,
            start_time=datetime.time(9, 0),
            end_time=datetime.time(17, 0),
            slot_duration_minutes=30,
        ),
        AvailabilityRule(
            day_of_week=3,
            start_time=datetime.time(10, 0),
            end_time=datetime.time(14, 0),
            slot_duration_minutes=45,
        ),
    ]
    saved = await replace_availability(db_session, provider_id, rules)
    assert {r.day_of_week for r in saved} == {1, 3}

    reloaded = await get_availability(db_session, provider_id)
    assert len(reloaded) == 2


async def test_replace_availability_overwrites_the_previous_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=1, start_time=datetime.time(9, 0), end_time=datetime.time(17, 0))],
    )
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=2, start_time=datetime.time(9, 0), end_time=datetime.time(17, 0))],
    )
    reloaded = await get_availability(db_session, provider_id)
    assert [r.day_of_week for r in reloaded] == [2]


async def test_replace_availability_rejects_overlapping_ranges_same_day(
    db_session: AsyncSession, provider_id: str
) -> None:
    rules = [
        AvailabilityRule(day_of_week=1, start_time=datetime.time(9, 0), end_time=datetime.time(13, 0)),
        AvailabilityRule(day_of_week=1, start_time=datetime.time(12, 0), end_time=datetime.time(17, 0)),
    ]
    with pytest.raises(ValueError, match="overlap"):
        await replace_availability(db_session, provider_id, rules)


async def test_add_and_list_exceptions(db_session: AsyncSession, provider_id: str) -> None:
    exc = await add_exception(
        db_session,
        provider_id,
        AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 1), reason="Holiday"),
    )
    assert exc.start_time is None and exc.end_time is None  # whole-day block

    exceptions = await list_exceptions(db_session, provider_id)
    assert len(exceptions) == 1


async def test_delete_exception_rejects_a_different_providers_row(
    db_session: AsyncSession, provider_id: str
) -> None:
    other_provider = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_provider, email=f"{other_provider}@test.invalid", name="Other Dr.",
            emailVerified=False,
        )
    )
    await db_session.flush()
    exc = await add_exception(
        db_session, other_provider, AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 1))
    )
    with pytest.raises(ValueError, match="not found"):
        await delete_exception(db_session, provider_id, exc.exception_id)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: FAIL — `service.py` doesn't exist yet.

- [ ] **Step 3: Write `service.py` (availability half)**

```python
import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.appointments.models import AvailabilityException, ProviderAvailability
from app.services.appointments.schemas import AvailabilityExceptionCreate, AvailabilityRule


def _ranges_overlap(
    a_start: datetime.time, a_end: datetime.time, b_start: datetime.time, b_end: datetime.time
) -> bool:
    return a_start < b_end and b_start < a_end


async def get_availability(db: AsyncSession, provider_id: str) -> list[ProviderAvailability]:
    result = await db.execute(
        select(ProviderAvailability)
        .where(ProviderAvailability.provider_id == provider_id)
        .order_by(ProviderAvailability.day_of_week, ProviderAvailability.start_time)
    )
    return list(result.scalars().all())


async def replace_availability(
    db: AsyncSession, provider_id: str, rules: list[AvailabilityRule]
) -> list[ProviderAvailability]:
    by_day: dict[int, list[AvailabilityRule]] = {}
    for rule in rules:
        by_day.setdefault(rule.day_of_week, []).append(rule)
    for day_rules in by_day.values():
        ordered = sorted(day_rules, key=lambda r: r.start_time)
        for first, second in zip(ordered, ordered[1:], strict=False):
            if _ranges_overlap(first.start_time, first.end_time, second.start_time, second.end_time):
                raise ValueError("Availability ranges overlap on the same day")

    existing = await get_availability(db, provider_id)
    for row in existing:
        await db.delete(row)
    await db.flush()

    saved = [
        ProviderAvailability(
            provider_id=provider_id,
            day_of_week=rule.day_of_week,
            start_time=rule.start_time,
            end_time=rule.end_time,
            slot_duration_minutes=rule.slot_duration_minutes,
        )
        for rule in rules
    ]
    db.add_all(saved)
    await db.commit()
    return saved


async def list_exceptions(db: AsyncSession, provider_id: str) -> list[AvailabilityException]:
    result = await db.execute(
        select(AvailabilityException)
        .where(AvailabilityException.provider_id == provider_id)
        .order_by(AvailabilityException.exception_date)
    )
    return list(result.scalars().all())


async def add_exception(
    db: AsyncSession, provider_id: str, data: AvailabilityExceptionCreate
) -> AvailabilityException:
    exception = AvailabilityException(provider_id=provider_id, **data.model_dump())
    db.add(exception)
    await db.commit()
    return exception


async def delete_exception(db: AsyncSession, provider_id: str, exception_id: int) -> None:
    result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.exception_id == exception_id,
            AvailabilityException.provider_id == provider_id,
        )
    )
    exception = result.scalar_one_or_none()
    if exception is None:
        raise ValueError(f"Exception {exception_id} not found for this provider")
    await db.delete(exception)
    await db.commit()
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/appointments/service.py backend/tests/test_appointments_service.py
git commit -m "feat(appointments): add provider availability and exception CRUD"
```

---

## Task 4: Slot computation

**Files:**
- Modify: `backend/app/services/appointments/service.py` (append)
- Modify: `backend/tests/test_appointments_service.py` (append)

**Interfaces:**
- Consumes: `get_availability`, `list_exceptions` (Task 3), `Appointment` model (Task 2).
- Produces: `compute_available_slots(db, provider_id, target_date: date, now: datetime | None = None) -> list[SlotRead]`
  — consumed by Task 7's `/providers/{id}/slots` endpoint and Task 5's booking
  validation.

- [ ] **Step 1: Write the failing tests**

```python
async def test_compute_available_slots_from_weekly_pattern(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    # 2026-09-07 is a Monday (day_of_week=0).
    await replace_availability(
        db_session,
        provider_id,
        [
            AvailabilityRule(
                day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0),
                slot_duration_minutes=30,
            )
        ],
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert [s.start_time.time() for s in slots] == [datetime.time(9, 0), datetime.time(9, 30)]


async def test_compute_available_slots_returns_nothing_for_an_unavailable_day(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0))],
    )
    # 2026-09-08 is a Tuesday — no rule for day_of_week=1.
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 8))
    assert slots == []


async def test_compute_available_slots_excludes_a_whole_day_exception(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0))],
    )
    await add_exception(
        db_session, provider_id, AvailabilityExceptionCreate(exception_date=datetime.date(2026, 9, 7))
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert slots == []


async def test_compute_available_slots_excludes_an_existing_appointment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import book_appointment, compute_available_slots
    from app.services.appointments.schemas import AppointmentCreate

    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=0, start_time=datetime.time(9, 0), end_time=datetime.time(10, 0))],
    )
    await book_appointment(
        db_session,
        test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    slots = await compute_available_slots(db_session, provider_id, datetime.date(2026, 9, 7))
    assert [s.start_time.time() for s in slots] == [datetime.time(9, 30)]


async def test_compute_available_slots_excludes_past_times_for_today(
    db_session: AsyncSession, provider_id: str
) -> None:
    from app.services.appointments.service import compute_available_slots

    today = datetime.datetime.now(datetime.UTC)
    weekday = today.weekday()  # Python: Monday=0, matches this schema's day_of_week
    await replace_availability(
        db_session,
        provider_id,
        [AvailabilityRule(day_of_week=weekday, start_time=datetime.time(0, 0), end_time=datetime.time(23, 30))],
    )
    slots = await compute_available_slots(
        db_session, provider_id, today.date(), now=today
    )
    assert all(s.start_time > today for s in slots)
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -k compute_available_slots -v`
Expected: FAIL — `compute_available_slots` not defined.

- [ ] **Step 3: Implement `compute_available_slots`**

Append to `backend/app/services/appointments/service.py`:

```python
from app.services.appointments.models import Appointment
from app.services.appointments.schemas import SlotRead


async def compute_available_slots(
    db: AsyncSession,
    provider_id: str,
    target_date: datetime.date,
    now: datetime.datetime | None = None,
) -> list[SlotRead]:
    now = now or datetime.datetime.now(datetime.UTC)
    day_of_week = target_date.weekday()

    rules_result = await db.execute(
        select(ProviderAvailability).where(
            ProviderAvailability.provider_id == provider_id,
            ProviderAvailability.day_of_week == day_of_week,
        )
    )
    rules = list(rules_result.scalars().all())
    if not rules:
        return []

    exceptions_result = await db.execute(
        select(AvailabilityException).where(
            AvailabilityException.provider_id == provider_id,
            AvailabilityException.exception_date == target_date,
        )
    )
    exceptions = list(exceptions_result.scalars().all())
    if any(e.start_time is None for e in exceptions):
        return []  # whole day blocked

    existing_result = await db.execute(
        select(Appointment).where(
            Appointment.provider_id == provider_id,
            Appointment.status.in_(("pending", "confirmed")),
            Appointment.start_time >= datetime.datetime.combine(
                target_date, datetime.time.min, tzinfo=datetime.UTC
            ),
            Appointment.start_time < datetime.datetime.combine(
                target_date, datetime.time.max, tzinfo=datetime.UTC
            ),
        )
    )
    booked_starts = {a.start_time for a in existing_result.scalars().all()}

    slots: list[SlotRead] = []
    for rule in rules:
        cursor = datetime.datetime.combine(target_date, rule.start_time, tzinfo=datetime.UTC)
        end = datetime.datetime.combine(target_date, rule.end_time, tzinfo=datetime.UTC)
        step = datetime.timedelta(minutes=rule.slot_duration_minutes)
        while cursor + step <= end:
            slot_end = cursor + step
            blocked_by_exception = any(
                e.start_time is not None
                and cursor.time() < e.end_time  # type: ignore[operator]
                and e.start_time < slot_end.time()
                for e in exceptions
            )
            if cursor not in booked_starts and not blocked_by_exception and cursor > now:
                slots.append(SlotRead(start_time=cursor, end_time=slot_end))
            cursor = slot_end
    return slots
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: all tests PASS (this task's 5 + Task 3's 5). Note this task's tests forward-
reference `book_appointment` from Task 5 — if run before Task 5 exists, only run the
first three tests (`-k "not existing_appointment and not past_times"`); run the full
file again after Task 5.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/appointments/service.py backend/tests/test_appointments_service.py
git commit -m "feat(appointments): compute available slots from availability and exceptions"
```

---

## Task 5: Booking + double-booking conflict handling

**Files:**
- Modify: `backend/app/services/appointments/service.py` (append)
- Modify: `backend/tests/test_appointments_service.py` (append)

**Interfaces:**
- Consumes: `clinical_review.service.create_assignment` (existing interface function),
  `external_user_table` (existing), `consultant_profile.models.ConsultantProfile` /
  `dermatologist_profile.models.DermatologistProfile` (existing, for role/mode lookup).
- Produces: `class SlotUnavailableError(Exception)`, `book_appointment(db, user_id, data: AppointmentCreate) -> Appointment`
  — consumed by Task 7 (router, catches `SlotUnavailableError` → 409).

- [ ] **Step 1: Write the failing tests**

```python
from sqlalchemy.exc import IntegrityError

from app.services.appointments.schemas import AppointmentCreate
from app.services.appointments.service import SlotUnavailableError, book_appointment
from app.services.clinical_review.service import _verify_assignment
from app.services.dermatologist_profile.models import DermatologistProfile


async def test_book_appointment_creates_pending_row_and_activates_assignment(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    appointment = await book_appointment(
        db_session,
        test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    assert appointment.status == "pending"
    assert appointment.provider_role == "consultant"  # derived server-side, not client-supplied

    # consultant_clients row was created/activated as a side effect.
    assignment = await _verify_assignment(db_session, provider_id, test_user_id)
    assert assignment.status == "active"


async def test_book_appointment_rejects_an_overlapping_slot(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    start = datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC)
    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=start, consultation_mode="video"),
    )

    other_user = f"test-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user, email=f"{other_user}@test.invalid", name="Other User", emailVerified=False
        )
    )
    await db_session.flush()

    with pytest.raises(SlotUnavailableError):
        await book_appointment(
            db_session, other_user,
            AppointmentCreate(provider_id=provider_id, start_time=start, consultation_mode="video"),
        )


async def test_book_appointment_derives_provider_role_for_a_dermatologist(
    db_session: AsyncSession, test_user_id: str
) -> None:
    derm_id = f"test-derm-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=derm_id, email=f"{derm_id}@test.invalid", name="Dr. Derm", emailVerified=False
        )
    )
    db_session.add(DermatologistProfile(user_id=derm_id, verification_status="approved"))
    await db_session.flush()

    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=derm_id,
            start_time=datetime.datetime(2026, 9, 8, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="chat",
        ),
    )
    assert appointment.provider_role == "dermatologist"
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -k book_appointment -v`
Expected: FAIL — `book_appointment` not defined.

- [ ] **Step 3: Implement `book_appointment`**

Append to `backend/app/services/appointments/service.py`:

```python
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.services.clinical_review import service as clinical_review_service
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile


class SlotUnavailableError(Exception):
    """Raised when the DB's EXCLUDE constraint rejects an overlapping booking —
    the actual concurrency guard; this just gives callers a typed exception instead
    of a raw IntegrityError to catch."""


async def _resolve_provider_role(db: AsyncSession, provider_id: str) -> str:
    consultant = await db.execute(
        select(ConsultantProfile.user_id).where(ConsultantProfile.user_id == provider_id)
    )
    if consultant.scalar_one_or_none() is not None:
        return "consultant"
    dermatologist = await db.execute(
        select(DermatologistProfile.user_id).where(DermatologistProfile.user_id == provider_id)
    )
    if dermatologist.scalar_one_or_none() is not None:
        return "dermatologist"
    raise ValueError(f"{provider_id} is not a consultant or dermatologist")


async def book_appointment(db: AsyncSession, user_id: str, data: AppointmentCreate) -> Appointment:
    provider_role = await _resolve_provider_role(db, data.provider_id)
    # slot_duration_minutes for this provider (defaults to 30 if no matching rule —
    # matches the availability the slot was computed from).
    duration_result = await db.execute(
        select(ProviderAvailability.slot_duration_minutes)
        .where(
            ProviderAvailability.provider_id == data.provider_id,
            ProviderAvailability.day_of_week == data.start_time.weekday(),
        )
        .limit(1)
    )
    duration_minutes = duration_result.scalar_one_or_none() or 30

    appointment = Appointment(
        user_id=user_id,
        provider_id=data.provider_id,
        provider_role=provider_role,
        consultation_mode=data.consultation_mode,
        start_time=data.start_time,
        end_time=data.start_time + datetime.timedelta(minutes=duration_minutes),
        status="pending",
    )
    db.add(appointment)
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise SlotUnavailableError("This appointment slot is no longer available") from exc

    await clinical_review_service.create_assignment(db, data.provider_id, user_id)
    await db.commit()
    return appointment
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: all tests (Tasks 3-5, 15 total) PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/appointments/service.py backend/tests/test_appointments_service.py
git commit -m "feat(appointments): implement booking with double-booking conflict handling"
```

---

## Task 6: List/detail, status transitions, cancel/reschedule

**Files:**
- Modify: `backend/app/services/appointments/service.py` (append)
- Modify: `backend/tests/test_appointments_service.py` (append)

**Interfaces:**
- Consumes: `Appointment` (Task 2), `SlotUnavailableError` (Task 5).
- Produces: `list_my_appointments(db, caller_id, status=None, date_from=None, date_to=None) -> list[Appointment]`,
  `get_appointment(db, caller_id, appointment_id) -> Appointment` (raises `ValueError`
  if not found/not a participant), `confirm_appointment`, `complete_appointment`,
  `mark_no_show` (each `(db, provider_id, appointment_id, ...) -> Appointment`, raise
  `ValueError` on invalid transition or wrong provider), `cancel_appointment(db, caller_id, appointment_id, reason) -> Appointment`
  (raises `PermissionError` if a user tries within 24h), `reschedule_appointment(db, caller_id, appointment_id, new_start_time) -> Appointment`
  (same cutoff; raises `SlotUnavailableError` on conflict) — consumed by Task 7 (router).

- [ ] **Step 1: Write the failing tests**

```python
async def test_list_my_appointments_matches_either_side_of_the_fk(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import list_my_appointments

    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    as_user = await list_my_appointments(db_session, test_user_id)
    as_provider = await list_my_appointments(db_session, provider_id)
    assert len(as_user) == 1
    assert len(as_provider) == 1
    assert as_user[0].appointment_id == as_provider[0].appointment_id


async def test_get_appointment_rejects_a_non_participant(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import get_appointment

    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    stranger = f"test-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=stranger, email=f"{stranger}@test.invalid", name="Stranger", emailVerified=False
        )
    )
    await db_session.flush()
    with pytest.raises(ValueError, match="not found"):
        await get_appointment(db_session, stranger, appointment.appointment_id)


async def test_confirm_then_complete_transition(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import complete_appointment, confirm_appointment

    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    confirmed = await confirm_appointment(db_session, provider_id, appointment.appointment_id)
    assert confirmed.status == "confirmed"
    completed = await complete_appointment(db_session, provider_id, appointment.appointment_id, notes="Went well")
    assert completed.status == "completed"
    assert completed.notes == "Went well"


async def test_confirm_rejects_a_non_owning_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import confirm_appointment

    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    with pytest.raises(ValueError, match="not found"):
        await confirm_appointment(db_session, test_user_id, appointment.appointment_id)


async def test_cancel_by_user_within_24h_is_rejected(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import cancel_appointment

    near_future = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=near_future, consultation_mode="video"),
    )
    with pytest.raises(PermissionError, match="24"):
        await cancel_appointment(db_session, test_user_id, appointment.appointment_id, reason=None)


async def test_cancel_by_provider_within_24h_is_allowed(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import cancel_appointment

    near_future = datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=2)
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=near_future, consultation_mode="video"),
    )
    cancelled = await cancel_appointment(db_session, provider_id, appointment.appointment_id, reason="Emergency")
    assert cancelled.status == "cancelled"
    assert cancelled.cancelled_by == provider_id


async def test_reschedule_updates_time_and_stamps_original(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from app.services.appointments.service import reschedule_appointment

    far_future = datetime.datetime.now(datetime.UTC) + datetime.timedelta(days=10)
    appointment = await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(provider_id=provider_id, start_time=far_future, consultation_mode="video"),
    )
    new_time = far_future + datetime.timedelta(days=1)
    rescheduled = await reschedule_appointment(db_session, test_user_id, appointment.appointment_id, new_time)
    assert rescheduled.start_time == new_time
    assert rescheduled.original_start_time == far_future
```

- [ ] **Step 2: Run to verify failure**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -k "list_my_appointments or get_appointment or confirm or cancel or reschedule" -v`
Expected: FAIL — functions not defined.

- [ ] **Step 3: Implement**

Append to `backend/app/services/appointments/service.py`:

```python
from sqlalchemy import and_, or_

_CUTOFF = datetime.timedelta(hours=24)
_VALID_TRANSITIONS = {
    "confirm": ("pending", "confirmed"),
    "complete": ("confirmed", "completed"),
    "no_show": ("confirmed", "no_show"),
}


async def list_my_appointments(
    db: AsyncSession,
    caller_id: str,
    status: str | None = None,
    date_from: datetime.datetime | None = None,
    date_to: datetime.datetime | None = None,
) -> list[Appointment]:
    conditions = [or_(Appointment.user_id == caller_id, Appointment.provider_id == caller_id)]
    if status is not None:
        conditions.append(Appointment.status == status)
    if date_from is not None:
        conditions.append(Appointment.start_time >= date_from)
    if date_to is not None:
        conditions.append(Appointment.start_time <= date_to)
    result = await db.execute(
        select(Appointment).where(and_(*conditions)).order_by(Appointment.start_time)
    )
    return list(result.scalars().all())


async def get_appointment(db: AsyncSession, caller_id: str, appointment_id: int) -> Appointment:
    result = await db.execute(
        select(Appointment).where(
            Appointment.appointment_id == appointment_id,
            or_(Appointment.user_id == caller_id, Appointment.provider_id == caller_id),
        )
    )
    appointment = result.scalar_one_or_none()
    if appointment is None:
        raise ValueError(f"Appointment {appointment_id} not found")
    return appointment


async def _get_owned_by_provider(db: AsyncSession, provider_id: str, appointment_id: int) -> Appointment:
    result = await db.execute(
        select(Appointment).where(
            Appointment.appointment_id == appointment_id, Appointment.provider_id == provider_id
        )
    )
    appointment = result.scalar_one_or_none()
    if appointment is None:
        raise ValueError(f"Appointment {appointment_id} not found for this provider")
    return appointment


async def _transition(
    db: AsyncSession, provider_id: str, appointment_id: int, action: str, **fields: object
) -> Appointment:
    appointment = await _get_owned_by_provider(db, provider_id, appointment_id)
    required_status, next_status = _VALID_TRANSITIONS[action]
    if appointment.status != required_status:
        raise ValueError(f"Cannot {action} an appointment in status '{appointment.status}'")
    appointment.status = next_status
    for field, value in fields.items():
        setattr(appointment, field, value)
    await db.commit()
    return appointment


async def confirm_appointment(db: AsyncSession, provider_id: str, appointment_id: int) -> Appointment:
    return await _transition(db, provider_id, appointment_id, "confirm")


async def complete_appointment(
    db: AsyncSession, provider_id: str, appointment_id: int, notes: str | None = None
) -> Appointment:
    return await _transition(db, provider_id, appointment_id, "complete", notes=notes)


async def mark_no_show(db: AsyncSession, provider_id: str, appointment_id: int) -> Appointment:
    return await _transition(db, provider_id, appointment_id, "no_show")


async def cancel_appointment(
    db: AsyncSession, caller_id: str, appointment_id: int, reason: str | None
) -> Appointment:
    appointment = await get_appointment(db, caller_id, appointment_id)
    is_user = caller_id == appointment.user_id
    if is_user and appointment.start_time - datetime.datetime.now(datetime.UTC) < _CUTOFF:
        raise PermissionError("Appointments can only be cancelled at least 24 hours in advance")
    appointment.status = "cancelled"
    appointment.cancelled_by = caller_id
    appointment.cancellation_reason = reason
    await db.commit()
    return appointment


async def reschedule_appointment(
    db: AsyncSession, caller_id: str, appointment_id: int, new_start_time: datetime.datetime
) -> Appointment:
    appointment = await get_appointment(db, caller_id, appointment_id)
    is_user = caller_id == appointment.user_id
    if is_user and appointment.start_time - datetime.datetime.now(datetime.UTC) < _CUTOFF:
        raise PermissionError("Appointments can only be rescheduled at least 24 hours in advance")
    duration = appointment.end_time - appointment.start_time
    if appointment.original_start_time is None:
        appointment.original_start_time = appointment.start_time
    appointment.start_time = new_start_time
    appointment.end_time = new_start_time + duration
    try:
        await db.flush()
    except IntegrityError as exc:
        await db.rollback()
        raise SlotUnavailableError("This appointment slot is no longer available") from exc
    await db.commit()
    return appointment
```

- [ ] **Step 4: Run to verify pass**

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: all tests (Tasks 3-6) PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/appointments/service.py backend/tests/test_appointments_service.py
git commit -m "feat(appointments): add status transitions, cancellation, and reschedule"
```

---

## Task 7: Router + notifications + wiring

**Files:**
- Create: `backend/app/services/appointments/router.py`
- Modify: `backend/app/main.py` (register router)
- Modify: `backend/app/services/appointments/service.py` (append notification calls
  to `book_appointment`/`confirm_appointment`/`cancel_appointment`/`reschedule_appointment`)
- Create: `backend/tests/test_appointments_router.py`
- Test: both files above

**Interfaces:**
- Consumes: everything from Tasks 3-6; `require_role`, `require_verified_professional`
  (`app.core.security`); `notifications.service.create_notification` (existing).
- Produces: the full `/api/v1/appointments/*` HTTP surface — consumed by Task 8 (frontend).

- [ ] **Step 1: Add notification calls (write the failing test first)**

```python
# Append to backend/tests/test_appointments_service.py
from app.services.notifications.service import list_my_notifications


async def test_booking_notifies_the_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    await book_appointment(
        db_session, test_user_id,
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
    )
    notifications = await list_my_notifications(db_session, provider_id)
    assert any(n.notification_type == "appointment_booked" for n in notifications)
```

Run: `cd backend && uv run pytest tests/test_appointments_service.py -k notifies -v`
Expected: FAIL.

In `service.py`, import `from app.services.notifications import service as notifications_service`
and add, right before `return appointment` in `book_appointment`:

```python
    await notifications_service.create_notification(
        db, data.provider_id,
        title="New appointment request",
        message=f"A new appointment request is pending your confirmation.",
        notification_type="appointment_booked",
    )
```

Add the equivalent single-line call in `confirm_appointment` (notify `appointment.user_id`,
`notification_type="appointment_confirmed"`), `cancel_appointment` (notify whichever
party is *not* `caller_id`, `notification_type="appointment_cancelled"`), and
`reschedule_appointment` (notify the other party, `notification_type="appointment_rescheduled"`)
— same pattern, before each function's final `return`.

Run: `cd backend && uv run pytest tests/test_appointments_service.py -v`
Expected: all PASS.

- [ ] **Step 2: Write `router.py`**

```python
import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role, require_verified_professional
from app.db.postgres import external_user_table, get_db
from app.services.appointments import service
from app.services.appointments.models import Appointment
from app.services.appointments.schemas import (
    AppointmentCancelUpdate,
    AppointmentCompleteUpdate,
    AppointmentCreate,
    AppointmentRead,
    AppointmentRescheduleUpdate,
    AvailabilityExceptionCreate,
    AvailabilityExceptionRead,
    AvailabilityRead,
    AvailabilityUpdate,
    ProviderSummaryRead,
    SlotRead,
)
from app.services.consultant_profile.models import ConsultantProfile
from app.services.dermatologist_profile.models import DermatologistProfile

router = APIRouter(prefix="/appointments")


async def _to_read(db: AsyncSession, caller_id: str, appointment: Appointment) -> AppointmentRead:
    other_id = appointment.provider_id if caller_id == appointment.user_id else appointment.user_id
    name_result = await db.execute(
        select(external_user_table.c.name).where(external_user_table.c.id == other_id)
    )
    other_party_name = name_result.scalar_one_or_none()
    return AppointmentRead(
        appointment_id=appointment.appointment_id,
        user_id=appointment.user_id,
        provider_id=appointment.provider_id,
        provider_role=appointment.provider_role,  # type: ignore[arg-type]
        consultation_mode=appointment.consultation_mode,
        start_time=appointment.start_time,
        end_time=appointment.end_time,
        status=appointment.status,  # type: ignore[arg-type]
        cancellation_reason=appointment.cancellation_reason,
        original_start_time=appointment.original_start_time,
        notes=appointment.notes,
        other_party_name=other_party_name,
    )


@router.get("/availability/me")
async def get_my_availability(
    user: Annotated[dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityRead:
    rules = await service.get_availability(db, user["id"])
    return AvailabilityRead(rules=[r for r in rules])  # pydantic coerces via from_attributes


@router.put("/availability/me")
async def put_my_availability(
    data: AvailabilityUpdate,
    user: Annotated[dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityRead:
    try:
        rules = await service.replace_availability(db, user["id"], data.rules)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return AvailabilityRead(rules=list(rules))


@router.get("/availability/exceptions")
async def get_my_exceptions(
    user: Annotated[dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[AvailabilityExceptionRead]:
    exceptions = await service.list_exceptions(db, user["id"])
    return [AvailabilityExceptionRead.model_validate(e) for e in exceptions]


@router.post("/availability/exceptions", status_code=status.HTTP_201_CREATED)
async def add_my_exception(
    data: AvailabilityExceptionCreate,
    user: Annotated[dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AvailabilityExceptionRead:
    exception = await service.add_exception(db, user["id"], data)
    return AvailabilityExceptionRead.model_validate(exception)


@router.delete("/availability/exceptions/{exception_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_exception(
    exception_id: int,
    user: Annotated[dict[str, Any], Depends(require_verified_professional("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_exception(db, user["id"], exception_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.get("/providers")
async def list_providers(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    role: str = Query(pattern="^(consultant|dermatologist)$"),
) -> list[ProviderSummaryRead]:
    model = ConsultantProfile if role == "consultant" else DermatologistProfile
    result = await db.execute(select(model).where(model.verification_status == "approved"))
    profiles = result.scalars().all()
    ids = [p.user_id for p in profiles]
    names: dict[str, str | None] = {}
    if ids:
        name_result = await db.execute(
            select(external_user_table.c.id, external_user_table.c.name).where(
                external_user_table.c.id.in_(ids)
            )
        )
        names = {row.id: row.name for row in name_result.all()}
    return [
        ProviderSummaryRead(
            provider_id=p.user_id,
            name=names.get(p.user_id),
            role=role,  # type: ignore[arg-type]
            biography=getattr(p, "biography", None) or getattr(p, "professional_biography", None),
            specializations=p.specializations,
            consultation_modes=p.consultation_modes,
            years_experience=getattr(p, "years_of_experience", None)
            or getattr(p, "years_of_practice", None),
        )
        for p in profiles
    ]


@router.get("/providers/{provider_id}/slots")
async def get_provider_slots(
    provider_id: str,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    date: datetime.date = Query(),
) -> list[SlotRead]:
    return await service.compute_available_slots(db, provider_id, date)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_appointment(
    data: AppointmentCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.book_appointment(db, user["id"], data)
    except service.SlotUnavailableError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.get("/me")
async def list_my_appointments(
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
    appointment_status: str | None = Query(default=None, alias="status"),
    date_from: datetime.datetime | None = None,
    date_to: datetime.datetime | None = None,
) -> list[AppointmentRead]:
    appointments = await service.list_my_appointments(
        db, user["id"], status=appointment_status, date_from=date_from, date_to=date_to
    )
    return [await _to_read(db, user["id"], a) for a in appointments]


@router.get("/{appointment_id}")
async def get_appointment(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.get_appointment(db, user["id"], appointment_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/confirm")
async def confirm_appointment(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.confirm_appointment(db, user["id"], appointment_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/complete")
async def complete_appointment(
    appointment_id: int,
    data: AppointmentCompleteUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.complete_appointment(db, user["id"], appointment_id, notes=data.notes)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/no-show")
async def mark_appointment_no_show(
    appointment_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.mark_no_show(db, user["id"], appointment_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    data: AppointmentCancelUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.cancel_appointment(db, user["id"], appointment_id, data.reason)
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)


@router.patch("/{appointment_id}/reschedule")
async def reschedule_appointment(
    appointment_id: int,
    data: AppointmentRescheduleUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user", "consultant", "dermatologist"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AppointmentRead:
    try:
        appointment = await service.reschedule_appointment(
            db, user["id"], appointment_id, data.start_time
        )
    except service.SlotUnavailableError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    except PermissionError as exc:
        raise HTTPException(status.HTTP_403_FORBIDDEN, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await _to_read(db, user["id"], appointment)
```

- [ ] **Step 3: Wire into `main.py`**

In `backend/app/main.py`, add the import alphabetically among the existing service
router imports:

```python
from app.services.appointments.router import router as appointments_router
```

Find the block of `app.include_router(...)` calls (same file) and add:

```python
    app.include_router(appointments_router, prefix="/api/v1")
```

- [ ] **Step 4: Write router-level tests**

```python
"""backend/app/services/appointments/router.py — auth/ownership behavior not already
covered by test_appointments_service.py. Calls handlers directly (test_routines_router.py's
established pattern), not through an HTTP client."""

import datetime
import uuid

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.postgres import external_user_table
from app.services.appointments.router import confirm_appointment, create_appointment
from app.services.appointments.schemas import AppointmentCreate
from app.services.consultant_profile.models import ConsultantProfile


@pytest.fixture
async def provider_id(db_session: AsyncSession):
    user_id = f"test-provider-{uuid.uuid4().hex[:16]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=user_id, email=f"{user_id}@test.invalid", name="Dr. Provider", emailVerified=False
        )
    )
    db_session.add(ConsultantProfile(user_id=user_id, verification_status="approved"))
    await db_session.flush()
    yield user_id


async def test_create_appointment_returns_the_other_partys_name(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    user = {"id": test_user_id, "role": "user", "claims": {}}
    result = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    assert result.other_party_name == "Dr. Provider"
    assert result.status == "pending"


async def test_confirm_appointment_rejects_a_stranger_provider(
    db_session: AsyncSession, provider_id: str, test_user_id: str
) -> None:
    from fastapi import HTTPException

    user = {"id": test_user_id, "role": "user", "claims": {}}
    created = await create_appointment(
        AppointmentCreate(
            provider_id=provider_id,
            start_time=datetime.datetime(2026, 9, 7, 9, 0, tzinfo=datetime.UTC),
            consultation_mode="video",
        ),
        user,
        db_session,
    )
    stranger_provider = {"id": f"test-{uuid.uuid4().hex[:16]}", "role": "consultant", "claims": {}}
    with pytest.raises(HTTPException) as exc_info:
        await confirm_appointment(created.appointment_id, stranger_provider, db_session)
    assert exc_info.value.status_code == 400
```

- [ ] **Step 5: Run all appointment tests, regenerate OpenAPI types**

Run: `cd backend && uv run pytest tests/test_appointments_service.py tests/test_appointments_router.py tests/test_appointments_migration.py -v`
Expected: all PASS.

Run: `cd backend && uv run ruff check app/services/appointments/ && uv run mypy --strict app/services/appointments/`
Expected: no errors (fix any typing issues surfaced — e.g. Pydantic `Literal` coercions
from ORM `str` columns commonly need the `# type: ignore[arg-type]` already included
above, or a cast, depending on what `mypy --strict` actually reports).

Run: `make openapi` (repo root)
Expected: `web/lib/api-types.ts` regenerates with `/api/v1/appointments/*` paths present.

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/appointments/router.py backend/app/services/appointments/service.py \
        backend/app/main.py backend/tests/test_appointments_router.py \
        backend/tests/test_appointments_service.py web/lib/api-types.ts
git commit -m "feat(appointments): add appointments router, wire into app, add notifications"
```

---

## Task 8: shadcn Calendar + nav-config changes

**Files:**
- Create: `web/components/ui/calendar.tsx` (via shadcn skill/CLI — Base UI variant)
- Modify: `web/lib/nav-config.ts`

**Interfaces:**
- Produces: `Calendar` component (shadcn's standard export shape — `mode`, `selected`,
  `onSelect`, `disabled` props); nav entries — consumed by Tasks 11-13.

- [ ] **Step 1: Add the Calendar component**

Use the shadcn skill (project style is `base-nova` per `web/components.json` — Base UI,
not Radix) to add the `calendar` component: `npx shadcn@latest add calendar` from
`web/`, confirming it targets the Base UI registry entry. If the CLI pulls
`react-day-picker` as a dependency, that is expected (shadcn's own Calendar
implementation depends on it) — not a new component library, just Calendar's own
transitive dependency.

- [ ] **Step 2: Add the User "Appointments" nav item**

In `web/lib/nav-config.ts`, add `CalendarClock` to the `lucide-react` import block
(alphabetically, between `Camera` and `ClipboardCheck`), then insert into the `user`
role's `"main"` section items array, right after the `"progress"` item (`path:
"/progress"`, before `"check-in"`):

```typescript
        {
          id: "appointments",
          label: "Appointments",
          subtitle: "Book & manage appointments",
          path: "/appointments",
          icon: CalendarClock,
        },
```

- [ ] **Step 3: Flip `built: true` on the two repurposed stubs**

Two edits, each changing `built: false,` to `built: true,` for exactly one item:
- The `consultant` role's `"reminders"` item (subtitle `"Appointments & reminders"`,
  `path: "/reminders"`).
- The `dermatologist` role's `"consultations"` item (subtitle `"Appointments & notes"`,
  `path: "/consultations"`).

(Both pages still render a `ComingSoon` sub-tab/section for the still-unbuilt half —
`built: true` reflects that the page itself is no longer a dead stub, matching how
`"ingredient-database"` is already `built: true` elsewhere in this same file.)

- [ ] **Step 4: Verify**

Run: `cd web && npm run typecheck`
Expected: no errors (confirms the new nav item's shape matches `NavItem`/`RawNavItem`).

Run: `cd web && npm run dev` (manual check, then stop it) — open the app, confirm
"Appointments" appears in the User sidebar and the two provider stubs no longer show
a "Soon" badge.

- [ ] **Step 5: Commit**

```bash
git add web/components/ui/calendar.tsx web/lib/nav-config.ts web/package.json web/package-lock.json
git commit -m "feat(appointments): add Calendar component and appointments nav entries"
```

---

## Task 9: `use-appointments.ts` query/mutation hooks

**Files:**
- Create: `web/lib/hooks/use-appointments.ts`

**Interfaces:**
- Consumes: `api` (`web/lib/api.ts`), `paths` types (`web/lib/api-types.ts`, from Task 7's
  `make openapi`).
- Produces: `useMyAppointmentsQuery(filters?)`, `useAppointmentQuery(id)`,
  `useProvidersQuery(role)`, `useProviderSlotsQuery(providerId, date)`,
  `useBookAppointmentMutation()`, `useConfirmAppointmentMutation()`,
  `useCompleteAppointmentMutation()`, `useNoShowAppointmentMutation()`,
  `useCancelAppointmentMutation()`, `useRescheduleAppointmentMutation()`,
  `useMyAvailabilityQuery()`, `useUpdateAvailabilityMutation()`,
  `useAvailabilityExceptionsQuery()`, `useAddExceptionMutation()`,
  `useDeleteExceptionMutation()` — consumed by Tasks 10-13.

- [ ] **Step 1: Write the hooks file**

```typescript
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api";
import type { components } from "@/lib/api-types";

type AppointmentRead = components["schemas"]["AppointmentRead"];
type AvailabilityRule = components["schemas"]["AvailabilityRule"];

const APPOINTMENTS_KEY = ["appointments", "me"] as const;

export function useMyAppointmentsQuery(filters?: { status?: string }) {
  return useQuery({
    queryKey: [...APPOINTMENTS_KEY, filters],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/me", {
        params: { query: filters ?? {} },
      });
      return data ?? [];
    },
  });
}

export function useAppointmentQuery(appointmentId: number | null) {
  return useQuery({
    queryKey: ["appointments", appointmentId],
    queryFn: async () => {
      if (appointmentId === null) return null;
      const { data } = await api.GET("/api/v1/appointments/{appointment_id}", {
        params: { path: { appointment_id: appointmentId } },
      });
      return data ?? null;
    },
    enabled: appointmentId !== null,
  });
}

export function useProvidersQuery(role: "consultant" | "dermatologist") {
  return useQuery({
    queryKey: ["appointments", "providers", role],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/providers", {
        params: { query: { role } },
      });
      return data ?? [];
    },
  });
}

export function useProviderSlotsQuery(providerId: string | null, date: string | null) {
  return useQuery({
    queryKey: ["appointments", "slots", providerId, date],
    queryFn: async () => {
      if (!providerId || !date) return [];
      const { data } = await api.GET("/api/v1/appointments/providers/{provider_id}/slots", {
        params: { path: { provider_id: providerId }, query: { date } },
      });
      return data ?? [];
    },
    enabled: Boolean(providerId && date),
  });
}

function useInvalidateAppointments() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["appointments"] });
}

export function useBookAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (body: components["schemas"]["AppointmentCreate"]) => {
      const { data, error, response } = await api.POST("/api/v1/appointments", { body });
      if (error) {
        if (response.status === 409) throw new Error("slot_unavailable");
        throw new Error("booking_failed");
      }
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useConfirmAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/confirm", {
        params: { path: { appointment_id: appointmentId } },
      });
      if (error) throw new Error("confirm_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCompleteAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ appointmentId, notes }: { appointmentId: number; notes?: string }) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/complete", {
        params: { path: { appointment_id: appointmentId } },
        body: { notes: notes ?? null },
      });
      if (error) throw new Error("complete_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useNoShowAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async (appointmentId: number) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/no-show", {
        params: { path: { appointment_id: appointmentId } },
      });
      if (error) throw new Error("no_show_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCancelAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ appointmentId, reason }: { appointmentId: number; reason?: string }) => {
      const { data, error } = await api.PATCH("/api/v1/appointments/{appointment_id}/cancel", {
        params: { path: { appointment_id: appointmentId } },
        body: { reason: reason ?? null },
      });
      if (error) throw new Error("cancel_failed");
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRescheduleAppointmentMutation() {
  const invalidate = useInvalidateAppointments();
  return useMutation({
    mutationFn: async ({ appointmentId, startTime }: { appointmentId: number; startTime: string }) => {
      const { data, error, response } = await api.PATCH(
        "/api/v1/appointments/{appointment_id}/reschedule",
        { params: { path: { appointment_id: appointmentId } }, body: { start_time: startTime } }
      );
      if (error) {
        if (response.status === 409) throw new Error("slot_unavailable");
        throw new Error("reschedule_failed");
      }
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useMyAvailabilityQuery() {
  return useQuery({
    queryKey: ["appointments", "availability", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/availability/me");
      return data?.rules ?? [];
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rules: AvailabilityRule[]) => {
      const { data, error } = await api.PUT("/api/v1/appointments/availability/me", {
        body: { rules },
      });
      if (error) throw new Error("availability_update_failed");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export function useAvailabilityExceptionsQuery() {
  return useQuery({
    queryKey: ["appointments", "availability", "exceptions"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/appointments/availability/exceptions");
      return data ?? [];
    },
  });
}

export function useAddExceptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: components["schemas"]["AvailabilityExceptionCreate"]) => {
      const { data, error } = await api.POST("/api/v1/appointments/availability/exceptions", {
        body,
      });
      if (error) throw new Error("add_exception_failed");
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export function useDeleteExceptionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (exceptionId: number) => {
      const { error } = await api.DELETE("/api/v1/appointments/availability/exceptions/{exception_id}", {
        params: { path: { exception_id: exceptionId } },
      });
      if (error) throw new Error("delete_exception_failed");
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["appointments", "availability"] }),
  });
}

export type { AppointmentRead };
```

- [ ] **Step 2: Typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS (any mismatch against the real generated `api-types.ts` shapes — e.g. a
different operationId or param name than assumed above — surfaces here; fix by reading
the actual generated types and matching them exactly, not by guessing again).

- [ ] **Step 3: Commit**

```bash
git add web/lib/hooks/use-appointments.ts
git commit -m "feat(appointments): add appointment and availability query/mutation hooks"
```

---

## Task 10: Shared `AppointmentList` + `AppointmentDetailDialog`

**Files:**
- Create: `web/components/appointments/appointment-list.tsx`
- Create: `web/components/appointments/appointment-detail-dialog.tsx`

**Interfaces:**
- Consumes: hooks from Task 9; `StateCard` (`@/components/state-card`), `Skeleton`,
  `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent`, `Dialog`, `Badge`, `Button` (existing
  `web/components/ui/*`).
- Produces: `<AppointmentList viewerRole="user"|"consultant"|"dermatologist" onOpenProfile={(otherPartyId) => void} />`,
  `<AppointmentDetailDialog appointment={...} viewerRole={...} open={...} onOpenChange={...} onOpenProfile={...} />`
  — consumed by Tasks 11-13, 14.

- [ ] **Step 1: Write `appointment-detail-dialog.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCancelAppointmentMutation,
  useCompleteAppointmentMutation,
  useConfirmAppointmentMutation,
  useNoShowAppointmentMutation,
  type AppointmentRead,
} from "@/lib/hooks/use-appointments";

const STATUS_TONE: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  confirmed: "default",
  completed: "secondary",
  cancelled: "destructive",
  no_show: "destructive",
};

interface AppointmentDetailDialogProps {
  appointment: AppointmentRead | null;
  viewerRole: "user" | "consultant" | "dermatologist";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenProfile?: (otherPartyUserId: string) => void;
}

export function AppointmentDetailDialog({
  appointment,
  viewerRole,
  open,
  onOpenChange,
  onOpenProfile,
}: AppointmentDetailDialogProps) {
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const confirmMutation = useConfirmAppointmentMutation();
  const completeMutation = useCompleteAppointmentMutation();
  const noShowMutation = useNoShowAppointmentMutation();
  const cancelMutation = useCancelAppointmentMutation();

  if (!appointment) return null;
  const isProvider = viewerRole !== "user";
  const otherPartyId = viewerRole === "user" ? appointment.provider_id : appointment.user_id;

  const handleCancel = () => {
    cancelMutation.mutate(
      { appointmentId: appointment.appointment_id },
      {
        onSuccess: () => {
          toast.success("Appointment cancelled");
          setConfirmingCancel(false);
          onOpenChange(false);
        },
        onError: (err) =>
          toast.error(
            err.message === "cancel_failed"
              ? "Appointments can only be cancelled at least 24 hours in advance."
              : "Couldn't cancel this appointment. Try again."
          ),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {confirmingCancel ? (
          <>
            <DialogHeader>
              <DialogTitle>Cancel this appointment?</DialogTitle>
              <DialogDescription>This can't be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
                Keep appointment
              </Button>
              <Button
                variant="destructive"
                disabled={cancelMutation.isPending}
                onClick={handleCancel}
              >
                Cancel appointment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{appointment.other_party_name ?? "Appointment"}</DialogTitle>
              <DialogDescription>
                {new Date(appointment.start_time).toLocaleString()} ·{" "}
                {appointment.consultation_mode}
              </DialogDescription>
            </DialogHeader>
            <Badge variant={STATUS_TONE[appointment.status] ?? "outline"}>
              {appointment.status.replace("_", " ")}
            </Badge>
            {appointment.notes && (
              <p className="text-on-surface-variant font-sans text-sm">{appointment.notes}</p>
            )}
            <DialogFooter className="flex-wrap gap-2">
              {onOpenProfile && (
                <Button variant="outline" onClick={() => onOpenProfile(otherPartyId)}>
                  Open profile
                </Button>
              )}
              {isProvider && appointment.status === "pending" && (
                <Button
                  disabled={confirmMutation.isPending}
                  onClick={() =>
                    confirmMutation.mutate(appointment.appointment_id, {
                      onSuccess: () => toast.success("Appointment confirmed"),
                      onError: () => toast.error("Couldn't confirm. Try again."),
                    })
                  }
                >
                  Confirm
                </Button>
              )}
              {isProvider && appointment.status === "confirmed" && (
                <>
                  <Button
                    disabled={completeMutation.isPending}
                    onClick={() =>
                      completeMutation.mutate(
                        { appointmentId: appointment.appointment_id },
                        {
                          onSuccess: () => toast.success("Marked complete"),
                          onError: () => toast.error("Couldn't complete. Try again."),
                        }
                      )
                    }
                  >
                    Mark complete
                  </Button>
                  <Button
                    variant="outline"
                    disabled={noShowMutation.isPending}
                    onClick={() =>
                      noShowMutation.mutate(appointment.appointment_id, {
                        onSuccess: () => toast.success("Marked no-show"),
                        onError: () => toast.error("Couldn't update. Try again."),
                      })
                    }
                  >
                    No-show
                  </Button>
                </>
              )}
              {["pending", "confirmed"].includes(appointment.status) && (
                <Button variant="destructive" onClick={() => setConfirmingCancel(true)}>
                  Cancel
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Write `appointment-list.tsx`**

```tsx
"use client";

import { useMemo, useState } from "react";
import { CalendarX, RotateCw, TriangleAlert } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMyAppointmentsQuery, type AppointmentRead } from "@/lib/hooks/use-appointments";

import { AppointmentDetailDialog } from "./appointment-detail-dialog";

interface AppointmentListProps {
  viewerRole: "user" | "consultant" | "dermatologist";
  onOpenProfile?: (otherPartyUserId: string) => void;
}

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
const isFuture = (iso: string) => new Date(iso).getTime() > Date.now();

export function AppointmentList({ viewerRole, onOpenProfile }: AppointmentListProps) {
  const [selected, setSelected] = useState<AppointmentRead | null>(null);
  const { data, isLoading, isError, refetch } = useMyAppointmentsQuery();

  const { today, upcoming, history } = useMemo(() => {
    const rows = data ?? [];
    return {
      today: rows.filter((a) => isToday(a.start_time) && ["pending", "confirmed"].includes(a.status)),
      upcoming: rows.filter(
        (a) => !isToday(a.start_time) && isFuture(a.start_time) && ["pending", "confirmed"].includes(a.status)
      ),
      history: rows.filter((a) => !["pending", "confirmed"].includes(a.status) || !isFuture(a.start_time)),
    };
  }, [data]);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (isError) {
    return (
      <StateCard
        tone="destructive"
        icon={TriangleAlert}
        description="Unable to load appointments."
        action={
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCw className="size-4" strokeWidth={1.5} />
            Retry
          </Button>
        }
      />
    );
  }

  const renderRows = (rows: AppointmentRead[], emptyMessage: string) =>
    rows.length === 0 ? (
      <StateCard icon={CalendarX} description={emptyMessage} />
    ) : (
      <ul className="flex flex-col gap-3">
        {rows.map((a) => (
          <li key={a.appointment_id}>
            <button
              type="button"
              onClick={() => setSelected(a)}
              className="border-border bg-card hover:bg-muted flex w-full items-center justify-between rounded-2xl border p-4 text-left transition-colors"
            >
              <div>
                <p className="font-sans text-sm font-semibold">{a.other_party_name ?? "Appointment"}</p>
                <p className="text-on-surface-variant font-sans text-xs">
                  {new Date(a.start_time).toLocaleString()}
                </p>
              </div>
              <Badge variant="outline">{a.status.replace("_", " ")}</Badge>
            </button>
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="today">{renderRows(today, "No appointments today.")}</TabsContent>
        <TabsContent value="upcoming">{renderRows(upcoming, "No upcoming appointments.")}</TabsContent>
        <TabsContent value="history">{renderRows(history, "No appointment history.")}</TabsContent>
      </Tabs>
      <AppointmentDetailDialog
        appointment={selected}
        viewerRole={viewerRole}
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
        onOpenProfile={onOpenProfile}
      />
    </>
  );
}
```

- [ ] **Step 3: Typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS. If `StateCard`'s prop names differ from `tone`/`icon`/`description`/
`action` as used above, read `web/components/state-card.tsx` and correct the calls to
match its real props (it's already used with this exact shape in
`app/(user)/progress/page.tsx:163-173` — cross-check there if unsure).

- [ ] **Step 4: Commit**

```bash
git add web/components/appointments/appointment-list.tsx \
        web/components/appointments/appointment-detail-dialog.tsx
git commit -m "feat(appointments): add shared appointment list and detail dialog components"
```

---

## Task 11: Consultant page — tabbed Appointments/Reminders

**Files:**
- Modify: `web/app/consultant/reminders/page.tsx`

**Interfaces:**
- Consumes: `AppointmentList` (Task 10), `ComingSoon` (existing), `Tabs` (existing).

- [ ] **Step 1: Rewrite the page**

```tsx
"use client";

import { AlarmClock } from "lucide-react";
import { useRouter } from "next/navigation";

import { ComingSoon } from "@/components/app-shell/coming-soon";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ConsultantAppointmentsAndRemindersPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">
          Appointments & reminders
        </h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Manage your schedule and client reminders.
        </p>
      </div>
      <Tabs defaultValue="appointments">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>
        <TabsContent value="appointments">
          <AppointmentList
            viewerRole="consultant"
            onOpenProfile={(userId) => router.push(`/consultant/clients/${userId}`)}
          />
        </TabsContent>
        <TabsContent value="reminders">
          <ComingSoon icon={AlarmClock} title="Reminders" description="Client reminders" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Manual check**

Run `cd web && npm run dev`, sign in as a consultant (or use existing dev auth
shortcut, whatever this repo's established local-testing flow is — check
`docs/AGENT_WORKFLOW.md`/`README.md` if unsure), navigate to `/consultant/reminders`,
confirm the Appointments tab renders (empty state initially, since no data exists yet)
and the Reminders tab still shows the `ComingSoon` stub. Stop the dev server after.

- [ ] **Step 3: Commit**

```bash
git add web/app/consultant/reminders/page.tsx
git commit -m "feat(appointments): build consultant appointment management tab"
```

---

## Task 12: Dermatologist page — appointment management

**Files:**
- Modify: `web/app/dermatologist/consultations/page.tsx`

**Interfaces:**
- Consumes: `AppointmentList` (Task 10).

- [ ] **Step 1: Rewrite the page**

```tsx
"use client";

import { useRouter } from "next/navigation";

import { AppointmentList } from "@/components/appointments/appointment-list";

export default function DermatologistConsultationsPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Consultations</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Manage your appointment schedule.
        </p>
      </div>
      <AppointmentList
        viewerRole="dermatologist"
        onOpenProfile={(userId) => router.push(`/dermatologist/patients/${userId}`)}
      />
    </div>
  );
}
```

Confirmed: `web/app/dermatologist/patients/[userId]/page.tsx` exists, so
`/dermatologist/patients/${userId}` is a real route — no substitution needed.

- [ ] **Step 2: Manual check**

Same manual verification as Task 11, for `/dermatologist/consultations`.

- [ ] **Step 3: Commit**

```bash
git add web/app/dermatologist/consultations/page.tsx
git commit -m "feat(appointments): build dermatologist appointment management page"
```

---

## Task 13: Consultant dashboard widget + AvailabilitySettings

**Files:**
- Modify: `web/components/clinical-review/clinical-dashboard.tsx` (replace the
  `emptyMessage="No scheduling system yet."` KPI, `clinical-dashboard.tsx:247`)
- Create: `web/components/appointments/availability-settings.tsx`
- Modify: `web/app/consultant/settings/page.tsx`
- Modify: `web/app/dermatologist/settings/page.tsx`

**Interfaces:**
- Consumes: `useMyAppointmentsQuery`, `useMyAvailabilityQuery`,
  `useUpdateAvailabilityMutation`, `useAvailabilityExceptionsQuery`,
  `useAddExceptionMutation`, `useDeleteExceptionMutation` (Task 9).

- [ ] **Step 1: Read the current KPI block before editing**

Read `web/components/clinical-review/clinical-dashboard.tsx` around line 202-247 in
full (the whole KPI row, not just the one line) to match its existing card markup
exactly — the replacement below assumes that structure; adjust to fit whatever the
real surrounding JSX looks like rather than dropping in a mismatched shape.

- [ ] **Step 2: Replace the KPI**

Replace the KPI card whose `emptyMessage="No scheduling system yet."` (around line 247)
with:

```tsx
function NextAppointmentKpi() {
  const { data, isLoading } = useMyAppointmentsQuery({ status: "confirmed" });
  const next = data?.[0];

  if (isLoading) return <Skeleton className="h-20 w-full rounded-xl" />;

  return (
    <button
      type="button"
      onClick={() => router.push("/consultant/reminders")}
      className="border-border bg-card hover:bg-muted flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-colors"
    >
      <p className="text-on-surface-variant font-geist text-xs font-semibold tracking-[0.05em] uppercase">
        Next appointment
      </p>
      {next ? (
        <>
          <p className="font-sans text-sm font-semibold">{next.other_party_name}</p>
          <p className="text-on-surface-variant font-sans text-xs">
            {new Date(next.start_time).toLocaleString()}
          </p>
        </>
      ) : (
        <p className="text-on-surface-variant font-sans text-sm">No appointments today.</p>
      )}
    </button>
  );
}
```

(Written as a standalone component here for clarity — inline it into
`clinical-dashboard.tsx`'s existing component, using that file's own `router`/`useRouter`
instance rather than a second one, and matching whatever KPI-card wrapper markup its
sibling cards already use instead of the ad hoc classes above.)

- [ ] **Step 3: Write `availability-settings.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useAddExceptionMutation,
  useAvailabilityExceptionsQuery,
  useDeleteExceptionMutation,
  useMyAvailabilityQuery,
  useUpdateAvailabilityMutation,
} from "@/lib/hooks/use-appointments";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayRow {
  day_of_week: number;
  enabled: boolean;
  start_time: string;
  end_time: string;
  slot_duration_minutes: number;
}

function rangesOverlap(a: DayRow, b: DayRow) {
  return a.start_time < b.end_time && b.start_time < a.end_time;
}

export function AvailabilitySettings() {
  const availabilityQuery = useMyAvailabilityQuery();
  const updateAvailability = useUpdateAvailabilityMutation();
  const exceptionsQuery = useAvailabilityExceptionsQuery();
  const addException = useAddExceptionMutation();
  const deleteException = useDeleteExceptionMutation();

  const [rows, setRows] = useState<DayRow[] | null>(null);
  const [blockDate, setBlockDate] = useState("");
  const [blockWholeDay, setBlockWholeDay] = useState(true);
  const [blockStart, setBlockStart] = useState("09:00");
  const [blockEnd, setBlockEnd] = useState("17:00");

  const effectiveRows: DayRow[] =
    rows ??
    DAYS.map((_, day_of_week) => {
      const existing = availabilityQuery.data?.find((r) => r.day_of_week === day_of_week);
      return existing
        ? { ...existing, enabled: true }
        : { day_of_week, enabled: false, start_time: "09:00", end_time: "17:00", slot_duration_minutes: 30 };
    });

  if (availabilityQuery.isLoading) return <Skeleton className="h-48 w-full rounded-2xl" />;

  const updateRow = (day_of_week: number, patch: Partial<DayRow>) => {
    setRows(effectiveRows.map((r) => (r.day_of_week === day_of_week ? { ...r, ...patch } : r)));
  };

  const hasOverlap = effectiveRows.some(
    (r) => r.enabled && effectiveRows.some((o) => o !== r && o.enabled && o.day_of_week === r.day_of_week && rangesOverlap(r, o))
  );
  const hasInvalidRange = effectiveRows.some((r) => r.enabled && r.start_time >= r.end_time);

  const handleSave = () => {
    const enabled = effectiveRows.filter((r) => r.enabled);
    updateAvailability.mutate(
      enabled.map(({ day_of_week, start_time, end_time, slot_duration_minutes }) => ({
        day_of_week,
        start_time,
        end_time,
        slot_duration_minutes,
      })),
      {
        onSuccess: () => toast.success("Availability saved"),
        onError: () => toast.error("Couldn't save availability. Try again."),
      }
    );
  };

  return (
    <div className="border-border bg-card flex flex-col gap-6 rounded-2xl border p-6">
      <div>
        <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">Weekly hours</h3>
        <div className="flex flex-col gap-3">
          {effectiveRows.map((row) => (
            <div key={row.day_of_week} className="flex flex-wrap items-center gap-3">
              <Switch
                checked={row.enabled}
                onCheckedChange={(checked) => updateRow(row.day_of_week, { enabled: checked })}
              />
              <span className="w-10 font-sans text-sm">{DAYS[row.day_of_week]}</span>
              {row.enabled && (
                <>
                  <Input
                    type="time"
                    value={row.start_time}
                    onChange={(e) => updateRow(row.day_of_week, { start_time: e.target.value })}
                    className="w-28"
                  />
                  <Input
                    type="time"
                    value={row.end_time}
                    onChange={(e) => updateRow(row.day_of_week, { end_time: e.target.value })}
                    className="w-28"
                  />
                  <Input
                    type="number"
                    min={5}
                    max={240}
                    value={row.slot_duration_minutes}
                    onChange={(e) =>
                      updateRow(row.day_of_week, { slot_duration_minutes: Number(e.target.value) })
                    }
                    className="w-20"
                  />
                  <span className="text-on-surface-variant font-sans text-xs">min slots</span>
                </>
              )}
            </div>
          ))}
        </div>
        {hasOverlap && (
          <p className="text-destructive mt-2 font-sans text-xs">
            Availability ranges overlap on the same day.
          </p>
        )}
        {hasInvalidRange && (
          <p className="text-destructive mt-2 font-sans text-xs">
            End time must be after start time.
          </p>
        )}
        <Button
          size="sm"
          className="mt-4"
          disabled={updateAvailability.isPending || hasOverlap || hasInvalidRange}
          onClick={handleSave}
        >
          Save weekly hours
        </Button>
      </div>

      <div>
        <h3 className="font-heading text-on-surface mb-4 text-sm font-semibold">Blocked dates</h3>
        {exceptionsQuery.isLoading ? (
          <Skeleton className="h-24 w-full rounded-xl" />
        ) : exceptionsQuery.data && exceptionsQuery.data.length > 0 ? (
          <ul className="mb-4 flex flex-col gap-2">
            {exceptionsQuery.data.map((exc) => (
              <li
                key={exc.exception_id}
                className="border-border flex items-center justify-between rounded-xl border p-3"
              >
                <span className="font-sans text-sm">
                  {exc.exception_date}
                  {exc.start_time ? ` (${exc.start_time}–${exc.end_time})` : " (whole day)"}
                  {exc.reason ? ` — ${exc.reason}` : ""}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => deleteException.mutate(exc.exception_id)}
                >
                  <Trash2 className="size-4" strokeWidth={1.5} />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-on-surface-variant mb-4 font-sans text-xs">No blocked dates.</p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} className="w-40" />
          <Switch checked={blockWholeDay} onCheckedChange={setBlockWholeDay} />
          <span className="font-sans text-xs">Whole day</span>
          {!blockWholeDay && (
            <>
              <Input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)} className="w-28" />
              <Input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)} className="w-28" />
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            disabled={!blockDate || addException.isPending}
            onClick={() =>
              addException.mutate(
                {
                  exception_date: blockDate,
                  start_time: blockWholeDay ? null : blockStart,
                  end_time: blockWholeDay ? null : blockEnd,
                  reason: null,
                },
                { onSuccess: () => setBlockDate("") }
              )
            }
          >
            <Plus className="size-4" strokeWidth={1.5} />
            Block date
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire into both settings pages**

In `web/app/consultant/settings/page.tsx` and `web/app/dermatologist/settings/page.tsx`,
add the import and render `<AvailabilitySettings />` under `<AppearanceSettings />`:

```tsx
import { AvailabilitySettings } from "@/components/appointments/availability-settings";
```

```tsx
      <AppearanceSettings />
      <AvailabilitySettings />
```

- [ ] **Step 5: Typecheck + manual check**

Run: `cd web && npm run typecheck`
Expected: PASS.

Manual: `npm run dev`, open consultant and dermatologist settings pages, toggle a day
on, set an overlapping range on purpose, confirm the inline warning appears and Save is
disabled; fix it, Save, reload, confirm it persisted. Add a blocked date, confirm it
lists and deletes. Stop the dev server after.

- [ ] **Step 6: Commit**

```bash
git add web/components/clinical-review/clinical-dashboard.tsx \
        web/components/appointments/availability-settings.tsx \
        web/app/consultant/settings/page.tsx web/app/dermatologist/settings/page.tsx
git commit -m "feat(appointments): add dashboard widget and provider availability settings"
```

---

## Task 14: User booking flow — `/appointments`

**Files:**
- Create: `web/app/(user)/appointments/page.tsx`
- Create: `web/components/appointments/provider-browse.tsx`
- Create: `web/components/appointments/booking-panel.tsx`

**Interfaces:**
- Consumes: `useProvidersQuery`, `useProviderSlotsQuery`, `useBookAppointmentMutation`
  (Task 9); `AppointmentList` (Task 10); `Calendar` (Task 8); `Command`/`Tabs`/`Card`
  (existing).

- [ ] **Step 1: Write `provider-browse.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Search } from "lucide-react";

import { StateCard } from "@/components/state-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useProvidersQuery } from "@/lib/hooks/use-appointments";

interface ProviderBrowseProps {
  onSelectProvider: (providerId: string, role: "consultant" | "dermatologist") => void;
}

export function ProviderBrowse({ onSelectProvider }: ProviderBrowseProps) {
  const [role, setRole] = useState<"consultant" | "dermatologist">("consultant");
  const [search, setSearch] = useState("");
  const providersQuery = useProvidersQuery(role);

  const filtered = (providersQuery.data ?? []).filter((p) =>
    (p.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <ToggleGroup
          value={[role]}
          onValueChange={(next) => next[0] && setRole(next[0] as "consultant" | "dermatologist")}
          className="bg-muted rounded-full p-1"
        >
          <ToggleGroupItem value="consultant" className="rounded-full px-3 py-1.5 text-xs font-bold">
            Consultants
          </ToggleGroupItem>
          <ToggleGroupItem value="dermatologist" className="rounded-full px-3 py-1.5 text-xs font-bold">
            Dermatologists
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="border-border bg-muted flex flex-1 items-center gap-2 rounded-full border px-3 py-2">
          <Search className="text-on-surface-variant size-4" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            className="w-full bg-transparent font-sans text-sm outline-none"
          />
        </div>
      </div>

      {providersQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <StateCard icon={Search} description="No providers found." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((provider) => (
            <button
              key={provider.provider_id}
              type="button"
              onClick={() => onSelectProvider(provider.provider_id, role)}
              className="border-border bg-card hover:bg-muted flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors"
            >
              <p className="font-sans text-sm font-semibold">{provider.name ?? "Provider"}</p>
              {provider.years_experience !== null && (
                <p className="text-on-surface-variant font-sans text-xs">
                  {provider.years_experience} years experience
                </p>
              )}
              {provider.biography && (
                <p className="text-on-surface-variant line-clamp-2 font-sans text-xs">
                  {provider.biography}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `booking-panel.tsx`**

```tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";

import { StateCard } from "@/components/state-card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useBookAppointmentMutation,
  useProviderSlotsQuery,
  useProvidersQuery,
} from "@/lib/hooks/use-appointments";

interface BookingPanelProps {
  providerId: string;
  role: "consultant" | "dermatologist";
  onBack: () => void;
  onBooked: () => void;
}

export function BookingPanel({ providerId, role, onBack, onBooked }: BookingPanelProps) {
  const providersQuery = useProvidersQuery(role);
  const provider = providersQuery.data?.find((p) => p.provider_id === providerId);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<string>(provider?.consultation_modes?.[0] ?? "video");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const bookMutation = useBookAppointmentMutation();

  const dateParam = date ? date.toISOString().slice(0, 10) : null;
  const slotsQuery = useProviderSlotsQuery(providerId, dateParam);

  const handleConfirm = () => {
    if (!selectedSlot) return;
    bookMutation.mutate(
      { provider_id: providerId, start_time: selectedSlot, consultation_mode: mode as "video" | "in_person" | "chat" },
      {
        onSuccess: () => {
          toast.success("Appointment booked");
          setConfirmOpen(false);
          onBooked();
        },
        onError: (err) => {
          if (err.message === "slot_unavailable") {
            toast.error("This appointment slot is no longer available. Please choose another time.");
            setSelectedSlot(null);
            slotsQuery.refetch();
          } else {
            toast.error("Couldn't book this appointment. Try again.");
          }
          setConfirmOpen(false);
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={onBack}>
        Back to providers
      </Button>

      {provider && (
        <div className="border-border bg-card rounded-2xl border p-6">
          <h2 className="font-heading text-on-surface text-lg font-semibold">{provider.name}</h2>
          {provider.biography && (
            <p className="text-on-surface-variant mt-1 font-sans text-sm">{provider.biography}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Calendar mode="single" selected={date} onSelect={(d) => { setDate(d); setSelectedSlot(null); }} />

        <div>
          <h3 className="font-heading text-on-surface mb-3 text-sm font-semibold">Available times</h3>
          {!date ? (
            <StateCard description="Pick a date to see available times." />
          ) : slotsQuery.isLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : !slotsQuery.data || slotsQuery.data.length === 0 ? (
            <StateCard description="No available slots for this date." />
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {slotsQuery.data.map((slot) => (
                <Button
                  key={slot.start_time}
                  variant={selectedSlot === slot.start_time ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedSlot(slot.start_time)}
                >
                  {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Button>
              ))}
            </div>
          )}

          {provider?.consultation_modes && provider.consultation_modes.length > 1 && (
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="mt-4 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {provider.consultation_modes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button className="mt-4 w-full" disabled={!selectedSlot} onClick={() => setConfirmOpen(true)}>
            Continue
          </Button>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm appointment</DialogTitle>
            <DialogDescription>
              {provider?.name} · {selectedSlot && new Date(selectedSlot).toLocaleString()} · {mode}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Back
            </Button>
            <Button disabled={bookMutation.isPending} onClick={handleConfirm}>
              Confirm booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

- [ ] **Step 3: Write `page.tsx`**

```tsx
"use client";

import { useState } from "react";

import { AppointmentList } from "@/components/appointments/appointment-list";
import { BookingPanel } from "@/components/appointments/booking-panel";
import { ProviderBrowse } from "@/components/appointments/provider-browse";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
  const [booking, setBooking] = useState<{ providerId: string; role: "consultant" | "dermatologist" } | null>(
    null
  );
  const [tab, setTab] = useState("book");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Appointments</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Book time with a consultant or dermatologist.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(next) => { setTab(next); setBooking(null); }}>
        <TabsList>
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        <TabsContent value="book">
          {booking ? (
            <BookingPanel
              providerId={booking.providerId}
              role={booking.role}
              onBack={() => setBooking(null)}
              onBooked={() => { setBooking(null); setTab("upcoming"); }}
            />
          ) : (
            <ProviderBrowse onSelectProvider={(providerId, role) => setBooking({ providerId, role })} />
          )}
        </TabsContent>
        <TabsContent value="upcoming">
          <AppointmentList viewerRole="user" />
        </TabsContent>
        <TabsContent value="history">
          <AppointmentList viewerRole="user" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

Note: `AppointmentList` already has its own internal Today/Upcoming/History tabs
(Task 10) — nesting it under this page's own Upcoming/History tabs duplicates that
structure. Before finalizing, simplify: either (a) give `AppointmentList` a
`defaultTab` prop and drop this page's outer Upcoming/History tabs in favor of just
"Book" + "My appointments" (rendering the full `AppointmentList` once), or (b) keep
this page's tabs as the only ones and add a `hideTabs`/`filter` prop to
`AppointmentList` for embedding without its own tab chrome. Pick (a) — simpler, no new
prop needed — before writing this file for real:

```tsx
        <TabsList>
          <TabsTrigger value="book">Book</TabsTrigger>
          <TabsTrigger value="appointments">My appointments</TabsTrigger>
        </TabsList>
        <TabsContent value="book">{/* ...same as above... */}</TabsContent>
        <TabsContent value="appointments">
          <AppointmentList viewerRole="user" />
        </TabsContent>
```

- [ ] **Step 4: Typecheck + manual check**

Run: `cd web && npm run typecheck`
Expected: PASS.

Manual: `npm run dev`, sign in as a user, visit `/appointments` (confirm it is exactly
`/appointments`, not `/user/appointments`), browse providers, pick one with availability
already configured (from Task 13's manual check), select a date/slot, confirm booking,
verify it appears under "My appointments." Open a second browser/session as the
provider, confirm the booking appears there too and can be confirmed. Stop the dev
server after.

- [ ] **Step 5: Commit**

```bash
git add "web/app/(user)/appointments/page.tsx" \
        web/components/appointments/provider-browse.tsx \
        web/components/appointments/booking-panel.tsx
git commit -m "feat(appointments): add user provider browse and booking flow"
```

---

## Task 15: Final validation + RBAC pass

**Files:** none created — verification only.

- [ ] **Step 1: Full backend suite**

Run: `cd backend && uv run pytest -v`
Expected: all tests PASS (not just the new appointment ones — confirms nothing existing
broke, per AGENTS.md §7's "verify existing functionality" requirement).

Run: `cd backend && uv run ruff check . && uv run mypy --strict app/`
Expected: no errors.

- [ ] **Step 2: Full frontend suite**

Run: `cd web && npm run lint && npm run typecheck && npm run build`
Expected: all PASS. `npm run build` in particular catches issues `dev` mode hides.

Run: `cd web && npm run test:e2e` (Playwright — check whether it needs the dev
server/backend running first per this repo's existing e2e setup, e.g.
`web/tests/e2e/`'s own config, before assuming it runs standalone)
Expected: existing suite still PASSES (no regression in unrelated flows).

- [ ] **Step 3: RBAC spot-check (manual, against the running app)**

- As a `user`: confirm `/appointments` works, `/consultant/reminders` and
  `/appointments/availability/me` (API) are rejected.
- As a `consultant`: confirm own appointments visible/manageable, a different
  consultant's or a dermatologist's appointments are not reachable by ID
  (`GET /api/v1/appointments/{other_provider_appointment_id}` → 404).
- As a `dermatologist`: same check, confirm no `consultant_notes` data leaks into
  anything this feature renders.
- Confirm two browser tabs booking the same slot simultaneously: second one gets the
  "slot no longer available" toast, not a silent double-booking.

- [ ] **Step 4: Final nav/placeholder audit**

- `web/components/clinical-review/clinical-dashboard.tsx` no longer contains
  `"No scheduling system yet."` (`grep -rn "No scheduling system yet" web/` returns
  nothing).
- `grep -n "built: false" web/lib/nav-config.ts` no longer includes the `reminders`
  (consultant) or `consultations` (dermatologist) items.
- User nav has exactly one new item (`appointments`); no new items were added to
  consultant/dermatologist nav (`git diff main -- web/lib/nav-config.ts` shows only the
  edits from Task 8, nothing else).

- [ ] **Step 5: Update `PROGRESS.md`**

Add an entry documenting what shipped (appointment system: DB model, backend service,
booking/management UI for all three roles) and what's explicitly deferred (reminders
tab content, video integration, per-provider cutoff config) — matching this repo's
existing `PROGRESS.md` entry style (check a recent entry, e.g. the 2026-08-13
reports/reminders one, for the expected format before writing this one).

- [ ] **Step 6: Final commit**

```bash
git add PROGRESS.md
git commit -m "docs: record appointment system delivery in PROGRESS.md"
```
