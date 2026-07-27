# M3R Phase 0 — Carry-over Closure & Rubric Gap Analysis

**Branch:** `feat/m3r-p0-gap-analysis` (from `dev`) · **Agents:** Orchestrator + Recon
Agent (read-only Explore subagent) + Docs Agent · **Blocks:** every other phase.
**Skills/plugins:** find-skills (start here), graphify (`graphify query` before any code
reading), superpowers (write the phase plan to `docs/superpowers/plans/`).

## Objective

Establish ground truth: what the earlier internal M3 pass (M3-0…M3-H) actually shipped
vs what `MILESTONE 3.pdf` literally grades, plus verified status of every M1/M2
carry-over. Output: a gap table + frozen contracts + task ledger. **No feature code in
this phase** — only audits, env/config fixes, and the ledger.

## Tasks

- **M3R-P0-T1 — Environment & stack sanity.** Bring up docker-compose stores + backend +
  web locally. Record exact versions/commands in the phase report. Fix the 5 MinIO test
  failures (root `.env` `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` vs compose's
  `skinlytics`/`skinlytics_dev_only`) — config change only; full backend suite must be
  green before P1 starts (branch `fix/m3r-minio-test-creds` if kept separate).
- **M3R-P0-T2 — Verify earlier-M3 claims.** For each of outbox/worker, ES/FAISS
  projections, `ingredients` router, recommendations v2, progress tracking, Insights,
  `ml/` harness: confirm it exists on `dev` and runs (graphify + live endpoint hits, not
  PROGRESS.md's word). List discrepancies.
- **M3R-P0-T3 — M1/M2 pending verification.** Re-verify the six items in Master Prompt
  §3 against live code. Close what's closable now (config, small fixes on `fix/m3r-*`
  branches); mark credential blockers (OpenWeather/OpenUV) as BLOCKED and ask Kiran;
  record owner-deferral for the rest with reasons.
- **M3R-P0-T4 — Rubric gap table.** For every literal requirement in rubric Steps 1–5
  (use Master Prompt §1's table as the checklist skeleton, but read the PDF directly),
  record: requirement → where implemented (file:symbol) → verified how → gap (none /
  partial / missing). This table drives P1–P6 scope; phases only do rows marked
  partial/missing.
- **M3R-P0-T5 — Contract freeze.** For the four rubric API surfaces (safety score,
  recommendations, progress/check-ins, analytics): freeze request/response shapes in
  `M3R_API_CONTRACT.md` (mirror M2's `M2_API_CONTRACT.md` format). Raise the §6 conflict
  items (chart lib, S3 naming, endpoint names, 90-day window) with Kiran **now** so
  P1–P5 don't stall mid-build.
- **M3R-P0-T6 — Create `M3R_TASK_LEDGER.md`** with every task ID from all phase files,
  status TODO, and the P0 findings wired in (BLOCKED/DONE rows with evidence links).

## Verification

Backend suite fully green (0 failures incl. storage tests) · gap table complete with a
file:symbol citation or "missing" for every rubric line · contracts frozen and conflicts
answered by Kiran (or explicitly pending) · ledger committed.

## Exit

`/code-review` clean → merge to `dev` → delete branch → `graphify update .`.
