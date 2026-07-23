# M2 Gap Analysis — UI-Fidelity Pack (P0)

Written against the operating-contract resolution in `docs/DECISIONS.md` ADR-020: this
is a UI-fidelity + one endpoint-rename pass on top of a largely-complete backend, not a
from-scratch build, despite `MILESTONE_2_MASTER_PROMPT.md`'s P6–P12 phase prompts
reading as if nothing exists yet. Every line below is checked against the live repo
(file paths, `grep`, directory listings), not against `PROGRESS.md`'s or the new pack's
own claims — where they disagreed with what's actually on disk, the disk wins and the
disagreement is called out.

---

## 1. Skin profile management + lifestyle/sleep/hydration/environment tracking

**Exists.** `backend/app/services/skin_profile/{models,router,service,schemas}.py` —
profile CRUD, `lifestyle_logs`, concerns as `list[SkinProfileConcernInput]` with
`severity_rating` (not the docx's flat fields — see ADR-021 C4). Frontend: `/profile`
route, nav item present in `web/lib/nav-config.ts:70`.

**Gap:** nav label/subtitle don't match `MILESTONE_2_UI_SPEC.md §3.1` ("My Skin Profile"
/ "View & update your profile" — current config has no subtitle field at all, see §8
below). No code gap.

## 2. Skin assessment engine (concern identification, scoring, prioritisation, risk)

**Exists and tested.** `backend/app/services/scores/scoring_engine.py` — 5 sub-score
functions, `backend/tests/test_scores_service.py` (22 granular tests covering ideal-
profile and sensitive-skin-style scenarios, under different literal names than
`PROGRESS.md`/old `MASTER_PROMPT.md` quote — see §7 below, not a missing-test gap).

**Gap:** endpoint literal names. Current: `GET /api/v1/assessment/score`,
`POST /api/v1/assessment/evaluate` (`backend/app/services/scores/router.py`), both
routed to the same `compute_and_store_score` call. New pack's contract wants
`POST /api/v1/assessment/submit` + `GET /api/v1/assessment/score/{id}` — see
`M2_API_CONTRACT.md` and ADR-020 point 2. `score_id` already exists as a real PK
(`SkinScore.score_id`) with a `user_id, calculated_at` index, so a by-id lookup is a
small service addition, not new architecture.

**Real gap, confirmed by docx re-verification (ADR-021 C3, corrected after an
initial wrong pass):** `MILESTONE 2.docx` — not `mile_2.docx`, see ADR-020 point 3 —
is the actual governing spec for this pack, and it states the hydration benchmark
is **3.0L**, twice, explicitly. The live `scoring_engine.py:113` uses `/2.0` (2.0L).
This is a real P10 code change (2.0L → 3.0L), not a documentation correction.

## 3. Personalized routine generator (AM/PM, weekly, seasonal, adaptive)

**Exists, literally matches the docx already.** `GET /api/v1/routine`,
`POST /api/v1/routine/generate` (`backend/app/services/routines/router.py`) — no
rename needed, router's own comment cites the docx section. `test_routines_service.py`
covers the AM/PM category matrix and season logic (432, 498, 511).

**No gap.**

## 4. Ingredient intelligence (suitability, interactions, allergy detection, education)

**Exists — more built than `AGENTS.md`'s service table currently states.**
`backend/app/services/ingredients/{models,router,service,schemas}.py` all exist;
`AGENTS.md`'s table says "router lands M3" — that line is stale and should be
corrected in a later docs pass (not this branch's job; flagging here so it isn't
lost). `backend/tests/test_interactions.py` exists.

**Gap:** no dedicated ingredient-analyzer frontend route found under `web/app/`
(nav-config points `/ingredients` at a stub or the profile flow — needs P-phase
confirmation, not re-verified line-by-line in this recon pass).

## 5. In-built visual datasets + wizard UI

**Real gap.** `skin_types.json` / `skin_concerns.json` do not exist anywhere in the
repo (confirmed via repo-wide filename search). This is P6's actual, un-fabricated
work item — 5 skin types (4 docx-verbatim + Normal per ADR-021 C1) and 10 concerns
(4 docx-verbatim + 6 more per ADR-021 C2), plus `web/public/assets/{skin_types,
concerns}/` (also confirmed absent — ADR-021 C5).

**Wizard UI exists** — `web/app/assessment/{basics,concerns,lifestyle,skin-type,
results}` + `layout.tsx` — built without the JSON dataset (inline data instead);
P6/P8 wire the wizard to the new dataset files rather than building the wizard itself.

## 6. The three FastAPI endpoints (docx-literal)

