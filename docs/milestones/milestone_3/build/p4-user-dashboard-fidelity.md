# P4 User Dashboard — fidelity & verification notes

Written during Task 5 (states/a11y/fidelity pass) of
`docs/superpowers/plans/2026-07-28-m3r-p4-user-dashboard.md`. This documents what
was actually verified against the running system versus what this sandbox
environment cannot verify — per the milestone's own rule, **never claim done on
unverified work**.

## Environment constraints (apply to all of P4, not just this note)

- No browser/screenshot tool is available in this session or to any dispatched
  subagent. `docker-compose.yml`'s `api`/`web` entries are deliberately deferred
  to M4 (ADR-005) — the real dev workflow runs `uv run uvicorn` and `npm run dev`
  as host processes, not containers, so "no api/web containers running" (hit by
  every Task 1/3/4 implementer) was never actually a gap, just the correct setup.
  A live backend WAS started for this task (`uv run uvicorn app.main:app`,
  confirmed healthy via `GET /health`) to do real service-layer verification —
  but with no browser, actual pixel-level rendering, keyboard-interaction
  recording, and screenshot-vs-wireframe image diffing could not be performed by
  either me or any subagent this phase.
- The Stitch MCP server (`stitch.withgoogle.com`) is not connected in this
  session — a required-plugin hard stop. Re-extracting a corrected wireframe
  screen was not possible; see "Wireframe discrepancy" below for how this was
  resolved with the milestone owner.

## Wireframe discrepancy found and resolved

`web/designs/wireframes/app-dashboard.html` / `app-dashboard.png` (the file every
task in this phase treated as the User Dashboard's visual source of truth) has a
"Clinical Portal" / "Dr. Sarah Chen" header and a 4-item nav (Dashboard,
Analytics, Consultants, Settings) that matches none of AGENTS.md §4's four locked
role navs. `derm-dashboard.png` was checked and confirmed to be a genuinely
different screen (patient case queue, condition census) — so this isn't simply
the same file duplicated. The wireframe's **body content** (Skin Score ring,
"Score History" chart, "Recommended for you" carousel, "Today's Routine"
checklist, weather) matches the real User Dashboard's content almost exactly —
only the header chrome/persona and nav are wrong, consistent with a Stitch
extraction/mislabeling artifact of the kind
`.agents/rules/skinlytics-stitch.md` explicitly warns about.

Raised to the milestone owner (2026-07-28): with Stitch unreachable this
session, the owner chose to proceed on a **content-only comparison** — judge
body layout against this wireframe, ignore the mismatched header/nav, and treat
the header/nav mismatch as a separate documentation bug for a future session
(re-extract the correct screen from Stitch once the MCP server is reachable
again; do not silently re-title or re-purpose the existing file without going
through the Stitch project).

**Follow-up needed in a future session:** re-fetch the correct "Dashboard"
screen from the Skinlytics Stitch project (ID `933192060480910018`) per
`.agents/rules/skinlytics-stitch.md`, confirm its header/nav matches the User
role's real nav, and replace `app-dashboard.html`/`app-dashboard-dark.html` +
their reference screenshots if the correct screen turns out to differ
structurally from what's there today.

## Content-layout comparison (both themes, viewed directly)

Compared `source/reference-screenshots/app-dashboard.png` (light) and
`app-dashboard-dark.png` (dark) against the built page
(`web/app/(user)/dashboard/page.tsx` + its child components) at the code/props
level (no live render available):

- **Skin Score card**: wireframe shows a ring (numeral + "/100") with 3
  placeholder mini-bars (Hydration/Texture/Pigmentation) beside it — confirmed
  in an earlier phase-4 planning pass to be cosmetic Stitch mockup values, not a
  literal requirement. Built version: same ring + card position, 5 REAL
  weighted mini-bars (Condition 35%, Lifestyle 20%, Routine 20%, Sleep 15%,
  Hydration 10%) per AGENTS.md §4's binding "five weighted mini-bars" spec —
  intentional content difference from the wireframe's placeholder, structurally
  in the same slot.
- **Today's Routine card**: wireframe shows an AM/PM checklist with a
  completion fraction — matches `RoutineChecklistCard`'s real structure
  (Morning/Evening protocol groups, `doneCount/total`, checkbox rows) exactly.
