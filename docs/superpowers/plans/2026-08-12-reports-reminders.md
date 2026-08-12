# Reports & Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the User role's two `built: false` stub pages (`/reports`, `/reminders`) with real, working features backed by existing-but-unused tables (`progress_reports`, `reminders`, `notifications`) and one new table (`report_schedules`).

**Architecture:** A new `backend/app/services/reports/` service (PDF generation via `reportlab`, report registry, scheduled generation) plus an extension of the existing `backend/app/services/notifications/` service (reminder CRUD, a notification write-path, two new producers). Two new `arq` cron jobs reuse the scheduling mechanism already running in `app/worker/main.py`. Both frontend pages follow the existing `ingredients/page.tsx` conventions (TanStack Query + `openapi-fetch` + `StateCard`/`Skeleton`).

**Tech Stack:** FastAPI, SQLAlchemy (async), Alembic, `arq`, `reportlab` (new dependency), Next.js App Router, TanStack Query, `openapi-fetch`, shadcn/ui.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-12-reports-reminders-design.md` — every task below implements one of its sections; re-read it if a task's rationale is unclear.
- Role: every new endpoint is `user`-only, own data (`require_role("user")`), matching the existing pattern in `routines/router.py` and `notifications/router.py`.
- No fabricated delivery: reminder-due and report-schedule cron jobs write real rows; they must NOT claim to send email/push (no adapter exists) — log a comment, never a fake "sent" status.
- Every new Pydantic `*Read` schema uses `model_config = ConfigDict(from_attributes=True)` (never a shared base class — this codebase doesn't have one, per `notifications/schemas.py`).
- Every new router file: `router = APIRouter()`, no `prefix=`/`tags=` kwarg on the router itself — mounted in `app/main.py`'s `api_v1.include_router(..., tags=[...])`.
- Migrations: new file in `backend/app/migrations/versions/`, `down_revision` chained to the current head (verify with `uv run alembic heads` before writing — this plan assumes `a3f7c9d21e6b` is head as of 2026-08-12; re-verify at execution time), and `database_schemas/skinlytics_postgresql_schema_v3.sql` updated in the **same commit**.
- Frontend types: `web/lib/api-types.ts` is generated (`make openapi`), never hand-edited — regenerate it after each backend task that adds/changes an endpoint, before writing the frontend code that consumes it.
- Both frontend pages ship light + dark, checked before considering the page done (AGENTS.md §7.6).
- Commit author: `Satya Sai tharun Jekkamsetti <satya.saitharun02@gmail.com>`; never add a Claude/AI co-author trailer.
- Do not touch `main` or `satya-sai-tharun-skinlytics` branches.

---

### Task 1: `report_schedules` migration + canonical schema sync

**Files:**
- Create: `backend/app/migrations/versions/<new_revision>_report_schedules.py`
- Modify: `database_schemas/skinlytics_postgresql_schema_v3.sql` (append the new table, matching this file's existing style — find where `progress_reports` or `reminders` is defined and add near there)

**Interfaces:**
- Produces: table `report_schedules` (schedule_id, user_id, report_type, frequency, day_of_week, day_of_month, time_of_day, is_active, created_at, updated_at) — Task 7's `ReportSchedule` ORM model maps this 1:1.

- [ ] **Step 1: Confirm the current migration head**

Run: `cd backend && uv run alembic heads`
Expected output: `a3f7c9d21e6b (head)` — if different, use that revision as `down_revision` instead.

- [ ] **Step 2: Write the migration file**

`backend/app/migrations/versions/b7c1e4f92a08_report_schedules.py`:

```python
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
        sa.Column(
            "time_of_day", sa.Time(), nullable=False, server_default="08:00:00"
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.CheckConstraint(
            "frequency IN ('weekly', 'monthly')", name="ck_report_schedules_frequency"
        ),
    )
    op.create_index(
        "ix_report_schedules_user_id", "report_schedules", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_report_schedules_user_id", table_name="report_schedules")
    op.drop_table("report_schedules")
```

- [ ] **Step 3: Run the migration**

Run: `cd backend && uv run alembic upgrade head`
Expected: no errors; `uv run alembic heads` now shows `b7c1e4f92a08 (head)`.

- [ ] **Step 4: Verify the table exists**

Run:
```bash
cd backend && uv run python -c "
import asyncio
from sqlalchemy import text
from app.db.postgres import async_session_factory

async def main():
    async with async_session_factory() as db:
        r = await db.execute(text(\"SELECT column_name FROM information_schema.columns WHERE table_name='report_schedules' ORDER BY ordinal_position\"))
        print([row[0] for row in r.fetchall()])

asyncio.run(main())
"
```
Expected: `['schedule_id', 'user_id', 'report_type', 'frequency', 'day_of_week', 'day_of_month', 'time_of_day', 'is_active', 'created_at', 'updated_at']`

- [ ] **Step 5: Update the canonical schema doc**

Open `database_schemas/skinlytics_postgresql_schema_v3.sql`, find the `CREATE TABLE reminders` block (documented at line ~540 in the design spec), and add the new table's `CREATE TABLE report_schedules (...)` definition directly after it, copying the exact column list from Step 2's migration (as plain SQL, matching this file's existing formatting for other tables).

- [ ] **Step 6: Commit**

```bash
git add backend/app/migrations/versions/b7c1e4f92a08_report_schedules.py database_schemas/skinlytics_postgresql_schema_v3.sql
git commit -m "feat(db): add report_schedules table for recurring report generation"
```

---

### Task 2: Notification write path (`create_notification`)

**Files:**
- Modify: `backend/app/services/notifications/service.py`
- Test: `backend/tests/test_notifications_service.py`

**Interfaces:**
- Produces: `async def create_notification(db: AsyncSession, user_id: str, *, title: str, message: str, notification_type: str) -> Notification` — every later producer (Task 8's reminder-due cron, Task 9's report-schedule cron, Task 10's streak hook) calls this.

- [ ] **Step 1: Write the failing test**

Append to `backend/tests/test_notifications_service.py`:

```python
async def test_create_notification_persists_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.service import create_notification

    created = await create_notification(
        db_session,
        test_user_id,
        title="Evening routine reminder",
        message="Time for your PM routine",
        notification_type="reminder",
    )
    await db_session.flush()

    assert created.notification_id is not None
    assert created.user_id == test_user_id
    assert created.title == "Evening routine reminder"
    assert created.is_read is False

    rows = await list_my_notifications(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].notification_id == created.notification_id
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_notifications_service.py::test_create_notification_persists_a_real_row -v`
Expected: FAIL with `ImportError: cannot import name 'create_notification'`

- [ ] **Step 3: Implement `create_notification`**

Add to `backend/app/services/notifications/service.py`:

```python
async def create_notification(
    db: AsyncSession, user_id: str, *, title: str, message: str, notification_type: str
) -> Notification:
    notification = Notification(
        user_id=user_id, title=title, message=message, notification_type=notification_type
    )
    db.add(notification)
    await db.flush()
    return notification
```

(`Notification` is already imported in this file per its existing `list_my_notifications`.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_notifications_service.py::test_create_notification_persists_a_real_row -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/notifications/service.py backend/tests/test_notifications_service.py
git commit -m "feat(notifications): add create_notification write path"
```

---

### Task 3: Reminder model, schemas, and CRUD service functions

**Files:**
- Modify: `backend/app/services/notifications/models.py`
- Modify: `backend/app/services/notifications/schemas.py`
- Modify: `backend/app/services/notifications/service.py`
- Test: `backend/tests/test_notifications_service.py`

**Interfaces:**
- Consumes: nothing new.
- Produces: `Reminder` ORM model; `ReminderCreate`, `ReminderUpdate`, `ReminderRead` schemas; `list_my_reminders(db, user_id) -> list[Reminder]`, `upsert_reminder(db, user_id, data: ReminderCreate) -> Reminder`, `update_reminder(db, user_id, reminder_id, data: ReminderUpdate) -> Reminder`, `delete_reminder(db, user_id, reminder_id) -> None` (raises `ValueError` if not found/not owned). Task 4's router and Task 8's cron job both depend on these.

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_notifications_service.py`:

```python
async def test_upsert_reminder_creates_a_new_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import list_my_reminders, upsert_reminder

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_morning",
            title="Morning Routine",
            message="Time for your AM routine",
            reminder_time=datetime.time(8, 0),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    assert created.reminder_id is not None
    rows = await list_my_reminders(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].reminder_type == "routine_morning"


async def test_list_my_reminders_returns_only_the_caller_s_own_rows(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import list_my_reminders, upsert_reminder

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other Test User",
            emailVerified=False,
        )
    )
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration Nudge",
            message="Drink water",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await upsert_reminder(
        db_session,
        other_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Not yours",
            message="Should not show up",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    rows = await list_my_reminders(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].title == "Hydration Nudge"


async def test_update_reminder_toggles_is_active(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate, ReminderUpdate
    from app.services.notifications.service import update_reminder, upsert_reminder

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_evening",
            title="Evening Routine",
            message="Time for your PM routine",
            reminder_time=datetime.time(21, 30),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    updated = await update_reminder(
        db_session, test_user_id, created.reminder_id, ReminderUpdate(is_active=False)
    )
    assert updated.is_active is False


async def test_update_reminder_rejects_another_user_s_reminder(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate, ReminderUpdate
    from app.services.notifications.service import update_reminder, upsert_reminder

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id,
            email=f"{other_user_id}@test.invalid",
            name="Other Test User",
            emailVerified=False,
        )
    )
    created = await upsert_reminder(
        db_session,
        other_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Not yours",
            message="msg",
            reminder_time=None,
            frequency="every_3h",
            is_active=True,
        ),
    )
    await db_session.flush()

    with pytest.raises(ValueError):
        await update_reminder(
            db_session, test_user_id, created.reminder_id, ReminderUpdate(is_active=False)
        )


async def test_delete_reminder_removes_the_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.notifications.schemas import ReminderCreate
    from app.services.notifications.service import (
        delete_reminder,
        list_my_reminders,
        upsert_reminder,
    )

    created = await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="msg",
            reminder_time=None,
            frequency="every_2h",
            is_active=True,
        ),
    )
    await db_session.flush()

    await delete_reminder(db_session, test_user_id, created.reminder_id)
    await db_session.flush()

    assert await list_my_reminders(db_session, test_user_id) == []
