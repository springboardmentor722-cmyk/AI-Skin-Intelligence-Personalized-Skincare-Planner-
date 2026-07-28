# M3R Phase 5 — Consultant & Dermatologist Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P5-T1 through T5 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
`docs/milestones/milestone_3/phases/phase_5_professional_portal.md`) —
`MILESTONE 3.pdf` Step 4.2's real gaps in the Consultant/Dermatologist portal.
Roster (`GET /clients/me`), inspection view (`GET /clients/{user_id}`), and
clinical notes CRUD already exist and are real (M2 + M3R-P0 confirmed). What's
actually missing: server-side roster search, compliance metrics on the roster,
an adherence/score-timeline chart on the inspection view, **zero** photo
capability (front or back end), and **zero** routine-overwrite capability
(front or back end) — the last two also block Step 5's E2E walkthrough
entirely, since the rubric's literal flow is exercised inside them.

**Architecture — reuse, not reinvent:** every piece of business logic this
phase needs already exists as a `user_id`-parametric service function, built
for the *user's own* screens in M2/M3R-P2/P3/P4:
- `routines_service.add_step/update_step/delete_step/search_products_for_edit`
  (`backend/app/services/routines/service.py`) already take the target
  `user_id` as an explicit argument — they don't derive it from a request-
  scoped caller. Today only `routines/router.py` calls them, always with the
  caller's own `user["id"]`. This phase adds new `clinical_review/router.py`
  endpoints that call the *same* functions with the *client's* `user_id`,
  after `_verify_assignment` gates the professional — no new mutation logic,
  no duplicated single-writer path (AGENTS.md §2 rule 4).
- `progress_service.get_progress_photos(db, user_id)`
  (`backend/app/services/progress/service.py`) already returns the real,
  presigned-URL, tag + frozen-score-at-upload photo list Phase 3 built. A new
  thin `clinical_review` endpoint verifies assignment, then calls this
  directly.
- `analytics_service.get_my_analytics(db, user_id, days=90)`
  (`backend/app/services/analytics/service.py`) already returns the real
  score/adherence/compliance/photos/correlations surface Phase 3/4 built. Same
  pattern: verify assignment, delegate.
- `admin_service.write_audit_log(db, actor_user_id=..., action=..., ...)`
  (`backend/app/services/admin/service.py`) is the single, already-real,
  reusable audit-log writer (AGENTS.md §6) — the routine-overwrite endpoints
  call this directly for attribution, not a new logging mechanism.
- Frontend: `web/app/(user)/routine/edit/[routineId]/page.tsx` is a complete,
  working routine editor (reorder, add/delete step, product swap search,
  usage notes, dirty-tracking save/discard) built against the user's own
  endpoints. This phase extracts its reusable parts into a shared
  `RoutineEditor` component parametrized by which API calls to make, so the
  professional's routine-overwrite screen doesn't duplicate ~400 lines of UI
  logic — reuse before invent (ponytail).
- `web/components/charts/score-adherence-chart.tsx` (`ScoreAdherenceChart`,
  built in P4) is already generic enough (points/rangeOptions props, no
  dashboard-specific state) to reuse directly on the inspection view for the
  adherence/score timeline — no new chart component needed.

