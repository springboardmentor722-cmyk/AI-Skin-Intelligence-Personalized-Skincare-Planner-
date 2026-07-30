# Fix bug_report.md Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 3 confirmed bugs in `bug_report.md` (2026-07-30): the routine-adherence
scoring discontinuity, the User sidebar's dead "Upgrade to Premium" CTA, and a missing
Base UI prop on a shared dashboard-widget button.

**Architecture:** Three independent, single-file fixes across the FastAPI backend and
Next.js frontend. No shared code between tasks — each is its own commit.

**Tech Stack:** Python 3.11 / FastAPI (backend), TypeScript / Next.js App Router / Base UI
via shadcn (frontend).

## Global Constraints

- Ponytail ultra: smallest diff that fixes the actual root cause, reuse what already
  exists in the file (`constants.ADHERENCE_WINDOW_DAYS` is already imported), no new
  abstractions, no speculative refactor of adjacent correct code.
- Don't touch anything not named in `bug_report.md` — `web/lib/nav-config.ts`'s
  `avatarCaption: "Premium User"` (same "Premium" framing, same file) is a related but
  unreported issue; leave it, flag it separately, don't silently expand scope.
- Backend quality gate: `ruff` + `mypy --strict` + the specific `pytest` test file touched.
  Frontend quality gate: `npm run typecheck` for the touched files.