```

Add `import datetime` and `import pytest` to this test file's imports if not already present (check the top of the file first — `uuid` and `external_user_table` are already imported per the existing tests).

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -k reminder -v`
Expected: FAIL (ImportError — nothing named `ReminderCreate`/`upsert_reminder`/etc. exists yet)

- [ ] **Step 3: Add the `Reminder` model**

Append to `backend/app/services/notifications/models.py`:

```python
class Reminder(Base):
    """Maps the `reminders` table (migrated alongside `notifications` in
    a7e9f4e50c45, unused until now). Backs the /reminders page's Reminder
    Settings tab — three reminder_type values in v1: 'routine_morning',
    'routine_evening', 'hydration' (docs/superpowers/specs/
    2026-08-12-reports-reminders-design.md)."""

    __tablename__ = "reminders"

    reminder_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    reminder_type: Mapped[str] = mapped_column()
    title: Mapped[str] = mapped_column()
    message: Mapped[str | None] = mapped_column(default=None)
    reminder_time: Mapped[datetime.time | None] = mapped_column(default=None)
    frequency: Mapped[str] = mapped_column()
    is_active: Mapped[bool] = mapped_column(server_default="true")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
```

(`ForeignKey`, `Mapped`, `mapped_column`, `func`, `Base`, `datetime` are already imported at the top of this file per the existing `Notification` model — no new imports needed.)

- [ ] **Step 4: Add the reminder schemas**

Append to `backend/app/services/notifications/schemas.py`:

```python
class ReminderCreate(BaseModel):
    reminder_type: str
    title: str
    message: str | None = None
    reminder_time: datetime.time | None = None
    frequency: str
    is_active: bool = True


class ReminderUpdate(BaseModel):
    title: str | None = None
    message: str | None = None
    reminder_time: datetime.time | None = None
    frequency: str | None = None
    is_active: bool | None = None


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reminder_id: int
    reminder_type: str
    title: str
    message: str | None
    reminder_time: datetime.time | None
    frequency: str
    is_active: bool
```

(`datetime`, `BaseModel`, `ConfigDict` already imported at the top of this file.)

- [ ] **Step 5: Implement the CRUD service functions**

Append to `backend/app/services/notifications/service.py`:

```python
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Reminder
from app.services.notifications.schemas import ReminderCreate, ReminderUpdate


async def list_my_reminders(db: AsyncSession, user_id: str) -> list[Reminder]:
    result = await db.execute(
        select(Reminder).where(Reminder.user_id == user_id).order_by(Reminder.reminder_id)
    )
    return list(result.scalars().all())


async def upsert_reminder(db: AsyncSession, user_id: str, data: ReminderCreate) -> Reminder:
    reminder = Reminder(user_id=user_id, **data.model_dump())
    db.add(reminder)
    await db.flush()
    return reminder


async def _get_owned_reminder(db: AsyncSession, user_id: str, reminder_id: int) -> Reminder:
    result = await db.execute(
        select(Reminder).where(
            Reminder.reminder_id == reminder_id, Reminder.user_id == user_id
        )
    )
    reminder = result.scalar_one_or_none()
    if reminder is None:
        raise ValueError(f"Reminder {reminder_id} not found for this user")
    return reminder


async def update_reminder(
    db: AsyncSession, user_id: str, reminder_id: int, data: ReminderUpdate
) -> Reminder:
    reminder = await _get_owned_reminder(db, user_id, reminder_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(reminder, field, value)
    await db.flush()
    return reminder


async def delete_reminder(db: AsyncSession, user_id: str, reminder_id: int) -> None:
    reminder = await _get_owned_reminder(db, user_id, reminder_id)
    await db.delete(reminder)
    await db.flush()
```

`select` is already imported at the top of `service.py` (used by `list_my_notifications`) — add `Reminder`, `ReminderCreate`, `ReminderUpdate` imports as shown.

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -k reminder -v`
Expected: 5 passed

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/notifications/models.py backend/app/services/notifications/schemas.py backend/app/services/notifications/service.py backend/tests/test_notifications_service.py
git commit -m "feat(notifications): add Reminder model and CRUD service functions"
```

---

### Task 4: Reminders router

**Files:**
- Modify: `backend/app/services/notifications/router.py`
- Test: `backend/tests/test_notifications_service.py`

**Interfaces:**
- Consumes: Task 3's `list_my_reminders`, `upsert_reminder`, `update_reminder`, `delete_reminder`, `ReminderCreate`/`ReminderUpdate`/`ReminderRead`.
- Produces: `GET /reminders`, `POST /reminders`, `PATCH /reminders/{reminder_id}`, `DELETE /reminders/{reminder_id}` — all role `user`, own data. Task 14 (frontend `/reminders` page) calls these.

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_notifications_service.py`:

```python
async def test_reminders_endpoints_require_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reminders")
    assert response.status_code in (401, 403)


async def test_create_list_update_delete_reminder_via_http(client: AsyncClient) -> None:
    await _as("test-reminders-http", client)
    try:
        create_response = await client.post(
            "/api/v1/reminders",
            json={
                "reminder_type": "hydration",
                "title": "Hydration Nudge",
                "message": "Drink water",
                "reminder_time": None,
                "frequency": "every_2h",
                "is_active": True,
            },
        )
        assert create_response.status_code == 200
        reminder_id = create_response.json()["reminder_id"]

        list_response = await client.get("/api/v1/reminders")
        assert list_response.status_code == 200
        assert len(list_response.json()) == 1

        patch_response = await client.patch(
            f"/api/v1/reminders/{reminder_id}", json={"is_active": False}
        )
        assert patch_response.status_code == 200
        assert patch_response.json()["is_active"] is False

        delete_response = await client.delete(f"/api/v1/reminders/{reminder_id}")
        assert delete_response.status_code == 204

        final_list = await client.get("/api/v1/reminders")
        assert final_list.json() == []
    finally:
        app.dependency_overrides.pop(require_user, None)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -k reminders_via_http -v`
Expected: FAIL with 404 (routes don't exist yet)

- [ ] **Step 3: Implement the router endpoints**

Modify `backend/app/services/notifications/router.py` — add imports and four new endpoints:

```python
from fastapi import APIRouter, Depends, HTTPException, status

from app.services.notifications.schemas import ReminderCreate, ReminderRead, ReminderUpdate


@router.get("/reminders")
async def get_my_reminders(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReminderRead]:
    rows = await service.list_my_reminders(db, user["id"])
    return [ReminderRead.model_validate(r) for r in rows]