| Docx endpoint | Live today | Status |
|---|---|---|
| `POST /api/v1/assessment/submit` | `POST /api/v1/assessment/evaluate` | **Renamed per ADR-020** |
| `GET /api/v1/assessment/score/{id}` | `GET /api/v1/assessment/score` (no id, "me" only) | **Extended per ADR-020** — add by-id lookup, ownership-checked |
| `POST /api/v1/routine/generate` | same | **Already matches** |

(`GET /api/v1/routine` is the docx's implied read model, also already matching.)

## 7. The three mandated pytest suites

**Exist in substance, not under the exact literal names `PROGRESS.md` and the old
`MASTER_PROMPT.md` quote.** No test named
`test_compute_and_store_score_is_perfect_for_an_ideal_profile` or a literally-named
"sensitive-skin safety test" exists — instead `test_scores_service.py` has 22 focused
tests (`test_skin_condition_score_clamps_at_zero`,
`test_hydration_score_caps_at_one_hundred`, etc.) covering the same scenarios more
granularly, and `test_routines_service.py` has the AM/PM/season matrix tests. This is
a **documentation-vs-code naming drift**, not a missing-test gap — the coverage exists
and passes (per `PROGRESS.md`'s dated verification entries); nothing here needs
building, only the docs' quoted names need correcting in a later pass.

## 8. The four role dashboards and sidebars

**Routes exist for all four roles**, and — contrary to what a from-scratch P2 phase
prompt implies — **one shared shell already exists**: `web/components/app-shell/
{app-shell.tsx, app-sidebar.tsx, glass-topbar.tsx, nav-user.tsx}`, driven by
`web/lib/nav-config.ts` + `web/lib/permissions.ts`. This is not a zero-to-one build;
it's a restructure.

**Real, large gap — this is the actual work of P1–P5:**
- `nav-config.ts` (165 lines) has **no subtitle field, no section grouping** (no
  MAIN MENU / QUICK ACTIONS / TOOLS & RESOURCES / SYSTEM & SECURITY), and materially
  fewer items per role than `UI_SPEC.md §3`'s transcribed trees (e.g. User has ~10
  flat items today vs. 11 + 3 quick-actions + a footer card in the new spec;
  Consultant/Dermatologist/Admin are similarly short several items and all missing
  subtitles). Several items are also flagged `built: false` (stub pages) already —
  consistent with the "no dead links, stub with empty state" rule the new phase
  wants, just not yet matching the new label set.
- **Dashboard widget kit is almost entirely unbuilt.** `web/components/dashboard/`
  has exactly 2 files (`routine-checklist-card.tsx`, `skin-score-trend-chart.tsx`)
  against the 14 shared widgets `UI_SPEC.md §5` / `MILESTONE_2_MASTER_PROMPT.md` P3
  specify (StatCard, ScoreRing, ScoreChip, DonutBreakdown, TrendChart,
  RankedBarList, RosterTable, TimelineList, ChecklistStrip, RoutineChain,
  ProductCarousel, InsightBanner, StatusTileGrid, QuickActionGrid). `web/components/
  charts/` — checked, effectively the same gap.
- `web/lib/fixtures/` **does not exist** — P4/P5's contract-shaped mock data (C7)
  is genuinely unbuilt.
- Admin already has a live read path worth reusing rather than re-inventing:
  `web/app/api/admin/dashboard-stats` exists — P4 should wire the Admin dashboard's
  KPI row through this rather than a fixture-only stub, once `M2_API_CONTRACT.md`'s
  shape is confirmed against it.

---

## Net summary

| Area | State |
|---|---|
| Skin profile + lifestyle tracking | Done |
| Assessment engine + scoring | Done; endpoint-rename + hydration-benchmark (2.0L→3.0L) gaps (P9/P10) |
| Routine generator | Done, no gap |
| Ingredient intelligence (backend) | Done (docs table stale) |
| Ingredient intelligence (frontend) | Needs confirmation (P8/P12) |
| Visual datasets (skin_types/concerns JSON + assets) | **Real gap — P6** |
| Assessment wizard UI | Exists, needs rewiring to new datasets |
| 3 FastAPI endpoints | 2/3 already docx-literal; 1 renamed per ADR-020 |
| 3 mandated pytest suites | Exist, different names than docs quote |
| Shared app shell | **Exists already — restructure, not rebuild** |
| Role nav trees (labels/subtitles/sections) | **Real gap — P2** |
| Dashboard widget kit (14 widgets) | **Real gap — P3** (2/14 exist) |
| Fixtures | **Real gap — P4/P5** |
| Vision toolkit (`tools/vision/`) | Exists, built, smoke-tested this phase |
