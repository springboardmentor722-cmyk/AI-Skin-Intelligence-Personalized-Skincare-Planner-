# Milestone 2 — Completion Report

Per `MILESTONE_2_MASTER_PROMPT.md` P14's close-out requirement: every `mile_2.docx`
requirement mapped to the code, tests, and screenshots that satisfy it, plus every
deferred item with a reason and a proposed home. Governing spec doc:
`docs/milestones/milestone_2/mile_2.docx` / `MILESTONE 2.docx` (the latter is
canonical for this pack — `docs/DECISIONS.md` ADR-020 point 3). Full phase-by-phase
detail lives in `docs/DECISIONS.md`'s ADR-020 through ADR-032 and
`docs/milestones/milestone_2/M2_TASK_LEDGER.md`; this report is the summary those
feed into, not a replacement for either.

## 1. Requirement → implementation map

| `mile_2.docx` requirement | Phase(s) | Code | Tests | Screenshots |
|---|---|---|---|---|
| §2 Skin Profile Management (skin type, age group, concerns, allergies/sensitivities, lifestyle habits, sleep quality, water intake) | P7 | `backend/app/services/skin_profile/` (structured `skin_profile_allergies` junction, ADR-026); `web/app/profile`, `web/app/check-in` | `backend/tests/test_skin_profile_service.py`, `test_skin_profile_router.py` | `docs/milestones/milestone_2/build/user-dashboard.png` (profile card) |
| §3 Skin Assessment Engine (concern identification, scoring, prioritization, risk factors) — survey-based | P6, P9, P10, P14 | `backend/app/services/assessment/` (P9, ADR-027), `backend/app/services/scores/scoring_engine.py` (P10, ADR-028); wizard wired to the real endpoint as of P14 (ADR-032) | `backend/tests/test_assessment_service.py`, `test_scores_service.py`, `test_openapi_contract.py` | `web/tests/e2e/assessment-wizard.spec.ts` real run |
| §4 Personalized Routine Generator (AM/PM, weekly, seasonal, adaptive, safety guardrails) | P11 | `backend/app/services/routines/{constants,guardrails,service}.py` (ADR-029) | `backend/tests/test_routines_service.py` (incl. mandated Safety Exclusion Test + Routine Output Test) | n/a (no dedicated routine-plan screenshot in the 4-dashboard set) |
| §5 Ingredient Intelligence (suitability, interaction analysis, allergy detection, education) | P12, P14 | `backend/app/services/ingredients/`, `app/ai/{suitability,interactions,ingredient_synonyms}.py` (ADR-030); `web/app/(user)/ingredients`, shared `web/components/ingredients/` for consultant/dermatologist/admin | `backend/tests/test_ingredients_service.py`, `test_openapi_contract.py`; `web/tests/e2e/ingredient-intelligence-p12.spec.ts` | n/a |
| Datasets — `skin_types.json`/`skin_concerns.json`, exact shape | P6 | `web/lib/assessment/{skin-types,skin-concerns}.json` + SVGs under `web/public/assets/` | `backend/tests/test_visual_datasets.py` (schema validation) | Assessment wizard steps |
| Deliverable 1 — Visual dataset & wizard UI | P8, P14 | `web/app/assessment/*` (single-select type → multi-select concerns → severity sliders → lifestyle) | `web/tests/e2e/assessment-wizard.spec.ts` (full happy path, validation blocks, back-nav/refresh state survival — real backend as of P14) | n/a |
| Deliverable 2 — Weighted scoring engine (0.35/0.20/0.15/0.20/0.10) | P10 | `backend/app/services/scores/{constants,scoring_engine}.py` | Mandated **Scoring Accuracy Test** + worst-case floor + per-weight-share + 500-profile sweep + determinism (`test_scores_service.py`) | User dashboard Skin Health Score ring |
| Deliverable 3 — Dynamic routine generator + safety guardrails | P11, P12 | `backend/app/services/routines/guardrails.py` (sensitivity + sunscreen, P11; interaction, P12) | Mandated **Safety Exclusion Test** + **Routine Output Test** + interaction-conflict regression (`test_routines_service.py`) | n/a |
| Deliverable 4 — Core backend API endpoints (`POST /assessment/submit`, `GET /assessment/score/{id}`, `POST /routine/generate`) | P9, P10, P11, P13 | `backend/app/services/{assessment,scores,routines}/router.py` | `test_openapi_contract.py` — real HTTP round trips validated against the exact response models that generate `openapi.json` | n/a |
| Deliverable 5 — Automated testing & QA (pytest) | P13 | — | Three mandated suites named + `mile_2.docx §5` docstring-cited (ADR-031); `.github/workflows/e2e-ci.yml` | n/a |
| 4 role dashboards (User/Consultant/Dermatologist/Admin) | P1–P5, P14 | `web/app/{(user),consultant,dermatologist,admin}/dashboard/` + `web/components/dashboard/`, `web/components/clinical-review/clinical-dashboard.tsx` (fully real as of P14, ADR-032) | `web/tests/e2e/{admin-dashboard-p4,clinical-dashboard-p5,role-sidebar-labels}.spec.ts` | `docs/milestones/milestone_2/{User,Admin,Consultant,Derma}.png` (source) vs `build/*.png` (live-data build) |
| Live integration (fixtures → real API calls, seed data, full-stack verification) | P14 | See §2/§3 below | Full Playwright suite, full pytest suite | `build/*.png`, `build/diff-*.png` |