@router.post("/reminders")
async def create_my_reminder(
    body: ReminderCreate,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReminderRead:
    created = await service.upsert_reminder(db, user["id"], body)
    return ReminderRead.model_validate(created)


@router.patch("/reminders/{reminder_id}")
async def update_my_reminder(
    reminder_id: int,
    body: ReminderUpdate,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReminderRead:
    try:
        updated = await service.update_reminder(db, user["id"], reminder_id, body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return ReminderRead.model_validate(updated)


@router.delete("/reminders/{reminder_id}", status_code=204)
async def delete_my_reminder(
    reminder_id: int,
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_reminder(db, user["id"], reminder_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
```

(`HTTPException`, `status` need adding to the existing `from fastapi import APIRouter, Depends` line at the top of the file.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -v`
Expected: all pass (including the pre-existing notification tests — no regression)

- [ ] **Step 5: Regenerate OpenAPI types**

Run: `cd backend && make openapi` (or whatever the repo's actual `make openapi` target does — check `Makefile` at repo root if this fails; it must regenerate `web/lib/api-types.ts` from the live FastAPI schema)

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/notifications/router.py backend/tests/test_notifications_service.py web/lib/api-types.ts
git commit -m "feat(notifications): add /reminders CRUD endpoints"
```

---

### Task 5: `reportlab` dependency + reports service scaffolding

**Files:**
- Modify: `backend/pyproject.toml`
- Create: `backend/app/services/reports/__init__.py` (empty)
- Create: `backend/app/services/reports/models.py`
- Create: `backend/app/services/reports/schemas.py`

**Interfaces:**
- Produces: `ProgressReport` ORM model (maps `progress_reports`), `ReportSchedule` ORM model (maps Task 1's `report_schedules`); `ReportGenerateRequest`, `ReportRead`, `ReportScheduleCreate`, `ReportScheduleUpdate`, `ReportScheduleRead` schemas. Task 6 (generation logic) and Task 7 (router) both depend on these.

- [ ] **Step 1: Add the dependency**

In `backend/pyproject.toml`, add `"reportlab>=4.2.5,<5"` alphabetically after the `"redis[hiredis]>=5.0.0,<6"` line (and its trailing comment) and before `"sentence-transformers>=3.3.1"`.

Run: `cd backend && uv sync`
Expected: `reportlab` installs cleanly (pure-Python wheel, no system dependency).

- [ ] **Step 2: Write the models**

`backend/app/services/reports/models.py`:

```python
import datetime

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class ProgressReport(Base):
    """Maps the `progress_reports` table (already migrated, unused until now —
    same pattern as notifications/models.py's Notification docstring). Report
    registry row: one per generated PDF. `report_url` stores the S3 key (never
    a baked-in presigned URL — same rule recommendations/service.py follows for
    product images), resolved to a fresh presigned URL on every read."""

    __tablename__ = "progress_reports"
    __table_args__ = (Index("idx_progress_reports_user_generated", "user_id", "generated_at"),)

    report_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    report_type: Mapped[str] = mapped_column()
    summary: Mapped[str | None] = mapped_column(default=None)
    report_url: Mapped[str | None] = mapped_column(default=None)
    generated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())


class ReportSchedule(Base):
    """Maps Task 1's new `report_schedules` table. Backs the Reports page's
    Scheduled Automations card — generation is real (arq cron, Task 9), actual
    email/push delivery is explicitly out of scope (no adapter exists, spec's
    scope decision)."""

    __tablename__ = "report_schedules"

    schedule_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    report_type: Mapped[str] = mapped_column()
    frequency: Mapped[str] = mapped_column()
    day_of_week: Mapped[int | None] = mapped_column(default=None)
    day_of_month: Mapped[int | None] = mapped_column(default=None)
    time_of_day: Mapped[datetime.time] = mapped_column()
    is_active: Mapped[bool] = mapped_column(server_default="true")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
```

- [ ] **Step 3: Write the schemas**

`backend/app/services/reports/schemas.py`:

```python
import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

ReportType = Literal["assessment", "progress", "routine"]


class ReportGenerateRequest(BaseModel):
    report_type: ReportType
    include_profile_header: bool = True


class ReportRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    report_id: int
    report_type: str
    summary: str | None
    generated_at: datetime.datetime | None


class ReportScheduleCreate(BaseModel):
    report_type: ReportType
    frequency: Literal["weekly", "monthly"]
    day_of_week: int | None = None  # 0-6, required when frequency='weekly'
    day_of_month: int | None = None  # 1-28, required when frequency='monthly'
    time_of_day: datetime.time = datetime.time(8, 0)
    is_active: bool = True


class ReportScheduleUpdate(BaseModel):
    frequency: Literal["weekly", "monthly"] | None = None
    day_of_week: int | None = None
    day_of_month: int | None = None
    time_of_day: datetime.time | None = None
    is_active: bool | None = None


class ReportScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    schedule_id: int
    report_type: str
    frequency: str
    day_of_week: int | None
    day_of_month: int | None
    time_of_day: datetime.time
    is_active: bool
```

- [ ] **Step 4: Verify it imports cleanly**

Run: `cd backend && uv run python -c "from app.services.reports import models, schemas; print('ok')"`
Expected: `ok`

- [ ] **Step 5: Commit**

```bash
git add backend/pyproject.toml backend/uv.lock backend/app/services/reports/__init__.py backend/app/services/reports/models.py backend/app/services/reports/schemas.py
git commit -m "feat(reports): add reportlab dependency and reports service scaffolding"
```

---

### Task 6: Report generation (`generate_report`, all 3 types)

**Files:**
- Create: `backend/app/services/reports/service.py`
- Test: `backend/tests/test_reports_service.py`

**Interfaces:**
- Consumes: `scores/service.py::get_latest_score(db, user_id) -> SkinScore | None`; `skin_profile/service.py::get_current_profile(db, user_id) -> SkinProfileRead | None`; `skin_profile/models.py::SkinType`; `analytics/service.py::get_my_analytics(db, user_id, days=90) -> AnalyticsMeRead`; `routines/service.py::get_or_generate_routines(db, user_id) -> list[RoutineRead]`; `recommendations/service.py::get_recommendations(db, user_id) -> list[RecommendationRead]`; `core/storage.py::build_key`, `upload`; Task 5's `ProgressReport` model.
- Produces: `async def generate_report(db, user_id, report_type: ReportType, *, include_profile_header: bool) -> ProgressReport`. Task 7's router and Task 9's cron job both call this.

- [ ] **Step 1: Write the failing tests**

`backend/tests/test_reports_service.py` (new file):

```python
"""Reports service — generation writes a real PDF to storage and a real
progress_reports row, never a fabricated one (AGENTS.md §0.2)."""

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.reports.service import generate_report


async def test_generate_assessment_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "assessment", include_profile_header=True
    )

    assert report.report_id is not None
    assert report.report_type == "assessment"
    assert report.report_url is not None
    assert report.summary is not None


async def test_generate_progress_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "progress", include_profile_header=False
    )

    assert report.report_type == "progress"
    assert report.report_url is not None


async def test_generate_routine_report_writes_a_real_row(
    db_session: AsyncSession, test_user_id: str
) -> None:
    report = await generate_report(
        db_session, test_user_id, "routine", include_profile_header=False
    )

    assert report.report_type == "routine"
    assert report.report_url is not None


async def test_generate_report_rejects_an_unknown_type(
    db_session: AsyncSession, test_user_id: str
) -> None:
    import pytest

    with pytest.raises(ValueError):
        await generate_report(
            db_session, test_user_id, "bogus", include_profile_header=False  # type: ignore[arg-type]
        )
```

(`test_user_id: str` is the shared conftest.py fixture used across the whole test suite — a real, FK-safe user row rolled back with `db_session`, with no profile/routine/score pre-populated. That's fine here: `generate_report`'s three builder functions all handle the "no data yet" case honestly (see `_assessment_flowables`'s explicit `score is None` branch in Task 6) — these tests assert structure (a real PDF got uploaded, a real row got written), not specific score values, so an empty-profile user is sufficient and keeps the test fast.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_reports_service.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'app.services.reports.service'`

- [ ] **Step 3: Implement `generate_report`**

`backend/app/services/reports/service.py`:

```python
import datetime
import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import build_key, upload
from app.services.analytics.service import get_my_analytics
from app.services.recommendations.service import get_recommendations
from app.services.reports.models import ProgressReport
from app.services.reports.schemas import ReportType
from app.services.routines.service import get_or_generate_routines
from app.services.scores.service import get_latest_score
from app.services.skin_profile.models import SkinType
from app.services.skin_profile.service import get_current_profile
from sqlalchemy import select

_STYLES = getSampleStyleSheet()


async def _profile_header_flowables(db: AsyncSession, user_id: str) -> list:
    profile = await get_current_profile(db, user_id)
    if profile is None:
        return []
    skin_type_name = "Unknown"
    result = await db.execute(
        select(SkinType.skin_type_name).where(SkinType.skin_type_id == profile.skin_type_id)
    )
    row = result.scalar_one_or_none()
    if row:
        skin_type_name = row
    generated_on = datetime.datetime.now(datetime.UTC).strftime("%B %d, %Y")
    return [
        Paragraph(f"Skin type: {skin_type_name}", _STYLES["Normal"]),
        Paragraph(f"Generated on: {generated_on}", _STYLES["Normal"]),
        Spacer(1, 12),
    ]


async def _assessment_flowables(db: AsyncSession, user_id: str) -> tuple[list, str]:
    score = await get_latest_score(db, user_id)
    if score is None:
        return (
            [Paragraph("No skin assessment recorded yet.", _STYLES["Normal"])],
            "No assessment data available.",
        )
    rows = [
        ["Metric", "Score"],
        ["Skin Condition (35%)", f"{score.skin_condition_score or 0:.1f}"],
        ["Lifestyle (20%)", f"{score.lifestyle_score or 0:.1f}"],
        ["Routine Adherence (20%)", f"{score.routine_adherence_score or 0:.1f}"],
        ["Sleep Quality (15%)", f"{score.sleep_quality_score or 0:.1f}"],
        ["Hydration (10%)", f"{score.hydration_score or 0:.1f}"],
        ["Overall Score", f"{score.overall_score or 0:.1f}"],
    ]
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
            ]
        )
    )
    summary = f"Overall skin health score: {score.overall_score or 0:.1f}/100."
    return ([Paragraph("Skin Assessment", _STYLES["Heading1"]), Spacer(1, 8), table], summary)


async def _progress_flowables(db: AsyncSession, user_id: str) -> tuple[list, str]:
    analytics = await get_my_analytics(db, user_id, days=90)
    rows = [["Window", "Compliance %"]]
    rows.append(["7-day", f"{analytics.compliance.seven_day or 0:.0f}%"])
    rows.append(["30-day", f"{analytics.compliance.thirty_day or 0:.0f}%"])
    rows.append(["90-day", f"{analytics.compliance.ninety_day or 0:.0f}%"])
    table = Table(rows, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
            ]
        )
    )
    summary = f"30-day routine compliance: {analytics.compliance.thirty_day or 0:.0f}%."
    return ([Paragraph("Progress Report", _STYLES["Heading1"]), Spacer(1, 8), table], summary)


async def _routine_flowables(db: AsyncSession, user_id: str) -> tuple[list, str]:
    routines = await get_or_generate_routines(db, user_id)
    recs = await get_recommendations(db, user_id)
    flowables: list = [Paragraph("Routine & Recommendations", _STYLES["Heading1"]), Spacer(1, 8)]
    for routine in routines:
        flowables.append(Paragraph(routine.routine_name or routine.routine_type or "Routine", _STYLES["Heading2"]))
        for step in routine.steps:
            flowables.append(Paragraph(f"- {step.step_name or 'Step'}", _STYLES["Normal"]))
        flowables.append(Spacer(1, 8))
    if recs:
        flowables.append(Paragraph("Recommended Products", _STYLES["Heading2"]))
        for rec in recs[:5]:
            flowables.append(
                Paragraph(f"- {rec.product.product_name or 'Product'} ({rec.match_percentage}% match)", _STYLES["Normal"])
            )
    summary = f"{len(routines)} routine(s), {len(recs)} recommendation(s)."
    return (flowables, summary)


_SECTION_BUILDERS = {
    "assessment": _assessment_flowables,
    "progress": _progress_flowables,
    "routine": _routine_flowables,
}


async def generate_report(
    db: AsyncSession, user_id: str, report_type: ReportType, *, include_profile_header: bool
) -> ProgressReport:
    builder = _SECTION_BUILDERS.get(report_type)
    if builder is None:
        raise ValueError(f"Unknown report_type: {report_type!r}")

    flowables: list = []
    if include_profile_header:
        flowables.extend(await _profile_header_flowables(db, user_id))

    section_flowables, summary = await builder(db, user_id)
    flowables.extend(section_flowables)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    doc.build(flowables)
    pdf_bytes = buffer.getvalue()

    key = build_key(prefix="reports", owner_user_id=user_id, filename=f"{report_type}.pdf")
    await upload(key, pdf_bytes, allowed_content_types={"application/pdf"})

    report = ProgressReport(
        user_id=user_id, report_type=report_type, summary=summary, report_url=key
    )
    db.add(report)
    await db.flush()
    return report
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_reports_service.py -v`
Expected: 4 passed

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/reports/service.py backend/tests/test_reports_service.py
git commit -m "feat(reports): implement PDF generation for assessment/progress/routine reports"
```

---

### Task 7: Reports router (`generate`, list, download)

**Files:**
- Create: `backend/app/services/reports/router.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_reports_service.py`

**Interfaces:**
- Consumes: Task 6's `generate_report`; `core/storage.py::get_presigned_url`.
- Produces: `POST /reports/generate`, `GET /reports`, `GET /reports/{report_id}/download` — role `user`, own data. Task 14 (frontend) calls these.

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_reports_service.py`:

```python
async def test_reports_endpoints_require_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/reports")
    assert response.status_code in (401, 403)


async def test_generate_list_and_download_report_via_http(
    client: AsyncClient, test_user_id: str
) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": test_user_id,
        "role": "user",
        "claims": {},
    }
    try:
        generate_response = await client.post(
            "/api/v1/reports/generate",
            json={"report_type": "assessment", "include_profile_header": True},
        )
        assert generate_response.status_code == 200
        report_id = generate_response.json()["report_id"]

        list_response = await client.get("/api/v1/reports")
        assert list_response.status_code == 200
        assert any(r["report_id"] == report_id for r in list_response.json())

        download_response = await client.get(f"/api/v1/reports/{report_id}/download")
        assert download_response.status_code == 200
        assert download_response.json()["url"].startswith("http")
    finally:
        app.dependency_overrides.pop(require_user, None)
```

Add these imports to the top of `backend/tests/test_reports_service.py`: `from httpx import AsyncClient`, `from app.core.security import require_user`, `from app.main import app`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_reports_service.py -k via_http -v`
Expected: FAIL with 404 (routes don't exist)

- [ ] **Step 3: Implement the router**

`backend/app/services/reports/router.py`:

```python
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_role
from app.core.storage import get_presigned_url
from app.db.postgres import get_db
from app.services.reports import service
from app.services.reports.models import ProgressReport
from app.services.reports.schemas import ReportGenerateRequest, ReportRead

router = APIRouter()


@router.post("/reports/generate")
async def generate_my_report(
    body: ReportGenerateRequest,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportRead:
    report = await service.generate_report(
        db, user["id"], body.report_type, include_profile_header=body.include_profile_header
    )
    return ReportRead.model_validate(report)


@router.get("/reports")
async def list_my_reports(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReportRead]:
    result = await db.execute(
        select(ProgressReport)
        .where(ProgressReport.user_id == user["id"])
        .order_by(ProgressReport.generated_at.desc())
    )
    return [ReportRead.model_validate(r) for r in result.scalars().all()]


@router.get("/reports/{report_id}/download")
async def download_my_report(
    report_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> dict[str, str]:
    result = await db.execute(
        select(ProgressReport).where(
            ProgressReport.report_id == report_id, ProgressReport.user_id == user["id"]
        )
    )
    report = result.scalar_one_or_none()
    if report is None or report.report_url is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Report not found")
    url = await get_presigned_url(report.report_url)
    return {"url": url}
```

- [ ] **Step 4: Mount the router**

In `backend/app/main.py`, add near the other service router imports (around line 25):
```python
from app.services.reports.router import router as reports_router
```
And add near the other `api_v1.include_router(...)` calls (around line 143, next to `notifications_router`):
```python
    api_v1.include_router(reports_router, tags=["reports"])
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_reports_service.py -v`
Expected: 6 passed

- [ ] **Step 6: Regenerate OpenAPI types**

Run: `cd backend && make openapi`

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/reports/router.py backend/app/main.py backend/tests/test_reports_service.py web/lib/api-types.ts
git commit -m "feat(reports): add /reports generate/list/download endpoints"
```

---

### Task 8: Report schedule CRUD (service + router)

**Files:**
- Modify: `backend/app/services/reports/service.py`
- Modify: `backend/app/services/reports/router.py`
- Test: `backend/tests/test_reports_service.py`

**Interfaces:**
- Consumes: Task 5's `ReportSchedule` model, `ReportScheduleCreate`/`ReportScheduleUpdate`/`ReportScheduleRead` schemas.
- Produces: `list_my_schedules(db, user_id) -> list[ReportSchedule]`, `create_schedule(db, user_id, data) -> ReportSchedule`, `update_schedule(db, user_id, schedule_id, data) -> ReportSchedule` (raises `ValueError` if not owned), `delete_schedule(db, user_id, schedule_id) -> None`; `POST/GET /reports/schedules`, `PATCH/DELETE /reports/schedules/{id}`. Task 9's cron job reads `report_schedules` directly (not through this CRUD layer, since it needs cross-user rows).

- [ ] **Step 1: Write the failing tests**

Append to `backend/tests/test_reports_service.py`:

```python
async def test_create_and_list_report_schedule(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.reports.schemas import ReportScheduleCreate
    from app.services.reports.service import create_schedule, list_my_schedules

    created = await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(report_type="progress", frequency="weekly", day_of_week=0),
    )
    await db_session.flush()

    assert created.schedule_id is not None
    rows = await list_my_schedules(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].frequency == "weekly"


async def test_update_report_schedule_rejects_another_user(
    db_session: AsyncSession, test_user_id: str
) -> None:
    import pytest

    from app.services.reports.schemas import ReportScheduleCreate, ReportScheduleUpdate
    from app.services.reports.service import create_schedule, update_schedule

    other_user_id = f"test-{uuid.uuid4().hex[:20]}"
    await db_session.execute(
        external_user_table.insert().values(
            id=other_user_id, email=f"{other_user_id}@test.invalid", name="Other", emailVerified=False
        )
    )
    created = await create_schedule(
        db_session,
        other_user_id,
        ReportScheduleCreate(report_type="progress", frequency="monthly", day_of_month=1),
    )
    await db_session.flush()

    with pytest.raises(ValueError):
        await update_schedule(
            db_session, test_user_id, created.schedule_id, ReportScheduleUpdate(is_active=False)
        )
```

Add `import uuid` and `from app.db.postgres import external_user_table` to the top of `test_reports_service.py` if not already present.

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && uv run pytest tests/test_reports_service.py -k schedule -v`
Expected: FAIL (ImportError)

- [ ] **Step 3: Implement the service functions**

Append to `backend/app/services/reports/service.py`:

```python
from app.services.reports.models import ReportSchedule
from app.services.reports.schemas import ReportScheduleCreate, ReportScheduleUpdate
from sqlalchemy import select


async def list_my_schedules(db: AsyncSession, user_id: str) -> list[ReportSchedule]:
    result = await db.execute(
        select(ReportSchedule).where(ReportSchedule.user_id == user_id)
    )
    return list(result.scalars().all())


async def create_schedule(
    db: AsyncSession, user_id: str, data: ReportScheduleCreate
) -> ReportSchedule:
    schedule = ReportSchedule(user_id=user_id, **data.model_dump())
    db.add(schedule)
    await db.flush()
    return schedule


async def _get_owned_schedule(db: AsyncSession, user_id: str, schedule_id: int) -> ReportSchedule:
    result = await db.execute(
        select(ReportSchedule).where(
            ReportSchedule.schedule_id == schedule_id, ReportSchedule.user_id == user_id
        )
    )
    schedule = result.scalar_one_or_none()
    if schedule is None:
        raise ValueError(f"Report schedule {schedule_id} not found for this user")
    return schedule


async def update_schedule(
    db: AsyncSession, user_id: str, schedule_id: int, data: ReportScheduleUpdate
) -> ReportSchedule:
    schedule = await _get_owned_schedule(db, user_id, schedule_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    await db.flush()
    return schedule


async def delete_schedule(db: AsyncSession, user_id: str, schedule_id: int) -> None:
    schedule = await _get_owned_schedule(db, user_id, schedule_id)
    await db.delete(schedule)
    await db.flush()
```

(Note: `select` and `ReportSchedule`/schemas are re-imported here for clarity if this is a separate edit pass — dedupe imports at the top of the file rather than leaving two `from sqlalchemy import select` lines.)

- [ ] **Step 4: Implement the router endpoints**

Append to `backend/app/services/reports/router.py`:

```python
from app.services.reports.schemas import ReportScheduleCreate, ReportScheduleRead, ReportScheduleUpdate


@router.get("/reports/schedules")
async def get_my_report_schedules(
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[ReportScheduleRead]:
    rows = await service.list_my_schedules(db, user["id"])
    return [ReportScheduleRead.model_validate(r) for r in rows]


@router.post("/reports/schedules")
async def create_my_report_schedule(
    body: ReportScheduleCreate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportScheduleRead:
    created = await service.create_schedule(db, user["id"], body)
    return ReportScheduleRead.model_validate(created)


@router.patch("/reports/schedules/{schedule_id}")
async def update_my_report_schedule(
    schedule_id: int,
    body: ReportScheduleUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ReportScheduleRead:
    try:
        updated = await service.update_schedule(db, user["id"], schedule_id, body)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return ReportScheduleRead.model_validate(updated)


@router.delete("/reports/schedules/{schedule_id}", status_code=204)
async def delete_my_report_schedule(
    schedule_id: int,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    try:
        await service.delete_schedule(db, user["id"], schedule_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_reports_service.py -v`
Expected: all pass

- [ ] **Step 6: Regenerate OpenAPI types**

Run: `cd backend && make openapi`

- [ ] **Step 7: Commit**

```bash
git add backend/app/services/reports/service.py backend/app/services/reports/router.py backend/tests/test_reports_service.py web/lib/api-types.ts
git commit -m "feat(reports): add report_schedules CRUD endpoints"
```

---

### Task 9: `report_schedule_tick` cron job

**Files:**
- Modify: `backend/app/worker/main.py`
- Create: `backend/app/worker/consumers/report_schedules.py`
- Test: `backend/tests/test_report_schedule_tick.py`

**Interfaces:**
- Consumes: Task 6's `generate_report`; Task 2's `create_notification`; `ReportSchedule` model.
- Produces: `async def run_due_report_schedules(db, mongo=None) -> int` (returns count generated) — registered in `WorkerSettings.cron_jobs`.

- [ ] **Step 1: Write the failing test**

`backend/tests/test_report_schedule_tick.py` (new file):

```python
"""The report-schedule cron generates real reports on schedule and notifies —
it never sends email/push (no adapter exists, spec's explicit scope decision)."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.service import list_my_notifications
from app.services.reports.schemas import ReportScheduleCreate
from app.services.reports.service import create_schedule, list_my_schedules
from app.worker.consumers.report_schedules import run_due_report_schedules


async def test_run_due_report_schedules_generates_a_report_and_notifies(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=now.weekday(),
            time_of_day=now.time().replace(second=0, microsecond=0),
        ),
    )
    await db_session.flush()

    generated_count = await run_due_report_schedules(db_session)

    assert generated_count == 1
    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "report_ready" for n in notifications)


async def test_run_due_report_schedules_skips_inactive_schedules(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await create_schedule(
        db_session,
        test_user_id,
        ReportScheduleCreate(
            report_type="progress",
            frequency="weekly",
            day_of_week=now.weekday(),
            time_of_day=now.time().replace(second=0, microsecond=0),
            is_active=False,
        ),
    )
    await db_session.flush()

    generated_count = await run_due_report_schedules(db_session)
    assert generated_count == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_report_schedule_tick.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement the tick function**

`backend/app/worker/consumers/report_schedules.py`:

```python
import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.service import create_notification
from app.services.reports.models import ReportSchedule
from app.services.reports.service import generate_report

# No email/push send here on purpose — no adapter exists yet (docs/superpowers/
# specs/2026-08-12-reports-reminders-design.md's explicit scope decision).
# Generation is real; delivery is a separate, later feature.


async def run_due_report_schedules(db: AsyncSession) -> int:
    now = datetime.datetime.now(datetime.UTC)
    current_time = now.time().replace(second=0, microsecond=0)

    result = await db.execute(
        select(ReportSchedule).where(
            ReportSchedule.is_active.is_(True),
            ReportSchedule.time_of_day == current_time,
        )
    )
    due_schedules = [
        s
        for s in result.scalars().all()
        if (s.frequency == "weekly" and s.day_of_week == now.weekday())
        or (s.frequency == "monthly" and s.day_of_month == now.day)
    ]

    generated = 0
    for schedule in due_schedules:
        report = await generate_report(
            db, schedule.user_id, schedule.report_type, include_profile_header=True  # type: ignore[arg-type]
        )
        await create_notification(
            db,
            schedule.user_id,
            title="Your scheduled report is ready",
            message=f"{schedule.report_type.title()} report generated.",
            notification_type="report_ready",
        )
        generated += 1
    return generated
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_report_schedule_tick.py -v`
Expected: 2 passed

(Note: matching `time_of_day` to the exact current minute is a real limitation of a fixed cron tick — Task 9's registration below runs this every 5 minutes, so a schedule's configured minute must land on a tick boundary to fire reliably within the test's tight window. This is an accepted v1 simplification; document it with a `ponytail:` comment in the cron registration, not silently.)

- [ ] **Step 5: Register the cron job**

Modify `backend/app/worker/main.py`:

```python
from app.worker.consumers.report_schedules import run_due_report_schedules


async def report_schedule_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        count = await run_due_report_schedules(db)
        await db.commit()
        return count


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        cron(poll_outbox_tick, second=set(range(0, 60, 2)), run_at_startup=True),
        # ponytail: exact-minute match against a 5-minute tick means a schedule can
        # miss its configured minute by up to 5 minutes of drift — fine for "roughly
        # weekly/monthly", upgrade to a minute-range match if exact timing matters.
        cron(report_schedule_tick, minute=set(range(0, 60, 5))),
    ]
```

- [ ] **Step 6: Verify the worker still starts**

Run: `cd backend && uv run python -c "from app.worker.main import WorkerSettings; print(len(WorkerSettings.cron_jobs))"`
Expected: `2`

- [ ] **Step 7: Commit**

```bash
git add backend/app/worker/main.py backend/app/worker/consumers/report_schedules.py backend/tests/test_report_schedule_tick.py
git commit -m "feat(reports): add report_schedule_tick cron job"
```

---

### Task 10: `reminder_due_tick` cron job

**Files:**
- Modify: `backend/app/worker/main.py`
- Create: `backend/app/worker/consumers/reminders.py`
- Test: `backend/tests/test_reminder_due_tick.py`

**Interfaces:**
- Consumes: Task 3's `Reminder` model; Task 2's `create_notification`.
- Produces: `async def run_due_reminders(db) -> int` — registered in `WorkerSettings.cron_jobs`.

- [ ] **Step 1: Write the failing test**

`backend/tests/test_reminder_due_tick.py` (new file):

```python
"""No push/email send here — no adapter exists (same scope decision as the
report-schedule cron). This only writes the real notification row."""

import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.schemas import ReminderCreate
from app.services.notifications.service import list_my_notifications, upsert_reminder
from app.worker.consumers.reminders import run_due_reminders


async def test_run_due_reminders_writes_a_notification_for_a_due_reminder(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="routine_morning",
            title="Morning Routine",
            message="Time for your AM routine",
            reminder_time=now.time().replace(second=0, microsecond=0),
            frequency="daily",
            is_active=True,
        ),
    )
    await db_session.flush()

    notified_count = await run_due_reminders(db_session)

    assert notified_count == 1
    notifications = await list_my_notifications(db_session, test_user_id)
    assert any(n.notification_type == "reminder" for n in notifications)


async def test_run_due_reminders_skips_inactive_reminders(
    db_session: AsyncSession, test_user_id: str
) -> None:
    now = datetime.datetime.now(datetime.UTC)
    await upsert_reminder(
        db_session,
        test_user_id,
        ReminderCreate(
            reminder_type="hydration",
            title="Hydration",
            message="Drink water",
            reminder_time=now.time().replace(second=0, microsecond=0),
            frequency="daily",
            is_active=False,
        ),
    )
    await db_session.flush()

    assert await run_due_reminders(db_session) == 0
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_reminder_due_tick.py -v`
Expected: FAIL with `ModuleNotFoundError`

- [ ] **Step 3: Implement the tick function**

`backend/app/worker/consumers/reminders.py`:

```python
import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Reminder
from app.services.notifications.service import create_notification

# No push/email send here on purpose — same scope decision as the report-schedule
# cron (docs/superpowers/specs/2026-08-12-reports-reminders-design.md).


async def run_due_reminders(db: AsyncSession) -> int:
    now = datetime.datetime.now(datetime.UTC)
    current_time = now.time().replace(second=0, microsecond=0)

    result = await db.execute(
        select(Reminder).where(
            Reminder.is_active.is_(True), Reminder.reminder_time == current_time
        )
    )
    due = list(result.scalars().all())

    for reminder in due:
        await create_notification(
            db,
            reminder.user_id,
            title=reminder.title,
            message=reminder.message or reminder.title,
            notification_type="reminder",
        )
    return len(due)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_reminder_due_tick.py -v`
Expected: 2 passed

- [ ] **Step 5: Register the cron job**

Modify `backend/app/worker/main.py`:

```python
from app.worker.consumers.reminders import run_due_reminders


async def reminder_due_tick(ctx: dict[str, object]) -> int:
    async with async_session_factory() as db:
        count = await run_due_reminders(db)
        await db.commit()
        return count


class WorkerSettings:
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    cron_jobs = [
        cron(poll_outbox_tick, second=set(range(0, 60, 2)), run_at_startup=True),
        cron(report_schedule_tick, minute=set(range(0, 60, 5))),
        # ponytail: same 5-minute exact-minute-match limitation as report schedules.
        cron(reminder_due_tick, minute=set(range(0, 60, 5))),
    ]
```

- [ ] **Step 6: Commit**

```bash
git add backend/app/worker/main.py backend/app/worker/consumers/reminders.py backend/tests/test_reminder_due_tick.py
git commit -m "feat(reminders): add reminder_due_tick cron job"
```

---

### Task 11: Routine-streak notification producer

**Files:**
- Modify: `backend/app/services/progress/service.py`
- Modify: `backend/app/services/routines/router.py`
- Test: `backend/tests/test_progress_service.py`
- Test: `backend/tests/test_routines_router.py`

**Interfaces:**
- Consumes: existing `_detect_streak_milestones`, `get_adherence_series` (both already in `progress/service.py`); Task 2's `create_notification`.
- Produces: `async def get_todays_new_streak_milestone(db, user_id) -> Milestone | None` in `progress/service.py`. Modifies the existing `POST /routines/steps/{step_id}/log` handler to write a notification on a fresh streak crossing.

- [ ] **Step 1: Write the failing test for the new progress-service function**

Append to `backend/tests/test_progress_service.py`:

```python
async def test_get_todays_new_streak_milestone_is_none_with_no_history(
    db_session: AsyncSession, test_user_id: str
) -> None:
    from app.services.progress.service import get_todays_new_streak_milestone

    assert await get_todays_new_streak_milestone(db_session, test_user_id) is None
```

(This only tests the "no streak yet" branch directly — the "just crossed 7 days" branch is exercised end-to-end in Task 11 Step 4's router test below, since building 7 days of real adherence history needs the same routine/log fixtures `test_routines_router.py` already sets up.)

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_progress_service.py::test_get_todays_new_streak_milestone_is_none_with_no_history -v`
Expected: FAIL with `ImportError`

- [ ] **Step 3: Implement `get_todays_new_streak_milestone`**

Append to `backend/app/services/progress/service.py`:

```python
async def get_todays_new_streak_milestone(db: AsyncSession, user_id: str) -> Milestone | None:
    """Public wrapper around the existing `_detect_streak_milestones` — reuses the
    same pure detection logic the Insights screen already computes, just checks
    whether *today* is the achieved_on date of a fresh crossing. Called from the
    routines router right after a step toggle (routines/router.py), not from here —
    this service doesn't know about notifications (service-boundary rule,
    AGENTS.md §2 point 4)."""
    adherence = await get_adherence_series(db, user_id, days=30)
    milestones = _detect_streak_milestones(adherence)
    today = datetime.datetime.now(datetime.UTC).date()
    for milestone in milestones:
        if milestone.achieved_on == today:
            return milestone
    return None
```

(`Milestone`, `datetime` are already imported at the top of this file per the existing `_detect_streak_milestones`/`ProgressSummaryRead` code.)

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_progress_service.py::test_get_todays_new_streak_milestone_is_none_with_no_history -v`
Expected: PASS

- [ ] **Step 5: Write the failing router-level test**

This test calls the router handler function directly (not through the `client`/HTTP fixture) so the whole test shares one `db_session` with no ambiguity about whether an HTTP-layer request sees data set up via direct service calls — the handler function itself is the real code under test either way. Append to `backend/tests/test_routines_router.py` (check this file's existing imports first — `AsyncSession`, `test_user_id`, and `get_or_generate_routines` are almost certainly already imported per its existing tests; add only what's missing):

```python
async def test_logging_a_step_completion_that_crosses_a_streak_writes_a_notification(
    db_session: AsyncSession, test_user_id: str
) -> None:
    import datetime

    from app.db.mongo import get_mongo_db
    from app.services.notifications.service import list_my_notifications
    from app.services.routines.router import log_step_completion
    from app.services.routines.schemas import StepCompletionUpdate
    from app.services.routines.service import get_or_generate_routines
    from app.services.skin_profile.schemas import SkinProfileCreate
    from app.services.skin_profile.service import create_profile

    # skin_type_id=1 is Normal (verified live against the seeded skin_types table,
    # 2026-08-12: `SELECT skin_type_id, skin_type_name FROM skin_types ORDER BY
    # skin_type_id LIMIT 3` -> [(1, 'Normal'), (2, 'Dry'), (3, 'Oily')]). Any real
    # skin_type_id works here since this test doesn't check score/product content,
    # only that a routine with real steps gets generated.
    await create_profile(db_session, test_user_id, SkinProfileCreate(skin_type_id=1))
    routines = await get_or_generate_routines(db_session, test_user_id)
    all_step_ids = [step.step_id for routine in routines for step in routine.steps]
    assert all_step_ids, "test setup requires at least one generated routine step"

    collection = get_mongo_db()["routine_logs"]
    today = datetime.datetime.now(datetime.UTC).date()
    try:
        # Seed 6 prior days of 100%-complete adherence directly — routine_logs'
        # real document shape, matching routines/service.py's toggle_step_completion
        # (`_day_start` = midnight-combined naive datetime, `completed_steps` is a
        # list of {routine_step_id, completed_at}).
        for offset in range(6, 0, -1):
            day = today - datetime.timedelta(days=offset)
            await collection.insert_one(
                {
                    "user_id": test_user_id,
                    "log_date": datetime.datetime.combine(day, datetime.time.min),
                    "completed_steps": [
                        {"routine_step_id": step_id, "completed_at": datetime.datetime.now(datetime.UTC)}
                        for step_id in all_step_ids
                    ],
                }
            )

        # Day 7 (today) goes through the real handler under test — this is what
        # actually exercises the new streak-notification code, not the seeding.
        user = {"id": test_user_id, "role": "user", "claims": {}}
        for step_id in all_step_ids:
            await log_step_completion(step_id, StepCompletionUpdate(completed=True), user, db_session)

        notifications = await list_my_notifications(db_session, test_user_id)
        assert any(n.notification_type == "streak" for n in notifications)
    finally:
        await collection.delete_many({"user_id": test_user_id})
```

(`StepCompletionUpdate` has one field, `completed: bool` — verified against `backend/app/services/routines/schemas.py:30-31`.)

- [ ] **Step 6: Run test to verify it fails**

Run: `cd backend && uv run pytest tests/test_routines_router.py::test_logging_a_step_completion_that_crosses_a_streak_writes_a_notification -v`
Expected: FAIL (no notification written yet — `log_step_completion` doesn't call `create_notification` until Step 7)

- [ ] **Step 7: Wire the hook into the router**

Modify `backend/app/services/routines/router.py`'s existing `log_step_completion` handler:

```python
from app.services.notifications.service import create_notification
from app.services.progress.service import get_todays_new_streak_milestone


@router.post("/routines/steps/{step_id}/log", status_code=204)
async def log_step_completion(
    step_id: int,
    body: StepCompletionUpdate,
    user: Annotated[dict[str, Any], Depends(require_role("user"))],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> None:
    await service.toggle_step_completion(user["id"], step_id, body.completed)
    if body.completed:
        milestone = await get_todays_new_streak_milestone(db, user["id"])
        if milestone is not None:
            await create_notification(
                db,
                user["id"],
                title="Streak milestone!",
                message=milestone.label,
                notification_type="streak",
            )
```

(This adds a `db: AsyncSession` param to a handler that didn't have one before — `get_db`/`AsyncSession`/`Depends` are already imported elsewhere in this router file for its other endpoints; reuse those imports.)

- [ ] **Step 8: Run test to verify it passes**

Run: `cd backend && uv run pytest tests/test_routines_router.py::test_logging_a_step_completion_that_crosses_a_streak_writes_a_notification -v`
Expected: PASS

- [ ] **Step 9: Run the full backend test suite for regressions**

Run: `cd backend && uv run pytest -q --deselect tests/test_rebuild.py::test_rebuild_all_matches_source_counts --deselect tests/test_rebuild.py::test_rebuild_all_is_idempotent_in_counts`
Expected: no new failures beyond the 4 pre-existing ones already tracked (`test_ingredients_service.py` x2, `test_routines_service.py::test_search_products_for_edit_...`, `test_scores_service.py::test_compute_and_store_score_...`).

- [ ] **Step 10: Commit**

```bash
git add backend/app/services/progress/service.py backend/app/services/routines/router.py backend/tests/test_progress_service.py backend/tests/test_routines_router.py
git commit -m "feat(notifications): write a streak-milestone notification on step completion"
```

---

### Task 12: `/reports` frontend page

**Files:**
- Modify: `web/app/(user)/reports/page.tsx` (replace wholesale — currently the 8-line `ComingSoon` stub)
- Modify: `web/lib/nav-config.ts:170-177` (flip `built: false` → remove the key, default is `true`)

**Interfaces:**
- Consumes: `api.POST("/api/v1/reports/generate", ...)`, `api.GET("/api/v1/reports")`, `api.GET("/api/v1/reports/{report_id}/download")`, `api.GET/POST/PATCH/DELETE("/api/v1/reports/schedules"...)` from Task 7/8 (typed via the regenerated `api-types.ts`).

- [ ] **Step 1: Replace the page**

`web/app/(user)/reports/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileText, RotateCw, TrendingUp, TriangleAlert, Sparkles, ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";

const REPORT_TYPES = [
  { type: "assessment" as const, label: "Skin Assessment", icon: Sparkles, description: "Your current score breakdown across all five weighted factors." },
  { type: "progress" as const, label: "Progress", icon: TrendingUp, description: "7/30/90-day routine compliance trend." },
  { type: "routine" as const, label: "Routine & Recommendations", icon: ClipboardList, description: "Your current AM/PM steps and top product matches." },
];

export default function Page() {
  const queryClient = useQueryClient();
  const [includeProfileHeader, setIncludeProfileHeader] = useState(true);

  const reportsQuery = useQuery({
    queryKey: ["reports", "list"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reports");
      if (error) throw new Error("Couldn't load your reports.");
      return data;
    },
  });

  const schedulesQuery = useQuery({
    queryKey: ["reports", "schedules"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reports/schedules");
      if (error) throw new Error("Couldn't load your scheduled reports.");
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (reportType: "assessment" | "progress" | "routine") => {
      const { data, error } = await api.POST("/api/v1/reports/generate", {
        body: { report_type: reportType, include_profile_header: includeProfileHeader },
      });
      if (error) throw new Error("Couldn't generate that report.");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports", "list"] }),
  });

  const downloadReport = async (reportId: number) => {
    const { data, error } = await api.GET("/api/v1/reports/{report_id}/download", {
      params: { path: { report_id: reportId } },
    });
    if (error || !data) return;
    window.open(data.url, "_blank");
  };

  return (
    <div className="flex min-w-0 flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Reports</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Generate a PDF snapshot of your skin data, or set up a recurring one.
        </p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {REPORT_TYPES.map(({ type, label, icon: Icon, description }) => (
          <div key={type} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
            <Icon className="text-secondary size-6" strokeWidth={1.5} />
            <h3 className="font-semibold">{label}</h3>
            <p className="text-on-surface-variant flex-1 text-sm">{description}</p>
            <Button
              onClick={() => generateMutation.mutate(type)}
              disabled={generateMutation.isPending}
            >
              <FileText data-icon="inline-start" />
              Generate Report
            </Button>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Recent Reports</h2>
        {reportsQuery.isLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : reportsQuery.isError ? (
          <StateCard
            tone="destructive"
            icon={TriangleAlert}
            description="Couldn't load your reports."
            action={
              <Button variant="outline" onClick={() => reportsQuery.refetch()}>
                <RotateCw className="size-4" strokeWidth={1.5} />
                Retry
              </Button>
            }
          />
        ) : reportsQuery.data && reportsQuery.data.length === 0 ? (
          <StateCard icon={FileText} title="No reports yet" description="Generate one above to see it here." />
        ) : (
          <div className="border-border overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead className="text-right">Download</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportsQuery.data?.map((report) => (
                  <TableRow key={report.report_id}>
                    <TableCell className="font-medium capitalize">{report.report_type}</TableCell>
                    <TableCell className="text-on-surface-variant">{report.summary}</TableCell>
                    <TableCell className="text-on-surface-variant">
                      {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => downloadReport(report.report_id)}>
                        <Download className="size-4" strokeWidth={1.5} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="mb-4 font-semibold">Scheduled Automations</h3>
          {schedulesQuery.data && schedulesQuery.data.length > 0 ? (
            <div className="space-y-3">
              {schedulesQuery.data.map((schedule) => (
                <div key={schedule.schedule_id} className="bg-muted flex items-center justify-between rounded-lg p-3">
                  <div>
                    <p className="font-medium capitalize">{schedule.report_type}</p>
                    <p className="text-on-surface-variant text-sm capitalize">{schedule.frequency}</p>
                  </div>
                  <Switch checked={schedule.is_active} disabled />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-on-surface-variant text-sm">No scheduled reports yet.</p>
          )}
        </div>

        <div className="border-border bg-card rounded-2xl border p-5">
          <h3 className="mb-4 font-semibold">Export Preferences</h3>
          <div className="flex items-center justify-between">
            <p className="text-sm">Include profile header (name, skin type, date)</p>
            <Switch checked={includeProfileHeader} onCheckedChange={setIncludeProfileHeader} />
          </div>
        </div>
      </section>
    </div>
  );
}
```

(Schedule creation UI — a form to actually create a new `ReportSchedule` row — is intentionally left as a follow-up: this step ships read + generate + the profile-header toggle, which is the full v1 scope from the spec; a "Schedule New Report" creation form is a natural next task once this is verified working end-to-end, not blocking this page from being real and useful.)

- [ ] **Step 2: Flip the nav flag**

In `web/lib/nav-config.ts`, remove the `built: false,` line from the `reports` entry (lines 170-177) — default is `true` (line ~600's destructure).

- [ ] **Step 3: Typecheck and lint**

Run: `cd web && npm run typecheck && npm run lint`
Expected: no new errors (2 pre-existing warnings in `login`/`signup` pages only).

- [ ] **Step 4: Manual verification**

Start both servers if not already running (`cd backend && uv run uvicorn app.main:app --reload`, `cd web && npm run dev`), sign in as `user.test@skinlytics.local` (or `imagerecs.test@skinlytics.local` for an account with real data — see `credentials.md`), navigate to `/reports`, click "Generate Report" on each of the 3 cards, confirm a row appears in Recent Reports and Download opens a real PDF. Check both light and dark themes.

- [ ] **Step 5: Commit**

```bash
git add "web/app/(user)/reports/page.tsx" web/lib/nav-config.ts
git commit -m "feat(web): build the real /reports page"
```

---

### Task 13: `/reminders` frontend page

**Files:**
- Modify: `web/app/(user)/reminders/page.tsx` (replace wholesale — currently the 8-line `ComingSoon` stub)
- Modify: `web/lib/nav-config.ts:178-185` (flip `built: false` → remove the key)

**Interfaces:**
- Consumes: `api.GET("/api/v1/notifications/me")` (existing), `api.GET/POST/PATCH/DELETE("/api/v1/reminders"...)` from Task 4.

- [ ] **Step 1: Replace the page**

`web/app/(user)/reminders/page.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Droplet, Moon, RotateCw, Sun, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StateCard } from "@/components/state-card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";

const REMINDER_DEFAULTS = {
  routine_morning: { label: "Morning Routine", icon: Sun, defaultTime: "08:00" },
  routine_evening: { label: "Evening Routine", icon: Moon, defaultTime: "21:30" },
  hydration: { label: "Hydration Nudge", icon: Droplet, defaultTime: null },
} as const;

export default function Page() {
  const queryClient = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/notifications/me");
      if (error) throw new Error("Couldn't load your notifications.");
      return data;
    },
  });

  const remindersQuery = useQuery({
    queryKey: ["reminders", "list"],
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/reminders");
      if (error) throw new Error("Couldn't load your reminders.");
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ reminderId, isActive }: { reminderId: number; isActive: boolean }) => {
      const { error } = await api.PATCH("/api/v1/reminders/{reminder_id}", {
        params: { path: { reminder_id: reminderId } },
        body: { is_active: isActive },
      });
      if (error) throw new Error("Couldn't update that reminder.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", "list"] }),
  });

  const createMutation = useMutation({
    mutationFn: async (reminderType: keyof typeof REMINDER_DEFAULTS) => {
      const config = REMINDER_DEFAULTS[reminderType];
      const { error } = await api.POST("/api/v1/reminders", {
        body: {
          reminder_type: reminderType,
          title: config.label,
          message: `Time for your ${config.label}`,
          reminder_time: config.defaultTime,
          frequency: reminderType === "hydration" ? "every_2h" : "daily",
          is_active: true,
        },
      });
      if (error) throw new Error("Couldn't create that reminder.");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", "list"] }),
  });

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Reminders</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Stay on top of your routine and hydration.
        </p>
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox">Inbox</TabsTrigger>
          <TabsTrigger value="settings">Reminder Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="inbox" className="mt-6">
          {notificationsQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : notificationsQuery.isError ? (
            <StateCard
              tone="destructive"
              icon={TriangleAlert}
              description="Couldn't load your notifications."
              action={
                <Button variant="outline" onClick={() => notificationsQuery.refetch()}>
                  <RotateCw className="size-4" strokeWidth={1.5} />
                  Retry
                </Button>
              }
            />
          ) : notificationsQuery.data && notificationsQuery.data.length === 0 ? (
            <StateCard icon={BellRing} title="No notifications yet" description="Reminder alerts and routine streaks will show up here." />
          ) : (
            <div className="space-y-3">
              {notificationsQuery.data?.map((n) => (
                <div key={n.notification_id} className="border-border bg-card flex items-start gap-3 rounded-2xl border p-4">
                  <BellRing className="text-secondary mt-0.5 size-5 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{n.title}</p>
                    <p className="text-on-surface-variant text-sm">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          {remindersQuery.isLoading ? (
            <Skeleton className="h-48 w-full rounded-2xl" />
          ) : remindersQuery.isError ? (
            <StateCard
              tone="destructive"
              icon={TriangleAlert}
              description="Couldn't load your reminders."
              action={
                <Button variant="outline" onClick={() => remindersQuery.refetch()}>
                  <RotateCw className="size-4" strokeWidth={1.5} />
                  Retry
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {(Object.keys(REMINDER_DEFAULTS) as (keyof typeof REMINDER_DEFAULTS)[]).map((type) => {
                const config = REMINDER_DEFAULTS[type];
                const Icon = config.icon;
                const existing = remindersQuery.data?.find((r) => r.reminder_type === type);
                return (
                  <div key={type} className="border-border bg-card flex flex-col gap-3 rounded-2xl border p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="text-secondary size-5" strokeWidth={1.5} />
                        <h4 className="font-semibold">{config.label}</h4>
                      </div>
                      <Switch
                        checked={existing?.is_active ?? false}
                        onCheckedChange={(checked) =>
                          existing
                            ? toggleMutation.mutate({ reminderId: existing.reminder_id, isActive: checked })
                            : createMutation.mutate(type)
                        }
                      />
                    </div>
                    {existing?.reminder_time && (
                      <p className="text-on-surface-variant text-sm">Scheduled: {existing.reminder_time}</p>
                    )}
                    {/* Channel toggle UI kept per spec, deliberately unwired — no push/email
                        adapter exists yet. */}
                    <div className="flex gap-2">
                      <span className="bg-secondary/10 text-secondary rounded-full px-3 py-1 text-xs font-semibold">Push</span>
                      <span className="bg-muted text-on-surface-variant rounded-full px-3 py-1 text-xs font-semibold">Email</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

- [ ] **Step 2: Flip the nav flag**

In `web/lib/nav-config.ts`, remove the `built: false,` line from the `reminders` entry (lines 178-185).

- [ ] **Step 3: Typecheck and lint**

Run: `cd web && npm run typecheck && npm run lint`
Expected: no new errors.

- [ ] **Step 4: Manual verification**

Navigate to `/reminders`, toggle each of the 3 reminder cards on, confirm a row appears via `GET /reminders` (check the Network tab or just toggle off and on again to see state persist across a refresh). Check both light and dark themes, and both phone/tablet/laptop widths (reuse the same Playwright sweep script pattern from the earlier responsive-overflow fix if easiest).

- [ ] **Step 5: Commit**

```bash
git add "web/app/(user)/reminders/page.tsx" web/lib/nav-config.ts
git commit -m "feat(web): build the real /reminders page"
```

---

### Task 14: End-to-end tests

**Files:**
- Create: `web/tests/e2e/reports-page.spec.ts`
- Create: `web/tests/e2e/reminders-page.spec.ts`

**Interfaces:**
- Consumes: `web/tests/e2e/helpers.ts`'s existing `pool()`, `clearRateLimits()`, `deleteTestUser()`, `signOut()` — same real-account pattern every other spec in this directory uses.

- [ ] **Step 1: Write the Reports e2e spec**

`web/tests/e2e/reports-page.spec.ts` — signup/promote boilerplate copied verbatim from `ingredient-intelligence-p12.spec.ts:10-48` (`signUpAndPromote`, `role: null` for a plain user):

```typescript
import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool, signOut } from "./helpers";

async function signUp(page: import("@playwright/test").Page, email: string): Promise<string> {
  const password = "SuperSecret123!";
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Reports");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/assessment/, { timeout: 10_000 });

  const db = pool();
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    return rows[0].id as string;
  } finally {
    await db.end();
  }
}

test("Reports page: generate a report, see it in Recent Reports, download it", async ({ page }) => {
  test.setTimeout(60_000);
  const email = `e2e-reports-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    userId = await signUp(page, email);

    await page.goto("/reports");
    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();

    await page
      .getByText("Skin Assessment", { exact: true })
      .locator("..")
      .getByRole("button", { name: /generate report/i })
      .click();

    await expect(page.getByRole("row").filter({ hasText: "assessment" })).toBeVisible({
      timeout: 15_000,
    });

    const [download] = await Promise.all([
      page.waitForEvent("popup", { timeout: 10_000 }),
      page.getByRole("button").filter({ has: page.locator("svg") }).last().click(),
    ]);
    expect(download.url()).toContain("reports/");
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
```

(The download assertion's selector — "last button with an svg" — is intentionally loose since the exact download-icon button isn't uniquely labeled in Task 12's JSX; tighten it with a real `aria-label` on that `Button` in `reports/page.tsx` if this selector proves flaky once run against the real page.)

- [ ] **Step 2: Write the Reminders e2e spec**

`web/tests/e2e/reminders-page.spec.ts`, same signup boilerplate (copy the `signUp` helper from Step 1 rather than importing across spec files — matches this directory's existing per-file convention of not sharing helpers beyond `helpers.ts`):

```typescript
import { test, expect } from "@playwright/test";

import { clearRateLimits, deleteTestUser, pool } from "./helpers";

async function signUp(page: import("@playwright/test").Page, email: string): Promise<string> {
  const password = "SuperSecret123!";
  await clearRateLimits();
  await page.goto("/signup");
  await page.fill("#firstName", "Reminders");
  await page.fill("#lastName", "Tester");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
  await page.getByRole("checkbox").click({ force: true });
  await page.getByRole("button", { name: /create account/i }).click();
  await page.waitForURL(/\/assessment/, { timeout: 10_000 });

  const db = pool();
  try {
    const { rows } = await db.query('select id from "user" where email = $1', [email]);
    return rows[0].id as string;
  } finally {
    await db.end();
  }
}

test("Reminders page: toggle a reminder on and off, state persists across reload", async ({ page }) => {
  test.setTimeout(60_000);
  const email = `e2e-reminders-${Date.now()}@example.com`;
  let userId: string | null = null;

  try {
    userId = await signUp(page, email);

    await page.goto("/reminders");
    await page.getByRole("tab", { name: "Reminder Settings" }).click();

    const morningToggle = page
      .getByText("Morning Routine", { exact: true })
      .locator("..")
      .locator("..")
      .getByRole("switch");
    await morningToggle.click();
    await expect(morningToggle).toBeChecked();

    await page.reload();
    await page.getByRole("tab", { name: "Reminder Settings" }).click();
    await expect(
      page
        .getByText("Morning Routine", { exact: true })
        .locator("..")
        .locator("..")
        .getByRole("switch")
    ).toBeChecked();

    await page.getByRole("tab", { name: "Inbox" }).click();
    await expect(
      page.getByText(/no notifications yet/i).or(page.getByText(/routine reminder/i))
    ).toBeVisible();
  } finally {
    if (userId) await deleteTestUser(userId);
  }
});
```

- [ ] **Step 3: Run both specs**

Run: `cd web && npx playwright test tests/e2e/reports-page.spec.ts tests/e2e/reminders-page.spec.ts`
Expected: all pass, both `chromium-light` and `chromium-dark` projects.

- [ ] **Step 4: Commit**

```bash
git add web/tests/e2e/reports-page.spec.ts web/tests/e2e/reminders-page.spec.ts
git commit -m "test(e2e): add Reports and Reminders page coverage"
```

---

## After all tasks

Run the full verification pass before merging: backend `ruff` + `mypy --strict` + `pytest`, frontend `npm run lint` + `npm run typecheck` + the two new Playwright specs, then `/code-review` on the full diff, then merge into `dev` per this repo's branch workflow (create the branch at the start of execution — e.g. `feat/reports-reminders-pages` — commit each task on it, code-review before merging, delete after). Update `PROGRESS.md` and flip the spec's "explicitly out of scope" items into tracked follow-up notes rather than letting them silently disappear.
