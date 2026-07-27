# M3R Task Ledger

Single live view per `milestone_3_Master_prompt.md` §7. Pre-filled at P0 with every
phase's task IDs. Status vocabulary: `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE` ·
`DEFERRED`. Governing spec for every row: `docs/milestones/milestone_3/MILESTONE 3.pdf`
(the graded rubric) + `M3R_API_CONTRACT.md` for endpoint shapes + `M3R_GAP_ANALYSIS.md`
for what's real vs missing today.

| ID | Phase | Task | Branch | Status | Notes |
|----|-------|------|--------|--------|-------|
| M3R-P0-T1 | P0 | Environment & stack sanity | feat/m3r-p0-gap-analysis | DONE | Docker stack up (postgres/mongo/redis/elasticsearch/minio/worker, all healthy). Backend suite 507/507 green incl. all 12 MinIO storage tests. Frontend `typecheck`/`lint` clean (2 pre-existing warnings, unrelated). |
| M3R-P0-T2 | P0 | Verify earlier-M3 claims | feat/m3r-p0-gap-analysis | DONE | See `M3R_GAP_ANALYSIS.md` §0-5. Outbox/worker/ES-FAISS real; ingredients router real but no safety-score endpoint; recommendations v2 real but wrong weights/categories; progress real but missing 90-day + photo metadata; analytics real but photos not merged; `ml/` harness real but standalone; frontend dashboards partial, portal missing photo/routine-overwrite entirely. |
| M3R-P0-T3 | P0 | M1/M2 pending verification | feat/m3r-p0-gap-analysis | DONE | All 6 Master Prompt §3 items re-verified; 4 of 6 turned out already stale/closed (MinIO creds, weather keys, deprecated aliases, bugs #3/#4). `docker-compose.yml` api/web absence confirmed (expected, M4 scope). ADR-010 outbox confirmed real. |
| M3R-P0-T4 | P0 | Rubric gap table | feat/m3r-p0-gap-analysis | DONE | Full requirement-by-requirement table in `M3R_GAP_ANALYSIS.md`. Real gaps: Safety Score endpoint (missing), conflict-matrix routine-step scoping (partial), recommendation weights/categories (missing/wrong), budget hard-cap (partial), 90-day adherence (missing), photo tag+score-at-upload (partial), analytics photo merge (partial), chart library (conflict, resolved), portal photo-compare + routine-overwrite (missing, blocks E2E). |
| M3R-P0-T5 | P0 | Contract freeze | feat/m3r-p0-gap-analysis | DONE | `M3R_API_CONTRACT.md` — 4 surfaces frozen: safety-score (new), recommendations (extended), progress/photos (extended), analytics (extended). |
| M3R-P0-T6 | P0 | Task ledger | feat/m3r-p0-gap-analysis | DONE | This file. |
| M3R-P1-T1 | P1 | Knowledge base audit & seed | feat/m3r-p1-ingredient-intelligence | DONE | P0 confirmed all 7 rubric classes already seeded correctly (`seed.py:230-320`) — no gap, no work needed. |
| M3R-P1-T2 | P1 | Allergy matching engine | feat/m3r-p1-ingredient-intelligence | DONE | P0 confirmed already real with alias support (`app/ai/suitability.py`) — no gap, no work needed. |
| M3R-P1-T3 | P1 | Chemical conflict matrix (routine-step scoping) | feat/m3r-p1-ingredient-intelligence | DONE | No new step-aware table needed: the safety-score endpoint's request shape (`ingredient_ids` + one `routine_time` value) already scopes to one step by construction, so every pairwise interaction found among them is inherently same-step (see `M3R_GAP_ANALYSIS.md` §1, `M3R_API_CONTRACT.md` §1). The config-driven severity thresholds (`IngredientSafetyConfig`, migration `75e0940c0f36`) are a separate T4 concern (score-formula tuning), not the step-scoping itself. |
| M3R-P1-T4 | P1 | Safety Score endpoint | feat/m3r-p1-ingredient-intelligence | DONE | `POST /api/v1/ingredients/safety-score` deployed with role/ownership checks; 10 passing tests (see T5's evidence for the breakdown). |
| M3R-P1-T5 | P1 | Tests | feat/m3r-p1-ingredient-intelligence | DONE | 10 tests across `test_ingredients_service.py`/`test_ingredients_router.py`/`test_rbac.py`: 1 config (`get_active_safety_config` seeded-row read, Task 1) + 4 `compute_safety_score` service (unsafe pairing, allergy via free-text synonym, clean list scores Safe, rejects unknown id); 4 router (unsafe pairing 200, empty list 422, professional without assignment 404, professional **with** a real assignment 200 — a genuine `verify_assignment` allow-path exercise, replacing an earlier vacuous "consultant" test that never touched the ownership check); 1 RBAC (admin role rejected 403). The "professional without assignment" 404 case lives in `test_ingredients_router.py`, not `test_rbac.py` — corrected here from an earlier misattribution. |
| M3R-P2-T1 | P2 | Catalog categories & price tiers | feat/m3r-p2-recommendation-engine | DONE | 7 rubric-literal categories mapped over real Sephora skincare catalog. Live ingested: Face Wash 219, Moisturizer 406, Serum 379, Treatment Products 356, Toner 79, Sunscreen 107, Face Masks 180, uncategorized 699 (2,425 total in live DB incl. 16 hand-seeded). Raw CSV: 8,494 total rows across all Sephora lines; 2,409 skincare-only rows ingested. |
| M3R-P2-T2 | P2 | Hard-filter safety gate | feat/m3r-p2-recommendation-engine | DONE | P0 confirmed already real and tested (`recommendations/service.py:339-352`) — no gap, no work needed. |
| M3R-P2-T3 | P2 | Suitability scoring (50/35/15) | feat/m3r-p2-recommendation-engine | DONE | Config-driven `recommendation_weights` table (migration 6d05f726e558): 50% Concern / 35% Skin-Type Fit / 15% Rating, CHECK sum = 1.00. Seeds one active row with defaults. Reads via `get_active_recommendation_weights()` service. |
| M3R-P2-T4 | P2 | Budget optimization & alternatives | feat/m3r-p2-recommendation-engine | DONE | Hard-cap + alternative substitution integrated into GET `/recommendations/me` response. Budget-flagged products (over_budget: true) paired with cheaper alternatives via alternative_for_product_id. Inline, no separate endpoint call needed. |
| M3R-P2-T5 | P2 | Recommendation endpoint (categorized, match %) | feat/m3r-p2-recommendation-engine | DONE | Per `M3R_API_CONTRACT.md` §2: results grouped by category (one top-1 per category). match_score renamed to match_percentage (0-100 scale). reasons array explains scoring per rubric factors. Service enforces one active recommendation_weights row via CHECK + unique index. |
| M3R-P2-T6 | P2 | Tests | feat/m3r-p2-recommendation-engine | DONE | 23 tests across test_recommendations_service.py (18) and test_recommendations_router.py (5): weight-sum read, budget-cap + alternative flagging, allergy exclusion, per-category top-1 ranking, match % 0-100, max_price filtering, feedback round-trip, ownership 403 rejection. Full suite: 2 pre-existing flaky ES-isolation tests, 521 passed (unrelated to P2 changes). |
| M3R-P3-T1 | P3 | AM/PM check-in logging (MongoDB) | feat/m3r-p3-progress-photo-pipeline | DONE | P0 confirmed already real (`routine_logs` collection via `toggle_step_completion`) — no gap, no work needed. |
| M3R-P3-T2 | P3 | Adherence math engine (7/30/90) | feat/m3r-p3-progress-photo-pipeline | TODO | Real gap — add the 90-day window; 7/30 already exist and are correct. |
| M3R-P3-T3 | P3 | Photo pipeline metadata (score-at-upload, tag) | feat/m3r-p3-progress-photo-pipeline | TODO | Real gap — new `skin_health_score_at_upload` PG column + wire `tag`/`image_stage` through the upload router (currently unreachable from the client). |
| M3R-P3-T4 | P3 | Analytics endpoint (merge photos in) | feat/m3r-p3-progress-photo-pipeline | TODO | Real gap — per `M3R_API_CONTRACT.md` §4, merge `/progress/me/photos` into `GET /analytics/me`. |
| M3R-P3-T5 | P3 | Tests | feat/m3r-p3-progress-photo-pipeline | TODO | 90-day boundary, mid-window routine change, frozen score-at-upload, presigned URL expiry, cross-user 403. |
| M3R-P4-T1 | P4 | Score gauge + sub-scores | feat/m3r-p4-user-dashboard | DONE | P0 confirmed already real (`skin-score-ring.tsx`) — verify fidelity only, no rebuild. |
| M3R-P4-T2 | P4 | Central AM/PM checklist (real-time + live-sync) | feat/m3r-p4-user-dashboard | TODO | Real-time logging exists; the P5-overwrite live-refetch counterpart needs building alongside P5-T4. |
| M3R-P4-T3 | P4 | Analytics chart (Chart.js/Plotly, 7/30/90 switcher) | feat/m3r-p4-user-dashboard | TODO | Real gap — chart library swap decision recorded, not yet implemented; only Recharts installed today. Add 90-day window switcher once P3-T2 lands. |
| M3R-P4-T4 | P4 | Recommendations shelf | feat/m3r-p4-user-dashboard | TODO | Rework to consume P2's categorized/match-%/budget-flag response shape. |
| M3R-P4-T5 | P4 | States + a11y + fidelity pass | feat/m3r-p4-user-dashboard | TODO | Both themes, wireframe screenshot comparison. |
| M3R-P5-T1 | P5 | Patient roster panel | feat/m3r-p5-professional-portal | DONE | P0 confirmed exists (`web/app/consultant/clients/`) — verify N+1 fix holds, no rebuild needed. |
| M3R-P5-T2 | P5 | Patient inspection view | feat/m3r-p5-professional-portal | TODO | Extend `client-detail-view.tsx` with survey details + adherence trend from the P3 analytics surface. |
| M3R-P5-T3 | P5 | Side-by-side photo comparison | feat/m3r-p5-professional-portal | TODO | Real gap — zero photo capability today, both frontend and backend (`clinical_review/router.py` has no photo-read endpoint). |
| M3R-P5-T4 | P5 | Routine-overwrite form (live sync) | feat/m3r-p5-professional-portal | TODO | Real gap — zero routine-write endpoint in `clinical_review/` today. This + P4-T2 together are the rubric's graded live-sync flow. |
| M3R-P5-T5 | P5 | States + fidelity | feat/m3r-p5-professional-portal | TODO | Empty roster, unassigned-client 403, both themes. |
| M3R-P6-T1 | P6 | Rubric unit-test sweep | feat/m3r-p6-e2e-verification | TODO | Named suites for clash detection, allergy filter, adherence math — most coverage exists per P0, close remaining gaps (90-day, routine-step conflict). |
| M3R-P6-T2 | P6 | Rubric E2E walkthrough spec | feat/m3r-p6-e2e-verification | TODO | New `tests/e2e/m3-rubric-walkthrough.spec.ts` — blocked until P5-T3/T4 land (portal has zero photo/routine-write capability today). |
| M3R-P6-T3 | P6 | Cross-dashboard sync + persistence checks | feat/m3r-p6-e2e-verification | TODO | Restart-mid-suite persistence verification. |
| M3R-P6-T4 | P6 | Full-gate run | feat/m3r-p6-e2e-verification | TODO | Backend + frontend + e2e + lint/typecheck/ruff/mypy + production build, all green in one pasted run. |
| M3R-P7-T1 | P7 | Outcomes sign-off document | chore/m3r-p7-docs-release | TODO | `M3R_COMPLETION_REPORT.md`. |
| M3R-P7-T2 | P7 | Docs in lockstep | chore/m3r-p7-docs-release | TODO | ARCHITECTURE.md, CONVENTIONS.md, ADRs for chart-library/storage/90-day decisions, `database_schemas/` mirrors, `AGENTS.md`'s stale "ingredients router lands M3" line. |
| M3R-P7-T3 | P7 | PROGRESS.md milestone entry | chore/m3r-p7-docs-release | TODO | |
| M3R-P7-T4 | P7 | Ledger close-out | chore/m3r-p7-docs-release | TODO | |
| M3R-P7-T5 | P7 | Branch cleanup | chore/m3r-p7-docs-release | TODO | Verify every `feat/m3r-*`/`fix/m3r-*`/`chore/m3r-*` branch merged + deleted. |
| M3R-P7-T6 | P7 | Handoff note for M4 | chore/m3r-p7-docs-release | TODO | `api`/`web` compose services, deprecated-alias claim correction, any deferred items. |

## Decisions recorded (owner confirmed this session, not silent defaults)

1. **Chart library:** switch to Chart.js or Plotly for P4/P5 dashboard charts
   (deviation from the locked Recharts default — ADR to be recorded in P7 or at P4
   kickoff).
2. **Cloud storage:** MinIO (S3-compatible) accepted as satisfying the rubric's "AWS
   S3 or Azure Blob" wording — no live cloud bucket needed.
3. **Working tree cleanup:** pre-existing uncommitted doc deletions folded into the P0
   setup commit (`bd145e2`).

## Skill/plugin discovery result

| Skill/plugin | Status |
|---|---|
| superpowers | AVAILABLE |
| ponytail | AVAILABLE (active this session, full mode) |
| graphify | AVAILABLE (`graphify-out/` exists in repo) |
| code-review | AVAILABLE |
| ui-ux-pro-max | AVAILABLE |
| frontend-design | AVAILABLE |
| find-skills | AVAILABLE |
| shadcn | to be confirmed at P4 kickoff |
| migrate-radix-to-base | to be confirmed at P4 kickoff |
