# Reports & Reminders pages — design

> Fills the last two `built: false` items in the User nav (`web/lib/nav-config.ts`):
> `/reports` and `/reminders`. Grounded in `web/designs/wireframes/app-reports.html`,
> `web/designs/wireframes/app-notifications.html`, `database_schemas/skinlytics_postgresql_schema_v3.sql`,
> and `docs/ARCHITECTURE.md` §4. Scope decisions below were made interactively with the
> owner (2026-08-12) — see rationale inline, not re-litigated here.

## Context

Both routes currently render the shared `components/app-shell/coming-soon.tsx` stub.
Two wireframes exist that name these screens, but neither maps 1:1 onto a user-role,
self-service skincare app:

- `app-reports.html` is a **clinical-portal** template (sidebar says "Clinical Portal" /
  "Dr. Sarah Chen" / "Analyses, Consultants"; content includes HIPAA branding, EHR
  integration, "Medical Practitioner ID"). Only the report-type-card grid / recent-reports
  table / export-preferences *pattern* is reusable — the chrome and clinical-specific
  copy are not.
- `app-notifications.html` (titled "Notifications & Reminders" — this is the real
  wireframe backing the nav's `/reminders` slot, despite the label mismatch between
  `AGENTS.md`'s nav list ("Notifications") and `nav-config.ts`'s actual item id/path
  (`reminders` / `/reminders`) — flagging, not silently resolving, per AGENTS.md §0)
  has an Inbox tab + a Reminder Settings tab, but assumes Push/Email delivery channels
  and an Apple Health sync button that this backend has no adapter for.

Real backing that exists today:
- `progress_reports` table (report_id, user_id, report_type, summary, report_url,
  generated_at) — unused by any service. Matches `docs/ARCHITECTURE.md` §4 row 11's
  "PG report registry" description for the still-unbuilt Report service.
- `reminders` table (reminder_id, user_id, reminder_type, title, message, reminder_time,
  frequency, is_active) — unused by any service.
- `notifications` table + `backend/app/services/notifications/` — real, but **read-only**
  today (`GET /notifications/me`, wired into `NotificationBell`); nothing writes a row.
  Per `docs/ARCHITECTURE.md` §4 row 9, this ONE service owns both `notifications` and
  `reminders` — no separate `reminders` service.
- `arq` cron already runs in `backend/app/worker/main.py` (`poll_outbox_tick`, a 2-second
  tick) — real scheduling infra, no new dependency needed for recurring jobs.
- `progress/service.py`'s `_detect_streak_milestones` (line 210) already computes 7/14/30
  -day routine streaks for the Insights screen — reusable, not reinvented.
- Product-image rendering was independently audited (2026-08-12) — no defect found, out
  of scope for this spec.

## Scope decisions (owner-approved)

