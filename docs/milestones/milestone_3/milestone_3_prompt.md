# Milestone 3 — Execution Prompt for Autonomous Coding Agents

This is the standing instruction set for any coding agent (Claude Code, Antigravity,
Cursor, Codex, Gemini CLI, …) implementing Milestone 3. The specification itself is
`docs/milestones/milestone_3/milestone_3.md` — this file tells you how to execute
it. It follows the same proven shape as `docs/milestones/milestone_2/MASTER_PROMPT.md`
(full-auto with stated defaults; a short list of genuine hard stops).

---

## Master prompt (paste into a fresh agent session)

> Read, in full and in this order, before writing any code:
> 1. `AGENTS.md` (all of it — especially §0 sources of truth, §0.1 milestone-rubric
>    precedence, §0.2 missing-data rules) and `CLAUDE.md`'s imports, including
>    `.agents/rules/skinlytics-stitch.md`.
> 2. `AI_Skin Intelligence & Personalized Skincare Planner (1).pdf` — the primary
>    source of truth; Milestone 3 is pp. 10–11 (tasks, outcomes, evaluation criteria).
> 3. `PROGRESS.md` — the top "Milestone 1 & 2 audit + Milestone 3 planning" entry
>    (2026-07-22) is the canonical statement of carry-over work; then skim the rest.
> 4. `docs/milestones/milestone_3/milestone_3.md` — the implementation spec you are
>    executing (modules M3-0 … M3-H, in order).
> 5. `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/CONVENTIONS.md`,
>    `docs/AI_ML.md`, `docs/DATASETS_AND_APIS.md`, `docs/DESIGN.md`,
>    `docs/WIREFRAMES.md` — plus `database_schemas/` before any data change and the
>    exact wireframe pair before any screen.
> 6. `.agents/skills/` (shadcn rules, migrate-radix-to-base) for any `web/` work.
>
> Then execute `milestone_3.md` module-by-module, **starting with M3-0 (carry-over
> closure): all pending Milestone 1 and Milestone 2 items listed in `PROGRESS.md`'s
> audit entry are completed or explicitly owner-deferred BEFORE any new Milestone 3
> feature work begins.** Run full-auto: where the spec marks a decision with a
> stated default, take the default and record the reasoning in `PROGRESS.md`'s dated
> entry — do not stop to ask. The ONLY hard stops (stop and wait for the user):
> 1. Any operation that could destroy real persisted data with no way back
>    (dropping/truncating live tables, deleting live Mongo collections, bucket
>    wipes). Non-destructive migrations don't qualify.
> 2. A required external credential/dataset that is genuinely absent with no
>    workaround (AGENTS.md §0.2) — e.g. OpenWeather/OpenUV keys. Never stub it
>    silently, never fabricate data, never claim the dependent feature done.
> 3. A newly-arrived external graded M3 rubric doc whose literal names conflict
>    with this spec (AGENTS.md §0.1) — reconcile with the user before renaming
>    anything, exactly as M2 did.
> 4. Any change that would require editing `AGENTS.md`'s fixed nav lists or an
>    accepted ADR — propose, don't apply.
>
> After each module: run its stated verification against the RUNNING system (not
> just unit tests), report actual command output, update `PROGRESS.md` honestly in
> the same branch, and only then merge. Never mark a task complete on partial or
> unverified work.

---

## Standing rules (apply to every task, every session)

1. **Docs first, always.** Never build from memory of a doc — open the file. Never
   skip the PDF, the spec, or `PROGRESS.md` at session start.
2. **Never bypass architecture.** The layer order in `docs/architecture.png` /
   `AGENTS.md` §2 is binding: no layer skipping, single writer per fact, services
   read each other only via interface functions, external calls only via
   `backend/app/integrations/`, derived stores written only by the worker.
3. **Follow every rule in `.agents/` and `AGENTS.md`.** They are strict contracts,
   not suggestions. Deviations need an ADR in `docs/DECISIONS.md` first or explicit
   user sign-off.
4. **Coding standards:** backend `ruff` + `mypy --strict` + `pytest`; frontend
   TypeScript strict, `npm run lint` + `npm run typecheck` + `next build`;
   conventional commits; SOLID/clean-architecture; no duplication — check for an
   existing helper/component (shadcn first) before writing one.
5. **Consistent UI:** exact wireframe pair + reference screenshot side-by-side
   before calling a screen done; tokens from `web/app/globals.css` only; both
   themes; empty/loading/error states designed; a11y floor incl. reduced
   transparency.
6. **Scalable, production-ready code only.** No TODO/FIXME placeholders, no
   commented-out code, no technical debt "for now". Validate all inputs, handle
   errors through the standard envelope, keep queries indexed (check the schema's
   existing indexes before adding query patterns).
7. **Tests with every feature** (per the spec's Testing requirements — the repo
   pattern is real-Docker-store fixtures, not mocks) and **docs in the same
   branch**: schema mirrors in `database_schemas/`, `make openapi` after router
   changes, ARCHITECTURE/CONVENTIONS tree updates when folders appear, ADRs for
   structural calls.
8. **Update `PROGRESS.md` continuously** — same branch as the work, dated,
   honest, including what was NOT verified and why.
9. **Verify before claiming.** A feature "works" only after it ran against the live
   dev stack (`docker compose` stores + real backend + real frontend). Record the
   actual output. The repo's history is full of bugs found only by running for
   real — keep that discipline.
10. **Missing data/credentials get a conversation** (hard stop #2). Check
    `training_dataset/MANIFEST.md` before assuming a dataset exists.

## Git workflow (mandatory — matches the project owner's instruction)

- **Never commit directly to `main` or `satya-sai-tharun-skinlytics`.**
- Development flow, for every module/sub-task:
  1. `git checkout dev` and pull latest.
  2. Create a feature branch **from `dev`**:
     `feature/milestone3-<slug>` (e.g. `feature/milestone3-outbox-worker`,
     `feature/milestone3-ingredient-intelligence`,
     `feature/milestone3-recommendation-engine`).
  3. Do the work; keep commits small and meaningful (conventional commits, one
     concern per commit).
  4. Test thoroughly (the module's stated verification + full regression suites).
  5. Merge back into `dev` only when green and verified.
  6. Delete the feature branch after a successful merge.
- One module (or coherent sub-slice) per branch — the same branch-per-phase
  discipline M2's phases used.
- Windows note: the repo is currently developed on Windows too (`PROGRESS.md`
  2026-07-21 fixes) — don't reintroduce symlink/encoding assumptions.

## Module order (from `milestone_3.md` §3 — do not reorder without cause)

M3-0 carry-over closure → M3-A outbox/worker/derived stores → M3-B ingredient
intelligence → M3-C product catalog/detail/compare → M3-D recommendation engine v2
→ M3-E progress tracking → M3-F analytics + insights → M3-G dashboards +
instrumentation → M3-H ml scaffold + eval. M3-E may run in parallel with M3-C/D if
worked by a second agent (it has no hard dependency on them), but merges serialize
through `dev`.

## Definition of done

A module is done only when every box in `milestone_3.md` §11 that it owns is
checked, its verification output is recorded in `PROGRESS.md`, and `dev` is green
after the merge. Milestone 3 is done only when all of §11 is checked.