## 2. What's real vs. deliberately still fixture

Per `docs/DECISIONS.md` ADR-023/024/032 — every fixture remaining after P14 is a
named, individually-justified gap, not an oversight:

| Screen / cell | Status | Reason |
|---|---|---|
| Admin: Platform Revenue, System Uptime, Assessments Overview donut, User Growth chart, Platform Analytics | Fixture | No billing/payments system, no uptime monitor, no multi-stage assessment workflow, no day-bucketed Better-Auth growth endpoint, no web-analytics instrumentation exist anywhere in this app — building any of these is new system scope for M3/M4, not a fixture swap (ADR-023). |
| Consultant/Dermatologist: "Upcoming Follow-ups" card + 5th KPI | Honest empty state, not fixture | No scheduling/appointment concept exists anywhere in `database_schemas/` — inventing one was out of scope (AGENTS.md §0.2). Proposed home: a real Notification/Reminder service build-out (M3–M4, `docs/ARCHITECTURE.md` §4 service #9). |
| Everything else on all four dashboards, the assessment wizard, and the ingredient pages | Real | Wired to real backend endpoints, verified against real seeded data (§3). |

## 3. Full-stack verification (P14)

- **Seed data:** `python -m app.db.seed` (idempotent) seeds the ingredient/product
  catalog, 7 named demo clients (Ananya Verma, Priya Sharma, Meera Iyer, Rohit
  Sharma, Kavya Nair, Riya Singh, Neha Gupta — real skin profiles, 4 real score
  points spanning ~21 days, real generated routines), and assigns all 7 to every
  currently-existing consultant/dermatologist account.
- **Backend gates:** `ruff check` clean, `ruff format --check` clean, `mypy app`
  clean (139 files), `pytest -q` — 492 passed, 0 failed (up from 458 at P11).
- **Frontend gates:** `tsc --noEmit` clean, `eslint` 0 errors (2 pre-existing
  unrelated warnings), `next build` clean.
- **Playwright:** full suite run against the live backend + fresh seed data — see
  the phase report for the exact pass count; the curated e2e-ci.yml subset
  (assessment wizard, all 4 dashboards + sidebars, role-permission negatives,
  profile/check-in) is what CI gates on.
- **Contract:** `web/lib/api-types.ts` (the real committed artifact —
  `/openapi.json` is deliberately gitignored, see ADR-032) regenerated and
  current against the live spec; `test_openapi_contract.py`'s three real
  HTTP-round-trip tests pass. No schema change this phase.
- **Fidelity re-check:** `tools/vision/extract.py diff --structural --max-pct 8` /
  `strings` re-run against the live-seeded dashboards — report-only, not a gate
  (ADR-031's reasoning: the measured ~87-90% structural mismatch against the
  fixed, AI-generated marketing mockups is a permanent, by-design consequence of
  real data + a simpler real component system, not a regression).

## 4. Deferred items — proposed home

| Item | Why deferred | Proposed milestone |
|---|---|---|
| Image/scan-based (CV) Skin Assessment | Never part of M2's survey-based scope; `docs/ARCHITECTURE.md` §4 row #3 describes it separately from the real, shipped survey assessment (ADR-032's footnote) | M3–M4 |
| Notification, Analytics, Report services | Planned services #9–11, not yet built | M3–M4 |
| Admin Platform Revenue / System Uptime / Assessments Overview / User Growth / Platform Analytics | No backing system (§2 above) | M3–M4, each needs its own real system first |
| Consultant/Dermatologist scheduling ("Upcoming Follow-ups") | No appointment concept in the schema (§2 above) | M3–M4, alongside Notification service |
| Weekly-calendar-bucketed portfolio score trend (currently point-indexed, ADR-032) | Real assigned clients rarely share assessment dates at this data scale | Revisit once portfolios are large enough for meaningful weekly buckets |
| `tools/vision` visual-regression as a hard CI gate | Source PNGs are a fixed marketing mockup; real data + the real component system can't honestly hit a single-digit mismatch against it (ADR-031) | Only meaningful again with a *built* baseline screenshot, not the original mockup |

## 5. Git history

One `--no-ff` merge commit per phase on `dev`, strictly local (no `git push`/
`fetch`/`remote` ever run this milestone) — confirmed via `git log --merges` and
`git status` clean before every merge. `main` untouched throughout.
