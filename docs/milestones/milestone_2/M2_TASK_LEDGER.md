# M2 Task Ledger

Single live view per `MILESTONE_2_MASTER_PROMPT.md` §8. Pre-filled at P0 with every
phase's IDs, branch, and spec reference. Status vocabulary: `TODO` · `IN_PROGRESS` ·
`BLOCKED` · `DONE` · `DEFERRED`. Governing spec doc for every row: `MILESTONE 2.docx`
(confirmed canonical for this pack, `docs/DECISIONS.md` ADR-020 point 3) +
`MILESTONE_2_UI_SPEC.md` for UI structure/copy.

| ID | Phase | Task | Branch | Status | Spec ref | Notes |
|----|-------|------|--------|--------|----------|-------|
| M2-P00-T01 | P0 | Skill/plugin discovery | chore/m2-recon | DONE | Master prompt §4 | superpowers, ponytail, shadcn, ui-ux-pro-max, frontend-design, migrate-radix-to-base all AVAILABLE |
| M2-P00-T02 | P0 | Vision toolchain install + smoke test | chore/m2-recon | DONE | Master prompt §5.1 | tesseract 5.4.0 installed (winget), pillow/pytesseract/opencv/numpy/sklearn/imagehash installed; probe/grid/crop/ocr all verified |
| M2-P00-T03 | P0 | Diff `mile_2.docx` vs `MILESTONE 2.docx`, extract embedded images | chore/m2-recon | DONE | ADR-020 pt.3 | Confirmed two different documents; `MILESTONE 2.docx` is canonical for this pack |
| M2-P00-T04 | P0 | M2_GAP_ANALYSIS.md | chore/m2-recon | DONE | Master prompt §1 step 3 | 8 deliverable areas checked against live code |
| M2-P00-T05 | P0 | M2_API_CONTRACT.md | chore/m2-recon | DONE | Master prompt §1 step 4 | Reconciled with live `openapi.json` |
| M2-P00-T06 | P0 | Resolve C1-C7, write ADR-020/021 | chore/m2-recon | DONE | UI_SPEC.md §7 | C3 required a reversal after docx re-verification — see ADR-021 |
| M2-P00-T07 | P0 | This ledger | chore/m2-recon | DONE | Master prompt §1 step 5 | — |
| M2-P01-T01 | P1 | Measure design tokens (palette/sample/regions) on all 4 PNGs | feat/m2-design-system | TODO | UI_SPEC §1 | |
| M2-P01-T02 | P1 | UI_EXTRACTION.md with source-channel + confidence per value | feat/m2-design-system | TODO | UI_SPEC §0 | |
| M2-P01-T03 | P1 | Token layer in globals.css + themes.ts | feat/m2-design-system | TODO | UI_SPEC §1 | Extend existing Frosted Lab Glass tokens, don't fork |
| M2-P01-T04 | P1 | Score colour ramp helper | feat/m2-design-system | TODO | UI_SPEC §1.1 | |
| M2-P01-T05 | P1 | shadcn primitive audit + install missing | feat/m2-design-system | TODO | Master prompt §4 | |
| M2-P01-T06 | P1 | Token showcase route `(dev)/design-system` | feat/m2-design-system | TODO | Master prompt §5.2 | |
| M2-P02-T01 | P2 | Extend nav-config.ts to typed 4-role tree w/ subtitles+sections | feat/m2-role-sidebar | TODO | UI_SPEC §3 | Real gap — current config has no subtitles/sections (M2_GAP_ANALYSIS §8) |
| M2-P02-T02 | P2 | Extend existing RoleSidebar (not a new one) | feat/m2-role-sidebar | TODO | UI_SPEC §2 | `web/components/app-shell/app-sidebar.tsx` already exists — restructure |
| M2-P02-T03 | P2 | Topbar per role | feat/m2-role-sidebar | TODO | UI_SPEC §2.3 | |
| M2-P02-T04 | P2 | Server-side permission gating | feat/m2-role-sidebar | TODO | UI_SPEC §3 | `web/lib/permissions.ts` exists — extend |
| M2-P02-T05 | P2 | Stub pages for every nav route, zero href="#" | feat/m2-role-sidebar | TODO | UI_SPEC §3 | |
| M2-P02-T06 | P2 | Responsive + a11y pass | feat/m2-role-sidebar | TODO | UI_SPEC §6 | |
| M2-P03-T01 | P3 | Build 14-widget kit (12 net-new, 2 exist) | feat/m2-widget-kit | TODO | UI_SPEC §5 | Real gap — only routine-checklist-card.tsx, skin-score-trend-chart.tsx exist |
| M2-P03-T02 | P3 | Loading/empty/error states per widget | feat/m2-widget-kit | TODO | UI_SPEC §5 | |
| M2-P03-T03 | P3 | Showcase route + unit tests (ramp, %, en-IN) | feat/m2-widget-kit | TODO | Master prompt P3 | |
| M2-P04-T01 | P4 | web/lib/fixtures/ contract-shaped mocks | feat/m2-dashboards-user-admin | TODO | UI_SPEC §7 C7 | Directory doesn't exist yet |
| M2-P04-T02 | P4 | User dashboard 4-row layout | feat/m2-dashboards-user-admin | TODO | UI_SPEC §4.1 | Route exists, rebuild from P3 kit |
| M2-P04-T03 | P4 | Admin dashboard 4-row layout | feat/m2-dashboards-user-admin | TODO | UI_SPEC §4.4 | Wire KPI row through existing `web/app/api/admin/dashboard-stats` (M2_API_CONTRACT §4) |
| M2-P04-T04 | P4 | Fidelity checklist + tools/vision diff <2% | feat/m2-dashboards-user-admin | TODO | UI_SPEC §8 | |
| M2-P05-T01 | P5 | Consultant dashboard (5 KPI, 3-cell footer) | feat/m2-dashboards-clinical | TODO | UI_SPEC §4.2 | |
| M2-P05-T02 | P5 | Dermatologist dashboard (5 KPI, 4-cell footer, mixed-gender roster) | feat/m2-dashboards-clinical | TODO | UI_SPEC §4.3 | |
| M2-P05-T03 | P5 | Shared layout, role config (not copied pages) | feat/m2-dashboards-clinical | TODO | UI_SPEC §4.2/4.3 | |
| M2-P05-T04 | P5 | Fidelity checklist + tools/vision diff <2% | feat/m2-dashboards-clinical | TODO | UI_SPEC §8 | |
| M2-P06-T01 | P6 | skin_types.json (5 types incl. Normal, ADR-021 C1) | feat/m2-visual-datasets | TODO | MILESTONE 2.docx §A | Confirmed absent from repo |
| M2-P06-T02 | P6 | skin_concerns.json (10 concerns, ADR-021 C2) | feat/m2-visual-datasets | TODO | MILESTONE 2.docx §B | Confirmed absent from repo |
| M2-P06-T03 | P6 | Seed `skin_types` lookup table row for Normal | feat/m2-visual-datasets | TODO | ADR-021 C1 | Plain INSERT — not an enum migration, table is a lookup table |
| M2-P06-T04 | P6 | SVG assets under web/public/assets/{skin_types,concerns}/ | feat/m2-visual-datasets | TODO | ADR-021 C5 | Confirmed absent |
| M2-P06-T05 | P6 | Schema-validation pytest | feat/m2-visual-datasets | TODO | Master prompt P6 | |
| M2-P07-T01 | P7 | Extend skin_profile CRUD for docx-named fields | feat/m2-skin-profile | DONE | MILESTONE 2.docx §2 | Confirmed already covered (skin type, age, concerns, allergies, sensitivities); no rebuild needed |
| M2-P07-T02 | P7 | 4-tracker time-series models (14-day window) | feat/m2-skin-profile | DONE | MILESTONE 2.docx §2 | `lifestyle_logs` already covered all 4 trackers; added `list_lifestyle_logs_since(user_id, days)` for the real 14-day window (old `list_recent_lifestyle_logs` was row-count only) |
| M2-P07-T03 | P7 | Structured allergy list (ingredient ids, not free text) | feat/m2-skin-profile | DONE | MILESTONE 2.docx §2 | New `skin_profile_allergies` junction table (migration `e8c1b4020614`), ADR-026; frontend allergy field is now a real ingredient search (shadcn `combobox`) instead of a free-text tag input |
| M2-P07-T04 | P7 | /check-in daily entry page | feat/m2-skin-profile | DONE | UI_SPEC §3.1 | Added missing stress-level + sun-exposure sliders and a real 30-day sleep/hydration history (`TrendChart`) fed by `GET /lifestyle-logs/me` |
| M2-P08-T01 | P8 | Wizard steps 1-4 consuming P6 datasets | feat/m2-assessment-wizard | DONE | MILESTONE 2.docx §2 (Interactive Selection Flow) | Split concerns/severity into 2 real steps (was 1 combined page); skin-type + concerns now render P6's SVG/title/description via `datasetForSkinTypeName`/`datasetForConcernName`; radio/checkbox semantics with keyboard arrow-nav on both radiogroups (skin type, sun exposure) |
| M2-P08-T02 | P8 | Payload builder: concerns[] + flat-field compat (ADR-021 C4) | feat/m2-assessment-wizard | DONE | MILESTONE 2.docx §3 | `web/lib/assessment/payload.ts`; unit-tested against docx's worked example (`web/lib/__tests__/assessment-payload.test.ts`, 3 tests) |
| M2-P08-T03 | P8 | Submit to POST /api/v1/assessment/submit (fixtures until P14) | feat/m2-assessment-wizard | DONE | M2_API_CONTRACT §1 | Real backend endpoint doesn't accept this payload shape until P9 (§12 sequencing rule) — submits against `assessmentSubmitFixture` (`web/lib/fixtures/assessment-fixtures.ts`), a canned `ScoreRead`. Explicit product-owner choice over keeping the pre-existing real skin-profile/lifestyle-log save (AskUserQuestion, this session) — real downstream dashboard/routine/recommendations coverage moved to a directly-seeded profile in `user-journey.spec.ts` instead of walking the now-fixture-only wizard |
| M2-P09-T01 | P9 | Real POST /assessment/submit (not a bare rename — ADR-027) | feat/m2-assessment-api | DONE | M2_API_CONTRACT §1 | New `backend/app/services/assessment/` module; `/assessment/evaluate` untouched, still mounted alongside it |
| M2-P09-T02 | P9 | Flat-field adapter → concerns[] | feat/m2-assessment-api | DONE | ADR-021 C4 | `submit_assessment` derives `concerns[]` from nonzero flat fields when `concerns[]` is omitted |
| M2-P09-T03 | P9 | 422 validation for every field rule | feat/m2-assessment-api | DONE | MILESTONE 2.docx §"Core Backend API Endpoints" | Pydantic (severity/sleep/water/sun_exposure) + service-layer DB lookups (skin_type, concern id); fixed `app/core/errors.py` so list-valued `HTTPException.detail` reaches `details` structured |
| M2-P09-T04 | P9 | Concern prioritisation + risk-factor service functions | feat/m2-assessment-api | DONE | MILESTONE 2.docx §3 | `prioritize_concerns` (severity desc, stable-sort tie-break), `derive_risk_factors` — both pure, unit-tested |
| M2-P09-T05 | P9 | Regenerate openapi.json + api-types.ts | feat/m2-assessment-api | DONE | Master prompt §6 | `web/lib/api-types.ts`: +173/-0 lines |
| M2-P10-T01 | P10 | Add GET /api/v1/assessment/score/{id}, ownership-checked | feat/m2-scoring-engine | DONE | M2_API_CONTRACT §2 | `get_score_by_id` filters by `score_id`+`user_id` in one query; 404 for unknown/foreign id |
| M2-P10-T02 | P10 | **Change hydration benchmark 2.0L → 3.0L** | feat/m2-scoring-engine | DONE | ADR-021 C3 (reversed) | `constants.HYDRATION_BENCHMARK_LITERS`; ADR-028 |
| M2-P10-T03 | P10 | Skin Age derivation (ADR-021 C6) | feat/m2-scoring-engine | DONE | UI_SPEC §7 C6 | `derive_skin_age` + `representative_age_for_group` (ADR-028); `ScoreRead.skin_age` |
| M2-P10-T04 | P10 | Mandated Scoring Accuracy Test | feat/m2-scoring-engine | DONE | MILESTONE 2.docx §5 (QA) | Plus worst-case floor, per-weight share, 500-profile sweep, new-user A=100, determinism, constants module + grep |
| M2-P11-T01 | P11 | Verify AM/PM pipelines match docx canonical steps | feat/m2-routine-generator | DONE | MILESTONE 2.docx §3 | Real gap found (ADR-029) — old code used product categories as step labels, no canonical 6; new `routines/constants.py` |
| M2-P11-T02 | P11 | Safety guardrail layer (sensitive/redness>7 override) | feat/m2-routine-generator | DONE | MILESTONE 2.docx §3 | New `routines/guardrails.py` — distinct post-generation layer, replaces old candidate-pool-only exclusion |
| M2-P11-T03 | P11 | Mandated Safety Exclusion Test + Routine Output Test | feat/m2-routine-generator | DONE | MILESTONE 2.docx §5 (QA) | Plus application-order, double-cleanse-PM-only, soothing-substitution-replaces, no-config-disables-sunscreen tests |
| M2-P12-T01 | P12 | Suitability/interaction/allergy/education (extend, not rebuild) | feat/m2-ingredient-intelligence | TODO | MILESTONE 2.docx §5 | Router/service already exist (M2_GAP_ANALYSIS §4) — AGENTS.md's "lands M3" note is stale |
| M2-P12-T02 | P12 | Ingredient Analyzer + Ingredient Database frontend | feat/m2-ingredient-intelligence | TODO | UI_SPEC nav trees | Frontend route needs confirmation |
| M2-P13-T01 | P13 | Consolidate 3 mandated tests, named + docstring-cited | test/m2-qa-suite | TODO | MILESTONE 2.docx §5 | Tests exist under different literal names (M2_GAP_ANALYSIS §7) — rename/alias, don't rewrite coverage |
| M2-P13-T02 | P13 | Playwright journeys (wizard, 4 dashboards, permission negatives) | test/m2-qa-suite | TODO | Master prompt P13 | |
| M2-P13-T03 | P13 | Wire tools/vision diff+strings into CI | test/m2-qa-suite | TODO | Master prompt §5.6 | Toolkit built + smoke-tested this branch |
| M2-P14-T01 | P14 | Swap fixtures for live API calls, all 4 dashboards | feat/m2-integration | TODO | Master prompt P14 | |
| M2-P14-T02 | P14 | Seed data (screenshot cast names) | feat/m2-integration | TODO | Master prompt P14 | |
| M2-P14-T03 | P14 | M2_COMPLETION_REPORT.md | feat/m2-integration | TODO | Master prompt P14 | |
| M2-P14-T04 | P14 | Docs close-out (ARCHITECTURE, AI_ML, PROGRESS, openapi.json) | feat/m2-integration | TODO | Master prompt P14 | |

