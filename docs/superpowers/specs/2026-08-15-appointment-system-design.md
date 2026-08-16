# Appointment booking & scheduling system — design

> Fills the consultant dashboard's `emptyMessage="No scheduling system yet."`
> (`web/components/clinical-review/clinical-dashboard.tsx:247`) and the two nav slots
> already subtitled for it: `web/app/consultant/reminders/page.tsx` ("Appointments &
> reminders") and `web/app/dermatologist/consultations/page.tsx` ("Appointments &
> notes"). Scope decisions below were made interactively with the owner (2026-08-15) —
> see rationale inline, not re-litigated here.

## Context

No appointment/availability/scheduling concept exists anywhere in this codebase today
— confirmed absent from `database_schemas/`, every `backend/app/services/` router, and
explicitly stated in `docs/DECISIONS.md:1205-1210`. `consultant_profiles.availability`
is a free-text `TEXT` column (never structured), `consultant_clients` models
consultant/dermatologist↔user *assignment* (not booking), and `dermatologist_profiles`
has no `consultation_modes` column at all (unlike `consultant_profiles`, which has
`consultation_modes TEXT[]`).

This is a genuine new subsystem — a new `appointments` service, two new/changed tables,
and booking UI across all three roles — not a wiring task like reminders (whose backend
already exists).

## Scope decisions (owner-approved)

| Area | Decision | Why |
|---|---|---|
| Appointment types | **Single generic slot per provider**, duration = provider's `slot_duration_minutes` | No `AppointmentType` menu table — YAGNI, one duration is enough for v1. |
| Availability model | **Recurring weekly pattern + date exceptions**, computed on read | No materialized slots table, no slot-generation job — slots are always derived from `provider_availability` − `availability_exceptions` − existing `appointments`, so they can never drift out of sync. |
| Cancel/reschedule cutoff | **Fixed 24h**, enforced server-side; provider exempt | Provider owns their calendar and can cancel/reschedule anytime; user needs a floor to stop last-minute churn. No per-provider config — no precedent for that kind of policy field elsewhere in the schema. |
| Consultation mode | **Recorded as metadata only** (`video`/`in_person`/`chat`, from the provider's supported modes) | No video-call provider integration — no adapter, no API key, not a scoped decision here (AGENTS.md §0.2). |
| Booking gate | **Open booking** — any user can book any approved provider; booking itself creates/activates the `consultant_clients` row if missing | No separate intake flow exists to gate on; matches a normal patient-facing booking product. |
| User nav | **Add "Appointments"** to the locked User nav list | Same precedent as the M3-G Skin Profile addition — booking is first-class, not buried. |
| Consultant/Dermatologist nav | **No new item** — repurpose the existing stub pages already subtitled for this | `consultant/reminders` ("Appointments & reminders") and `dermatologist/consultations` ("Appointments & notes") become tabbed pages; Reminders tab stays `ComingSoon` (separate sub-project). |
| Reminders/notifications | **Fire on state change only** (booked/confirmed/cancelled/rescheduled via existing `notifications.service.create_notification`) | No new scheduled "starts in 1h" cron tick — that belongs to the separate reminders sub-project. |
| Double-booking prevention | **Postgres `EXCLUDE USING gist`** on `(provider_id, tstzrange(start_time,end_time))` | DB-enforced concurrency safety, no app-level lock, no Redis — native feature beats custom code. |

## Data model

New tables in `database_schemas/skinlytics_postgresql_schema_v3.sql`, owned by the new
`appointments` service (single-writer rule):

```sql
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE provider_availability (
    availability_id SERIAL PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes SMALLINT NOT NULL DEFAULT 30,
    CHECK (end_time > start_time)
);
CREATE INDEX idx_provider_availability_provider ON provider_availability(provider_id);

CREATE TABLE availability_exceptions (
    exception_id SERIAL PRIMARY KEY,
    provider_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,           -- NULL start + NULL end = whole day blocked
    end_time TIME,
    reason TEXT,
    CHECK ((start_time IS NULL) = (end_time IS NULL))
);
CREATE INDEX idx_availability_exceptions_provider_date
    ON availability_exceptions(provider_id, exception_date);

CREATE TABLE appointments (
    appointment_id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id),
    provider_id TEXT NOT NULL REFERENCES "user"(id),
    provider_role VARCHAR(20) NOT NULL CHECK (provider_role IN ('consultant','dermatologist')),
    consultation_mode VARCHAR(20) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')),
    cancelled_by TEXT REFERENCES "user"(id),
    cancellation_reason TEXT,
    original_start_time TIMESTAMPTZ,   -- set on reschedule; one-hop history, no separate table
    notes TEXT,                        -- provider's post-appointment note
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    EXCLUDE USING gist (provider_id WITH =, tstzrange(start_time, end_time) WITH &&)
        WHERE (status IN ('pending','confirmed'))
);
CREATE INDEX idx_appointments_user ON appointments(user_id);
CREATE INDEX idx_appointments_provider_start ON appointments(provider_id, start_time);
```

**Migration also adds** `consultation_modes TEXT[]` to `dermatologist_profiles` (parity
with `consultant_profiles`, currently missing).

No `AppointmentType`, `AppointmentParticipant`, or materialized-slots table — the FK
pair *is* the two participants, duration lives on `provider_availability`, and slots are
computed, never stored (explicitly out of scope, see below).

## Backend service

New `backend/app/services/appointments/` — `router.py · service.py · schemas.py ·
models.py · deps.py`, mounted under `/api/v1`, matching the fixed service anatomy
(AGENTS.md §5).

**Availability (provider-owned):**
- `GET/PUT /appointments/availability/me` — full weekly-pattern replace (simpler than
  per-row PATCH). `service.py` validates `end_time > start_time` per row and no two
  rows for the same `day_of_week` overlap, before writing (app-level check — no DB
  exclusion constraint needed for this low-cardinality table).
- `POST /appointments/availability/exceptions`, `DELETE
  /appointments/availability/exceptions/{id}`
- Gate: `require_verified_professional("consultant","dermatologist")`.

**Discovery + booking:**
- `GET /appointments/providers?role=consultant|dermatologist` — `verification_status
  = 'approved'` only.
- `GET /appointments/providers/{provider_id}/slots?date=` — computed free slots for
  that date (weekly pattern − exceptions − existing pending/confirmed appointments −
  any slot whose start time has already passed, for `date == today`).
- `POST /appointments` — `require_role("user")`; body carries `provider_id`,
  `start_time`, and `consultation_mode` (user's choice, validated server-side against
  that provider's supported `consultation_modes` — reject with 400 if not a member).
  `provider_role` is **not** part of the request body at all — `service.py` derives it
  by looking up whether `provider_id` is a `ConsultantProfile` or `DermatologistProfile`
  row (a client can't spoof a dermatologist row for a consultant or vice versa; unlike
  `consultation_mode`, there is no legitimate reason for the client to ever send this
  field). Creates/activates `consultant_clients`, inserts `status='pending'`.
  On `IntegrityError` from the `EXCLUDE` constraint, the router returns **409** with a
  prose `detail` string (FastAPI's standard `HTTPException` shape) — the frontend never
  parses the body, it keys off the HTTP status code alone (`response.status === 409`),
  so the exact string isn't a contract. This is the conflict the frontend spec below
  handles explicitly.

**Management** (one role-aware endpoint, not two — a caller is never both sides of the
FK):
- `GET /appointments/me` — `WHERE user_id = me OR provider_id = me`, filters:
  `status`, `from`, `to`.
- `GET /appointments/{id}` — ownership via `deps.py::_verify_participant` (403 unless
  caller is `user_id` or `provider_id`).
- `PATCH /appointments/{id}/confirm|complete|no-show` — provider only, status-transition
  guard in `service.py` (`pending→confirmed`, `confirmed→completed`,
  `confirmed→no_show`; invalid transitions raise `ValueError` → 400).
- `PATCH /appointments/{id}/cancel` — either party; 24h cutoff enforced for the user
  (`start_time - now() < 24h` → 403), provider exempt.
- `PATCH /appointments/{id}/reschedule` — either party, same cutoff; updates
  `start_time`/`end_time`, stamps `original_start_time` if unset, re-validated against
  the `EXCLUDE` constraint (same 409 path as booking).

**Notifications:** `service.py` calls `notifications.service.create_notification`
(existing cross-service interface, not touching its table directly) on
booked/confirmed/cancelled/rescheduled, notifying the other party. No new cron.

## Frontend

**Prerequisite:** `web/components/ui/calendar.tsx` does not exist yet in this project
(`components.json` style is `base-nova` — Base UI, not Radix; no `calendar*` file, no
existing date-picker pattern anywhere in `web/components/`). Add it via the shadcn skill
(Base UI variant) before building the date-selection step — this is filling a gap in the
already-adopted component library, not introducing a new one.

**Routing:** `web/app/(user)/appointments/` → bare `/appointments` (route-group
convention, matches `/profile`, `/progress`, etc. already in that group). No `/user/...`
prefix.

### Consultant — `web/app/consultant/reminders/page.tsx`

Becomes a tabbed page (`Tabs`: **Appointments** | **Reminders**). Appointments tab is
built now; Reminders tab keeps its current `ComingSoon` render, untouched. No new nav
item — the existing sidebar entry (subtitle "Appointments & reminders") already covers
this.

Appointments tab:
- Sub-tabs or filter chips: **Today** / **Upcoming** / **History**, backed by one
  `useQuery` on `GET /appointments/me` with client-side date bucketing (today's date vs
  future vs past+terminal-status) — no three separate API calls for one dataset.
- Each row: client name/avatar (join via existing client lookup used elsewhere in
  `clinical-review` components), time, status `Badge`, consultation mode.
- Row click → `Dialog` with full detail: confirm / cancel / reschedule / complete /
  no-show actions, gated by current `status` (e.g. only `pending` shows Confirm; only
  `confirmed` shows Complete/No-show).
- "Open client profile" action routes to the existing
  `web/app/consultant/clients/[userId]/` page — no new client-detail UI.
- Cancel/reschedule confirmed via a nested confirmation step inside the same `Dialog`
  (swap its body to a "Cancel this appointment?" confirm view before calling the
  mutation) — no `AlertDialog` component exists in this project's shadcn set today, so
  this reuses `Dialog` rather than introducing a new primitive for one flow.
- States: `Skeleton` rows while loading; `StateCard` empty states — "No appointments
  today.", "No upcoming appointments.", "No appointment history." (reuses the
  `StateCard` component already used on `progress/page.tsx`); `StateCard` destructive
  variant + Retry button on query error (same pattern as `progress/page.tsx:162-173`).
  Mutations: buttons `disabled` while `isPending`, `sonner` toast on success/failure.

### Dermatologist — `web/app/dermatologist/consultations/page.tsx`

Same component shape as the consultant Appointments tab (today/upcoming/history,
confirm/cancel/reschedule/complete/no-show, open-patient-profile), reusing a shared
`AppointmentList`/`AppointmentDetailDialog` component pair (one implementation, two thin
page wrappers — not two copies). No Reminders tab here (that subtitle pattern is
consultant-only); this page's existing "notes" half of its subtitle already has a home
via `clinical_review`'s existing notes endpoints, left untouched — only the appointments
half is being built.

RBAC: dermatologist can only see/act on appointments where `provider_id = me`, exactly
like consultant — same `deps.py::_verify_participant` check, no separate code path. No
consultant-private data (`consultant_notes`) is ever touched by this page.

### Consultant dashboard widget — `clinical-dashboard.tsx:247`

Replace the `emptyMessage="No scheduling system yet."` KPI slot with a small
`useQuery(["appointments","me"])` widget: next upcoming appointment (name + time) if
one exists, else "No appointments today." Links to the Appointments tab above. Loading
→ `Skeleton`; same query key as the Appointments tab page so navigating between them
doesn't refetch.

### Shared component: `AvailabilitySettings`

Added to both `consultant/settings` and `dermatologist/settings` pages (both already in
locked nav, no new item):

- **Weekly hours:** one row per day (`Switch` enabled/disabled, `Select`/time-input for
  start/end, number input for slot duration). Client-side validates `end > start` and
  no same-day overlap before enabling Save (mirrors the backend check — backend stays
  authoritative, this is UX-only). `PUT` on save.
- **Blocked dates:** list of `availability_exceptions` rows with add/edit/delete.
  "Block whole day" toggle — when on, hides the start/end time inputs (enforces the
  NULL+NULL convention from the UI, not just the API).

### User booking flow — `/appointments`

```
Provider Browse → Provider Profile → Calendar (date) → Slot grid → Confirm Dialog →
Created → Upcoming/History Tabs
```

- **Browse:** `Command`/search input + role filter (Consultant/Dermatologist toggle) +
  `Card` grid from `GET /appointments/providers`. No filters beyond what that endpoint
  returns (no speciality/rating filter — not in the payload).
- **Profile:** public fields only (`biography`, `specializations`,
  `years_of_experience`/`years_of_practice`, `consultation_modes`) — never
  `license_number`, `phone`, documents, or verification internals.
- **Calendar:** shadcn `Calendar`; dates with zero computed slots are `disabled` (not
  just visually muted) — backend `slots` endpoint is the source of truth, calendar
  never guesses.
- **Slot grid:** re-fetched per date selection; each slot is a `Button`; grid shows "No
  available slots for this date." `StateCard` when empty.
- **Confirm dialog:** provider, role, date, time, consultation-mode `Select` (options =
  that provider's `consultation_modes`), submit → `POST /appointments`.
  - **On 409**: toast "This appointment slot is no longer
    available. Please choose another time.", dialog closes, slot grid
    `invalidateQueries` to refetch real availability. No client-side reservation/lock —
    the grid re-fetching *is* the recovery path.
- **Upcoming/History tabs:** same list/detail/cancel/reschedule pattern as the provider
  side, mirrored for the user's own bookings.

## RBAC summary

| Action | user | consultant | dermatologist |
|---|---|---|---|
| Browse/book providers | own bookings only | — | — |
| View own availability / edit | — | own only | own only |
| `GET /appointments/me` | rows where `user_id=me` | rows where `provider_id=me` | rows where `provider_id=me` |
| Confirm/complete/no-show | — | own appointments only | own appointments only |
| Cancel/reschedule | own, ≥24h out | own, anytime | own, anytime |

All enforced in `deps.py`/`service.py` — frontend route guards are UX only, never the
security boundary (AGENTS.md §18/§34).

## Explicitly out of scope (this spec)

- Separate appointment nav items (reuses existing subtitled stubs + adds one User item).
- `AppointmentType` / `AppointmentParticipant` tables.
- Materialized slots or a slot-generation background job.
- Frontend/Redis booking locks (the DB `EXCLUDE` constraint is the only lock).
- Separate reschedule-history table (one-hop `original_start_time` covers the ask).
- Video-call integration.
- Reminders tab implementation (separate sub-project).
- Per-provider configurable cancellation cutoff.

## Testing

- Backend: `provider_availability`/`availability_exceptions` CRUD + validation;
  slot-computation function (weekly pattern − exceptions − existing appointments,
  several fixture cases); booking happy path; **concurrent double-booking** (two
  simultaneous `POST /appointments` for the same slot — assert one 201 + one 409, this
  is the concurrency requirement's actual test, not a mocked lock); cancel cutoff
  (23h59m out → 403, 24h01m out → 200); reschedule re-validated against `EXCLUDE`;
  ownership checks (user A can't act on user B's appointment; consultant can't act on
  dermatologist's).
- Frontend: booking flow through to confirmation; 409-conflict UI path; provider
  confirm/cancel/reschedule/complete/no-show state transitions; empty/loading/error
  states on all four new/changed pages.
