# Age-Group Sync & Notification Bell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix bugs #3 and #4 from `bugs_report.md` (2026-07-26 full-app QA pass): the
onboarding assessment discards the user's age-group answer instead of persisting it,
and every role's notification bell shows a fake hardcoded unread count with no click
handler.

**Architecture:** Bug #3 is a one-field wire-through — `SkinProfileCreate` already
accepts `age_group`, the assessment submit path just never passed it. Bug #4 reuses a
table + Alembic migration that already exist (`notifications`, migrated in
`a7e9f4e50c45`, currently owned by no service — exactly the "add a models.py when it's
actually built" case that migration's own docstring names) behind a new, minimal
`notifications` service following this repo's fixed `router.py · service.py ·
schemas.py · models.py` anatomy, read-only (no mark-as-read — nothing in the app
creates a notification yet, so there is nothing to mark).

**Tech Stack:** FastAPI + SQLAlchemy (async) + Pydantic v2 (backend), Next.js App
Router + TanStack Query + shadcn `DropdownMenu` (frontend).

## Global Constraints

- `AGENTS.md` §5: service anatomy is `router.py · service.py · schemas.py · models.py ·
  deps.py`, routers mount under `/api/v1` (ADR-009).
- `AGENTS.md` §4: only shadcn primitives already used in this project — `DropdownMenu`
  is already the account-menu pattern in `glass-topbar.tsx`/`nav-user.tsx`; reuse it,
  don't add `Popover`.
- `AGENTS.md` §6: every endpoint declares its role(s). The bell is shared by all 4
  roles' topbars → `Depends(require_user)` (any authenticated role), not
  `require_role(...)`.
- `docs/ARCHITECTURE.md` §4 row 9: Notification service owns PG `notifications`,
  `reminders`; API prefix `/notifications`, `/reminders`. This plan only touches
  `notifications` — `reminders`/the Reminders nav item stays "Soon", out of scope.
- Regenerate `web/lib/api-types.ts` after any backend schema change (`make openapi`,
  repo root) — cross-cutting rule, `AGENTS.md` §6.
- No `Co-Authored-By: Claude` in any commit message (owner decision, `AGENTS.md` §6).

---

### Task 1: Persist the assessment wizard's age-group answer onto the skin profile

**Files:**
- Modify: `backend/app/services/assessment/schemas.py`
- Modify: `backend/app/services/assessment/service.py:198-202`
- Test: `backend/tests/test_assessment_service.py`
- Modify: `web/lib/assessment/payload.ts`
- Test: `web/lib/__tests__/assessment-payload.test.ts`
- Regenerate: `web/lib/api-types.ts` (via `make openapi`)

**Interfaces:**
- Consumes: `skin_profile_service.create_profile(db, user_id, SkinProfileCreate(...))` —
  `SkinProfileCreate` already has `age_group: str | None = None`
  (`backend/app/services/skin_profile/schemas.py:47-49`), unchanged by this task.
- Produces: `AssessmentSubmitRequest.age_group: str | None` — new optional field later
  request-builders can rely on being present in the OpenAPI schema.

- [ ] **Step 1: Write the failing backend test**

Add to `backend/tests/test_assessment_service.py`, after
`test_submit_assessment_persists_and_returns_ids`:

```python
async def test_submit_assessment_persists_age_group_onto_profile(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await submit_assessment(
        db_session,
        test_user_id,
        AssessmentSubmitRequest(
            skin_type="Oily",
            age_group="18-24",
            lifestyle=AssessmentLifestyleInput(
                sleep_hours=7.5, water_intake_liters=2.5, stress_level=4, sun_exposure="Moderate"
            ),
        ),
    )

    profile = await get_current_profile(db_session, test_user_id)
    assert profile is not None
    assert profile.age_group == "18-24"


async def test_submit_assessment_without_age_group_leaves_profile_age_group_none(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await submit_assessment(
        db_session,
        test_user_id,
        AssessmentSubmitRequest(
            skin_type="Oily",
            lifestyle=AssessmentLifestyleInput(
                sleep_hours=7.5, water_intake_liters=2.5, stress_level=4, sun_exposure="Moderate"
            ),
        ),
    )

    profile = await get_current_profile(db_session, test_user_id)
    assert profile is not None
    assert profile.age_group is None
```

- [ ] **Step 2: Run the tests to verify they fail**

Run (repo root): `cd backend && uv run pytest tests/test_assessment_service.py -k age_group -v`
Expected: FAIL — `AssessmentSubmitRequest` has no field `age_group` (Pydantic rejects
the unknown kwarg, or silently drops it if `extra` isn't configured — either way
`profile.age_group` will not equal `"18-24"`).

- [ ] **Step 3: Add `age_group` to the request schema**

In `backend/app/services/assessment/schemas.py`, inside `AssessmentSubmitRequest`, add
one field next to `skin_type` (exact spot doesn't matter, keep it near the top with the
other top-level fields, above the deprecated flat severity fields):

```python
    age_group: str | None = None
```

- [ ] **Step 4: Thread it through `submit_assessment`**

In `backend/app/services/assessment/service.py`, the existing `create_profile` call
(around line 198-202) is:

```python
    await skin_profile_service.create_profile(
        db,
        user_id,
        SkinProfileCreate(skin_type_id=skin_type.skin_type_id, concerns=profile_concerns),
    )
```

Change to:

```python
    await skin_profile_service.create_profile(
        db,
        user_id,
        SkinProfileCreate(
            skin_type_id=skin_type.skin_type_id,
            age_group=payload.age_group,
            concerns=profile_concerns,
        ),
    )
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_assessment_service.py -v`
Expected: PASS — full file, not just the two new tests (confirms nothing else broke).

- [ ] **Step 6: Regenerate the frontend OpenAPI types**

Run (repo root, backend + Docker Postgres must be reachable for the app to import):
`make openapi`
Expected: `web/lib/api-types.ts` regenerates with `age_group?: string | null` added to
`AssessmentSubmitRequest`. Diff it (`git diff web/lib/api-types.ts`) — it should be a
small, additive diff touching only that one schema block. If it also reformats unrelated
parts of the file, that's the codegen's normal churn, not a mistake — leave it.

- [ ] **Step 7: Write the failing frontend unit test**

In `web/lib/__tests__/assessment-payload.test.ts`, change `EXAMPLE_STATE.ageGroup` from
`null` to a real value, and assert it round-trips:

```typescript
const EXAMPLE_STATE: AssessmentState = {
  ageGroup: "25-34",
  goals: [],
  location: "",
  skinTypeId: 1,
  skinTypeName: "Oily",
  priorities: [
    { concernId: 101, concernName: "Acne", severity: 7 },
    { concernId: 102, concernName: "Hyperpigmentation", severity: 4 },
  ],
  sleepHours: 7.5,
  waterLiters: 2.5,
  stressLevel: 4,
  sunExposure: "Moderate",
};
```

Add one assertion to the first test (`"buildAssessmentSubmitPayload — matches
mile_2.docx's worked example exactly"`), right after `assert.equal(payload.skin_type,
"Oily");`:

```typescript
  assert.equal(payload.age_group, "25-34");
```

Add a new test at the end of the file:

```typescript
test("buildAssessmentSubmitPayload — omits age_group when the wizard state has none", () => {
  const payload = buildAssessmentSubmitPayload({ ...EXAMPLE_STATE, ageGroup: null }, "usr_1");
  assert.equal(payload.age_group, undefined);
});
```

- [ ] **Step 8: Run the frontend test to verify it fails**

Run: `cd web && node --test --experimental-strip-types lib/__tests__/assessment-payload.test.ts`
Expected: FAIL — `payload.age_group` is `undefined` even for `EXAMPLE_STATE.ageGroup =
"25-34"` (the builder doesn't read `state.ageGroup` yet).

- [ ] **Step 9: Add `age_group` to the payload builder**

In `web/lib/assessment/payload.ts`, add the field to the exported type (after
`skin_type: string;`):

```typescript
  age_group?: string;
```

And in `buildAssessmentSubmitPayload`'s return object, add it (after `skin_type:
state.skinTypeName ?? "",`):

```typescript
    age_group: state.ageGroup ?? undefined,
```

- [ ] **Step 10: Run the frontend test to verify it passes**

Run: `cd web && node --test --experimental-strip-types lib/__tests__/assessment-payload.test.ts`
Expected: PASS, all 5 tests (3 original + 2 new).

- [ ] **Step 11: Typecheck + lint**

Run: `cd web && npx tsc --noEmit && npx eslint lib/assessment/payload.ts lib/__tests__/assessment-payload.test.ts`
Expected: clean, no errors.

- [ ] **Step 12: Commit**

```bash
git add backend/app/services/assessment/schemas.py backend/app/services/assessment/service.py backend/tests/test_assessment_service.py web/lib/assessment/payload.ts web/lib/__tests__/assessment-payload.test.ts web/lib/api-types.ts
git commit -m "fix(assessment): persist the wizard's age-group answer onto the skin profile"
```

---

### Task 2: Real notification bell — reuse the existing `notifications` table

**Files:**
- Create: `backend/app/services/notifications/__init__.py`
- Create: `backend/app/services/notifications/models.py`
- Create: `backend/app/services/notifications/schemas.py`
- Create: `backend/app/services/notifications/service.py`
- Create: `backend/app/services/notifications/router.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_notifications_service.py`
- Modify: `web/lib/nav-config.ts`
- Modify: `web/components/app-shell/glass-topbar.tsx`
- Regenerate: `web/lib/api-types.ts` (via `make openapi`)

**Interfaces:**
- Consumes: `app.core.security.require_user` (existing — any authenticated role, no
  role filter, matches every topbar showing the bell).
- Produces: `GET /api/v1/notifications/me` → `list[NotificationRead]`, each with
  `notification_id: int, title: str | None, message: str | None, notification_type: str
  | None, is_read: bool, created_at: datetime`. Frontend derives its own unread count as
  `data.filter(n => !n.is_read).length` — no separate count endpoint.

- [ ] **Step 1: Write the failing backend test**

Create `backend/tests/test_notifications_service.py`:

```python
"""Bug #4, bugs_report.md 2026-07-26: the notification bell showed a hardcoded fake
unread count with no backing data and no click handler. This is the real (currently
always-empty, since nothing in the app produces a notification yet) read path behind
it — reuses the `notifications` table already migrated in a7e9f4e50c45, which that
migration's own docstring says is exactly meant to gain a models.py "when it's actually
built"."""

from httpx import AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.core.security import require_user
from app.services.notifications.service import list_my_notifications


async def _as(user_id: str, client: AsyncClient) -> None:
    app.dependency_overrides[require_user] = lambda: {
        "id": user_id,
        "role": "user",
        "claims": {},
    }


async def test_list_my_notifications_is_empty_for_a_user_with_none(
    db_session: AsyncSession, test_user_id: str
) -> None:
    assert await list_my_notifications(db_session, test_user_id) == []


async def test_list_my_notifications_returns_only_the_caller_s_own_rows(
    db_session: AsyncSession, test_user_id: str
) -> None:
    await db_session.execute(
        text(
            "INSERT INTO notifications (user_id, title, message, notification_type, is_read) "
            "VALUES (:uid, 'Routine reminder', 'Time for your PM routine', 'routine', false)"
        ),
        {"uid": test_user_id},
    )
    await db_session.execute(
        text(
            "INSERT INTO notifications (user_id, title, message, notification_type, is_read) "
            "VALUES ('some-other-user', 'Not yours', 'Should not show up', 'routine', false)"
        )
    )
    await db_session.flush()

    rows = await list_my_notifications(db_session, test_user_id)
    assert len(rows) == 1
    assert rows[0].title == "Routine reminder"
    assert rows[0].is_read is False


async def test_notifications_endpoint_requires_auth(client: AsyncClient) -> None:
    response = await client.get("/api/v1/notifications/me")
    assert response.status_code in (401, 403)


async def test_notifications_endpoint_returns_the_caller_s_notifications(
    client: AsyncClient,
) -> None:
    await _as("test-notifications-http", client)
    try:
        response = await client.get("/api/v1/notifications/me")
    finally:
        app.dependency_overrides.pop(require_user, None)
    assert response.status_code == 200
    assert response.json() == []
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -v`
Expected: FAIL — `app.services.notifications` doesn't exist yet (`ModuleNotFoundError`).

- [ ] **Step 3: Create the package + ORM model**

Create `backend/app/services/notifications/__init__.py` (empty file).

Create `backend/app/services/notifications/models.py`:

```python
import datetime

from sqlalchemy import ForeignKey, Index, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.postgres import Base


class Notification(Base):
    """Maps onto the `notifications` table already migrated in a7e9f4e50c45 (schema-only
    until now, per that migration's own docstring). Nothing in the app writes a row here
    yet — this service is a read path only; write support (a real producer: routine
    reminders, verification-decision pings, etc.) is a separate, later feature, not
    invented here."""

    __tablename__ = "notifications"
    __table_args__ = (Index("idx_notifications_user_unread", "user_id", "is_read"),)

    notification_id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("user.id", ondelete="CASCADE"))
    title: Mapped[str | None] = mapped_column(default=None)
    message: Mapped[str | None] = mapped_column(default=None)
    notification_type: Mapped[str | None] = mapped_column(default=None)
    is_read: Mapped[bool] = mapped_column(server_default="false")
    created_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime.datetime | None] = mapped_column(server_default=func.now())