- **Score History card**: wireframe shows a bar-style history chart with a
  day-range control near the top. Built version: `ScoreAdherenceChart`
  (Chart.js line chart, two series — score + adherence — 7/30/90-day literal
  switcher) in the same card position. Chart *type* (line vs. bar) differs from
  the wireframe's literal rendering, but the rubric's own requirement (Chart.js,
  score + adherence together, 7/30/90 windows) governs over the Stitch mockup's
  cosmetic bar-chart choice, consistent with how mini-bar labels were already
  handled earlier in this phase.
- **Recommended for you card**: wireframe shows a single product image with
  name/subtitle only, no match %, tags, or budget flag. Built version adds all
  three per the rubric's explicit "active ingredient tags and budget flags"
  requirement — an intentional addition beyond the cosmetic mockup, not a
  fidelity regression.
- **External Factors / Reminders cards**: out of this phase's scope (weather,
  notifications), unchanged.

No structural drift found beyond the differences above, and each one traces to
an explicit rubric/AGENTS.md requirement overriding a cosmetic Stitch value —
consistent with how this milestone has handled every prior mockup-vs-real-data
conflict.

## Real-system verification actually performed

With a live backend (`uv run uvicorn`, confirmed healthy) against the real
Postgres/Mongo/Redis/Elasticsearch/MinIO stack, for real user
`ewWJ2owds1XAWlUDgIzrZn7YOeXwzGVH` (a real skin profile + 2 real computed
scores, `demo-client-*` fixtures also available):

- **Real 5 sub-scores, non-degenerate**: `overall=79.99 condition=93.00
  lifestyle=43.89 routine=100.00 sleep=80.00 hydration=66.67` — confirms Task
  1's mini-bars will show genuinely varied bar widths, not five identical
  placeholder values.
- **Real recommendations**: 7 recommendations returned, match percentages 86%
  and 85% (not a flat/fake constant), 2/7 with non-empty
  `active_ingredient_tags` (the rest legitimately `[]` — an honest ingredient-
  catalog coverage gap already documented in `M3R_API_CONTRACT.md`, not a bug).
- **Budget-cap path**: with `max_price=5.0`, 7/8 recommendations flagged
  `over_budget=true` and exactly 1 real alternative appended
  (`alternative_for_product_id` set) — confirms Task 4's over-budget badge and
  the underlying P2 budget-cap logic are both wired correctly end to end.
- **Analytics endpoint**: `score_vs_adherence` returned 2 real points (matching
  the 2 real score rows), `compliance` all `0.0` (correct — no routine
  completions logged for this user in the relevant windows), `photos` empty
  (correct — none uploaded), 2 `correlations` computed.
- **Checklist real-time persistence**: called `toggle_step_completion(user_id,
  step_id=27082, completed=True)` directly (the same function
  `POST /routines/steps/{id}/log` calls), confirmed via a direct Mongo query
  that `routine_logs` gained a `completed_steps` entry for that step with a
  real timestamp — then reverted the toggle to leave data as found. Confirms
  the "real-time, not a client-only guess" claim in
  `routine-checklist-card.tsx`'s own comment is genuinely true at the data
  layer.
- **Accessibility**: `RoutineChecklistCard` uses a real shadcn `Checkbox`
  wrapped in a `<label>` — inherits standard keyboard focus/toggle semantics
  from the underlying accessible primitive (Tab + Space), not a custom
  non-semantic click handler. No a11y gap found in this component by static
  reading.
- **Automated gates**: `npm run typecheck` clean, `npm run lint` clean (0
  errors, the same 2 pre-existing unrelated warnings every task in this phase
  reported), `npm run build` succeeds (all routes prerender). Full backend
  `pytest` run separately — see the ledger for its result.

## Honestly not verified in this sandbox

- Live browser rendering of either theme — no browser tool available.
- Keyboard-navigation recording (Tab order, focus rings) beyond the static
  semantic-HTML check above.
- Pixel/visual diff against the reference screenshots — only a structural
  comparison (this document) was possible.
- The routines-query 30s poll interval's actual live-sync behavior end to end
  (requires P5's professional-overwrite endpoint, which doesn't exist yet) —
  by design, per the plan's own Task 2 scope note.

A human pass with a real browser against both themes, once one is available in
this environment (or on a machine with Docker Desktop's `web`/`api` able to run
`npm run dev`/`uv run uvicorn` normally), is recommended before treating P4 as
fully shipped — this is flagged here rather than silently assumed.
