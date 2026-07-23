# Skinlytics — Milestone 2 Master Prompt Pack

**Repo:** `AI-Skin-Intelligence-Personalized-Skincare-Planner-`
**Target:** Milestone 2 (`docs/milestones/milestone_2/mile_2.docx`)
**Runner:** Claude Code CLI, autonomous mode
**Companion:** `UI_SPEC.md` — the reverse-engineered design spec for the four role dashboards

---

## How to use this file

1. Place this file at `docs/milestones/milestone_2/MASTER_PROMPT.md` and `UI_SPEC.md`
   beside it.
2. Copy **Part 1 (§ Master Prompt)** into Claude Code as the first message of the session.
   It sets the rules for everything that follows and stays in effect for the whole run.
3. Then paste **one phase prompt at a time** from Part 3. Each phase is a self-contained
   unit of work that produces exactly one branch and one merge into `dev`.
4. Do not paste two phases at once. The gate between phases is where you catch drift.

If you want a single hands-off run instead, paste Part 1 followed by:
`Execute phases P0 through P14 in order. Stop after each phase merge and print the phase
report. Continue automatically unless a STOP condition fires.`

---

# PART 1 — MASTER PROMPT

> Paste everything between the rules below as your first message to Claude Code.

---

You are the lead engineer on **Skinlytics** (*AI Skin Intelligence & Personalized
Skincare Planner*), a monorepo with a FastAPI backend, a Next.js (App Router) frontend,
an ML package, and canonical database schemas. You are executing **Milestone 2**
end-to-end in autonomous mode.

## 1. Sources of truth — read these before writing any code

Read in this order and keep them loaded for the whole session. Do not proceed on memory
or assumption; if something is unclear, the answer is in one of these files.