```

- [ ] **Step 4: Create the schema**

Create `backend/app/services/notifications/schemas.py`:

```python
import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    title: str | None
    message: str | None
    notification_type: str | None
    is_read: bool
    created_at: datetime.datetime | None
```

- [ ] **Step 5: Create the service**

Create `backend/app/services/notifications/service.py`:

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.notifications.models import Notification


async def list_my_notifications(db: AsyncSession, user_id: str, limit: int = 20) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())
```

- [ ] **Step 6: Create the router**

Create `backend/app/services/notifications/router.py`:

```python
from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import require_user
from app.db.postgres import get_db
from app.services.notifications import service
from app.services.notifications.schemas import NotificationRead

router = APIRouter()


@router.get("/notifications/me")
async def get_my_notifications(
    user: Annotated[dict[str, Any], Depends(require_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> list[NotificationRead]:
    rows = await service.list_my_notifications(db, user["id"])
    return [NotificationRead.model_validate(r) for r in rows]
```

- [ ] **Step 7: Mount the router**

In `backend/app/main.py`, add the import alongside the other service router imports
(alphabetical, after `instrumentation_router`):

```python
from app.services.notifications.router import router as notifications_router
```

And add the `include_router` call alongside the others (after the `progress_router`
line, before `analytics_router` — order doesn't matter functionally, keep it readable):

```python
    api_v1.include_router(notifications_router, tags=["notifications"])
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `cd backend && uv run pytest tests/test_notifications_service.py -v`
Expected: PASS, all 4 tests.

- [ ] **Step 9: Regenerate the frontend OpenAPI types**

Run (repo root): `make openapi`
Expected: `web/lib/api-types.ts` gains a `NotificationRead` schema and a
`/notifications/me` path entry.

- [ ] **Step 10: Remove the fake `bellCount` fixture**

In `web/lib/nav-config.ts`, remove `bellCount: number;` from the `TopbarConfig`
interface (around line 695) and delete the `bellCount: 3` / `bellCount: 5` line from
each of the 4 role entries (`user`, `consultant`, `dermatologist`, `admin` — lines
704/711/718/725). Leave `avatarCaption`/`primaryActionLabel`/`primaryActionHref`
untouched.

- [ ] **Step 11: Replace the dead bell button with a real `DropdownMenu`**

In `web/components/app-shell/glass-topbar.tsx`, the current bell (around lines
143-154) is:

```tsx
          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant hover:bg-muted hover:text-on-surface relative flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Bell className="size-[18px]" strokeWidth={1.5} />
            {topbar.bellCount > 0 && (
              <span className="bg-destructive text-on-error absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
                {topbar.bellCount}
              </span>
            )}
          </button>
```

Replace it with a `DropdownMenu` that fetches the real list on open. Add these imports
near the top of the file, alongside the existing ones:

```tsx
import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";
```

(`DropdownMenu`, `DropdownMenuContent`, `DropdownMenuTrigger` are already imported in
this file for the account menu — reuse them, don't re-import.)

Add a small formatter + the new component above `GlassTopbar`'s own function
definition:

```tsx
function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function NotificationBell() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/notifications/me");
      return data ?? [];
    },
  });
  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant hover:bg-muted hover:text-on-surface relative flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Bell className="size-[18px]" strokeWidth={1.5} />
            {unread > 0 && (
              <span className="bg-destructive text-on-error absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
                {unread}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex flex-col gap-2 p-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-on-surface-variant px-2 py-6 text-center text-sm">
            No notifications yet.
          </p>
        ) : (
          (data ?? []).map((n) => (
            <div key={n.notification_id} className="flex flex-col gap-0.5 px-2 py-2">
              <div className="flex items-center gap-2">
                {!n.is_read && <span className="bg-secondary size-1.5 shrink-0 rounded-full" />}
                <span className="font-sans text-sm font-medium">{n.title}</span>
              </div>
              {n.message && (
                <p className="text-on-surface-variant font-sans text-xs">{n.message}</p>
              )}
              <span className="text-on-surface-variant font-geist text-[11px]">
                {timeAgo(n.created_at)}
              </span>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

Then replace the bell `<button>` block in the topbar's JSX with:

```tsx
          <NotificationBell />
```

- [ ] **Step 12: Check `Skeleton` is imported**

`glass-topbar.tsx` likely doesn't import `Skeleton` yet — add it to the existing
`@/components/ui/skeleton` import if the file has one, or add:

```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

- [ ] **Step 13: Typecheck + lint**

Run: `cd web && npx tsc --noEmit && npx eslint components/app-shell/glass-topbar.tsx lib/nav-config.ts`
Expected: clean.

- [ ] **Step 14: Manual check against the running app**

With `docker compose up -d`, `uv run uvicorn app.main:app --reload` (backend), and `npm
run dev` (web) all running: log in as any role, click the bell. Expected: dropdown
opens showing "No notifications yet." (every seeded account has zero rows in
`notifications`), badge is gone (0 unread), no console errors. Confirm via `curl -s
http://localhost:8000/api/v1/notifications/me -H "Authorization: Bearer <token>"`
returns `[]` if you want to check the API directly, but the UI check is sufficient.

- [ ] **Step 15: Commit**

```bash
git add backend/app/services/notifications backend/app/main.py backend/tests/test_notifications_service.py web/lib/nav-config.ts web/components/app-shell/glass-topbar.tsx web/lib/api-types.ts
git commit -m "fix(notifications): real bell backed by the notifications table, drop the fake unread-count fixture"
```

---

## Deferred (tracked, not fixed by this plan)

Per the user's explicit scope ("fix the age_group and notification bell bugs too") —
these two remaining `bugs_report.md` items are tracked as open tasks, not implemented
here:

- **Bug #5** — Consultant "Add New Client" topbar button just links to the Clients list
  page it's already on; clients are admin-assigned only, so there's no add-client action
  to link to. Needs a product call (remove the button vs. build a real "request a
  client" flow) before touching code.
- **Bug #6** — Landing page footer/legal links (`Privacy Policy`, `Terms of Service`,
  `HIPAA Compliance`, etc.) are all `href="#"` placeholders. Minor/cosmetic, expected
  for pre-launch marketing content; only worth real pages once there's real legal copy
  to put on them.