| Area | Decision | Why |
|---|---|---|
| Report export format | **PDF only, v1** | One format done right beats three half-done (ponytail YAGNI). Excel/CSV/JSON deferred. |
| Report types | **Assessment/Score, Progress, Routine+Recommendations** (3) | Each fully backed by existing service data (`scoring_engine.py`, `analytics`/`progress`, `routines`+`recommendations`). No Health-Summary/HIPAA card — clinical-only concept, no user-role equivalent. |
| Scheduled Automations | **Real** — generation runs on schedule via `arq` cron; **no email send** (no email adapter exists — logged as a documented no-op, not faked or silently dropped) | Owner explicitly asked to keep the full UI + a real scheduler, disable only the actual send step. |
| Export Preferences | **One real toggle: "Include profile header"** (name, skin type, generated-on date — from `skin_profiles`) | Repurposes the wireframe's HIPAA/Medical-Practitioner-ID toggle into something that has a real field to control. Format picker dropped (v1 is PDF-only). |
| Reminders scope | **3 types: Morning Routine, Evening Routine, Hydration Nudge** (time/interval + frequency + on/off) | Product Replenishment (needs product-usage tracking that doesn't exist — only step-completion is tracked) and Sleep/Apple-Health-Sync (needs a HealthKit integration, no ADR for one) dropped for v1. |
| Reminder channels | **Push/Email toggle UI stays, unwired** — reminder-due detection is real (writes a notification row), actual push/email send does not happen | Consistent with the Scheduled Automations decision: real detection, no fake delivery. |
| Inbox tab producers | **Reminder-due + routine-streak**, both real | Reminder-due comes free with the reminders cron. Streak reuses the existing `_detect_streak_milestones` function — no new detection logic. |

## Data model

**New table: `report_schedules`**
```sql
CREATE TABLE report_schedules (
    schedule_id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL,      -- 'assessment' | 'progress' | 'routine'
    frequency VARCHAR(20) NOT NULL,        -- 'weekly' | 'monthly'
    day_of_week SMALLINT,                  -- 0-6, set when frequency='weekly'
    day_of_month SMALLINT,                 -- 1-28, set when frequency='monthly'
    time_of_day TIME NOT NULL DEFAULT '08:00',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```
Added via Alembic migration + the same change lands in
`database_schemas/skinlytics_postgresql_schema_v3.sql` in the same commit (AGENTS.md §5).

**Reused as-is (no migration needed):** `progress_reports`, `reminders`, `notifications`.

## Backend

**New service: `backend/app/services/reports/`** (router/service/schemas/models —
matches the fixed 5-file service anatomy). Owns `progress_reports` + `report_schedules`
(single-writer rule). Endpoints, role `user` only, own data:
- `POST /reports/generate` — body `{report_type, include_profile_header}`, generates a
  PDF synchronously (small, bounded data — no job queue needed for the on-demand path),
  uploads via the existing `core/storage.py` adapter, inserts a `progress_reports` row,
  returns it.
- `GET /reports` — list the caller's `progress_reports`, newest first (same pattern as
  `notifications/service.py`'s `list_my_notifications`).
- `GET /reports/{id}/download` — returns a fresh presigned URL (never a baked-in one,
  same rule `recommendations/service.py` already follows for product images).
- `POST /reports/schedules`, `GET /reports/schedules`, `PATCH /reports/schedules/{id}`,
  `DELETE /reports/schedules/{id}` — CRUD on `report_schedules`.

PDF generation: **reportlab** (pure-Python wheel, no system dependency — the alternative,
WeasyPrint, needs a GTK/Pango native runtime that's a known pain point on Windows dev
machines; reportlab is the boring, portable choice here). New dependency, added to
`backend/pyproject.toml`.

**Extend `backend/app/services/notifications/`** (not a new service — see table above):
- `models.py` — add a `Reminder` model mapping the existing `reminders` table.
- `schemas.py` — `ReminderCreate` / `ReminderRead` / `ReminderUpdate`.
- `service.py` — `list_my_reminders`, `upsert_reminder`, `toggle_reminder`,
  `delete_reminder` (same shape as the existing `list_my_notifications`).
- `router.py` — `GET/POST/PATCH/DELETE /reminders`, role `user`, own data.

**Worker (`backend/app/worker/main.py`)** — two new cron jobs added to `cron_jobs`,
same list `poll_outbox_tick` is already in:
- `report_schedule_tick` — every 5 minutes, matches `report_schedules` rows due against
  current time, runs the same generation path `POST /reports/generate` uses, writes the
  `progress_reports` row + a "report ready" notification. No email send.
- `reminder_due_tick` — every 5 minutes, matches `reminders` rows due, writes a
  notification row (`notification_type='reminder'`). No push/email send.

**Streak producer** — hooked at the `routines` router's step-toggle endpoint (after
calling `routines/service.py`'s `toggle_step_completion`), not inside the routines
service itself (keeps the routines service from having to know about notifications —
service-boundary rule, AGENTS.md §2 point 4). Calls `progress/service.py`'s existing
adherence + milestone-detection functions; if today's toggle just crossed a new
milestone, writes one notification row via the notifications service.

## Frontend

- `app/(user)/reports/page.tsx` — 3 report-type cards (shadcn `Card`), "Generate Report"
  triggers `POST /reports/generate` with a loading state (reportlab generation is fast
  but not instant), Recent Reports `Table` (from `GET /reports`), Scheduled Automations
  card (list + create/toggle, backed by the new schedules endpoints), Export Preferences
  reduced to the one real toggle.
- `app/(user)/reminders/page.tsx` — shadcn `Tabs`: **Inbox** (same list-item pattern
  `NotificationBell`'s dropdown already renders, just full-page and un-truncated) and
  **Reminder Settings** (3 cards: Morning/Evening Routine time + frequency + channel
  toggle (cosmetic) + on/off; Hydration Nudge interval + on/off).
- `web/lib/nav-config.ts` — flip `built: false → true` on both `reports` and `reminders`
  items.
- Both pages ship light + dark (AGENTS.md §7.6), and get the same real-viewport
  responsive check (phone/tablet/laptop) the 2026-08-12 overflow-fix branch used.

## Error handling

- PDF generation failure (e.g. malformed data mid-report) → the `/reports/generate`
  endpoint returns 422 with a message, no partial `progress_reports` row is written
  (write happens only after the file is confirmed uploaded — same "no fabricated rows"
  discipline as the rest of the app, AGENTS.md §0.2).
- Cron job failures (report-schedule or reminder-due tick) are logged via the existing
  structured-logging convention, not silently swallowed — a bad row doesn't block the
  next tick from processing other users' rows.
- Reminder/schedule CRUD validation errors follow the existing convention: `ValueError`
  from the service layer → `422` at the router.

## Testing

- Backend: `pytest` for the new `reports` service (generation, list, download-URL
  freshness, schedule CRUD) and the extended `notifications` service (reminder CRUD),
  plus one test per new cron job function, matching existing test file conventions
  (`tests/test_notifications_service.py` already exists — extend it; new
  `tests/test_reports_service.py`).
- Frontend: Playwright e2e for both pages (generate-a-report happy path, toggle a
  reminder, both themes) under `web/tests/e2e/`, following `helpers.ts`'s existing
  real-account pattern.

## Explicitly out of scope (this round)

- Actual email/push delivery (no adapter exists — a real ADR-worthy decision for later,
  not built here).
- Excel/CSV/JSON export formats.
- Product Replenishment reminders (needs product-usage tracking, a separate feature).
- Apple Health / HealthKit sync (needs its own integration ADR).
- Consultant/Dermatologist "Reports" nav items (separate, still `built: false`, not
  touched by this spec — clinical-portal scope, different audience).