- Commit author must be `Satya Sai tharun Jekkamsetti <satya.saitharun02@gmail.com>`
  (already the local git identity — no action needed, just don't override it).
- Branch: `satya-sai-tharun-skinlytics`. Never touch `main`.

---

### Task 1: Fix routine-adherence denominator (scoring discontinuity)

**Files:**
- Modify: `backend/app/services/scores/scoring_engine.py:191-216`
- Test: `backend/tests/test_scores_service.py` (add one test after line 331)

**Interfaces:**
- Consumes: `app.services.scores.constants.ADHERENCE_WINDOW_DAYS` (already `14`, already
  imported in this file as `constants`), `constants.ADHERENCE_DEFAULT_WHEN_NO_DATA`
  (already `100.0`).
- Produces: `_routine_adherence_score(step_ids: list[int], logs: list[dict[str, Any]]) ->
  float` — same signature as before, so `scores/service.py:69`'s call site
  (`_routine_adherence_score(step_ids, routine_logs)`) needs no change.

- [ ] **Step 1: Write the failing test**

Add to `backend/tests/test_scores_service.py`, directly after
`test_routine_adherence_score_ignores_a_completed_step_no_longer_active` (line 331):

```python
def test_routine_adherence_score_counts_unlogged_days_as_missed_not_excluded() -> None:
    # Regression: `scheduled` used to be len(step_ids) * len(logs), so a user who only
    # opened the app 2 of the 14 window days (and did everything both times) scored
    # 100% adherence — identical to someone logging honestly every day. Unlogged days
    # shrank the denominator instead of counting as misses.
    logs = [{"completed_steps": [{"routine_step_id": 1}, {"routine_step_id": 2}]}] * 2
    assert _routine_adherence_score([1, 2], logs) == pytest.approx(2 / 14 * 100)
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python -m pytest tests/test_scores_service.py::test_routine_adherence_score_counts_unlogged_days_as_missed_not_excluded -v`
Expected: FAIL — old code computes `scheduled = 2 * 2 = 4`, `completed = 4`, giving
`100.0`, not `~14.29`.

- [ ] **Step 3: Fix the denominator**

In `backend/app/services/scores/scoring_engine.py`, replace lines 204-216:

```python
    if not step_ids or not logs:
        return constants.ADHERENCE_DEFAULT_WHEN_NO_DATA
    active_step_ids = set(step_ids)
    completed_count = sum(
        1
        for log in logs
        for entry in log.get("completed_steps", [])
        if entry.get("routine_step_id") in active_step_ids
    )
    scheduled = len(step_ids) * len(logs)
    if not scheduled:
        return constants.ADHERENCE_DEFAULT_WHEN_NO_DATA
    return min(100.0, (completed_count / scheduled) * 100)
```

with:

```python
    if not step_ids or not logs:
        return constants.ADHERENCE_DEFAULT_WHEN_NO_DATA
    active_step_ids = set(step_ids)
    completed_count = sum(
        1
        for log in logs
        for entry in log.get("completed_steps", [])
        if entry.get("routine_step_id") in active_step_ids
    )
    scheduled = len(step_ids) * constants.ADHERENCE_WINDOW_DAYS
    return min(100.0, (completed_count / scheduled) * 100)
```

(`scheduled` can no longer be 0 here — `step_ids` is non-empty per the guard above and
`ADHERENCE_WINDOW_DAYS` is a fixed positive constant — so the old `if not scheduled`
branch is now dead code and is dropped.) Also update the function's docstring
(lines 192-203) to describe the fixed behavior: unlogged days within the window now
count as 0 completions among the fixed 14-day denominator, rather than being excluded
from it.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python -m pytest tests/test_scores_service.py -k routine_adherence -v`
Expected: PASS — all 6 pre-existing `_routine_adherence_score` tests plus the new one
(they all use exactly 14 log entries or an empty list already, so none of them
exercised the buggy partial-window path — that's why the bug shipped unnoticed).

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/scores/scoring_engine.py backend/tests/test_scores_service.py
git commit -m "fix: routine adherence denominator uses fixed 14-day window, not log count"
```

---

### Task 2: Remove the User sidebar's dead "Upgrade to Premium" CTA

**Files:**
- Modify: `web/lib/nav-config.ts:662-667`

**Interfaces:**
- Consumes: `FooterConfig` interface (`web/lib/nav-config.ts:62-68`) — `actionLabel` is
  already optional (`actionLabel?: string`); `actionHref` is required.
- Produces: `ROLE_FOOTER.user` — consumed by `web/components/app-shell/app-sidebar.tsx:55-144`,
  which only renders the CTA button when `footer.actionLabel` is truthy (line 140).

- [ ] **Step 1: Replace the misleading entry**

In `web/lib/nav-config.ts`, replace lines 662-667:

```ts
  user: {
    icon: Sparkles,
    title: "Upgrade to Premium",
    description: "Unlock AI insights, advanced reports & more.",
    actionLabel: "Upgrade Now",
    actionHref: "/settings",
  },
```

with:

```ts
  // No premium/billing tier exists in this app yet (docs/DECISIONS.md ADR-033) — this
  // used to advertise "Upgrade to Premium" with a working button that led to a settings
  // page with no premium content at all (bug_report.md 2026-07-30, bug #2). Reframed
  // around Settings -> Appearance, a real shipped feature (8 palettes, light/dark/
  // system), same "no actionLabel, description-only" shape the other three roles
  // already use here so there's no dead-end button.
  user: {
    icon: Sparkles,
    title: "Make It Yours",
    description: "8 themes, light, dark, or system — tune it in Settings.",
    actionHref: "/settings",
  },
```

- [ ] **Step 2: Verify no other reference to the removed copy**

Run: `cd web && grep -rn "Upgrade to Premium\|Upgrade Now" --include=*.ts --include=*.tsx .`
Expected: no matches (the wireframe HTML under `web/designs/wireframes/` is reference
source, not live code, and is out of scope — confirm it isn't the only place a literal
"Premium" match hits by checking the grep output names `.ts`/`.tsx` files only).

- [ ] **Step 3: Typecheck**

Run: `cd web && npm run typecheck`
Expected: PASS — `FooterConfig.actionLabel` is already optional, so omitting it is not
a type error.

- [ ] **Step 4: Commit**

```bash
git add web/lib/nav-config.ts
git commit -m "fix: drop User sidebar's dead Upgrade to Premium CTA, no premium tier exists"
```

---

### Task 3: Add missing `nativeButton={false}` to `WidgetEmpty`'s button

**Files:**
- Modify: `web/components/dashboard/widget-states.tsx:57`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/button` (Base UI-backed, requires
  `nativeButton={false}` whenever `render` targets a non-`<button>` element — the
  existing, established pattern at every other `render={<Link .../>}`/`render={<a .../>}`
  call site in this codebase, e.g. `web/components/app-shell/app-sidebar.tsx:141`).
- Produces: `WidgetEmpty` — shared by 14+ dashboard/chart widgets (no signature change).

- [ ] **Step 1: Add the prop**

In `web/components/dashboard/widget-states.tsx`, replace line 57:

```tsx
          <Button size="sm" render={<a href={actionHref} />}>
```

with:

```tsx
          <Button size="sm" nativeButton={false} render={<a href={actionHref} />}>
```

- [ ] **Step 2: Verify the console error is gone**

This is a one-line prop addition matching an established pattern used 30+ other places
in this codebase (trivial per ponytail — no test needed). Confirm visually: run
`cd web && npm run dev`, open any dashboard page in a state with no data (or temporarily
force `state="empty"` on any widget using `WidgetEmpty`), open the browser console, and
confirm no `Base UI: A component that acts as a button expected a native <button>...`
error appears when the empty-state action button is present. Check both light and dark
theme (AGENTS.md §7 definition-of-done, item 6).

- [ ] **Step 3: Commit**

```bash
git add web/components/dashboard/widget-states.tsx
git commit -m "fix: add missing nativeButton prop to WidgetEmpty's action button"
```

---

## Self-Review

**Spec coverage:** All 3 `bug_report.md` findings have a task. No gaps.

**Placeholder scan:** No TBD/TODO; every step has literal file paths, line numbers, and
full before/after code.

**Type consistency:** Task 1 keeps `_routine_adherence_score`'s signature unchanged, so
`scores/service.py:69`'s call site needs no edit — verified by reading that call site
during planning. Task 2 relies on `FooterConfig.actionLabel` already being optional —
verified against the interface definition. Task 3 is a prop addition with no signature
change.
