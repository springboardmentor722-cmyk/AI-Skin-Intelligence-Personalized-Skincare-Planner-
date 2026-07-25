# Full-Repo Code Review + Fix Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run `/code-review` as a whole-repo audit (not a diff review), triage every finding through the app's 4-role RBAC lens, and fix confirmed issues with `ponytail ultra` (smallest correct diff).

**Architecture:** Unlike a normal plan, the fix list isn't known up front — `/code-review`'s own output *is* Task 2's input. This plan fixes the *process* (review → triage → fix → verify), not pre-specified code changes.

**Tech Stack:** Backend: Python/FastAPI, `ruff`, `mypy --strict`, `pytest`. Frontend: Next.js/TypeScript, `tsc`, `eslint`, Playwright.

## Global Constraints

- Never commit to or push `main` or `satya-sai-tharun-skinlytics` — all work happens on `dev`.
- Never add a `Co-Authored-By: Claude` (or any AI) trailer to any commit (AGENTS.md §6, standing user rule).
- Every fix ships with the smallest correct diff (`ponytail ultra`) — no unrequested refactors, no speculative abstractions.
- Every fix that touches a role-gated endpoint or screen must respect AGENTS.md §4's fixed nav lists and §2 rule 6 (role + ownership enforcement).
- Quality gates before any commit: backend `ruff check` + `ruff format --check` + `mypy --strict` + `pytest`; frontend `tsc --noEmit` + `eslint`.
- graphify-out/graph.json (3679 nodes, 248 communities) is available for `graphify query "<question>"` — use it to scope a finding's real blast radius instead of grepping cold.

---

### Task 1: Run the whole-repo review

**Files:** none modified — this task only produces the finding list.

**Interfaces:**
- Produces: a findings list (file, line, severity, RBAC-role relevance, one-sentence failure scenario) that Task 2 consumes.

- [ ] **Step 1: Invoke `/code-review` in whole-repo mode**, not diff mode — explicitly scope it to the full `backend/` + `web/` trees, not just `git diff dev...main`.
- [ ] **Step 2: For every finding touching an endpoint or UI screen, tag which of the 4 roles (user/consultant/dermatologist/admin) it affects**, using AGENTS.md §4's nav lists and §5's service table to confirm the finding is real (not a misread of an intentionally role-gated code path).
- [ ] **Step 3: Save the raw findings** to `docs/superpowers/plans/2026-07-26-review-findings.md` (one row per finding: file:line, severity, role, one-line failure scenario) so Task 2 has a durable input list independent of chat context.

---

### Task 2: Triage findings

**Files:** `docs/superpowers/plans/2026-07-26-review-findings.md` (read + annotate).

**Interfaces:**
- Consumes: the findings list from Task 1.
- Produces: each finding marked `fix-now` / `defer` / `wontfix`, with a one-line reason — this is what Task 3 iterates over.

- [ ] **Step 1: Drop anything that isn't a real defect** — a correctly role-gated 403, an intentional ADR-023/031-style fixture, or a style nit already covered by `ruff`/`eslint` config. Mark `wontfix` with the ADR/rule it matches.
- [ ] **Step 2: Mark anything that changes a binding/graded formula (scoring weights, mandated docx wording) or a documented architectural boundary as `defer`** — those need an ADR or explicit user sign-off first (AGENTS.md §0), not a silent `ponytail ultra` fix.
- [ ] **Step 3: Everything else is `fix-now`.** Order by severity, then by shared root cause (AGENTS.md's own rule: fix the shared function once, not every caller).

---

### Task 3: Fix each `fix-now` finding

**Files:** whatever Task 1/2 identified — determined by the review, not pre-specified here.

**Interfaces:**
- Consumes: the `fix-now` list from Task 2.
- Produces: one commit per logically-related group of fixes (matching this repo's existing convention of bundling related fixes into one commit, e.g. `43edab4`).

For **each** `fix-now` finding:
- [ ] **Step 1: Re-read the actual current code at the cited file:line** — a review pass can lag behind by the time fixing starts.
- [ ] **Step 2: Grep every caller of the function/component being changed** (ponytail's own root-cause rule) — fix at the shared point, not per-caller.
- [ ] **Step 3: Apply the smallest correct diff.** No new abstraction, no config for a value that never changes, no defensive code for a case that can't happen.
- [ ] **Step 4: Add or update the one test that would fail if the fix regressed** — a targeted unit test, not a new framework or fixture suite.
- [ ] **Step 5: Run the relevant quality gate** (backend: `ruff check <file> && ruff format --check <file> && mypy --strict <module> && pytest -k <test>`; frontend: `tsc --noEmit && eslint <file>`) and confirm clean before moving to the next finding.

---

### Task 4: Full verification + commit

**Files:** none new — this is the gate before committing Task 3's changes.

**Interfaces:**
- Consumes: all fixes applied in Task 3.
- Produces: one or more commits on `dev`, nothing pushed.

- [ ] **Step 1: Run the full backend suite** — `cd backend && uv run ruff check . && uv run ruff format --check . && uv run mypy app && uv run pytest -q`. All must pass with zero regressions vs. the pre-fix baseline.
- [ ] **Step 2: Run the full frontend suite** — `cd web && npm run typecheck && npm run lint`. Run `npm run build` and the relevant Playwright specs if any fix touched a page/component that has e2e coverage.
- [ ] **Step 3: `git status` must be clean of anything unintended** (no stray temp files, no `graphify-out/` churn) before staging.
- [ ] **Step 4: Commit** with a message describing each bundled fix and its reviewed root cause — no AI co-author trailer. Do not push. Do not touch `main` or `satya-sai-tharun-skinlytics`.

---

## Self-Review

**Spec coverage:** covers the full lifecycle the user asked for — whole-repo `/code-review` (Task 1) → RBAC-aware triage (Task 2) → `ponytail ultra` fixes (Task 3) → verify + commit, no push, branch constraint respected (Task 4).
**Placeholder scan:** no TBD/"handle appropriately" — Tasks 1-2 are process steps (their deliverable is a findings document, not code, so no code placeholder applies); Task 3's steps are generic by necessity since the findings aren't known until Task 1 runs, but each step names an exact, checkable action.
**Type consistency:** n/a — no cross-task function signatures are defined here, since Task 3 operates on whatever Task 1 finds.