**Tech Stack:** FastAPI (backend/app/services/clinical_review/*), Next.js +
TanStack Query + shadcn/ui (locked). No new dependencies.

## Global Constraints

- **Single-writer rule (AGENTS.md §2 rule 4):** every new endpoint in this
  phase is a thin, assignment-gated wrapper that calls an *existing* service
  function — never a parallel mutation path, never a copy-pasted query.
- **Ownership check first, always.** Every new endpoint calls
  `clinical_review_service.verify_assignment` (or the new endpoints live
  inside `clinical_review/service.py` itself and call `_verify_assignment`
  directly) before touching any of the client's data. A professional
  requesting an unassigned client's data must get a 404 (matching the
  existing `get_client_detail` convention), never a 403 that leaks whether
  the user_id exists.
- **Nav is fixed (AGENTS.md §4).** No new sidebar entries for either role —
  everything in this phase lives inside the existing Consultant "Clients" and
  Dermatologist "Patients" nav items, as routes nested under the existing
  client-detail page.
- **"Not medical advice" + `confidence` surfaced** wherever AI-derived values
  (the analytics correlations, the trend-analyzer insight) are shown to a
  professional — same as the user-facing screens (AGENTS.md §2.8).
- **Presigned URLs never persisted client-side beyond their TTL** — the photo
  comparison UI fetches on view via TanStack Query (no manual caching/storage
  of the URL strings beyond the query cache's own lifetime).
- **Every routine mutation is attributable.** Each of the new
  clinical_review routine-mutation endpoints writes one audit-log row via the
  existing `admin_service.write_audit_log` (actor = professional, target =
  the step/routine, metadata includes the client's user_id) — reuse the
  existing mechanism, don't build a second one.
- **Frosted Lab Glass tokens, shadcn primitives, both themes** — same as
  every prior phase. Check any touched `Button render={<Link/>}` for
  `nativeButton={false}` (recurring bug pattern in this repo).
- Real data only. No fabricated adherence/photo/analytics values if a client
  has none yet — honest empty states (matching Phase 3's "None assigned yet
  →None fabricated" precedent throughout this milestone).
- Quality gates: backend `ruff` + `mypy --strict` + `pytest`; frontend
  `npm run lint` + `npm run typecheck` + production build.
- **Never add a Co-Authored-By trailer or any AI-assistant co-author to any
  commit message.**

---

### Task 1: Roster — server-side search + compliance metrics

**Why:** the rubric names "searchable list... showing primary concerns,
current health score, **and compliance metrics (7/30-day)**." Today
`GET /clients/me` (`clinical_review/router.py:29`) has no search param at
all, and `ClientSummaryRead` has `overall_score`/`routine_adherence_score`/
`score_trend` but no compliance percentage field.

**Files:**
- Modify: `backend/app/services/clinical_review/schemas.py` (`ClientSummaryRead`)
- Modify: `backend/app/services/clinical_review/service.py` (`list_my_clients`)
- Modify: `backend/app/services/clinical_review/router.py` (`get_my_clients`)
- Modify: `web/app/consultant/clients/page.tsx` and the dermatologist
  equivalent (grep for the real file — likely
  `web/app/dermatologist/patients/page.tsx`, confirm the exact path first)
- Test: `backend/tests/test_clinical_review_service.py` (confirm this file's
  real name first — grep `backend/tests/` for the existing clinical-review
  test file rather than assuming)

**Interfaces:**
- `GET /api/v1/clients/me?q=<search>&page=&page_size=` — `q` is optional,
  matches against the client's name/email (case-insensitive `ILIKE`),
  server-side, over assigned clients only (never returns an unassigned user
  regardless of query match).
- `ClientSummaryRead` gains `compliance_seven_day: float | None` and
  `compliance_thirty_day: float | None` (0-1, `None` when nothing assigned in
  that window — same honest-`None` convention as
  `progress_service.get_compliance_percentages`'s own fields).

- [ ] **Step 1: Read the real current files first**

Read `backend/app/services/clinical_review/service.py` (`list_my_clients`,
already shown above — has the LIMIT/OFFSET pattern, N+1 per-assignment
already accepted for this function per its own docstring),
`backend/app/services/progress/service.py`'s `get_compliance_percentages`
(exact signature: `async def get_compliance_percentages(db, user_id) ->
CompliancePercentages` — confirm `CompliancePercentages`'s real field names,
`seven_day`/`thirty_day`/`ninety_day`, before wiring), and find the real
frontend roster page paths (`web/app/consultant/clients/page.tsx` and
whatever the dermatologist "Patients" page is actually called — grep
`web/app/dermatologist/` for it, don't assume the name).

- [ ] **Step 2: Add server-side search to `list_my_clients`**

Add an optional `search: str | None = None` parameter. When provided, filter
the initial `ConsultantClient` query by joining `external_user_table` and
matching `name ILIKE '%{search}%' OR email ILIKE '%{search}%'` — apply this
filter to BOTH the count query and the paginated query (don't let the total
count ignore the search term). Use SQLAlchemy's `ilike()` method with proper
parameter binding — never string-interpolate the search term into raw SQL
(SQL injection).

- [ ] **Step 3: Add compliance metrics to the summary**

In the same per-assignment loop `list_my_clients` already has (its own
docstring already accepts this function's N+1 shape), call
`progress_service.get_compliance_percentages(db, assignment.user_id)` and map
`seven_day`/`thirty_day` onto the new `ClientSummaryRead` fields.

- [ ] **Step 4: Wire the router and frontend**

Add `q: str | None = Query(default=None)` to `get_my_clients`, pass through
to `service.list_my_clients(..., search=q)`. On the frontend roster page(s),
add a search input (debounced, matching the existing pattern in
`web/app/(user)/routine/edit/[routineId]/page.tsx`'s `useDebouncedValue` if a
shared version doesn't already exist — check `web/lib/hooks/` first), wired
into the `["clinical-review", "clients", search, page]`-keyed query. Render
the new compliance percentages on each roster row/card (check the real
wireframe — `web/designs/wireframes/consultant-dashboard.html` or
`consultant-clients.html`, whichever actually maps to this screen — for
placement; if no wireframe placement exists for compliance %, add it as a
small stat near the existing score, following AGENTS.md §8's "flag the
assumption" for anything genuinely un-wireframed).

- [ ] **Step 5: Tests**

Add a real (not vacuous) test: seed 2+ assigned clients with different
names, search for one by a substring of their name, confirm only the
matching client is returned AND the `total` count reflects the filtered
count, not the full roster. Add a compliance-metrics test: seed a client with
known routine_logs history, confirm the returned `compliance_seven_day`
matches `get_compliance_percentages`'s own directly-computed value (don't
duplicate the math in the test — call the same function and assert
equality, catching any wiring bug without re-deriving the formula).

- [ ] **Step 6: Run gates, verify, commit**

Backend: `cd backend && uv run pytest tests/test_clinical_review_service.py
tests/test_clinical_review_router.py -v` (confirm real file names first),
then `uv run ruff check . && uv run mypy app`. Frontend:
`cd web && npm run typecheck && npm run lint`.

```bash
git add backend/app/services/clinical_review/ web/app/consultant/ web/app/dermatologist/ backend/tests/
git commit -m "feat(portal): add server-side roster search and 7/30-day compliance metrics"
```

---

### Task 2: Patient inspection view — adherence + score timeline

**Why:** the rubric wants a "visual timeline" per client — score timeline and
adherence trend, both of which the analytics endpoint already computes for
the *user's own* dashboard (P3/P4). `ClientDetailRead` today only has a
single `ClientScoreRead` snapshot (30-day recent scores collapsed to
"latest"), no timeline data and no adherence series at all.

**Files:**
- Create: `backend/app/services/clinical_review/schemas.py` — no new schema
  needed if reusing `AnalyticsMeRead` directly (check whether importing it
  across services violates any boundary — `analytics/schemas.py` is a
  sibling service's public schema, importing a Pydantic response model
  across services for a read-only reuse is consistent with this repo's
  existing pattern, e.g. `clinical_review/schemas.py` already imports
  `RoutineRead` from `routines/schemas.py` and `SkinProfileRead` from
  `skin_profile/schemas.py`)
- Modify: `backend/app/services/clinical_review/router.py` (new endpoint)
- Modify: `web/components/clinical-review/client-detail-view.tsx`
- Test: the same clinical-review test file as Task 1

**Interfaces:**
- `GET /api/v1/clients/{user_id}/analytics` — `_professional` +
  `_verify_assignment(db, professional["id"], user_id)`, then
  `return await analytics_service.get_my_analytics(db, user_id)`. Same
  `AnalyticsMeRead` response shape the user's own `GET /analytics/me`
  returns.

- [ ] **Step 1: Add the endpoint**

In `clinical_review/router.py`, add:

```python
from app.services.analytics import service as analytics_service
from app.services.analytics.schemas import AnalyticsMeRead

@router.get("/clients/{user_id}/analytics")
async def get_client_analytics(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> AnalyticsMeRead:
    try:
        await service.verify_assignment(db, professional["id"], user_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await analytics_service.get_my_analytics(db, user_id)
```

(Confirm `analytics_service.get_my_analytics`'s exact signature and
`AnalyticsMeRead`'s exact import path before writing this — read
`backend/app/services/analytics/service.py` and `schemas.py` directly rather
than trusting this plan's memory of Phase 3's work.)

- [ ] **Step 2: Wire the frontend inspection view**

In `web/components/clinical-review/client-detail-view.tsx`, add a new
`useQuery` for `GET /api/v1/clients/{user_id}/analytics`, and render
`ScoreAdherenceChart` (`web/components/charts/score-adherence-chart.tsx`,
built in P4 — confirm its exact prop shape by reading the file, don't guess)
fed by this query's `score_vs_adherence`, in a new card section ("Progress
timeline" or similar — check the wireframe for placement/naming first). Add
the "not medical advice" disclaimer near the `correlations` section if you
render it (check whether a shared disclaimer component already exists —
grep `web/components/` for "not medical advice" or "disclaimer" before
writing a new one).

- [ ] **Step 3: Tests + gates + commit**

Add a router test: professional with a real assignment gets 200 with real
data; professional without an assignment gets 404. Run backend/frontend
gates as in Task 1.

```bash
git add backend/app/services/clinical_review/ web/components/clinical-review/ backend/tests/
git commit -m "feat(portal): add adherence/score timeline to the patient inspection view"
```

---

### Task 3: Baseline vs Current photo comparison

**Why:** rubric-literal "Baseline vs Current" side-by-side comparison. Zero
photo capability exists today in the portal — no read endpoint, no frontend
component at all.

**Files:**
- Modify: `backend/app/services/clinical_review/router.py` (new endpoint)
- Create: `web/components/clinical-review/photo-comparison.tsx`
- Modify: `web/components/clinical-review/client-detail-view.tsx` (render it)
- Test: same clinical-review test file

**Interfaces:**
- `GET /api/v1/clients/{user_id}/photos` — same assignment-gate pattern as
  Task 2, delegates to `progress_service.get_progress_photos(db, user_id)`.
  Reuses `ProgressPhotosRead` (confirm the real schema name/shape by reading
  `backend/app/services/progress/schemas.py` — it should already carry
  `image_stage`/`uploaded_at`/`skin_health_score_at_upload`/presigned `url`
  per Phase 3's work).

- [ ] **Step 1: Add the endpoint**

```python
from app.services.progress import service as progress_service
from app.services.progress.schemas import ProgressPhotosRead

@router.get("/clients/{user_id}/photos")
async def get_client_photos(
    user_id: str,
    professional: Annotated[dict[str, Any], Depends(_professional)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> ProgressPhotosRead:
    try:
        await service.verify_assignment(db, professional["id"], user_id)
    except ValueError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return await progress_service.get_progress_photos(db, user_id)
```

(Confirm the exact return shape of `get_progress_photos` first — read
`backend/app/services/progress/service.py:107` and its schema, since this
plan's description of it is from memory of Phase 3, not a fresh read.)

- [ ] **Step 2: Build the comparison UI**

New `PhotoComparison` component: two `Select` dropdowns (or a simpler
"Baseline" pinned + a single "Compare to" selector, per whichever the real
wireframe shows — check `web/designs/wireframes/derm-patient-detail.html`/
`consultant-client-detail.html` for the literal layout first) populated from
the fetched photo list's `image_stage` tags, rendering the two selected
photos side by side with their real `uploaded_at` date and frozen
`skin_health_score_at_upload` as captions. Empty state: "No progress photos
yet" when the list is empty — don't render two blank boxes. Use
`next/image` or a plain `<img>` with the presigned URL directly (it's already
short-lived and scoped, no need for additional handling).

- [ ] **Step 3: Tests + gates + commit**

Router test: assigned professional sees the real photo list (seed 2+ photos
for a test client, confirm both appear with correct fields); unassigned
professional gets 404. Frontend: manual check only if a dev server is
reachable in this sandbox (prior phases found none — flag honestly if so,
don't skip silently).

```bash
git add backend/app/services/clinical_review/ web/components/clinical-review/ backend/tests/
git commit -m "feat(portal): add baseline-vs-current progress photo comparison"
```

---

### Task 4: Routine-overwrite backend — assignment-gated mutation endpoints

**Why:** zero routine-write capability exists for professionals today. This
is the rubric-graded live-sync flow's write side (P4-T2 already built the
read side's 30s poll). Reuses the exact same single-writer service functions
the user's own routine editor already calls — see this plan's "Architecture"
section above.

**Files:**
- Modify: `backend/app/services/clinical_review/router.py` (4 new endpoints)
- Modify: `backend/app/services/clinical_review/service.py` (thin
  assignment-gated wrappers, or call `service.verify_assignment` +
  `routines_service.*` directly from the router — choose whichever keeps the
  router thin and the service layer as the actual business-logic-adjacent
  layer, matching this file's existing style: `get_client_detail` already
  does the verify-then-delegate pattern in `service.py`, not the router, so
  follow that precedent)
- Test: same clinical-review test file

**Interfaces (mirroring `routines/router.py`'s existing shapes exactly, just
professional-scoped and assignment-gated):**
- `GET /api/v1/clients/{user_id}/routines/products/search?category=&q=` →
  `routines_service.search_products_for_edit(db, user_id, category, q)`
- `POST /api/v1/clients/{user_id}/routines/{routine_id}/steps` (body:
  `StepCreate`) → `routines_service.add_step(db, user_id, routine_id,
  step_name, product_id)`
- `PATCH /api/v1/clients/{user_id}/routines/steps/{step_id}` (body:
  `StepUpdate`) → `routines_service.update_step(db, user_id, step_id,
  step_name, product_id, usage_notes)`
- `DELETE /api/v1/clients/{user_id}/routines/steps/{step_id}` →
  `routines_service.delete_step(db, user_id, step_id)`

Each endpoint: verify assignment first (404 if not assigned), delegate to the
existing service function (propagate its existing `UnsafeProductError` →
400 and `ValueError` → 404, matching `routines/router.py`'s own error
handling exactly), then write one audit-log row via
`admin_service.write_audit_log` before returning.

- [ ] **Step 1: Read the existing patterns fully before writing**

Read `backend/app/services/routines/router.py` (already shown above) and
`backend/app/services/routines/service.py`'s `add_step`/`update_step`/
`delete_step`/`search_products_for_edit` signatures in full (confirm the
exact parameter order/types — this plan paraphrases them from an earlier
read, verify against the current file). Read
`backend/app/services/admin/service.py`'s `write_audit_log` signature
(already shown above: `actor_user_id`, `action`, `target_type`, `target_id`,
`metadata`) and confirm it's importable from `clinical_review` without
violating the single-writer rule (it's a shared utility function, not a
model/table import — check how `admin/service.py`'s own callers within other
services, if any exist, already do this, or confirm this is the first
cross-service caller and that's fine given it's explicitly a public write
path, not raw table access).

- [ ] **Step 2: Add the 4 endpoints to `clinical_review/router.py`**

Follow the exact error-handling shape `routines/router.py` already uses
(`UnsafeProductError` → 400, `ValueError` → 404) so a professional gets the
same safety-gate feedback a user editing their own routine would. Each
successful mutation writes an audit-log row, e.g.:

```python
await admin_service.write_audit_log(
    db,
    actor_user_id=professional["id"],
    action="routine_step_overwrite",
    target_type="routine_steps",
    target_id=str(step_id),
    metadata={"client_user_id": user_id},
)
await db.commit()
```

(Check whether `add_step`/`update_step`/`delete_step` already commit
internally — if so, the audit-log write needs its own `db.commit()` in the
same request rather than assuming one shared commit; read the service
functions' bodies to confirm before assuming either way.)

- [ ] **Step 3: Tests**

For each of the 4 endpoints: professional WITH a real assignment gets a
successful mutation (verify the change actually persisted, e.g. re-fetch the
routine and confirm the step is really added/updated/deleted); professional
WITHOUT an assignment gets 404 and the client's routine is confirmed
unchanged; an unsafe product swap (allergy/avoid-gated) still returns 400
exactly as it would for the user's own edit (reuse the same safety-gate test
fixtures Phase 2 already built if they're reusable, don't re-derive the
allergy-gate test setup from scratch). Confirm an audit-log row is written
for each successful mutation (query `AuditLog` directly in the test).

- [ ] **Step 4: Gates + commit**

```bash
cd backend && uv run pytest tests/test_clinical_review_router.py -v
uv run ruff check . && uv run mypy app
```

```bash
git add backend/app/services/clinical_review/ backend/tests/
git commit -m "feat(portal): add assignment-gated routine-overwrite endpoints, reusing the routines service"
```

---

### Task 5: Routine-overwrite frontend — shared editor + professional screen

**Why:** Task 4 built the backend; this task gives professionals a UI to use
it. Per this plan's Architecture section, reuse
`web/app/(user)/routine/edit/[routineId]/page.tsx`'s logic rather than
duplicating it — extract a shared `RoutineEditor` component parametrized by
which endpoints to call.

**Files:**
- Create: `web/components/routine-editor/routine-editor.tsx` (extracted
  shared component)
- Modify: `web/app/(user)/routine/edit/[routineId]/page.tsx` (thin wrapper
  around the shared component, passing the user's own endpoint paths)
- Create: a new professional-scoped edit route — check the real routing
  convention first (`web/app/consultant/` and `web/app/dermatologist/` are
  real folders per AGENTS.md §4's routing rules) — likely
  `web/app/consultant/clients/[userId]/routines/[routineId]/edit/page.tsx`
  and a dermatologist equivalent, or a single shared route if the app router
  structure allows a role-agnostic path reused by both role layouts (check
  how `client-detail-view.tsx` is itself already shared/reused across both
  role folders before deciding — follow whatever pattern it already
  established, don't invent a new one)
- Modify: `web/components/clinical-review/client-detail-view.tsx` (link to
  the new edit route per routine)

**Interfaces:**
- `RoutineEditorProps` — parametrize by a small set of endpoint-building
  functions or a `basePath`-style prop (e.g. `{ getRoutinesPath,
  searchProductsPath, addStepPath, updateStepPath, deleteStepPath,
  reorderPath }` or simpler, a single `clientUserId?: string` prop that the
  component uses to decide which of the two endpoint families to call —
  choose whichever keeps the diff smallest; read the full current
  `EditRoutinePage` implementation (already shown above) before deciding the
  exact extraction boundary).

- [ ] **Step 1: Extract the shared `RoutineEditor` component**

Move `EditRoutinePage`'s body (steps state, `isDirty`, `moveStep`/
`removeStep`/`addStep`/`updateSelected`/`discard`/`save`, the JSX for the
step list + editor panel + save bar) into
`web/components/routine-editor/routine-editor.tsx`, parametrized so it can
call either the user's own `/api/v1/routines/*` endpoints or the new
`/api/v1/clients/{user_id}/routines/*` endpoints depending on a prop. Keep
`ProductPicker` and `useDebouncedValue` as part of this same file/module
(they're pure UI helpers, not routing-specific). `web/app/(user)/routine/edit/[routineId]/page.tsx`
becomes a thin wrapper: fetch `routine`, render `<RoutineEditor
routine={routine} ... />` with the user's own endpoint config.

- [ ] **Step 2: Build the professional-scoped edit screen**

New route rendering the same `RoutineEditor`, fetching the client's routine
via `GET /api/v1/clients/{user_id}` (already real, `ClientDetailRead.routines`)
or a dedicated fetch if cleaner, configured to call Task 4's new
`/api/v1/clients/{user_id}/routines/*` endpoints instead. On save, invalidate
this professional's own query key AND leave the user's `routines`/`me` query
alone (that's the *other* user's TanStack Query cache, in a different
browser session — the live-sync proof is the poll P4-T2 already added, this
task doesn't need any special cross-session invalidation).

- [ ] **Step 3: Wire the link from the inspection view**

In `client-detail-view.tsx`'s "Skin profile & routine" card, add an "Edit
routine" button/link per routine, going to the new edit route.

- [ ] **Step 4: Gates + manual check + commit**

`cd web && npm run typecheck && npm run lint && npm run build`. Manual
dev-server check if reachable in this sandbox; flag honestly in the report
if not (matching every prior phase's disclosed environment constraint,
don't re-litigate it as a new discovery).

```bash
git add web/components/routine-editor/ "web/app/(user)/routine/edit/" web/app/consultant/ web/app/dermatologist/ web/components/clinical-review/
git commit -m "feat(portal): extract shared routine editor, add professional routine-overwrite screen"
```

---

### Task 6: States + a11y + fidelity pass

**Why:** same closing-gate pattern as every prior phase in this milestone.

**Files:**
- Create: `docs/milestones/milestone_3/build/p5-professional-portal-fidelity.md`
- Modify: `docs/milestones/milestone_3/M3R_TASK_LEDGER.md`,
  `docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md`

- [ ] **Step 1: Empty/error states**

Confirm: empty roster (professional with zero assigned clients) renders a
real empty state, not a blank table. An unassigned-client 403/404 attempt
(hit `GET /clients/{user_id}` for a real user_id NOT assigned to the calling
professional) surfaces a real error card on the frontend, not a silent
blank/crash — check `client-detail-view.tsx`'s existing error handling
already covers this (it should, per the code already shown above) or fix it
if it doesn't.

- [ ] **Step 2: A11y**

Check the new search input, photo-comparison selectors, and routine-editor
controls are real semantic elements (native `<input>`, `<button>`, shadcn
`Select`) with real keyboard operability — same static-read verification
method Phase 4 established, given no browser tool exists in this
environment.

- [ ] **Step 3: Live verification against the running stack**

As admin, assign a real seeded user to a consultant and a dermatologist
(reuse `clinical_review_service.create_assignment` directly via a script,
same pattern P4's fidelity pass used for direct service-layer verification).
As each professional: confirm the roster search actually filters, confirm
compliance metrics show real (not fabricated) values, confirm the analytics
timeline renders real data, confirm the photo comparison shows real photos
if the seeded user has any (upload one via `progress_service` directly if
none exist), confirm a routine-step edit via the new endpoint actually
persists (re-fetch and check) AND writes a real audit-log row. Cross-role
403/404 attempts pasted with real output. Document all of this in the new
fidelity doc, following the honest disclosure pattern
`p4-user-dashboard-fidelity.md` established — don't claim a visual/browser
check that wasn't possible.

- [ ] **Step 4: Wireframe comparison**

Check `consultant-client-detail.html`/`derm-patient-detail.html` (or whatever
the real file names are — confirm via Glob, don't assume) and their
reference screenshots for the photo-comparison and routine-overwrite
screens' visual structure, same as Phase 4's content-only comparison method
(view the reference PNGs directly, compare against the built component
props/structure).

- [ ] **Step 5: Full gate**

Backend: `cd backend && uv run pytest -q` (full suite, no `run_in_background`
— synchronous with a long timeout, matches every prior phase's real-suite
verification). Frontend: `cd web && npm run typecheck && npm run lint &&
npm run build`.

- [ ] **Step 6: Update ledger + docs, commit**

Mark M3R-P5-T1 through T5 `DONE` in `M3R_TASK_LEDGER.md` with real evidence.
Update `M3R_GAP_ANALYSIS.md` §4.2 to reflect the closed gaps.

```bash
git add docs/milestones/milestone_3/build/ docs/milestones/milestone_3/M3R_TASK_LEDGER.md docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md
git commit -m "docs(m3r): close P5 ledger rows - professional portal rebuilt to rubric spec"
```

---

## Verification (against the running stack, per the phase file)

As admin, assign a seeded user to both a consultant and a dermatologist. As
each professional: roster search actually filters to matching assigned
clients only → compliance metrics are real → inspection view's timeline
renders real score/adherence history → Baseline vs Current photo comparison
renders real photos with real captions → edit an evening treatment step via
the new form → confirm it persisted (re-fetch) and an audit-log row exists →
as the user, the dashboard's checklist (P4-T2's 30s poll) reflects the
revised step without a manual reload within that window. Cross-role 403/404
attempts pasted. All gates green.

## Exit

Manual self-review (no `gh`/PR, per this milestone's established decision) →
merge `feat/m3r-p5-professional-portal` to `dev` → delete branch →
`graphify update .` → `PROGRESS.md` entry.
