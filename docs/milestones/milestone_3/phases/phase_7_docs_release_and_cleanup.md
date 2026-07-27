# M3R Phase 7 — Docs, Release & Branch Cleanup

**Branch:** `chore/m3r-p7-docs-release` (from `dev`) · **Agents:** Docs Agent +
Orchestrator · **Depends:** P6 green.
**Skills/plugins:** graphify (final `graphify update .`), code-review.

## Tasks

- **M3R-P7-T1 — Outcomes sign-off document.** `M3R_COMPLETION_REPORT.md` (mirror M2's
  completion report): the four official rubric outcomes, each mapped to evidence —
  endpoints, specs, screenshots, test names, ledger rows. No outcome claimed without a
  pasted verification artifact.
- **M3R-P7-T2 — Docs in lockstep.** Update `docs/ARCHITECTURE.md` (anything structural
  that changed), `docs/CONVENTIONS.md` (new patterns, e.g. photo tags), ADRs in
  `docs/DECISIONS.md` for every §6 conflict resolution (chart library, endpoint naming,
  storage naming, 90-day window) with Kiran's recorded decision, `database_schemas/`
  mirrors final-checked against live schema, `make openapi` types current.
- **M3R-P7-T3 — `PROGRESS.md` milestone entry.** Dated M3-rubric-pass entry: what was
  already built vs what this pass closed, remaining owner-deferred items (with owners),
  credential blockers still open. Honest — no "done" for anything unverified.
- **M3R-P7-T4 — Ledger close-out.** Every `M3R-*` task DONE-with-evidence, BLOCKED-with-
  owner, or explicitly deferred. Zero silent drops.
- **M3R-P7-T5 — Branch cleanup.** Verify every `feat/m3r-*`, `fix/m3r-*`,
  `chore/m3r-*` branch is merged and **deleted** (local + remote). `git branch -a`
  output pasted in the report showing only: `main`, `satya-sai-tharun-skinlytics`,
  `dev`, this branch (about to be deleted), and other contributors' untouched branches.
  **Never delete `main`, `satya-sai-tharun-skinlytics`, `dev`, or any other
  contributor's branch.** Do not merge `dev` anywhere — `dev → main` promotion is
  Kiran's/the owner's call, outside this milestone.
- **M3R-P7-T6 — Handoff note for M4.** Short section in the completion report listing
  what M4 (dashboards/reports/testing/Docker-cloud deploy per `docs/ARCHITECTURE.md`
  §13) inherits: `api`/`web` compose services, deprecated aliases retirement, any
  deferred items.

## Verification

Completion report reviewed against the rubric PDF line-by-line one final time (read the
PDF again — not this pack's summary of it). All gates green on `dev` after final merge.

## Exit

`/code-review` → merge to `dev` → delete branch → final `graphify update .` →
tell Kiran Milestone 3 rubric pass is complete, with the completion report linked.