## Skill/plugin discovery result (M2-P00-T01)

| Skill/plugin | Status |
|---|---|
| superpowers | AVAILABLE (brainstorming, systematic-debugging, TDD, executing-plans, etc.) |
| ponytail | AVAILABLE (active this session, full mode) |
| shadcn | AVAILABLE (`.claude/skills/shadcn`, tracked in `skills-lock.json`) |
| ui-ux-pro-max | AVAILABLE (`.claude/skills/ui-ux-pro-max`) |
| frontend / frontend-design | AVAILABLE (`frontend-design:frontend-design`) |
| migrate-radix-to-base | AVAILABLE (`.claude/skills/migrate-radix-to-base`, tracked in `skills-lock.json`) |

None UNAVAILABLE.

## Vision toolchain smoke test (M2-P00-T02)

- `tesseract --version` → 5.4.0.20240606 (installed via winget this session; not
  previously present on this machine).
- Python deps (`pillow pytesseract opencv-python-headless numpy scikit-learn
  imagehash`) installed via `pip install --user`.
- `extract.py probe` on all 4 PNGs → 1536×1024, scale 1.0667, matches
  `VISION_CALIBRATION.md` exactly.
- `extract.py grid User.png --scale 1.0667` → sidebar 240px, gutter 17px, row
  widths `[292, 219, 237, 220, 202]` for row 1 — matches `VISION_CALIBRATION.md`
  byte for byte.
- `extract.py crop` + `ocr` on the User sidebar at 3× → all labels and 12px
  subtitles legible (89–96% confidence), 5 icon-bleed `suspect` lines exactly as
  `VISION_CALIBRATION.md` predicted.
- **Windows-only fix applied, not a rewrite:** the tool's own `→`/`⚠` output chars
  crash on the default Windows console codepage (cp1252) — fixed by setting
  `PYTHONUTF8=1` in the environment before invoking `extract.py`, not by editing
  the script (per "verify it runs, then use it").