| Priority | File | Why |
|---|---|---|
| 1 | `docs/milestones/milestone_2/mile_2.docx` | **The requirement spec.** Every deliverable in this milestone traces back to a line in this document. Extract it with `python-docx` (it contains three diagram images — extract and read those too; one of them defines the API endpoint table). |
| 2 | `docs/milestones/milestone_2/UI_SPEC.md` | Reverse-engineered design spec for the four dashboards. |
| 3 | `docs/milestones/milestone_2/{User,Consultant,Derma,Admin}.png` | **The visual acceptance criteria.** Open the actual PNGs at full resolution. |
| 4 | `AGENTS.md`, `CLAUDE.md`, `docs/AGENT_WORKFLOW.md` | House rules for agents in this repo. These override anything here that conflicts. |
| 5 | `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/CONVENTIONS.md` | Existing architecture and past decisions. Do not re-litigate a settled decision; extend it. |
| 6 | `database_schemas/*.sql`, `*.txt`, `skinlytics_identity_betterauth.md` | Canonical Postgres / Mongo / Elasticsearch / vector schemas. **The schema files lead; the code follows.** |
| 7 | `PROGRESS.md`, `openapi.json`, `docs/milestones/milestone_3/` | Current state, current API surface, and what comes next (so M2 doesn't block M3). |
| 8 | `web/designs/wireframes/` (82 Stitch screens), `docs/Skinlytics_Stitch_UI_Prompt_Pack_v2.md` | Existing extracted design language. Reuse it; the screenshots refine it, they don't replace it. |

**Rule:** every task you open starts by re-reading the specific section of
`mile_2.docx` (and, for UI work, the specific screenshot) that it implements. Quote the
requirement in the task ledger entry. No requirement, no code.

## 1a. THEME OVERRIDE — read before any UI work

**The screenshots are the authority for STRUCTURE ONLY, not colour.** The project keeps
its existing colour theme (`web/app/globals.css` + `web/lib/themes.ts` + the Stitch
wireframe language). From the four PNGs, reproduce: layout, grids, spans, sidebar trees
(every label and subtitle verbatim), component anatomy, typography scale, spacing,
radii, states, and copy. Do NOT port their violet palette.

Practically:
- Wherever `UI_SPEC.md` or `VISION_CALIBRATION.md` names a hex value, treat it as a
  **semantic role** (primary / primary-soft / success / warning / danger / info /
  canvas / card / border) and map that role onto the EXISTING theme's token for it. If
  the existing theme lacks a needed role token, add the token derived from the current
  theme's palette — never hard-code a screenshot colour.
- P1 changes meaning: skip colour sampling for token values. Instead, audit the existing
  theme, produce the role→existing-token mapping table in UI_EXTRACTION.md, and fill any
  missing roles. Geometry/typography extraction stays exactly as written.
- Verification changes: `extract.py diff` in plain RGB mode can never pass against a
  differently-themed build. All UI loops (P2, P4, P5, P13, P14) use
  `extract.py diff --structural` (colour-invariant edge comparison, threshold
  `--max-pct 8` structure mismatch) instead of the 2% RGB budget. The `strings` gate and
  `grid` row/card-count gates are colour-independent and stay unchanged.
- The score ramp (Good/Fair/Poor) and status semantics stay; render them with the
  existing theme's success/warning/danger tokens.

Where a phase prompt or goal condition below says "diff --max-pct 2", read it as
"diff --structural --max-pct 8". This section overrides those lines.

## 2. Git protocol — strictly enforced, no exceptions

```bash
# Start of every unit of work
git checkout dev
git status --porcelain          # must be clean; if not, STOP and report
git checkout -b <type>/<scope>-<slug>

# ... work, committing in small logical steps ...

# End of the unit of work, only after all verification gates pass
git checkout dev
git merge --no-ff <branch> -m "merge: <branch> — <one-line summary>"
git branch -d <branch>
```

**Hard rules:**

- `dev` is the integration branch. **Every** feature, fix, chore, doc change, and
  experiment gets its own branch cut from `dev`. Never commit directly to `dev`.
- **This repository stays local for this milestone.** Do not run `git push`, `git pull`,
  `git fetch`, `git remote add`, or open a PR. Nothing leaves the machine.
- Never touch `main` / `master`.
- Merge with `--no-ff` so each phase is one identifiable merge commit in `dev`'s history.
- If a merge conflicts, resolve it **on the feature branch** (`git merge dev` into the
  feature branch first), re-run the verification gates, then merge into `dev`.
- Delete the feature branch after a successful merge.
- Never `git reset --hard`, `git checkout -- .`, `git clean -fd`, or force anything on a
  branch with uncommitted work you did not author in this session.
- Branch types: `feat/` · `fix/` · `chore/` · `docs/` · `test/` · `refactor/`
  Examples: `feat/m2-role-sidebar`, `feat/m2-scoring-engine`, `test/m2-pytest-qa`.
- Commit format (Conventional Commits, with the task ID):
  `feat(web/sidebar): role-aware nav config for 4 roles [M2-P2-T03]`

## 3. Auto mode — how autonomously to work

Work continuously without asking for permission. Specifically:

**Proceed without asking when:** creating branches, writing code and tests, installing
shadcn components, adding dependencies that are already in the ecosystem the repo uses,
running lint/typecheck/test/build, writing migrations, updating docs, merging into `dev`
after gates pass, and choosing between implementation options where the spec is silent
(pick the one most consistent with existing code, then log it).

**STOP and ask when — and only when:**

- A requirement in `mile_2.docx` contradicts an existing schema in `database_schemas/`
  and reconciling it means a destructive migration (dropping a column or table with data).
- A change would break an API contract that `docs/milestones/milestone_3/` depends on.
- Secrets, credentials, `.env` values, or third-party account setup are required.
- The work needs a network egress the sandbox blocks, or a paid/external service.
- Two source-of-truth documents conflict and both readings are defensible, **and** the
  conflict is not already answered in `UI_SPEC.md §7`.
- You are about to delete or rewrite more than ~200 lines of code you did not write in
  this session.

Everything else: decide, log the decision in `docs/DECISIONS.md` with a one-paragraph
rationale, and keep moving.

**Never fake progress.** If something cannot be built, write the task ledger entry as
`BLOCKED` with the reason. Do not stub a function, mark it done, and move on. Do not
weaken an assertion to make a test pass. Do not `# type: ignore` or `as any` your way
through a type error — fix the type. A failing gate is information, not an obstacle.

## 4. Skills and plugins — use them, don't hand-roll

This CLI has plugins and skills installed. **First action of the session:** enumerate what
is actually available and write the result into the task ledger:

```bash
# discover, then use — do not assume any of these are present
/plugin            # list installed plugins
ls .claude/skills/ .agents/skills/
cat skills-lock.json
```

Expected in this repo: **superpowers**, **ponytail**, **shadcn**,
**ui-ux-pro-max**, **frontend/frontend-design**, **migrate-radix-to-base**.
If a named skill or plugin is missing, record it as `UNAVAILABLE` in the ledger and say
so in the phase report — do not silently substitute your own approach and do not pretend
it was used.

**Routing table — which skill for which work:**

| Work | Skill / plugin |
|---|---|
| Planning a phase, decomposing tasks, spawning parallel subagents, TDD loops, systematic debugging | **superpowers** |
| Any screenshot reverse-engineering, visual hierarchy, spacing/type/colour decisions, design critique passes | **ui-ux-pro-max** |
| Component selection, install, and correct usage of shadcn primitives | **shadcn** |
| Building the actual React components, layout implementation, responsive behaviour | **frontend / frontend-design** |
| Radix→Base migrations if the repo's primitives need it | **migrate-radix-to-base** |
| Whatever **ponytail** provides — read its SKILL.md at discovery time and route accordingly | **ponytail** |
| Pixel sampling, OCR, region detection, fidelity diffing | **`tools/vision/` toolkit** (§5) — used *with* ui-ux-pro-max, not instead of it |

**Rules of use:**

- Before building any UI, run a **ui-ux-pro-max** pass over the relevant screenshot and
  write down the extracted system *before* writing JSX. Design first, code second.
- Never hand-write a component that shadcn already provides. Install it, then compose.
  Check what's already in `web/components/ui/` before installing anything.
- Use **superpowers** to decompose each phase into tasks and to run independent tasks in
  parallel subagents where they touch disjoint files. Do not parallelise work that edits
  the same file.
- Run a **ui-ux-pro-max critique pass** at the end of every UI phase against the source
  screenshot, and fix what it finds before merging.

## 5. Vision analysis & OCR — how to actually read the screenshots

Native vision alone gives you impressions, not measurements. A 1536px screenshot read as a
single image loses 12px subtitles, and "looks like violet" is not a hex value. Reverse-
engineering to pixel fidelity needs **three channels**, cross-checked:

| Channel | Gives you | Fails at |
|---|---|---|
| **Native vision** on upscaled crops | Semantics — "this is a donut with a two-line centre label", icon identity, layout intent | Exact hex, exact spacing, verbatim long strings |
| **OCR** (Tesseract, word-level with bounding boxes) | Verbatim strings and where they sit | Symbols, small muted text, two-line labels, ₹ |
| **Programmatic pixel/geometry analysis** (PIL + OpenCV) | Exact colours, card bounds, gutters, radii, grid spans | Knowing what anything *means* |

**Never trust one channel alone.** A string enters the spec only when OCR and vision agree,
or when vision on a 3× crop settles the disagreement. Log which channel each value came from.

### 5.1 Toolchain setup (P0, one time)

```bash
# system OCR engine
sudo apt-get update && sudo apt-get install -y tesseract-ocr libtesseract-dev

# python — install into ml/ or a dedicated tools venv, NOT backend runtime deps
uv pip install pillow pytesseract opencv-python-headless numpy scikit-learn imagehash

# node — for visual regression inside Playwright
cd web && pnpm add -D pixelmatch pngjs
```

Verify with `tesseract --version` and a one-line pytesseract import. If OCR cannot be
installed in this environment, record it as `UNAVAILABLE` in the ledger, fall back to
vision-on-upscaled-crops only, and **say so in every phase report that depended on it** —
do not silently downgrade and present the result as measured.

### 5.2 Commit the toolkit — `tools/vision/`

Build this as a real, committed CLI, not a throwaway script. P13 reuses it for visual
regression and every future milestone reuses it for its own screenshots.

```
tools/vision/
  extract.py          # CLI entrypoint
  regions.py          # contour detection → card bounding boxes
  palette.py          # k-means colour extraction
  ocr.py              # word-level OCR with bboxes + confidence
  diff.py             # pixel comparison
  README.md
```

| Subcommand | Does |
|---|---|
| `probe <img>` | Dimensions, DPI scale factor, top-N dominant colours |
| `crop <img> --region <name\|x,y,w,h> --scale 3` | Named or explicit crop, upscaled with LANCZOS, written to `build/crops/` for vision reading |
| `ocr <img> [--tsv] [--upscale 3] [--psm 6]` | Word-level text with bounding boxes and per-word confidence |
| `sample <img> --points x,y;x,y` | Exact hex at coordinates |
| `palette <img> --k 12` | Dominant colours with hex + coverage %, sorted |
| `regions <img>` | Card/panel bounding boxes → derived 12-col spans, gutters, radii, paddings |
| `diff <a> <b> [--ignore-regions ...]` | Pixel mismatch %, plus a diff PNG highlighting differences |

Everything writes machine-readable output (JSON/TSV) alongside the human-readable summary,
so the extraction is reproducible rather than a one-off reading.

### 5.3 The extraction protocol — run in this order

1. `probe` each of the four PNGs. Record the scale factor (these are ~1536px captures of a
   ~1440px viewport, so ≈1.067 — confirm, don't assume).
2. `crop` each screenshot into: brand block, sidebar (in two vertical halves), topbar, and
   every dashboard card individually. Upscale 3×. Write to
   `docs/milestones/milestone_2/build/crops/<role>/`.
3. **Read every crop with native vision.** This is where structure, icons, and intent are
   understood. Do not skip to OCR.
4. `ocr --tsv` each crop. Reconcile against step 3 word by word.
5. `palette` and `sample` → the token values that replace the estimates in `UI_SPEC.md §1`.
6. `regions` → grid spans, gutters, radii, paddings that replace the estimates in
   `UI_SPEC.md §1.3` and `§4`.
7. Write `docs/milestones/milestone_2/UI_EXTRACTION.md`: one table per role listing every
   string, its bounding box, its source channel (`vision` / `ocr` / `both`), and confidence.
   Flag every low-confidence value for manual vision confirmation.
8. Only then update `UI_SPEC.md` and start building.

### 5.4 Known OCR failure modes on these four screenshots

Check every one of these by hand. They *will* occur:

- **`₹` is unreliable** — comes back as `2`, `R`, `%`, or nothing. Every currency string
  (`₹24.8L`, `₹24,80,500`, `₹349`, `₹1,250`) must be vision-confirmed, not OCR-trusted.
- **Indian digit grouping** (`24,80,500`) gets re-grouped Western-style or split into
  separate tokens. Reassemble by bounding box, then confirm visually.
- **12px muted subtitles** are unreadable at native scale — the sidebar's second lines are
  exactly this case. Always upscale ≥3× before OCR, and confirm with vision regardless.
- **Glyphs are not text**: ✓ checks, → arrows, ↑↓ deltas, › chevrons, ✨ sparkles, the 👋
  emoji, the ⋮ row menu, and the score-ring smiley. Vision identifies these; OCR will
  either drop them or invent characters.
- **Two-line labels** ("Acne &" / "Post Acne Marks", "Dryness &" / "Uneven Tone") return as
  separate rows. Rejoin by x-overlap and vertical adjacency before treating them as strings.
- **Suffixes split from values**: `/100`, `/ 10`, `%`, `L`. Reassemble by proximity.
- **Numbers on coloured arcs** (score rings) sit on low-contrast backgrounds and score low
  confidence. Read these with vision.
- **Sortable-column carets** (`Skin Type ▾`) get read as letters.

### 5.5 Icon identification

Crop each sidebar and card icon at 4×, read it with vision, and map it to a specific
`lucide-react` export name. Record the full mapping in `UI_EXTRACTION.md`. Do not infer an
icon name from its label — "Reports" could be `FileText`, `ClipboardList`, or `BarChart3`,
and the screenshot shows exactly one of them.

### 5.6 Closing the loop — numeric fidelity verification

After building any screen, verify with the same pipeline rather than by eye:

1. Playwright-screenshot the built route at 1440×900 into
   `docs/milestones/milestone_2/build/<role>-dashboard.png`.
2. Run `ocr` over the build and diff the string set against the source screenshot's string
   set. Report strings **missing**, **added**, and **altered**.
3. Run `palette` over both and report colour deltas.
4. Run `regions` over both and report layout deltas (card counts, spans, gutters).
5. Run `diff` and report pixel mismatch %, ignoring regions that legitimately differ
   (avatar photos, product images, illustrated graphics).

**Target: <2% pixel mismatch on layout regions, and a zero-item "missing strings" list.**
Put these four numbers in the phase report. "Looks close" is not a result; a number is.

## 6. Verification gates — nothing merges until these are green

Run from the repo root (adapt to the actual `Makefile` targets — check `make help` first):

```bash
# Backend
cd backend && uv run ruff check . && uv run ruff format --check .
cd backend && uv run mypy app        # if configured
cd backend && uv run pytest -q

# Frontend
cd web && pnpm lint && pnpm typecheck && pnpm build
cd web && pnpm exec playwright test   # phases that touch UI

# Contract
# regenerate openapi.json and web/lib/api-types.ts; both must be committed in the same
# branch as the endpoint change that caused them to move
```

Gate rules:

- **No new failures, and no new skipped tests.** If a test was already failing on `dev`
  before your branch, note it in the phase report and leave it alone unless the phase
  owns it.
- Coverage on new backend logic (scoring, routine generation, ingredient rules) must be
  meaningful — assert on values and edge cases, not just "it returns 200".
- CI configs in `.github/workflows/` must stay green in principle; if you change build
  inputs, update the workflow in the same branch.

## 7. Definition of Done — every task, no exceptions

A task is done when **all** of the following are true:

1. It implements a requirement traceable to `mile_2.docx` (quoted in the ledger entry).
2. Code follows `docs/CONVENTIONS.md` and the patterns already in the touched module.
3. Tests exist and pass: pytest for backend logic, Playwright for user-visible flows.
4. Types are complete — Pydantic models backend-side, TypeScript types frontend-side,
   generated from OpenAPI where the boundary is crossed.
5. Loading / empty / error states exist for any UI it adds.
6. `docs/` updated if behaviour, architecture, or a contract changed;
   `docs/DECISIONS.md` updated if a judgement call was made.
7. `PROGRESS.md` updated with the task ID, status, and date.
8. All verification gates green.
9. Committed on its own branch and merged into `dev` with `--no-ff`.

## 8. Task IDs, ledger, and reporting

Task ID format: `M2-P<phase>-T<nn>` — e.g. `M2-P07-T03`.

Maintain `docs/milestones/milestone_2/M2_TASK_LEDGER.md` as the single live view:

```markdown
| ID | Phase | Task | Branch | Status | Spec ref | Notes |
|----|-------|------|--------|--------|----------|-------|
| M2-P02-T01 | P2 | Role nav config for 4 roles | feat/m2-role-sidebar | DONE | UI_SPEC §3 | 5 types incl. Normal (C1) |
```

Status vocabulary: `TODO` · `IN_PROGRESS` · `BLOCKED` · `DONE` · `DEFERRED`.

**Phase report** — print this after every phase merge, and append it to the ledger:

```
PHASE Pn — <name>
Branch:        <branch> → merged into dev (<sha>)
Tasks:         n done / n total  (list any BLOCKED / DEFERRED with reasons)
Skills used:   superpowers, ui-ux-pro-max, shadcn, …   (unavailable: …)
Files:         +n / ~n / -n
Gates:         ruff ✓  mypy ✓  pytest 142 passed ✓  lint ✓  typecheck ✓  build ✓  e2e ✓
Decisions:     <one line each, and where logged>
Contract:      <API/schema changes, or "none">
Next:          P<n+1> — <name>
```

## 9. Engineering standards specific to this repo

- **Schemas lead.** `database_schemas/` is canonical. Any model change starts there, then
  an Alembic migration in `backend/app/migrations/versions/`, then the SQLAlchemy model.
  Never let a model drift from the schema file.
- **Service layer, not fat routers.** Business logic lives in
  `backend/app/services/<domain>/`. Routers validate, delegate, and serialise. Scoring
  and routine generation must be pure, importable, unit-testable functions with no
  request objects in their signatures.
- **One shared shell.** `web/components/app-shell/` serves all four roles from
  `web/lib/nav-config.ts` + `web/lib/permissions.ts`. Four copies of a sidebar is a
  phase failure.
- **Server Components by default**; `"use client"` only where interaction demands it
  (charts, sliders, carousels, selects).
- **Contract-shaped fixtures.** Mock data in `web/lib/fixtures/` must match the real API
  response types exactly, so wiring live data is a fetch swap and nothing else.
- **Money and numbers.** `Intl.NumberFormat('en-IN')` for ₹ (`₹24,80,500`, `₹24.8L`).
  Tabular numerals on all metrics.
- **No magic numbers in scoring.** Weights, benchmarks, and thresholds live in one
  documented constants module, mapped to the formula in `mile_2.docx`.
- **Accessibility is a gate, not a polish step** — see `UI_SPEC.md §6`.

## 11. Convergence loops — how each phase runs

Every phase runs as a **loop against a measurable exit condition**, not as a list of
steps you perform once. You do not stop when you have done the work; you stop when the
numbers say the work holds.

### 11.1 The mechanism: `/goal`

`/goal <condition>` sets a completion condition. After each turn, a separate small model
reads the transcript and decides whether the condition holds. If it does not, you get
another turn automatically with the evaluator's reason as guidance. The goal clears
itself when the condition is met. `/goal` with no argument shows turns and tokens spent;
`/goal clear` aborts. Requires Claude Code v2.1.139+.

Pair it with auto mode. `/goal` removes the per-turn stop; auto mode removes the per-tool
approval prompt. You need both for an unattended run.

**The constraint that shapes every condition below:** the evaluator *cannot run commands
or read files*. It only sees what you have surfaced in the transcript. So a condition like
"the tests pass" is only checkable if you actually ran the tests and their output is in the
conversation. Every phase goal is therefore written as *"you have printed X showing Y"*,
and every loop iteration must **print its gate output** rather than summarising it. A
summary of a passing test is not evidence; the test output is.

### 11.2 Writing a condition

Four parts, in this order:

1. **Outcome** — the end state, not the work. "The sidebar renders for all four roles with
   every label and subtitle from UI_SPEC §3" — not "build the sidebar".
2. **Proof** — how you demonstrate it, as a command whose output lands in the transcript.
   "`extract.py strings` prints an empty missing list for each of the four roles."
3. **Guardrails** — what must not break on the way. "No file outside `web/` is modified;
   `pnpm typecheck` still exits 0."
4. **Stop clause** — a bound, so a stuck loop ends. "Or stop and report BLOCKED after 15
   turns, or after 3 consecutive turns with no improvement in the failing metric."

Conditions can be up to 4,000 characters. Use the room: a vague goal is the single biggest
cause of a loop that runs forever or exits early.

### 11.3 Loop discipline inside a turn

- **One change per iteration when diagnosing.** Change the largest single contributor to
  the failing metric, re-measure, print the number. If you change five things and the
  number moves, you have learned nothing about which one mattered.
- **Print the metric every iteration**, in the same format, so the trend is visible in the
  transcript. `iteration 4: missing strings 7 → 3, mismatch 4.1% → 2.6%`.
- **Regression guard.** Re-run the gates that already passed. A loop that fixes fidelity by
  breaking typecheck has not converged.
- **Stall detection.** Three iterations with no improvement means the approach is wrong,
  not that it needs a fourth try. Stop, write what you tried and what the numbers did, mark
  the task `BLOCKED`, and return control.
- **Never move the goalposts.** Loosening a threshold, adding to an ignore-region list to
  hide a real diff, or deleting a failing assertion ends the loop dishonestly. If a
  threshold is genuinely wrong, say so explicitly, justify it, and log it in
  `docs/DECISIONS.md` — do not quietly edit it mid-loop.

### 11.4 The standard exit conditions

| Phase type | Exit condition |
|---|---|
| Backend logic (P9–P12) | `pytest -q` printed, 0 failed, 0 new skips; `ruff` and `mypy` printed clean |
| UI fidelity (P2, P4, P5) | `extract.py strings` printed with an empty missing list; `extract.py diff` printed <2%; `pnpm lint && typecheck && build` printed clean; Playwright printed green |
| Extraction (P0, P1) | Every required artefact file exists and its contents are printed; no value in it is still an estimate |
| QA (P13) | Full suite printed green, the three mandated tests named in the output, CI config committed |
| Integration (P14) | Every screen printed as fetching live data; seed + full-stack Playwright run printed green |

### 11.5 Failure is a result, not a reason to keep going

A loop that cannot converge must **report**, not grind. When you hit the stop clause, print:
the metric's starting value, its best value, what you changed, and your best hypothesis for
why it is stuck. That is a useful outcome. Twenty more turns of the same approach is not.

## 12. Sequencing rule

UI phases (P1–P5) run against typed fixtures whose shapes are frozen in P0. Backend
phases (P6–P12) implement those exact shapes. P13 verifies. P14 swaps fixtures for live
calls. This is deliberate: it lets pixel-accurate UI and correct backend logic proceed
without blocking each other, at the cost of one integration phase at the end. Do not
"save time" by binding screens to invented response shapes before the contract is frozen.

---

# PART 2 — PHASE MAP

| Phase | Name | Branch | Depends on | Primary output |
|---|---|---|---|---|
| **P0** | Recon, vision toolchain, contract freeze & ledger | `chore/m2-recon` | — | `tools/vision/`, gap analysis, frozen API contract, ledger |
| **P1** | Design system extraction | `feat/m2-design-system` | P0 | Sampled tokens, primitives, theme |
| **P2** | Role-aware app shell & sidebar | `feat/m2-role-sidebar` | P1 | One shell, 4 nav trees |
| **P3** | Dashboard widget kit | `feat/m2-widget-kit` | P1 | 14 shared widgets + states |
| **P4** | User & Admin dashboards | `feat/m2-dashboards-user-admin` | P2, P3 | 2 pixel-matched screens |
| **P5** | Consultant & Dermatologist dashboards | `feat/m2-dashboards-clinical` | P2, P3 | 2 pixel-matched screens |
| **P6** | In-built visual datasets & assets | `feat/m2-visual-datasets` | P0 | `skin_types.json`, `skin_concerns.json`, SVGs |
| **P7** | Skin profile & lifestyle tracking | `feat/m2-skin-profile` | P6 | Profile CRUD, sleep/water/env tracking |
| **P8** | Assessment wizard UI | `feat/m2-assessment-wizard` | P3, P6 | 4-step wizard + payload builder |
| **P9** | Assessment submit API & persistence | `feat/m2-assessment-api` | P6, P7 | `POST /api/v1/assessment/submit` |
| **P10** | Weighted scoring engine | `feat/m2-scoring-engine` | P9 | Formula + `GET /assessment/score/{id}` |
| **P11** | Dynamic routine generator | `feat/m2-routine-generator` | P10 | AM/PM pipelines + `POST /routine/generate` |
| **P12** | Ingredient intelligence | `feat/m2-ingredient-intelligence` | P6, P11 | Suitability, interactions, allergy detection |
| **P13** | QA suite — pytest + Playwright + CI | `test/m2-qa-suite` | P8–P12 | The three mandated tests + e2e |
| **P14** | Live integration & milestone close-out | `feat/m2-integration` | all | Fixtures → live APIs, M2 report |

---

# PART 3 — PHASE PROMPTS

Paste one at a time, after the master prompt.

---

## P0 — Recon, vision toolchain, contract freeze & task ledger

**Branch:** `chore/m2-recon`  ·  **Skills:** superpowers  ·  **No application code.**

```
LOOP — set this before you begin, and let it drive the phase:

/goal Phase 0 is complete. I have PRINTED, in this conversation: (1) the output of the skill/plugin discovery commands, listing which of superpowers, ponytail, shadcn, ui-ux-pro-max, frontend, migrate-radix-to-base are installed and which are UNAVAILABLE; (2) `tesseract --version` and a successful run of `tools/vision/extract.py probe` on all four dashboard PNGs, `grid` on User.png, `crop` of a sidebar at 3x, and `ocr` of that crop showing legible subtitles; (3) the full contents of docs/milestones/milestone_2/M2_GAP_ANALYSIS.md, M2_API_CONTRACT.md, and M2_TASK_LEDGER.md; (4) the resolution of each of C1 through C7 with its rationale. tools/vision/ is committed with all seven subcommands and a README. Guardrails: no application code is written in this phase, and `git status` printed clean on dev before and after the merge. Stop and report BLOCKED after 15 turns, or after 3 consecutive turns with no new artefact completed.

Start Milestone 2, Phase 0.

Cut chore/m2-recon from dev.

1. DISCOVERY
   - Run the skill/plugin discovery from master prompt §4. Record what is available and
     what is missing.
   - Read every source-of-truth file in master prompt §1. Extract mile_2.docx with
     python-docx INCLUDING its three embedded images (word/media/) — one of them is the
     API endpoint table, one is the wizard flow diagram, one is the system pipeline. Read
     each with native vision AND run OCR over them at 3x upscale; their content is
     requirement, not decoration. Transcribe the endpoint table into the contract below.

2. VISION TOOLCHAIN (master prompt §5)
   - Install the toolchain per §5.1 and verify tesseract works. If it cannot be installed,
     record UNAVAILABLE and say so in the phase report.
   - Build and commit tools/vision/ per §5.2 with all seven subcommands
     (probe, crop, ocr, sample, palette, regions, diff), machine-readable output, and a
     README. This is a real deliverable of P0, not scaffolding — P1 measures the design
     system with it and P13 runs visual regression through it.
   - Smoke-test it: `probe` all four PNGs, `crop` one sidebar at 3x, `ocr` that crop, and
     confirm the output is legible. Paste the smoke-test result into the phase report.

3. GAP ANALYSIS
   Produce docs/milestones/milestone_2/M2_GAP_ANALYSIS.md. For each Milestone 2
   deliverable, state: what exists in the repo today (with file paths), what is missing,
   what is partially built and needs extension. Cover at minimum:
     - Skin profile management + lifestyle/sleep/hydration/environment tracking
     - Skin assessment engine (concern identification, scoring, prioritisation, risk)
     - Personalized routine generator (AM/PM, weekly, seasonal, adaptive)
     - Ingredient intelligence (suitability, interactions, allergy detection, education)
     - The in-built visual datasets and wizard UI
     - The three FastAPI endpoints
     - The three mandated pytest suites
     - The four role dashboards and sidebars
   Check what backend/app/services/{skin_profile,scores,routines,ingredients,...} and
   web/app/{(user),admin,consultant,dermatologist}/ already contain. Do not assume empty.

4. CONTRACT FREEZE
   Produce docs/milestones/milestone_2/M2_API_CONTRACT.md with the exact request and
   response shapes for:
     POST /api/v1/assessment/submit
     GET  /api/v1/assessment/score/{id}
     POST /api/v1/routine/generate
   plus the read models the four dashboards need. Reconcile with the existing
   openapi.json — extend the existing surface, do not invent a parallel one.
   Resolve UI_SPEC.md §7 items C1–C7 and record each in docs/DECISIONS.md.

5. LEDGER
   Create docs/milestones/milestone_2/M2_TASK_LEDGER.md with every task for P0–P14,
   pre-filled with IDs, phases, branches, and spec references. Update PROGRESS.md.

Gates: tools/vision/ must run cleanly; everything else is markdown. Merge to dev with
--no-ff. Print the phase report including the vision smoke-test output.
```

---

## P1 — Design system extraction

**Branch:** `feat/m2-design-system`  ·  **Skills:** ui-ux-pro-max, shadcn, frontend-design

```
LOOP:

/goal Phase 1 is complete. I have PRINTED the full contents of docs/milestones/milestone_2/UI_EXTRACTION.md, and every colour and dimension in it carries a measured value plus a source channel (vision / ocr / both) and a confidence — zero entries still say "estimate". I have PRINTED the `extract.py palette --accent` and `extract.py sample` output that each colour derives from, and the `extract.py grid` output that each dimension derives from. UI_SPEC.md section 1 has been updated in this branch so no estimated hex remains. I have PRINTED `pnpm lint && pnpm typecheck && pnpm build` completing with exit code 0, and PRINTED a grep showing zero raw hex literals in web/components. Guardrail: no component behaviour changes in this phase, only tokens and primitives. Stop and report BLOCKED after 20 turns, or after 3 consecutive turns with no reduction in the count of unmeasured values.

Milestone 2, Phase 1: extract the real design system from the screenshots.

Cut feat/m2-design-system from dev.

Read UI_SPEC.md §0 and §1 first, then run the ui-ux-pro-max skill over all four PNGs in
docs/milestones/milestone_2/.

1. MEASURE, DON'T GUESS. Run the full extraction protocol from master prompt §5.3 using
   the tools/vision/ toolkit built in P0 — probe, crop at 3x, read every crop with native
   vision, OCR every crop, then palette / sample / regions. Extract:
     - exact hex for page background, card background, card border, primary violet, both
       active-nav variants (solid and soft), every KPI icon tint, every donut and chart
       series colour, and every badge
     - measured sidebar width, card radius, gutter, card padding, row gap, and font sizes,
       in screenshot pixels converted to CSS px via the probed scale factor
     - every visible string with its bounding box
   Commit docs/milestones/milestone_2/UI_EXTRACTION.md with a source-channel column
   (vision / ocr / both) and confidence per value, per master prompt §5.3 step 7.
   Apply the §5.4 failure-mode checks before trusting any OCR output — especially every ₹
   string and every 12px sidebar subtitle.
   Map every sidebar and card icon to a lucide-react export name per §5.5.

2. Replace the estimated hex values in UI_SPEC.md §1 with the sampled ones, in this
   branch. The spec becomes accurate; it does not stay a guess.

3. Implement the token layer in web/app/globals.css and web/lib/themes.ts: colour,
   typography scale, radii, spacing, shadow, and the categorical chart palette. Wire it
   through the Tailwind/shadcn theme so components consume tokens, never raw hex.
   Verify against the existing tokens in web/designs/wireframes/ and
   docs/Skinlytics_Stitch_UI_Prompt_Pack_v2.md — extend that language, don't fork it.

4. Add the score colour ramp (75+/60-74/<60 → Good/Fair/Poor) as a single exported
   helper used by every score ring, chip, and badge across all four roles.

5. Audit web/components/ui/ against what the screenshots need. Install missing shadcn
   primitives via the shadcn skill (likely: card, badge, avatar, table, select, slider,
   checkbox, progress, separator, sheet, tooltip, skeleton, scroll-area, dropdown-menu,
   sidebar). Do not hand-write anything shadcn provides.

6. Build a token showcase route at web/app/(dev)/design-system/page.tsx rendering every
   token, ramp, and primitive, so drift is visible at a glance.

Gates: pnpm lint && pnpm typecheck && pnpm build clean. No raw hex outside the token
files. Every token in UI_SPEC.md §1 must now be a measured value with a recorded source
channel — zero remaining estimates. Merge to dev with --no-ff. Print the phase report.
```

---

## P2 — Role-aware app shell & sidebar

**Branch:** `feat/m2-role-sidebar`  ·  **Skills:** ui-ux-pro-max, shadcn, frontend

```
LOOP:

/goal The role sidebar is complete for all four roles. I have PRINTED, for each of user, consultant, dermatologist, and admin, the output of `tools/vision/extract.py strings` comparing the source sidebar crop against a Playwright screenshot of the built sidebar, and every one shows an EMPTY missing-strings list. I have PRINTED `pnpm lint && pnpm typecheck && pnpm build` at exit 0 and a Playwright run at 0 failures, including a test that asserts every label AND subtitle from UI_SPEC section 3 is present per role. Guardrails: exactly one RoleSidebar component exists (I have printed the file listing proving it), zero nav items use href="#", and permissions filtering happens server-side. Stop and report BLOCKED after 25 turns, or after 3 consecutive turns with no reduction in the total missing-string count across the four roles.

Milestone 2, Phase 2: one app shell, four role sidebars. This is the milestone's headline
UI task — the sidebars must match the screenshots exactly.

Cut feat/m2-role-sidebar from dev. Read UI_SPEC.md §2 and §3, and open all four PNGs.

1. Extend web/lib/nav-config.ts to a typed Record<Role, NavSection[]>:
     type NavItem = { id, label, subtitle?, icon, href, badge?, permission? }
     type NavSection = { id, label?, items: NavItem[] }
   Transcribe the four nav trees from UI_SPEC.md §3 EXACTLY — every label, every
   subtitle, the order, and the section grouping (MAIN MENU / QUICK ACTIONS /
   TOOLS & RESOURCES / SYSTEM & SECURITY).
   Verify every string three ways before committing it: against UI_EXTRACTION.md (P1),
   against a fresh `tools/vision/extract.py ocr` pass over the sidebar crop at 3x, and
   against native vision on that same crop. The 12px subtitles are the highest-risk
   strings in the entire milestone — see master prompt §5.4.
   Note deliberate divergences: consultant has "Skin Concerns Guide", dermatologist has
   "Skin Conditions Guide"; their AI-assistant footer captions differ too.

2. Build ONE RoleSidebar in web/components/app-shell/, driven by config:
     - brand block: logo mark + "Skin Intelligence" + role subtitle
     - two-line nav items (label + muted subtitle) at ~52-56px height, radius 10
     - activeVariant prop: "solid" (user/derma/admin) | "soft" (consultant)
     - per-role footer slot: Upgrade to Premium card | Ask AI Assistant (two wordings) |
       Platform Status card
     - lucide-react icons at 18px, strokeWidth 1.75, chosen to match the glyphs in the
       screenshots
   Four sidebar components is a phase failure.

3. Build the topbar per UI_SPEC.md §2.3: greeting + subtitle, optional search field,
   notification bell with count badge, date pill, avatar cluster with role caption, and
   the consultant's "+ Add New Client" primary button.

4. Gate visibility through web/lib/permissions.ts. A user must never receive admin nav
   items in their payload — filter server-side, not with CSS.

5. Every nav item gets a real route. Create stub pages with a titled empty state for any
   route that doesn't exist yet. Zero href="#", zero dead links.

6. Responsive per UI_SPEC.md §6: off-canvas sheet below 1024px, hamburger trigger,
   focus trap, aria-current on the active item.

7. Run a ui-ux-pro-max critique pass against each screenshot and fix what it finds.

Gates: lint, typecheck, build. Playwright test asserting, for each of the 4 roles, that
every expected label AND subtitle is present in the rendered sidebar. Screenshot each
sidebar to docs/milestones/milestone_2/build/, then close the loop per master prompt §5.6:
OCR the build, diff its string set against the source sidebar crop, and report missing /
added / altered strings. The missing list must be empty.
Merge to dev with --no-ff. Print the report with those numbers.
```

---

## P3 — Dashboard widget kit

**Branch:** `feat/m2-widget-kit`  ·  **Skills:** ui-ux-pro-max, shadcn, frontend

```
LOOP:

/goal The dashboard widget kit is complete. I have PRINTED a listing of web/components/dashboard/ and web/components/charts/ showing all fourteen widgets from UI_SPEC section 5, PRINTED the design-system showcase route rendering each widget in loading, empty, and error state, and PRINTED `pnpm lint && pnpm typecheck && pnpm build` at exit 0 with a Playwright smoke test on the showcase route passing. I have PRINTED unit test results for the score-ramp mapping, percentage maths, and en-IN currency formatting. Guardrail: no widget fetches its own data — I have printed a grep showing zero fetch/useQuery calls inside these directories. Stop and report BLOCKED after 20 turns, or after 3 turns with no widget newly completed.

Milestone 2, Phase 3: build the shared widget kit every dashboard is assembled from.

Cut feat/m2-widget-kit from dev. Read UI_SPEC.md §5 and study how the same widget appears
across all four screenshots — the differences are props, not new components.

Build in web/components/dashboard/ and web/components/charts/:
  StatCard, ScoreRing, ScoreChip, DonutBreakdown, TrendChart, RankedBarList,
  RosterTable, TimelineList, ChecklistStrip, RoutineChain, ProductCarousel,
  InsightBanner, StatusTileGrid, QuickActionGrid

Requirements:
  - Fully typed props, no `any`. Data in via props only — no widget fetches its own data.
  - Every widget ships loading (skeleton matching real geometry), empty (one line of
    direction + an action), and error (says what failed) states.
  - StatCard supports both layouts seen in the screenshots: icon-right with a big value
    (user role) and icon-left-circular with label-above-value (consultant/derma/admin),
    plus a delta chip (↑ green / ↓ red / — neutral) or a footer link.
  - Charts use the repo's existing chart library (check web/components/charts/ and
    package.json before adding a dependency). Violet stroke, light violet gradient area
    fill, dotted markers, floating tooltip card, optional "This Month ▾" range select.
  - DonutBreakdown supports both legend modes: percent-only (user) and count+percent
    (consultant/derma/admin), with a two-line centre label.
  - RosterTable: sortable headers, avatar cells, inline ScoreRing cells, status pills,
    row kebab menu, and a header action link.
  - All numeric output uses tabular-nums; currency uses Intl.NumberFormat('en-IN').
  - Colour is never the only signal — every chip and pill carries its word.

Add each widget to the design-system showcase route from P1, in all three states.
Unit-test the pure bits (score ramp mapping, percentage maths, en-IN formatting).

Gates: lint, typecheck, build, Playwright smoke on the showcase route.
Merge to dev with --no-ff. Print the phase report.
```

---

## P4 — User & Admin dashboards

**Branch:** `feat/m2-dashboards-user-admin`  ·  **Skills:** ui-ux-pro-max, frontend, shadcn

```
LOOP:

/goal The User and Admin dashboards match their screenshots. For BOTH routes I have PRINTED: `tools/vision/extract.py strings` against the source PNG showing an empty missing-strings list; `tools/vision/extract.py diff --max-pct 2` exiting 0; and `extract.py grid` output for source and build showing the same row count and card counts per row. I have PRINTED `pnpm lint && pnpm typecheck && pnpm build` at exit 0 and Playwright at 0 failures. I have PRINTED the UI_SPEC section 8 fidelity checklist with every box ticked and a one-line justification for every region passed to --ignore. Guardrails: both pages are assembled from the P3 widget kit with no one-off components defined inside a page file, and no fixture value contradicts the P0 API contract. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns where neither the missing-string count nor the mismatch percentage improves.

Milestone 2, Phase 4: build the User and Admin dashboards to match User.png and Admin.png.

Cut feat/m2-dashboards-user-admin from dev. Read UI_SPEC.md §4.1 and §4.4 with both PNGs
open at full resolution.

1. Typed, contract-shaped fixtures in web/lib/fixtures/ using the exact numbers from the
   screenshots (78/100, 12,845 users, ₹24,80,500, 99.9% uptime, …). Shapes must match the
   P0 contract so P14 is a fetch swap.

2. User dashboard at web/app/(user)/dashboard/page.tsx — 4 rows per UI_SPEC §4.1:
     Row 1: 5 KPI cards (Skin Health Score with the smiley progress ring, Skin Type with
            T-Zone/Cheeks breakdown, Top Concerns, Skin Age, Hydration Level with bar)
     Row 2: Today's Routine (AM/PM RoutineChains with check badges), Skin Health Progress
            (area chart + range select + footer sentence), AI Skin Insights (tinted lead
            insight with bolded ingredient names + 3 icon rows)
     Row 3: Recommended Products carousel (Best Match badge, ₹ price, ★ rating) and
            Skin Concerns Overview donut
     Row 4: full-width Daily Checklist with progress bar and checkbox chips

3. Admin dashboard at web/app/admin/dashboard/page.tsx — 4 rows per UI_SPEC §4.4:
     Row 1: 6 KPI cards
     Row 2: User Overview donut · User Growth line chart · Assessments Overview donut
     Row 3: Top Skin Concerns bars · Revenue Overview · Recent Activity feed
     Row 4: System Health tiles · Quick Actions grid · Platform Analytics cells
   Per-card "This Month ▾" selects must actually change the rendered range.

4. Assemble from the P3 kit only. If a screen needs a shape the kit lacks, add it to the
   kit — do not write a one-off component inside a page.

5. Run the UI_SPEC.md §8 fidelity checklist for both screens, then close the loop per
   master prompt §5.6: Playwright-screenshot at 1440x900 into
   docs/milestones/milestone_2/build/, run ocr / palette / regions / diff against the
   source PNGs, and report the four numbers (missing strings, colour delta, layout delta,
   pixel mismatch %). Ignore avatar photos, product images, and illustrated graphics in
   the diff. Target: <2% mismatch, zero missing strings. Then run a ui-ux-pro-max critique
   pass and fix what it finds.

Gates: lint, typecheck, build, Playwright (both routes render, key strings present).
Merge to dev with --no-ff. Print the phase report including the fidelity checklist result
and the four §5.6 fidelity numbers per screen.
```

---

## P5 — Consultant & Dermatologist dashboards

**Branch:** `feat/m2-dashboards-clinical`  ·  **Skills:** ui-ux-pro-max, frontend, shadcn

```
LOOP:

/goal The Consultant and Dermatologist dashboards match their screenshots. For BOTH routes I have PRINTED `extract.py strings` with an empty missing list, `extract.py diff --max-pct 2` exiting 0, and matching `extract.py grid` row and card counts for source versus build. I have PRINTED `pnpm lint && pnpm typecheck && pnpm build` at exit 0 and Playwright at 0 failures. I have PRINTED evidence that the deliberate divergences are preserved: consultant has a 3-cell progress footer and dermatologist a 4-cell footer including a neutral "Stable" delta; consultant says "Skin Concerns Guide" and dermatologist "Skin Conditions Guide"; the dermatologist roster includes a male patient. Guardrail: both roles render from one shared layout with role config, not two copied page files. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns with no improvement in either metric.

Milestone 2, Phase 5: build the Consultant and Dermatologist dashboards to match
Consultant.png and Derma.png.

Cut feat/m2-dashboards-clinical from dev. Read UI_SPEC.md §4.2 and §4.3 with both PNGs open.

These two screens are structurally twins with deliberate differences. Build them from one
shared layout with role-specific config and copy — but do NOT collapse the real
divergences:
  - Consultant: 5 KPIs, client vocabulary, Age/Gender as a sub-line under the name,
    3-cell progress stat footer, "Consultant Tip" banner with one line of copy.
  - Dermatologist: 5 KPIs, patient vocabulary, Age/Gender as its own column, 4-cell stat
    footer (including a neutral "28 Stable —"), "AI Clinical Insights" banner with two
    lines of copy, and a mixed-gender roster (include Rohit Sharma, 32, Male,
    "Hair Fall & Dandruff").

Layout for both (UI_SPEC §4.2/§4.3):
  Row 1: 5 KPI cards, 5th is a link card not a delta card
  Row 2: roster table (span 7) + right column (span 5) stacking the distribution donut
         above the Top Skin Concerns ranked bars
  Row 3: progress chart with in-card stat footer (span 5), Recent Assessments timeline
         (3.5), Upcoming Follow-ups with days-left pills (3.5)
  Row 4: full-width insight banner with a right-aligned "View AI Insights ✨" button

Fixtures use the exact screenshot values (128 clients / 156 patients, the donut splits,
the 42/24/18/9/7 concern bars, the follow-up dates and days-left pills).

Run the UI_SPEC.md §8 fidelity checklist for both screens, close the loop per master
prompt §5.6 (Playwright screenshot → ocr / palette / regions / diff against the source
PNGs → report the four numbers), and run a ui-ux-pro-max critique pass.

Gates: lint, typecheck, build, Playwright, <2% pixel mismatch, zero missing strings.
Merge to dev with --no-ff. Print the report with the fidelity numbers.
```

---

## P6 — In-built visual datasets & assets

**Branch:** `feat/m2-visual-datasets`  ·  **Skills:** superpowers, frontend

```
LOOP:

/goal The in-built visual datasets are complete. I have PRINTED the full contents of skin_types.json and skin_concerns.json, and the four skin types and four concerns defined in mile_2.docx appear VERBATIM with their exact ids, titles, descriptions and backend_enum/backend_field values. I have PRINTED pytest output at 0 failures for a schema-validation suite asserting: every entry has all required fields, ids are unique and SCREAMING_SNAKE, every backend_enum and backend_field maps to a real value in the Postgres schema, and every image_url resolves to a file that exists on disk. I have PRINTED a directory listing of web/public/assets/skin_types/ and web/public/assets/concerns/ showing an SVG for every entry. Guardrail: the doc's literal /assets/... paths are unchanged in the JSON. Stop and report BLOCKED after 20 turns, or after 3 turns with no reduction in failing assertions.

Milestone 2, Phase 6: the in-built visual datasets. Spec: mile_2.docx §"A. Skin Types
In-Built Dataset" and §"B. Skin Concerns In-Built Dataset". Re-read both sections now.

Cut feat/m2-visual-datasets from dev.

1. skin_types.json — copy the doc's four entries VERBATIM (id, title, description,
   image_url, backend_enum) for SKIN_TYPE_OILY, SKIN_TYPE_DRY, SKIN_TYPE_COMBINATION,
   SKIN_TYPE_SENSITIVE. Then add SKIN_TYPE_NORMAL per decision C1 (the Consultant
   dashboard shows Normal as a real skin type), following the identical shape.

2. skin_concerns.json — copy the doc's four entries VERBATIM (CONCERN_ACNE,
   CONCERN_HYPERPIGMENTATION, CONCERN_REDNESS, CONCERN_WRINKLES, each with its
   backend_field). Then extend to the full 10 concerns from mile_2.docx §3 per decision
   C2: Dark Spots, Dry Skin, Oily Skin, Fine Lines, Uneven Skin Tone, and Post Acne Marks
   (which appears throughout the dashboards). Same shape, same field naming discipline.

3. Single source of truth. Store the canonical JSON once and consume it from both sides:
   backend loads and validates it into Pydantic models with enums that MATCH the Postgres
   enums in database_schemas/skinlytics_postgresql_schema_v3.sql; the frontend imports
   typed loaders in web/lib/assessment/. If the Postgres enum lacks Normal or any concern,
   write the Alembic migration in this branch.

4. Assets. Create web/public/assets/skin_types/ and web/public/assets/concerns/ so the
   doc's literal image_url paths resolve unchanged (decision C5). Produce clean, flat,
   on-brand SVG illustrations for each type and concern using the P1 token palette —
   consistent stroke weight, consistent framing, legible at 96px. No photographs of skin
   conditions, no stock imagery, no third-party medical illustrations.

5. Tests: a schema-validation test asserting every entry has all required fields, ids are
   unique and SCREAMING_SNAKE, every backend_enum/backend_field maps to a real DB value,
   and every image_url resolves to a file that exists on disk.

Gates: pytest, lint, typecheck, build. Merge to dev with --no-ff. Print the phase report.
```

---

## P7 — Skin profile management & lifestyle tracking

**Branch:** `feat/m2-skin-profile`  ·  **Skills:** superpowers, shadcn, frontend

```
LOOP:

/goal Skin profile management and lifestyle tracking are complete. I have PRINTED pytest output at 0 failures covering profile CRUD across every field named in mile_2.docx section 2, upserts for all four trackers, and the 14-day window query the Adherence sub-score will consume. I have PRINTED the Alembic migration file and confirmed it derives from database_schemas/. I have PRINTED Playwright at 0 failures for the profile edit and daily check-in flows, and PRINTED `ruff check`, `mypy`, `pnpm typecheck` all at exit 0. Guardrail: the allergy list is stored as structured ingredient ids, not free text — I have printed the model definition proving it. Stop and report BLOCKED after 25 turns, or after 3 consecutive turns with no reduction in failing tests.

Milestone 2, Phase 7. Spec: mile_2.docx §2 "Skin Profile Management". Re-read it now.

Cut feat/m2-skin-profile from dev.

Backend — extend backend/app/services/skin_profile/:
  - Profile creation and update covering the doc's Skin Information fields: skin type,
    age group, skin concerns, allergies & sensitivities, lifestyle habits, sleep quality,
    water intake.
  - Tracking models + endpoints for the four trackers the doc names: lifestyle, sleep
    pattern, hydration, environmental exposure. Time-series shaped (one entry per day per
    user), because the scoring engine's Adherence sub-score reads a 14-day window and the
    dashboards render 30-day trends.
  - Alembic migration derived from database_schemas/ — schema file first, then migration,
    then model.
  - Allergy list is structured (ingredient ids), not free text, so P12's allergy detection
    can actually use it.

Frontend:
  - "My Skin Profile" page (/profile): view and edit everything above, using the P1/P3
    system and shadcn form primitives with Zod validation in web/lib/schemas/.
  - "Lifestyle & Habits" page (/check-in): daily entry for sleep hours, water intake
    (litres), stress level, and sun exposure, plus the 30-day history the dashboard cards
    read from.
  - Hydration goal is per-user configurable, defaulting to 2.5 L for display, while the
    scoring benchmark stays 3.0 L (decision C3). Both numbers, both correct, both labelled.

Tests: pytest for profile CRUD, tracker upserts, and the 14-day window query;
Playwright for the profile edit and daily check-in flows.

Gates: all. Merge to dev with --no-ff. Print the phase report.
```

---

## P8 — Assessment wizard UI

**Branch:** `feat/m2-assessment-wizard`  ·  **Skills:** ui-ux-pro-max, shadcn, frontend

```
LOOP:

/goal The assessment wizard is complete. I have PRINTED Playwright output at 0 failures for the full happy path (skin type -> concerns -> severity sliders -> lifestyle -> submit -> results), for validation blocking advancement at each step, and for state surviving back-navigation and a page refresh. I have PRINTED a passing unit test that builds the payload from mile_2.docx's worked example (skin_type Oily, acne_severity 7, hyperpigmentation_severity 4, redness 0, wrinkles 0, sleep_hours 7.5, water_intake_liters 2.5, stress_level 4, sun_exposure Moderate) and asserts it matches the P0 contract exactly, including the concerns[] array alongside the deprecated flat fields. I have PRINTED lint, typecheck and build at exit 0. Guardrail: a severity slider appears only for a concern the user selected. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns with no reduction in failing tests.

Milestone 2, Phase 8. Spec: mile_2.docx §"2. Interactive Selection Flow" (see the embedded
flow diagram) and §"1. In-Built Visual Dataset & Wizard UI". Re-read both now.

Cut feat/m2-assessment-wizard from dev. Build under web/app/assessment/ and
web/components/assessment/, consuming the P6 datasets.

Step 1 — Select Skin Type
  Single-select visual cards, one per type, each showing the SVG illustration, title, and
  description from skin_types.json. Radio semantics with a card presentation: keyboard
  navigable, arrow keys move selection, selected state is visible without relying on
  colour alone.

Step 2 — Select Target Concerns
  Multi-select cards from skin_concerns.json, same visual treatment, checkbox semantics.
  At least one concern required to advance.

Step 3 — Intensity Sliders
  A 0–10 slider appears for each SELECTED concern only, per the doc's diagram. Live
  numeric readout ("Acne Severity: 7 / 10"), sensible default, keyboard-operable, and an
  accessible name per slider.

Step 4 — Lifestyle Inputs
  Sleep hours per night, daily water intake in litres, stress level, sun exposure
  (None/Low/Moderate/High). Simple numeric steppers per the doc, not free-text fields.

Wizard mechanics:
  - Progress indicator, back/next, per-step Zod validation, state preserved across steps
    and across an accidental refresh.
  - Payload builder producing EXACTLY the P0-frozen contract shape, with the doc's flat
    severity fields emitted alongside the canonical concerns[] array for compatibility
    (decision C4). Unit-test the builder against the doc's worked example: skin_type Oily,
    acne_severity 7, hyperpigmentation_severity 4, redness 0, wrinkles 0, sleep_hours 7.5,
    water_intake_liters 2.5, stress_level 4, sun_exposure "Moderate".
  - Submit → POST /api/v1/assessment/submit (against fixtures until P14), then a results
    view showing the returned score and its sub-scores.
  - Loading, error, and retry states. A failed submit must never lose the user's answers.

Playwright: full happy path (type → concerns → sliders → lifestyle → submit → results),
plus validation blocks and back-navigation state preservation.

Gates: all, plus a ui-ux-pro-max critique pass on each step. Merge to dev with --no-ff.
```

---

## P9 — Assessment submit API & persistence

**Branch:** `feat/m2-assessment-api`  ·  **Skills:** superpowers

```
LOOP:

/goal POST /api/v1/assessment/submit is complete. I have PRINTED pytest at 0 failures covering: a valid payload persisting and returning an id; a rejection with 422 and field-level errors for each validation rule (unknown skin type, unknown concern id, severity outside 0-10, implausible sleep or water values, unknown sun_exposure); the doc's worked example round-tripping unchanged; the flat-field adapter mapping onto concerns[]; and concern prioritisation asserted on ordered values with its tie-break. I have PRINTED the Alembic migration, and `ruff check`, `mypy`, and `pnpm typecheck` against the regenerated api-types.ts all at exit 0. Guardrail: openapi.json and web/lib/api-types.ts are regenerated and committed in this branch — I have printed the git diff stat proving it. Stop and report BLOCKED after 25 turns, or after 3 turns with no reduction in failures.

Milestone 2, Phase 9. Spec: mile_2.docx §"4. Core Backend API Endpoints" (in the embedded
table image) and §"3. How the Payload Sends to the Backend". Re-read both now.

Cut feat/m2-assessment-api from dev.

Implement POST /api/v1/assessment/submit — "Validates survey inputs and saves raw
assessment snapshot to PostgreSQL":
  - Pydantic request model matching the P0-frozen contract. Validate hard: skin_type in
    the enum, every concern id known, every severity an int 0–10 inclusive, sleep hours
    and water litres in plausible ranges, sun_exposure in the enum. Reject with 422 and a
    field-level error body — never coerce bad input into a silent default.
  - Accept the doc's flat severity fields via an adapter that maps them onto concerns[]
    (decision C4); mark them deprecated in the OpenAPI description.
  - Persist an immutable raw snapshot to Postgres: user id, timestamp, full payload,
    schema version. Snapshots are append-only; a re-assessment writes a new row.
  - Alembic migration from database_schemas/ first, then the model.
  - Return the assessment id the score endpoint will be called with.
  - Wire into backend/app/services/skin_profile/ + the assessment service; router stays
    thin. Emit the outbox/instrumentation events this repo already uses for domain events.

Also implement the concern identification, prioritisation, and risk-factor analysis from
mile_2.docx §3 as pure service functions — concerns ranked by severity with documented
tie-breaking, and risk factors derived from lifestyle inputs. These feed both the score
endpoint and the dashboards' "Top Concerns" cards.

Regenerate openapi.json and web/lib/api-types.ts and commit them in this branch.

Tests: valid payload persists and returns an id; each validation rule rejects; the doc's
worked example round-trips exactly; prioritisation ordering is asserted on values.

Gates: ruff, mypy, pytest, and the frontend typecheck against the regenerated types.
Merge to dev with --no-ff. Print the phase report.
```

---

## P10 — Weighted skin health scoring engine

**Branch:** `feat/m2-scoring-engine`  ·  **Skills:** superpowers (TDD)

```
LOOP:

/goal The weighted scoring engine is complete. I have PRINTED pytest at 0 failures including the mandated Scoring Accuracy Test asserting that optimal parameters yield the maximum sub-score weighting, plus tests that worst-case inputs floor correctly, that each of the five weights contributes exactly its documented share, that the composite stays within [0,100] across a randomised sweep of at least 500 profiles, and that a new user with no completion logs receives A = 100. I have PRINTED the constants module showing every weight and benchmark from mile_2.docx in one place, and PRINTED a grep proving no numeric literal for a weight or benchmark appears anywhere else. I have PRINTED a passing test for the Skin Age derivation. `ruff check` and `mypy` printed at exit 0, openapi.json regenerated. Guardrail: the sub-score functions are pure — no clock reads, no request objects, deterministic across repeated runs, and I have printed a test asserting determinism. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns with no reduction in failures.

Milestone 2, Phase 10. Spec: mile_2.docx §"2. Weighted Skin Health Scoring Engine".
Re-read it now. This is the mathematical core of the milestone — write the tests first.

Cut feat/m2-scoring-engine from dev. Implement in backend/app/services/scores/.

Formula, exactly as specified:

    Skin Health Score = 0.35(C) + 0.20(L) + 0.15(S) + 0.20(A) + 0.10(H)

  C — Condition, 35%: penalised by the total severity of the user's skin concerns.
  L — Lifestyle, 20%: evaluated against daily stress level and sun exposure risk.
  S — Sleep, 15%:     evaluated against an optimal 8-hour baseline.
  A — Adherence, 20%: computed from the active 14-day completion logs;
                      defaults to 100% for a new assessment with no history.
  H — Hydration, 10%: evaluated against a 3.0 L daily fluid benchmark.

Rules:
  - Every weight, benchmark, and threshold lives in ONE documented constants module
    mapped line-by-line to the doc. No magic numbers anywhere else.
  - Each sub-score is its own pure function returning 0–100, clamped, fully unit-tested at
    its boundaries. The composite is a pure function of the five sub-scores.
  - Document each sub-score's curve in a docstring and in docs/AI_ML.md: how severity maps
    to a C penalty, how deviation from 8h maps to S, how the 3.0 L benchmark maps to H,
    how stress and sun exposure combine into L. State the choice, justify it, and log it
    in docs/DECISIONS.md — the doc gives the weights, not the curves.
  - Deterministic. Same input, same output, always. No randomness, no clock reads inside
    the pure functions — pass "now" in.

Implement GET /api/v1/assessment/score/{id} — "Returns overall health score (0-100) and
individual sub-scores (C, L, S, A, H)". Response carries the overall score, all five
sub-scores, the band label (Good/Fair/Poor per the P1 ramp), and the timestamp. 404 on an
unknown id; never invent a score for a missing assessment.

Derive and expose Skin Age here too (decision C6) — the dashboard renders it, so it needs
a real, tested derivation, not a constant.

MANDATED TEST — "Scoring Accuracy Test": asserts that optimal parameters yield the maximum
sub-score weighting. Plus: worst-case inputs floor correctly, each weight contributes its
exact share, the composite is within [0,100] across a wide randomised sweep, and a new
user with no logs gets A = 100.

Regenerate openapi.json + api-types.ts. Gates: ruff, mypy, pytest.
Merge to dev with --no-ff. Print the phase report with the test count.
```

---

## P11 — Dynamic routine generator

**Branch:** `feat/m2-routine-generator`  ·  **Skills:** superpowers (TDD)

```
LOOP:

/goal The dynamic routine generator is complete. I have PRINTED pytest at 0 failures including both mandated tests, named as such in the output: the Safety Exclusion Test proving sensitive-skin profiles never receive high-concentration retinoids or harsh physical exfoliants, tested at redness exactly 7 and exactly 8; and the Routine Output Test proving a sunscreen step appears in EVERY generated AM routine across a sweep of the whole profile space, not one happy case. I have also PRINTED passing tests that application order is always correct, that double cleanse appears only in PM, and that the soothing-active substitution replaces rather than appends. I have PRINTED the guardrail layer as a separate module applied after generation, and `ruff check`, `mypy` at exit 0 with openapi.json regenerated. Guardrail: no configuration flag can disable the sunscreen step — I have printed a test asserting that. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns with no reduction in failures.

Milestone 2, Phase 11. Spec: mile_2.docx §"3. Dynamic Routine Generator" and §4
"Personalized Routine Generator". Re-read both now. Safety rules are tests first.

Cut feat/m2-routine-generator from dev. Implement in backend/app/services/routines/.

Categories (canonical, exactly these six): Cleansing, Exfoliation, Treatment,
Moisturizing, Sun Protection, Night Care.

AM pipeline:  Gentle/Gel Cleanser → Antioxidant/Brightening Active → Lightweight Hydrator
              → Broad Spectrum SPF 30+
PM pipeline:  Double Cleanse (Oil/Micellar + Water-based) → Targeted Active Treatment
              → Ceramide Barrier Cream

SAFETY GUARDRAILS — non-negotiable, and the reason this phase is TDD:
  - A sensitive skin profile, OR redness severity > 7/10, overrides harsh exfoliants and
    strong retinoids in favour of soothing actives (e.g. Centella Asiatica, Azelaic Acid).
  - Every generated AM routine contains a sunscreen step. No exceptions, no configuration
    that can disable it.
  - Guardrails are a distinct, independently testable layer applied AFTER generation, so a
    future change to the generator cannot quietly bypass them.

Also implement from mile_2.docx §4: weekly treatment planning, seasonal recommendations,
and adaptive routine updates that respond to progress logs and re-assessments. Seasonal
logic may use the existing weather service in backend/app/services/weather/ — check what
it already provides before adding anything.

Implement POST /api/v1/routine/generate — "Generates dynamic AM/PM routine calendar with
application order and safety checks". Response: AM and PM step lists with explicit
application order, each step carrying its category, product/ingredient recommendation,
rationale, and any safety flag that fired.

MANDATED TESTS:
  - "Safety Exclusion Test": sensitive skin profiles NEVER receive high-concentration
    retinoids or harsh physical exfoliants. Test the boundary at redness exactly 7 and 8.
  - "Routine Output Test": mandatory steps — sunscreen above all — are present in EVERY
    generated AM routine. Sweep the whole profile space, not one happy case.
  Plus: application order is always correct, double cleanse only appears PM, and the
  soothing-active substitution actually substitutes rather than merely appending.

Regenerate openapi.json + api-types.ts. Gates: ruff, mypy, pytest.
Merge to dev with --no-ff. Print the phase report with the test count.
```

---

## P12 — Ingredient intelligence

**Branch:** `feat/m2-ingredient-intelligence`  ·  **Skills:** superpowers, shadcn, frontend

```
LOOP:

/goal Ingredient intelligence is complete. I have PRINTED pytest at 0 failures covering suitability scoring at its boundaries, every pair in the interaction matrix, allergy matching including synonym and casing variants, and a regression test proving a generated routine never places two conflicting actives in the same AM or PM sequence. I have PRINTED the interaction matrix as committed data with a severity and a plain-language explanation per pair. I have PRINTED Playwright at 0 failures for the Ingredient Analyzer page and the shared Ingredient Database page, and lint, typecheck, build, ruff and mypy all at exit 0. Guardrail: allergy matching flags on uncertainty rather than suppressing — I have printed the test that proves an ambiguous synonym still raises a flag. Stop and report BLOCKED after 30 turns, or after 3 turns with no reduction in failures.

Milestone 2, Phase 12. Spec: mile_2.docx §5 "Ingredient Intelligence". Re-read it now.

Cut feat/m2-ingredient-intelligence from dev. Extend backend/app/services/ingredients/.

Catalogue the eight categories the doc names: Retinoids, Niacinamide, Vitamin C,
Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs. Check
training_dataset/raw/cosmetics/ and the existing ingredient service and Elasticsearch
schema first — extend what exists rather than seeding a parallel catalogue.

Build the four capabilities from the doc:
  1. Suitability assessment — score an ingredient against a user's skin type, concerns,
     and severities. Reuse backend/app/ai/suitability if it exists; reconcile with
     ml/eval/suitability_eval.py so evaluation and runtime agree.
  2. Interaction analysis — an explicit, sourced pairwise matrix (retinoid + AHA/BHA,
     retinoid + benzoyl peroxide, vitamin C + niacinamide, and so on) with severity levels
     and a plain-language explanation for each. No inferred interactions at runtime; the
     matrix is data, reviewed and versioned.
  3. Allergy detection — match the structured allergy list from P7 against ingredient
     entries and their known synonyms/INCI names. A miss here is a safety failure, so
     match conservatively: flag on uncertainty rather than suppress.
  4. Ingredient education — a short, accurate explainer per ingredient: what it does, who
     it suits, what to pair or avoid, and how to introduce it.

Endpoints for lookup, suitability, interaction check, and category browse, wired to the
frozen contract. Hook the interaction matrix into P11 so a generated routine can never
place two conflicting actives in the same AM or PM sequence — add that as a regression
test in the routine suite.

Frontend: the "Ingredient Analyzer" page (/ingredients, user role) with search, safety
verdict, interaction warnings, and the education panel; plus the "Ingredient Database"
page shared by consultant, dermatologist, and admin per their nav trees.

Tests: suitability boundaries, every interaction pair, allergy matching including synonym
and casing variants, and the routine-conflict regression.

Gates: all. Merge to dev with --no-ff. Print the phase report.
```

---

## P13 — QA suite: pytest, Playwright, CI

**Branch:** `test/m2-qa-suite`  ·  **Skills:** superpowers

```
LOOP:

/goal The QA suite is complete and green. I have PRINTED the full pytest run showing total passed, 0 failed, and 0 skips that did not already exist on dev, with the three mandated tests visible by name in the output and each carrying a docstring citing its line in mile_2.docx. I have PRINTED the full Playwright run at 0 failures covering the assessment wizard, all four role dashboards with correct sidebars, role-permission negative tests, and the profile and check-in flows. I have PRINTED `tools/vision/extract.py diff` and `strings` running against all four dashboards as a CI step and exiting 0. I have PRINTED the updated .github/workflows files and a full local run of both workflows' commands at exit 0. Guardrail: no test was skipped, marked xfail, or had an assertion weakened to make this pass — I have printed the git diff of every test file I touched. Stop and report BLOCKED after 30 turns, or after 3 consecutive turns with no reduction in failing or flaky tests.

Milestone 2, Phase 13. Spec: mile_2.docx §5 "Automated Testing & QA Criteria (Pytest)".
Re-read it now.

Cut test/m2-qa-suite from dev.

1. Consolidate and harden the three MANDATED suites so they are unmistakably present,
   named, and traceable to the spec:
     - Scoring Accuracy Test — optimal parameters yield the maximum sub-score weighting.
     - Safety Exclusion Test — sensitive profiles never receive high-concentration
       retinoids or harsh physical exfoliants.
     - Routine Output Test — mandatory steps (morning sunscreen above all) appear in every
       generated AM routine.
   Add a docstring on each pointing at the exact line of mile_2.docx it satisfies.

2. Extend beyond the minimum: property-based sweeps over the profile space for scoring and
   routine generation, contract tests asserting every response matches openapi.json, and
   regression tests for each decision recorded in docs/DECISIONS.md.

3. Playwright journeys in web/tests/e2e/: the full assessment wizard for a user; each of
   the four roles landing on its dashboard with the correct sidebar; role-permission
   negative tests (a user cannot reach an admin route); and the profile/check-in flows.

4. Visual regression, wired through tools/vision/: capture all four dashboards at
   1440x900, store as baselines in docs/milestones/milestone_2/build/, and add a CI step
   that runs `tools/vision/extract.py diff` (plus the OCR string-set comparison from
   master prompt §5.6) against both the baselines AND the original source screenshots.
   Fail the build on >2% mismatch or any missing string. This is what stops the UI from
   silently drifting away from the design over the next milestone.

5. Make .github/workflows/backend-ci.yml and frontend-ci.yml run all of it. Deterministic,
   no network dependence, no flakes. Fix flakes; never retry them away.

6. Run the whole suite and report honestly: total passed, failed, skipped, coverage on the
   scoring and routine modules, and anything still red with a reason.

Gates: everything green, no new skips. Merge to dev with --no-ff. Print the phase report.
```

---

## P14 — Live integration & milestone close-out

**Branch:** `feat/m2-integration`  ·  **Skills:** superpowers, frontend

```
LOOP:

/goal Milestone 2 is closed. I have PRINTED a grep proving no dashboard, wizard, or profile route still imports from web/lib/fixtures outside test files. I have PRINTED the seed command running successfully and a full-stack Playwright run against the real backend at 0 failures, with docker-compose up. I have PRINTED `tools/vision/extract.py strings` and `diff --max-pct 2` for all four dashboards against live data, all exiting 0. I have PRINTED the complete contents of docs/milestones/milestone_2/M2_COMPLETION_REPORT.md, containing a row for every mile_2.docx requirement mapped to the code, tests, and screenshots satisfying it, plus every deferred item with a reason. I have PRINTED the final git log of dev showing one --no-ff merge commit per phase, and confirmed `git status` is clean and no remote operation was ever run. Guardrail: every fetch has loading, empty, and error states wired with a retry path. Stop and report BLOCKED after 30 turns, or after 3 turns with no reduction in remaining close-out items.

Milestone 2, Phase 14: replace fixtures with live data and close the milestone.

Cut feat/m2-integration from dev.

1. Swap every dashboard, wizard, and profile screen from web/lib/fixtures/ to real API
   calls through web/lib/api.ts, using the generated api-types.ts. If a shape mismatches,
   the API is right and the fixture was wrong — fix the frontend, don't reshape the API.
   Keep the fixtures as test doubles for Playwright.

2. Every fetch gets loading, empty, and error states wired to the P3 widget states, with a
   retry path. No screen may render a blank card on failure or a spinner forever.

3. Seed data: extend backend/app/db/seed so `make seed` (check the Makefile for the real
   target) produces a database that renders all four dashboards with plausible values —
   enough users, assessments, routines, and 30 days of tracking history for the charts.
   The seed uses the screenshot's cast (Ananya, Priya, Meera, Rohit, Kavya, Riya, Neha)
   so the built screens read like the design.

4. Full-stack verification: docker-compose up, run every Playwright journey against the
   real backend, confirm the three mandated pytest suites pass, and re-run the UI_SPEC §8
   fidelity checklist on all four dashboards with live data.

5. Documentation close-out:
     - docs/ARCHITECTURE.md — the scoring, routine, and ingredient services as built
     - docs/AI_ML.md — the scoring curves and routine rules
     - docs/DECISIONS.md — confirm every C1–C7 decision is recorded
     - openapi.json regenerated and committed
     - PROGRESS.md — all M2 tasks closed
     - docs/milestones/milestone_2/M2_COMPLETION_REPORT.md — a per-deliverable table
       mapping each mile_2.docx requirement to the code, tests, and screenshots that
       satisfy it, plus anything deferred with a reason and a proposed home in Milestone 3

6. Final phase report covering the whole milestone: branches merged, tests added, files
   changed, decisions logged, and an honest list of everything left undone.

Gates: everything. Merge to dev with --no-ff. Do not push.
```

---

# APPENDIX A — Milestone 2 requirements extracted from `mile_2.docx`

Use this as a checklist; the document itself remains the source of truth.

**§2 Skin Profile Management** — skin profile creation · skin type assessment · lifestyle
tracking · sleep pattern tracking · hydration tracking · environmental exposure tracking.
*Skin Information fields:* skin type, age group, skin concerns, allergies & sensitivities,
lifestyle habits, sleep quality, water intake. → **P7**

**§3 Skin Assessment Engine** — concern identification · skin health evaluation ·
condition scoring · concern prioritisation · risk factor analysis.
*Ten common concerns:* Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily Skin,
Sensitive Skin, Wrinkles, Fine Lines, Redness, Uneven Skin Tone. → **P6, P9, P10**

**§4 Personalized Routine Generator** — morning routine · evening routine · weekly
treatment planning · seasonal recommendations · adaptive updates.
*Six categories:* Cleansing, Exfoliation, Treatment, Moisturizing, Sun Protection,
Night Care. → **P11**

**§5 Ingredient Intelligence** — ingredient module · suitability assessment · interaction
analysis · allergy detection · ingredient education.
*Eight categories:* Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid,
Ceramides, Peptides, AHAs/BHAs. → **P12**

**Datasets** — `skin_types.json` and `skin_concerns.json` with the exact shape given in
the document (`id`, `title`, `description`, `image_url`, `backend_enum` / `backend_field`),
served as static SVG/PNG cards from `/assets/`. → **P6**

**Deliverable 1 — Visual dataset & wizard UI** — single-select skin type cards →
multi-select concern cards → 0–10 severity sliders for selected concerns → lifestyle
inputs. → **P8**

**Deliverable 2 — Weighted scoring engine** — `0.35(C) + 0.20(L) + 0.15(S) + 0.20(A) +
0.10(H)`, sub-scores as defined in the document. → **P10**

**Deliverable 3 — Dynamic routine generator** — AM/PM pipelines, category mapping, and
safety guardrails for sensitive skin and redness > 7/10. → **P11**

**Deliverable 4 — Core backend API endpoints** *(from the embedded table image)*

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/assessment/submit` | Validates survey inputs and saves the raw assessment snapshot to PostgreSQL |
| GET | `/api/v1/assessment/score/{id}` | Returns the overall health score (0–100) and the individual sub-scores (C, L, S, A, H) |
| POST | `/api/v1/routine/generate` | Generates the dynamic AM/PM routine calendar with application order and safety checks |

→ **P9, P10, P11**

**Deliverable 5 — Automated testing & QA (pytest)** — Scoring Accuracy Test · Safety
Exclusion Test · Routine Output Test. → **P13**

**Design intent stated in the document** — eliminate self-diagnosis errors (users tap a
picture, not medical jargon) · clean backend compatibility (the dataset maps directly to
standardised fields) · low complexity (static asset cards and structured parameters, no
computer-vision model needed for attribute selection). Keep these true; if a design choice
starts requiring users to know dermatological terms, it is the wrong choice.

**System pipeline** *(from the embedded deliverables diagram)*
`Visual Card Selector → Assessment Engine → Scoring Algorithm → Dynamic Routine Engine`

---

# APPENDIX B — Quick reference

### Branch and commit cheat sheet

```bash
git checkout dev && git status --porcelain
git checkout -b feat/m2-scoring-engine

git commit -m "feat(backend/scores): weighted composite score [M2-P10-T02]"
git commit -m "test(backend/scores): scoring accuracy boundaries [M2-P10-T05]"

# gates green, then:
git checkout dev
git merge --no-ff feat/m2-scoring-engine -m "merge: feat/m2-scoring-engine — weighted scoring engine + /score endpoint"
git branch -d feat/m2-scoring-engine
# no push. ever. this milestone stays local.
```

### Phase gate command block

```bash
cd backend && uv run ruff check . && uv run ruff format --check . && uv run pytest -q
cd ../web && pnpm lint && pnpm typecheck && pnpm build && pnpm exec playwright test
```

### Failure protocol

| Situation | Action |
|---|---|
| Gate fails | Fix on the feature branch. Never merge red. Never weaken a test to make it pass. |
| Merge conflict | `git merge dev` into the feature branch, resolve there, re-run gates, then merge out. |
| Spec ambiguity | Check `UI_SPEC.md §7` first. If unanswered and both readings are defensible → STOP and ask. Otherwise decide and log in `docs/DECISIONS.md`. |
| Skill unavailable | Record `UNAVAILABLE` in the ledger, say so in the phase report, proceed with the best available approach. Do not claim a skill was used. |
| Task can't be completed | Mark `BLOCKED` with the reason. Do not stub-and-close. |
| Screenshot vs. this document disagree | The screenshot wins. Correct the document in the same branch. |
| Existing test already failing on `dev` | Note it in the report; leave it unless the phase owns it. |

### Grep-able task index

`M2-P0` recon · `M2-P1` tokens · `M2-P2` sidebar · `M2-P3` widgets · `M2-P4` user+admin ·
`M2-P5` consultant+derma · `M2-P6` datasets · `M2-P7` profile · `M2-P8` wizard ·
`M2-P9` submit API · `M2-P10` scoring · `M2-P11` routines · `M2-P12` ingredients ·
`M2-P13` QA · `M2-P14` integration
