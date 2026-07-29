# P5 Professional Portal — fidelity & verification notes

Written during Task 6 (states/a11y/fidelity pass) of
`docs/superpowers/plans/2026-07-28-m3r-p5-professional-portal.md`. Follows the
same honest-disclosure convention `p4-user-dashboard-fidelity.md` established:
document what was actually verified against the running system versus what
this sandbox cannot verify — never claim done on unverified work.

## Environment constraints (same as P4, not re-discovered)

No browser/screenshot tool exists in this session. `docker-compose.yml`'s
`api`/`web` services are deliberately deferred to M4 (ADR-005) — the real dev
workflow runs `uv run uvicorn`/`npm run dev` as host processes. A live backend
WAS started for this task and used for real service-layer verification below;
pixel-level rendering and keyboard-interaction recording were not possible.

Neither seeded consultant/dermatologist test user
(`e2e-consultant-*`/`e2e-dermatologist-*`) has a `consultant_profiles`/
`dermatologist_profiles` verification row, so a full HTTP-authenticated
`require_verified_professional` walkthrough wasn't practical without first
standing up a verification flow unrelated to this phase's scope. Verification
was instead performed directly against the real service-layer functions
(`clinical_review_service.*`, `analytics_service.get_my_analytics`,
`progress_service.get_progress_photos`, `routines_service.update_step`,
`admin_service.write_audit_log`) against the real, running Postgres/Mongo
stack — the same functions the HTTP endpoints call with zero additional
logic in between (confirmed in each task's own review). This is the same
pragmatic method P4's fidelity pass used.

## Real-system verification actually performed

Using consultant `Z1uCXs1Ab57XabgDIhlKlbWp92r8a5Qt` and real client
`ewWJ2owds1XAWlUDgIzrZn7YOeXwzGVH` (real skin profile, 2 real scores, 4 real
routines) plus 7 pre-existing `demo-client-*` fixtures already assigned to
this consultant:

- **Task 1 (roster search + compliance)**: `list_my_clients` returned all 8
  real assigned clients with real varying `overall_score` values (79.99,
  75.05×5, 72.25); `compliance_seven_day`/`compliance_thirty_day` both `0.0`
  (correct — no routine completions logged in either window for this
  synthetic data, matching the same honest-zero-vs-fabricated-None
  distinction `get_compliance_percentages` already makes elsewhere). A
  non-matching search term (`"zzz_no_match"`) correctly returned `total=0`,
  confirming the search filter reaches the count query, not just the items
  list.
- **Task 2 (analytics timeline)**: `get_my_analytics` for the same client
  returned 2 real `score_vs_adherence` points, matching the exact count
  P4's fidelity pass found for this same user's own dashboard — confirms the
  professional-scoped endpoint and the user's own endpoint read the same
  underlying real data, not a divergent computation.
- **Task 3 (photo comparison)**: `get_progress_photos` for this client
  correctly returned `photos=[]`, `before=None`, `after=None` — the honest
  zero-photos empty state, not fabricated placeholders. (Task 3's own task
  review already independently verified the non-empty case with 2 real
  seeded photos via a backend test; this pass additionally confirms the
  empty case against a real, live client with genuinely zero photos.)
- **Task 4 (routine-overwrite backend) — the critical end-to-end check**:
  called `routines_service.update_step` directly with this client's real
  step id (27082), changing its `usage_notes` to a test string, then called
  `admin_service.write_audit_log` + `db.commit()` in the exact sequence
  Task 4's endpoints use (mutation commits first, audit row second) — then
  reverted the note. Queried `AuditLog` directly afterward and confirmed
  **exactly one** real row exists for that `action`/`target_id` pair. This
  is the strongest possible confirmation the commit-ordering correctness the
  Task 4 reviewer verified statically also holds when actually executed
  against live data, not just read from source.
- **Cross-role isolation**: called `get_client_detail` with a nonexistent
  professional id against the same real client — correctly raised
  `ValueError("This client isn't assigned to you")`, which every endpoint in
  this phase maps to a real 404 (confirmed in each task's own review, not
  re-derived here).

## A11y

Found and fixed one real, small gap during this pass: the roster's search
input (`web/components/clinical-review/client-list-table.tsx`) relied on
`placeholder` text alone with no `aria-label` — placeholder text isn't
reliably announced as a label by assistive tech once an input has a value.
Added `aria-label={`Search ${personLabel.toLowerCase()}`}`, matching the
existing dynamic placeholder text. `PhotoComparison`'s two `<img>` elements
already have real, specific `alt` text ("Baseline progress photo"/"Current
progress photo"), not empty/decorative alt or a generic "photo". The
routine-overwrite form's controls were already verified real (native
buttons/inputs, not synthetic click handlers) during Task 5's own review.

## Content-layout comparison (wireframes, viewed directly)

Checked `consultant-client-detail.png` and `derm-patient-detail.png`. Both
wireframes use a **tabbed** interface (Overview/Assessment Report/Progress/
Routine/Notes for consultant; Condition Report/History/Photos/Documents for
dermatologist) — the built `client-detail-view.tsx` instead stacks every
section vertically on one page. This is a pre-existing structural choice
from an earlier (M2-era) phase, not something P5 introduced or needs to
revisit — P5's new sections (analytics timeline, photo comparison) were
added as new cards in that same established vertical-stack convention,
consistent with everything already on the page.

Both wireframes also invent clinical-sounding fields with no backing model
anywhere in this repo — consultant's "Diagnostic Analysis"
(Hydration/Texture/Pigmentation/Elasticity/Sensitivity) and dermatologist's
"Affected Area Mapping"/"AI Insights"/"Risk Factor Index"/"Clinical Severity
Matrix" — already correctly identified and deliberately NOT reproduced by
`client-detail-view.tsx`'s own top-of-file comment (predates P5). P5's new
sections follow the same real-data-only discipline: the analytics timeline
and photo comparison show only real computed/uploaded values, nothing
invented.

## Honestly not verified in this sandbox

- Live browser rendering of either theme, or the new routes' actual pixel
  layout — no browser tool available.
- A full HTTP-authenticated walkthrough as a real verified
  consultant/dermatologist session (no verified test professional exists in
  the seed data; verified directly at the service layer instead, per above).
- The rubric's literal live-sync proof (professional edits a step → user's
  dashboard checklist reflects it within the poll window) end-to-end through
  two real separate browser sessions — verified only that the write path
  persists correctly and that the read side (P4-T2's 30s poll) exists; the
  actual two-session round trip needs a real browser and is deferred to P6's
  E2E spec, which is explicitly where the phase file says this gets
  exercised.

A human pass with a real browser, in both themes, against a fully seeded
verified professional account, is recommended before treating P5 as fully
shipped — flagged here rather than silently assumed, matching this
milestone's established practice.

## Final whole-branch review fix (post-dated addendum)

The phase spec (T2) unconditionally requires a "'Not medical advice'"
disclaimer on this view; this fidelity pass's own a11y/content checks above
never caught its absence because the plan's own Global Constraint had
softened that into "wherever AI-derived values ... are shown," which never
fired since `correlations` isn't rendered here. Fixed: added inline text
("AI-derived insights, not a clinical diagnosis.") near the skin-score/
progress-timeline card in `client-detail-view.tsx`, matching the existing
`ingredient-detail.tsx` pattern.
