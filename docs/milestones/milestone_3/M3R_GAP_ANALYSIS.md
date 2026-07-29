# M3R Gap Analysis — Rubric vs Live Code (P0)

Written against `docs/milestones/milestone_3/MILESTONE 3.pdf` (the graded rubric) and
verified against the live repo on `feat/m3r-p0-gap-analysis` (branched from `dev`) —
file paths, `grep`, live pytest runs, not `PROGRESS.md`'s or the Master Prompt's own
claims. Where the Master Prompt's assumed repo state disagreed with what's actually on
disk, the disk wins and the disagreement is called out below. This table is the only
input P1-P6 use to scope work — **rows marked `none` are not touched.**

Docker compose stack (`postgres, mongo, redis, elasticsearch, minio, worker`) was
brought up and verified healthy this pass; backend suite is 507/507 green including all
12 MinIO storage tests (`backend/tests/test_storage.py`).

---

## 0. Master Prompt assumptions that turned out stale

| Assumed (Master Prompt §3 / §1) | Actual | Verdict |
|---|---|---|
| 5 MinIO tests failing, `InvalidAccessKeyId` | `.env` S3 creds already match `docker-compose.yml`'s MinIO creds; the failure was Docker Desktop being down, not a credential mismatch. All 12 storage tests pass now that the stack is up. | **Stale — closed, no code change needed.** |
| OpenWeather/OpenUV keys blank in root `.env` | Both keys are present and non-blank; `backend/app/integrations/base.py` has real timeout/retry/circuit-breaker, `weather/service.py` surfaces `AdapterError` rather than fabricating a fallback. | **Stale — closed, no code change needed.** |
| Deprecated aliases `/scores/me`, `/routines/me`, `/routines/generate` still mounted | Grepped every router; these paths don't exist. Only comments reference the old names historically. Real mounted paths: `/assessment/score`, `/assessment/evaluate`, `/routine`, `/routine/generate`. | **Stale — nothing to deprecate.** |
| bugs_report.md #3/#4 (age_group, notification bell) still open | Both fixed and merged (`a98aac4`, `631de83`) — confirmed in code, not just git log. | **Stale — already closed.** |
| ADR-010 outbox may not have landed | `backend/app/db/outbox.py` + `backend/app/worker/poller.py` are real; grep for direct ES/vector writes outside the worker returned zero hits. | **Confirmed real, matches ADR-010.** |
| `docker-compose.yml` missing `api`/`web` services | Confirmed still missing (6 services: postgres/mongo/redis/elasticsearch/minio/worker). | **Confirmed — expected, M4 scope per Master Prompt.** |

---

## 1. Ingredient Intelligence Engine (Rubric Step 1)

**Partially exists.** `backend/app/services/ingredients/{router,service,schemas}.py` is
real (not just a service layer, contrary to `AGENTS.md`'s stale "router lands M3" note
— that line should be corrected in P7 docs pass). Knowledge base is seeded
(`backend/app/db/seed.py:230-320`) with all seven rubric active classes. Allergy
matching with aliases is real (`app/ai/suitability.py`, synonym-aware).

**Real gaps (P1 scope):**
- Chemical conflict matrix (`app/ai/interactions.py`) is pairwise ingredient-name rules
  only — **no routine-step/time dimension** (rubric wants "same evening step" scoping).
  **Resolved during P1, no new table built:** the Safety Score endpoint's own request
  shape (`ingredient_ids` + one `routine_time` value) already scopes every submitted
  ingredient to one step by construction — every pairwise interaction found among them
  is inherently a same-step conflict. `routine_time` is recorded on the request but
  there's no separate per-pair, step-aware filtering logic to build on top of
  `app/ai/interactions.py`'s existing pairwise dict. See `M3R_API_CONTRACT.md` §1.
- **No Safety Score endpoint at all.** Closest is `GET /ingredients/interactions`
  (pairwise verdicts, no numeric 0-100 score or Safe/Warning/Unsafe label). This is the
  rubric's core Step-1 deliverable and must be built new, composing the existing
  suitability + interaction building blocks rather than reimplementing them.

## 2. Product Recommendation Engine (Rubric Step 2)

**Real, rubric-shaped, as of P2 (Tasks 1-9).** Every gap this section originally
flagged is now closed. What's actually live today:

- ~~Catalog categories seeded are `Cleanser, Moisturizer, Sunscreen, Treatment` —
  rubric's literal 7 are `Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment
  Products, Face Masks`.~~ **CLOSED (Task 2, T1):** all 7 rubric-literal categories
  mapped over real Sephora skincare catalog. Raw CSV: 8,494 total rows across all
  Sephora product lines (skincare, makeup, hair, fragrance, etc.); skincare-only
  ingest loaded 2,409 products across the 7 categories plus `uncategorized`. Live DB:
  Face Wash 219, Moisturizer 406, Serum 379, Treatment Products 356, Toner 79,
  Sunscreen 107, Face Masks 180, uncategorized 699 (2,425 total incl. 16 hand-seeded
  originals). Task 9 closed a follow-on leak: `uncategorized` was being served as an
  unintended 8th recommendation category from `GET /recommendations/me` — it's now
  hard-excluded from `served_by_category` (still browsable via `GET /products` with
  an explicit `category=uncategorized` filter; only the ranked-recommendation feed
  excludes it, per the rubric's literal 7).
- ~~Suitability weights are `0.35/0.25/0.15/0.10/0.10/0.05` across 6 hardcoded module
  constants — rubric needs exactly Concern 50% / Skin-Type Fit 35% / Rating 15%,
  config-driven.~~ **CLOSED (T3):** the real, live `recommendation_weights` table
  (migration `6d05f726e558`) seeds one active row at exactly 50/35/15 (CHECK sum =
  1.00), read via `get_active_recommendation_weights()` — no hardcoded module
  constants left in the ranking path.
- ~~No hard budget-cap filter on `GET /recommendations/me`; `/products/{id}/
  alternatives` left as a separate side call.~~ **CLOSED (T4):** `max_price` on
  `GET /recommendations/me` hard-flags any top match over the cap
  (`over_budget: true`) and inlines the cheapest same-category, safety-gated
  alternative alongside it via `alternative_for_product_id` — no separate endpoint
  call needed for the budget flow. (`/products/{id}/alternatives` still exists
  separately for the product-detail page's own "similar products" use case, now
  also allergy-gated per Task 9 — see below.)
- ~~`match_score` is a raw float, not literally the "94% Match" display shape.~~
  **CLOSED (T5):** renamed to `match_percentage`, an integer 0-100.
- **Task 9 safety-gate closure:** the hard allergy filter
  (`evaluate_products_suitability(...).any_allergy`) that the main
  `GET /recommendations/me` ranking path and the Task 8 budget-cap-alternative path
  both already enforced was **not** reachable from routine generation
  (`_generate_steps`), manual routine step add/update
  (`_assert_product_is_safe`), the routine step-swap search
  (`search_products_for_edit`), or the product-detail "alternatives" endpoint
  (`get_alternatives`) — pre-existing gaps, only reachable once Task 7 gave
  routines a real 665+-product candidate pool instead of 16 hand-seeded ones. All
  four now run the same `evaluate_products_suitability` check the recommendation
  pipeline uses, over the same avoid-junction-narrowed candidate pool, before any
  product reaches the user. TDD-verified: the first version of 2 of the 3 new
  routine tests passed even without the fix (a 137-candidate real Moisturizer pool
  made the unsafe pick too rare to reliably trigger, and a `[:10]`-truncated search
  result sorted the freshly-inserted unsafe product past the cap by `product_id`)
  — both were rewritten to be deterministic (an RNG-forcing monkeypatch; a
  unique-name search query) before being trusted as real regression coverage.
- **Known, honest coverage gap (not a bug):** Sensitive-skin recommendations still
  draw effectively only from the original 16 hand-seeded products. The real
  Sephora `highlights` column (the only field `parse_highlights` maps to
  `skin_types`/`skin_concerns`) has no phrase that maps to "Sensitive" in the real
  dataset's actual value distribution (`_SKIN_TYPE_HIGHLIGHT_MAP` in
  `admin/ingest/products.py` — six real phrases, none naming Sensitive skin) — so
  none of the 2,409 real ingested products ever get a `product_skin_types` row for
  Sensitive. Not fabricated/guessed around (AGENTS.md §0.2); flagged here as a real,
  known data-coverage limitation rather than silently left undocumented.

## 3. Progress Tracking & Cloud Photo Pipeline (Rubric Step 3)

**Fully exists (P3 tasks 1-4 closed).** AM/PM check-in logging in Mongo is real
(`routines/service.py::toggle_step_completion`/`get_completed_step_ids`, `routine_logs`
collection). Photo upload pipeline is real and live-verified (`core/storage.py` —
private bucket, presigned URLs, EXIF-stripped, content-type sniffed).

**Formerly real gaps (all now closed, P3-T1–T4):**
- ~~Adherence math only computes 7-day and 30-day windows~~: **CLOSED (T2, commit
  b78c0f6).** Added `get_compliance_percentages` (7/30/90-day completed/assigned
  ratios). **But the more significant fix in T2 was the underlying bug:** previous
  `get_adherence_series` judged every historical day against the *currently active*
  routine's steps, silently misjudging any day before a mid-window regeneration (e.g.
  dermatologist overwrite, reassessment). The fix adds
  `list_historical_active_step_ids` (per-day lookup against whichever routine of each
  type was active as of that day; soft-deactivated routines are never deleted so
  remain queryable), and rebuilds adherence math on top of it. This is what "assigned
  counts follow what was assigned each day" (MILESTONE 3.pdf Step 3) actually means in
  practice — a correctness fix, not just a window-count addition.
- ~~`ProgressImage` has no score-at-upload, `image_stage` unreachable from client~~:
  **CLOSED (T3, commit 5ce97b6).** Migration `fc93ac5cf2d4` adds `skin_health_score_at_upload`
  column; `POST /progress/photos` now accepts `tag` parameter (first photo auto-tags
  "Baseline", subsequent compute "Week N" from weeks-since-baseline, user-supplied
  value wins over default).
- ~~Analytics endpoint missing photo links~~: **CLOSED (T4, commit 1b11963).** `GET
  /analytics/me` now returns `photos` array (progress_image_id, image_stage,
  uploaded_at, skin_health_score_at_upload, url) merged into the score_timeline +
  compliance response. Single endpoint serves the rubric's "score timelines, compliance
  %, and progress photo links" together for charting/comparison.

## 4. Frontend Dashboards (Rubric Step 4)

**User dashboard (4.1): closed in P4.** Score gauge now carries the real 5 weighted
sub-score mini-bars (`skin-score-ring.tsx`'s optional `subScores` prop), the AM/PM
checklist (`ChecklistStrip`, the dashboard's real interactive toggle — not
`RoutineChecklistCard`, which is check-in-only) gained a 30s poll for future P5
live-sync, the trend chart was rebuilt on
Chart.js as `ScoreAdherenceChart` (fed only by `GET /analytics/me`, dual score+adherence
series, literal 7/30/90-day windows — `trend-chart.tsx` itself deliberately left alone,
still serving 4 other Recharts consumers with an incompatible shape), and the
recommendations shelf now shows literal match %, ingredient tag chips, and a budget
flag. Full evidence: `M3R_TASK_LEDGER.md`'s P4-T1..T5 rows and
`docs/milestones/milestone_3/build/p4-user-dashboard-fidelity.md`.

**New finding from P4's fidelity pass:** `web/designs/wireframes/app-dashboard.html`/
`.png` (the file used as the User Dashboard's visual source of truth through this
entire phase) actually has a "Clinical Portal"/"Dr. Sarah Chen" header and a 4-item nav
matching none of AGENTS.md §4's four locked role navs — while its body content (score
ring, routine checklist, score-history chart, recommendations carousel) matches the real
User Dashboard closely. Confirmed `derm-dashboard.png` is a genuinely different screen,
not a duplicate — this looks like a pre-existing Stitch extraction/mislabeling artifact
(the exact risk `.agents/rules/skinlytics-stitch.md` warns about), not something
introduced this phase. The Stitch MCP server was not reachable this session, so
re-extraction couldn't happen; the owner chose to proceed on a content-only comparison
for P4 and defer re-extraction to a future session. **Follow-up needed:** once Stitch is
reachable again, re-fetch the correct "Dashboard" screen from the Skinlytics Stitch
project (ID `933192060480910018`) and replace `app-dashboard.html`/`-dark.html` + their
reference screenshots if the correct screen differs structurally.

Every task in P4 was also constrained by having no browser/screenshot tool available in
this environment (`docker-compose.yml`'s `api`/`web` entries are deliberately deferred to
M4, ADR-005 — the real dev workflow runs host processes, not containers) — pixel/visual
diffing and live keyboard-navigation recording were not possible for any task this
phase, honestly flagged rather than faked. A human browser pass in both themes is
recommended before treating P4 as fully shipped.

**Consultant/Dermatologist portal (4.2): closed in P5.** Roster search + 7/30-day
compliance metrics, an analytics/adherence timeline on the inspection view, real
Baseline-vs-Current photo comparison (reusing `progress_service.get_progress_photos`'s
already-computed before/after pair), and 4 assignment-gated routine-overwrite endpoints
(reusing the exact same `routines_service` functions the user's own editor calls, with
real audit-log attribution) are all now real. Full evidence:
`M3R_TASK_LEDGER.md`'s P5-T1..T5 rows and
`docs/milestones/milestone_3/build/p5-professional-portal-fidelity.md`.

**One scoped omission, judged correct, not a gap:** no client-scoped step-reorder
endpoint exists — this phase's own rubric bullet (`phases/phase_5_professional_portal.md`
T4) only names "add/remove/edit AM/PM steps," never reordering. The professional's routine
editor hides reorder controls rather than wiring them to a nonexistent endpoint (a real,
correctly-scoped UI decision, not a silently broken feature).

**Same category, a second instance:** the phase spec's T3 bullet also names "a selector
to compare any two tagged photos," but the graded rubric itself
(`milestone_3_Master_prompt.md`) only says "side-by-side **Baseline vs Current** photos" —
no selector requirement. `PhotoComparison` was built as the server-computed Baseline/
Current pair only, no selector, which matches the actual graded wording rather than the
phase spec's elaboration of it — the same defensible phase-spec-vs-graded-rubric
simplification as the reorder omission above, just not documented until this review.

These two gaps (photo comparison, routine-overwrite) were the last blockers on Step 5's
E2E walkthrough — P6 can now build the full assessment→recs→check-off→photo→derm
inspects+edits→user sees live update spec.

## 5. Testing & Verification (Rubric Step 5) — closed in P6

All three rubric-named test classes now solidly covered: chemical-clash detection
(`test_interactions.py`), allergy filtering (`test_suitability.py` +
`test_recommendations_service.py`), and adherence formulas exact on fixtures —
7/30/90-day, mid-window routine change, and day boundary
(`test_progress_service.py`).

The rubric's literal E2E walkthrough now exists as
`web/tests/e2e/m3-rubric-walkthrough.spec.ts` (assessment → recommendations →
check-off → photo upload → dermatologist inspects + edits → user sees the live
update, both themes, 3× flake-checked) plus
`web/tests/e2e/m3-persistence-after-restart.spec.ts` (DB-level persistence across
a real `worker` container restart — see `M3R_TASK_LEDGER.md`'s P6-T3 row for why
the backend API process itself is out of scope for an in-sandbox restart proof;
deferred to a real deployment environment).

The full-gate run itself surfaced and closed 4 more real, previously-undetected
bugs across the whole stack — 2 real UI layout bugs (a fixed save-bar overflowing
the viewport; topbar widgets colliding with the sidebar's own breakpoint) and 2
real pre-existing test-suite bugs (an ambiguous ingredient-search locator; a
cleanup-helper FK-ordering race with a live background poll) — see
`M3R_TASK_LEDGER.md`'s P6-T2/T4 rows for the full detail on each.

---

## Decisions already recorded this session (owner confirmed, not defaults)

1. **Chart library:** switch P4/P5 dashboard charts from the locked Recharts default to
   **Chart.js or Plotly**, matching the rubric's literal wording. This is a deviation
   from `AGENTS.md` §4's locked stack — record as an ADR in `docs/DECISIONS.md` during
   P7 (or earlier, at P4 kickoff). Implementation choice between the two (prefer
   whichever avoids adding a net-new dependency) is deferred to P4.
2. **Cloud storage naming:** the existing MinIO (S3-compatible) adapter in
   `core/storage.py` is accepted as satisfying the rubric's "AWS S3 or Azure Blob"
   requirement — no live AWS/Azure bucket needed. Document the env-var-swap story in
   the P3 phase report.
3. **Working tree cleanup:** the pre-existing uncommitted doc deletions (superseded
   `docs/superpowers/plans/*.md` QA-pass plans, old `milestone_3.md`/
   `milestone_3_prompt.md`) were committed as P0 setup (`bd145e2`).

No endpoint-literal-naming conflict was found this pass (unlike M2) — the Step 1
Safety Score endpoint and Step 2/3/4 gaps are genuinely new-build or rework items, not
a case of the code already doing the same thing under a different name. They're scoped
as build work in P1-P5, not raised as a conflict needing precedence resolution.
