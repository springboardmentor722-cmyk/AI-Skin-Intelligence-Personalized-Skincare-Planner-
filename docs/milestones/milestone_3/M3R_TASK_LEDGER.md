# Milestone 3 (remaining work) — task ledger

> Recreated fresh per M3-P0-T6 (the old ledger from the superseded M3R pass is in git
> history, `git show 8a4f988:docs/milestones/milestone_3/M3R_TASK_LEDGER.md`). One row
> per task ID from `Master_prompt_milestone3.md` Part 3. Status: `TODO` · `IN_PROGRESS` ·
> `BLOCKED` · `DONE` · `DEFERRED`.

## P0 — Re-baseline & contract freeze (branch `feat/m3-p0-rebaseline`)

| Task | Status | Evidence |
|---|---|---|
| M3-P0-T1 | DONE | docker compose stack already up (postgres/mongo/redis/es/minio/worker healthy); backend `ruff` clean, `mypy --strict` clean (156 files); frontend `npm ci` clean (720 pkgs), `lint` 0 errors/2 pre-existing warnings, `typecheck` clean; backend `pytest` run in progress |
| M3-P0-T2 | DONE | Explore-agent audit of 9 claims against live code, 2026-08-12: 6 confirmed, 2 refuted (product `/compare` and a progress-log endpoint already existed — corrected in Master_prompt_milestone3.md §1/§2.2/G6/G7/C3), 1 confirmed-with-nuance (unrelated LightGBM ranker flag exists but doesn't feed `rating_norm`) |
| M3-P0-T3 | DONE | Old M3R doc set (`milestone_3_Master_prompt.md`, `phases/*`, `M3R_API_CONTRACT.md`/`M3R_COMPLETION_REPORT.md`/`M3R_GAP_ANALYSIS.md`/`M3R_TASK_LEDGER.md`, `build/e2e/*.png`, `build/p4-*`/`p5-*-fidelity.md`) deleted; `Master_prompt_milestone3.md` + `MILSTONE 3 & 4.pdf` brought onto `dev` for the first time (previously only existed on `feature/product-quality-model`, commit 11ef2e0, never merged) — commit `2cfb6cb` |
| M3-P0-T4 | DONE | C1/C4/C5/C6 decided via AskUserQuestion (all defaults); C7/C8 decided (all defaults); C1-C3 decisions recorded in `M3R_API_CONTRACT.md`; owner additionally reopened ADR-033 → ADR-047 (biometric consent) + ADR-048 (Sephora CF), P8/P9 added |
| M3-P0-T5 | DONE | `M3R_API_CONTRACT.md` written — C1/C2/C3 new-endpoint shapes, C4 (compare) confirmed no-change |
| M3-P0-T6 | DONE | this file |
| M3-P0-T7 | DONE | `/code-review` ran, 4 doc-consistency findings fixed (C2/C3 swap, dangling `M3R_GAP_ANALYSIS.md`/`build/p4-p5` refs, flagged pre-existing ADR-045/046 gap); merged to `dev`. Backend pytest: 610 passed / 4 pre-existing failures (unrelated, zero backend diff on this branch) / 2 full-catalog rebuild tests deselected (~24k rows, no batching, multi-hour runtime — pre-existing perf issue, not this branch's) |

## P1 — INCI parsing + `analyze-compatibility` (branch `feat/m3-p1-inci-compatibility`)

| Task | Status |
|---|---|
| M3-P1-T1 | TODO |
| M3-P1-T2 | TODO |
| M3-P1-T3 | TODO |
| M3-P1-T4 | TODO |
| M3-P1-T5 | TODO |
| M3-P1-T6 | TODO |
| M3-P1-T7 | TODO |

## P2 — Vector Stage-1 + ML Stage-2 completion (branch `feature/product-quality-model`)

| Task | Status | Evidence |
|---|---|---|
| M3-P2-T1 | IN_PROGRESS | branch has real committed ML work (`cf151fa`..`82d4c23`) + one pending uncommitted change (`web/package.json`/`package-lock.json` eslint/typescript dependency pin) — parked in a stash during P0, needs to be reconciled/committed |
| M3-P2-T2 | TODO | C5 (sklearn GBM) + C6 (384-dim) deviation ADRs — fold into ADR-047/048's neighborhood or a dedicated ADR |
| M3-P2-T3 | TODO |
| M3-P2-T4 | TODO |
| M3-P2-T5 | TODO |
| M3-P2-T6 | TODO |

## P3 — `recommend-routine-set` + comparison verify (branch `feat/m3-p3-routine-set-compare`)

| Task | Status | Evidence |
|---|---|---|
| M3-P3-T1 | TODO |
| M3-P3-T2 | TODO |
| M3-P3-T3 | TODO | **corrected scope**: `GET /products/compare` already real — verify against rubric field list only, no new endpoint |
| M3-P3-T4 | TODO |
| M3-P3-T5 | TODO |
| M3-P3-T6 | TODO |

## P4 — `progress/log-entry` (branch `feat/m3-p4-log-entry`)

| Task | Status | Evidence |
|---|---|---|
| M3-P4-T1 | TODO | **corrected scope**: `toggle_step_completion` lives in `services/routines/`, not `services/progress/`; `/progress/me/logs` is an unrelated weekly report endpoint — this is a real new build, not a rename |
| M3-P4-T2 | TODO |
| M3-P4-T3 | TODO |
| M3-P4-T4 | TODO |
| M3-P4-T5 | TODO |
| M3-P4-T6 | TODO |

## P5 — Dashboard route reconciliation (branch `feat/m3-p5-dashboard-routes`)

| Task | Status |
|---|---|
| M3-P5-T1 | TODO |
| M3-P5-T2 | TODO |
| M3-P5-T3 | TODO |
| M3-P5-T4 | TODO |
| M3-P5-T5 | TODO |

## P6 — Extended testing & verification (branch `feat/m3-p6-verification`)

| Task | Status |
|---|---|
| M3-P6-T1 | TODO (blocked on P1-P5) |
| M3-P6-T2 | TODO (blocked on P1-P5) |
| M3-P6-T3 | TODO (blocked on P1-P5) |
| M3-P6-T4 | TODO (blocked on P1-P5) |
| M3-P6-T5 | TODO (blocked on P1-P5) |

## P7 — Docs/ADR lockstep + close-out (branch `chore/m3-p7-docs-closeout`)

| Task | Status |
|---|---|
| M3-P7-T1 | TODO (blocked on P6) |
| M3-P7-T2 | TODO (blocked on P6) |
| M3-P7-T3 | TODO (blocked on P6) |
| M3-P7-T4 | TODO (blocked on P6) |
| M3-P7-T5 | TODO (blocked on P6) |
| M3-P7-T6 | TODO (blocked on P6) |

## P8 — Biometric consent + face-photo pipeline, beyond rubric (branch `feat/m3-p8-biometric-consent`, ADR-047)

| Task | Status |
|---|---|
| M3-P8-T1 | TODO |
| M3-P8-T2 | TODO |
| M3-P8-T3 | TODO |
| M3-P8-T4 | TODO |
| M3-P8-T5 | TODO |
| M3-P8-T6 | TODO |
| M3-P8-T7 | TODO |
| M3-P8-T8 | TODO |

## P9 — Sephora-review CF signal, beyond rubric (branch `feat/m3-p9-cf-signal`, ADR-048)

| Task | Status |
|---|---|
| M3-P9-T1 | TODO |
| M3-P9-T2 | TODO |
| M3-P9-T3 | TODO |
| M3-P9-T4 | TODO |
| M3-P9-T5 | TODO |
| M3-P9-T6 | TODO |
