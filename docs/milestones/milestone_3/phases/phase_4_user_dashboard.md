# M3R Phase 4 — User Dashboard (Rubric Step 4.1)

**Branch:** `feat/m3r-p4-user-dashboard` (from `dev`) · **Agents:** Frontend Agent +
Review Agent · **Depends:** P1–P3 contracts frozen (endpoints may still be in review;
build against the frozen shapes + regenerated `api-types.ts`).
**Skills/plugins:** shadcn + migrate-radix-to-base (every touched component),
ui-ux-pro-max + frontend-design (fidelity vs Frosted Lab Glass + wireframes),
graphify, code-review.

> The User dashboard + Insights screens exist. Before each task: open the matching
> `web/designs/wireframes/` file + `source/reference-screenshots/` pair side-by-side.
> Close only the rubric-literal gaps P0 found. Tokens from `web/app/globals.css` only;
> both themes; empty/loading/error states; `nativeButton={false}` on any
> `Button render={<Link/>}` (recurring bug).

## Tasks

- **M3R-P4-T1 — Top banner: Skin Health Score gauge + sub-scores.** Overall 0–100 gauge
  = the Skin Score Ring signature element (frosted housing, teal→royal-blue stroke,
  Geist numeral, five weighted mini-bars 35/20/20/15/10) — identical treatment as
  everywhere else, no variant. Sub-score cards alongside, from the scores endpoint.
- **M3R-P4-T2 — Central interactive AM/PM checklist.** Clickable checkboxes on today's
  AM/PM steps; each toggle logs the check-in in real time via the P3 endpoint
  (optimistic update + TanStack Query invalidation; revert on error with a Sonner
  toast). This checklist must re-render live when a professional overwrites the routine
  (P5 dependency — polling/refetch interval per the frozen contract's default).
- **M3R-P4-T3 — Analytics chart.** Line chart of score trajectory alongside adherence
  rates, fed **only** by the P3 analytics endpoint. Library per the P0 conflict
  resolution (default Recharts/shadcn Charts; rubric names Chart.js/Plotly — Kiran's
  call, recorded in the ledger). Window switcher 7/30/90 days.
- **M3R-P4-T4 — Recommendations shelf.** Product cards from the P2 endpoint: match
  percentage ("94% Match"), active-ingredient tags, budget flag, alternative labeling.
  Solid Diagnostic Module cards (data never sits on glass), Geist tabular figures for
  numbers.
- **M3R-P4-T5 — States + a11y + fidelity pass.** Empty (new user, no logs/photos),
  loading skeletons, error envelopes surfaced; keyboard toggling of checklist items;
  reduced-transparency support; both themes screenshot-compared against wireframes
  (store crops under `docs/milestones/milestone_3/build/` mirroring M2's structure).

## Verification (running stack)

Playwright: fresh user → dashboard shows empty states → complete assessment → gauge +
sub-scores render → toggle two checklist items → Mongo log rows appear (API-verified)
→ chart renders with real data on all three windows → shelf shows match % and no
allergen products. `npm run lint` + `typecheck` + `next build` green; screenshots both
themes attached.

## Exit

`/code-review` → merge to `dev` → delete branch → `graphify update .` → `PROGRESS.md`.
