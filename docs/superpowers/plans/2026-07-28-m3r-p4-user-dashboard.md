# M3R Phase 4 — User Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close M3R-P4-T1 through T5 (`docs/milestones/milestone_3/M3R_TASK_LEDGER.md`)
— `MILESTONE 3.pdf` Step 4.1's real gaps in the already-mostly-real user dashboard
(`web/app/(user)/dashboard/page.tsx`): the Skin Score Ring is missing the 5
weighted sub-score mini-bars AGENTS.md's own locked design system names as part of
its "signature element" ("Identical treatment everywhere it appears"); the trend
chart uses Recharts (this session's owner decision already picked Chart.js over
the locked default, per the rubric's literal "Chart.js or Plotly" wording), shows
score only (not "score trajectories alongside adherence rates"), reads from the
wrong endpoint (`/progress/me/summary` instead of the single analytics read
surface Phase 3 built), and its window switcher uses "This Week/Month/All Time"
labels instead of the rubric's literal 7/30/90-day windows; the recommendations
shelf shows no match percentage, no active-ingredient tags, and no budget flag —
all three rubric-named requirements.

**Architecture:** Pure extension of `web/components/skin-score-ring.tsx`,
`web/components/charts/trend-chart.tsx` (or its replacement),
`web/components/dashboard/product-carousel.tsx`, and
`web/app/(user)/dashboard/page.tsx` — no new pages, no new routes. The AM/PM
checklist (`ChecklistStrip`/`RoutineChain` + `useToggleRoutineStep`) is already
real-time (confirmed: an optimistic mutation against
`PUT /api/v1/routine/steps/{id}/completion`-shaped endpoint via TanStack Query) —
this phase only adds the polling/refetch interval P5's live-sync requirement
depends on; P6 is where the full cross-role round trip actually gets exercised
end to end, since P5 (the professional routine-overwrite feature) doesn't exist
yet at the time this phase runs.

**Tech Stack:** Next.js App Router + TypeScript + Tailwind v4 + shadcn/ui
(locked). New dependency this phase: `chart.js` + `react-chartjs-2` (Chart.js
chosen over Plotly per AGENTS.md's own existing scoping — "Plotly only for heavy
scientific viz" — a simple score/adherence line chart isn't that; Chart.js is the
lighter, better-fitting pick between the two the rubric names).

## Global Constraints

- Frosted Lab Glass tokens only (`web/app/globals.css` / `docs/DESIGN.md`) — no
  invented colors/spacing. Both themes on every visual change.
- shadcn primitives first; any touched Radix-based component gets
  `nativeButton={false}` on `Button render={<Link/>}` (recurring bug pattern this
  repo has hit before — check every button touched in this phase for it).
- The trend chart must be fed **only** by `GET /api/v1/analytics/me` (Phase 3's
  single read surface) — no client-side recomputation, no parallel fetch to
  `/progress/me/summary` for chart-adjacent data.
- Skin Score Ring stays **one shared component** — "Identical treatment
  everywhere it appears" (AGENTS.md §4) — the mini-bars addition must be an
  optional prop so the landing page's marketing usage (no real per-user
  sub-scores) keeps working unchanged, not a breaking change to every call site.
- Real data only — active-ingredient tags and budget flags come from the P2
  response fields that already exist (`active_ingredient_tags`, `over_budget`,
  `alternative_for_product_id`), never invented client-side.
- `npm run lint` + `npm run typecheck` + production `next build` green. Both
  themes screenshot-compared against the wireframe before calling any screen
  "done" (`web/designs/wireframes/app-dashboard.html` +
  `source/reference-screenshots/app-dashboard[-dark].png`).
- **Never add a Co-Authored-By trailer or any AI-assistant co-author to any
  commit message** — AGENTS.md §6 strictly forbids it.

---

### Task 1: Skin Score Ring — real 5 weighted sub-score mini-bars

**Why this exists:** AGENTS.md §4 names the Skin Score Ring's signature form
explicitly: "frosted-glass circular gauge... **five weighted mini-bars
(35/20/20/15/10) beside it**. Identical treatment everywhere it appears." The
shipped `SkinScoreRing` component has no mini-bars at all today — confirmed by
reading the component directly. The wireframe (`app-dashboard.html`) does show 3
mini-bars next to the ring, but with placeholder Stitch-generated labels/values
("Hydration 35%, Texture 20%, Pigmentation 20%") that were never wired to real
data — this task replaces those with the 5 real weighted components
(`skin_condition_score`, `lifestyle_score`, `routine_adherence_score`,
`sleep_quality_score`, `hydration_score`, at their real 0.35/0.20/0.20/0.15/0.10
weights) from the already-fetched `ScoreRead`.

**Files:**
- Modify: `web/components/skin-score-ring.tsx`
- Modify: `web/app/(user)/dashboard/page.tsx`
- Test: check for an existing unit test file
  (`ls web/lib/__tests__/` or `grep -rl SkinScoreRing web/**/__tests__` /
  component test conventions this repo uses — this codebase's test pattern for
  UI components; if none exists for this component, a visual/manual check is
  the established verification method per AGENTS.md §4, not a new test
  framework)

**Interfaces:**
- `SkinScoreRingProps` gains an optional `subScores?: { label: string; value:
  number; weight: number }[]` — when omitted (landing page, assessment/results
  if left as-is), the ring renders exactly as it does today; when provided
  (dashboard), it renders the 5 mini-bars beneath/beside the ring per the
  wireframe's structural layout.

- [ ] **Step 1: Open the wireframe + reference screenshot side by side**

Open `web/designs/wireframes/app-dashboard.html` (and `-dark` variant) plus
`web/designs/wireframes/source/reference-screenshots/app-dashboard.png` (and
`-dark.png`) to see the mini-bars' exact visual treatment (spacing, label
position, bar height/rounding — already partially visible in the wireframe HTML
read during planning: `h-1.5 w-32 bg-surface-container rounded-full`, label +
percentage-width bar side by side). Match this structure, not the placeholder
labels/values.

- [ ] **Step 2: Extend `SkinScoreRingProps` and render the mini-bars**

In `web/components/skin-score-ring.tsx`, add the new optional prop and render
block:

```typescript
interface SubScore {
  label: string;
  value: number; // 0-100
  weight: number; // e.g. 0.35
}

interface SkinScoreRingProps {
  score: number;
  size?: number;
  label?: string;
  className?: string;
  subScores?: SubScore[];
}
```

Add a mini-bars block rendered after the existing ring markup (only when
`subScores` is provided and non-empty), following the wireframe's real
structure (label left, thin rounded bar right, bar width = `value`%, using the
existing token classes already in use elsewhere in this file/repo for
consistency — e.g. `bg-surface-container` track, a token-driven fill color, not
a new invented color):

```tsx
{subScores && subScores.length > 0 && (
  <div className="mt-4 w-full space-y-2">
    {subScores.map((s) => (
      <div key={s.label} className="flex items-center justify-between gap-3 text-xs">
        <span className="text-on-surface-variant shrink-0">
          {s.label} <span className="tabular-nums">({Math.round(s.weight * 100)}%)</span>
        </span>
        <div className="bg-surface-container h-1.5 w-24 shrink-0 overflow-hidden rounded-full">
          <div
            className="bg-secondary h-full rounded-full"
            style={{ width: `${Math.max(0, Math.min(100, s.value))}%` }}
          />
        </div>
      </div>
    ))}
  </div>
)}
```

(Check `web/app/globals.css` for the real token names `bg-surface-container`/
`bg-secondary` resolve to before assuming these exact class names are right —
match whatever this file's existing ring markup already uses for its own
track/fill colors, for consistency within the same component.)

- [ ] **Step 3: Wire real sub-scores into the dashboard**

In `web/app/(user)/dashboard/page.tsx`, where `<SkinScoreRing score={...} />` is
rendered (Row 1's hero card), pass the 5 real weighted components from
`score` (the already-fetched `ScoreRead`):

```tsx
<SkinScoreRing
  score={score.overall_score ?? 0}
  size={110}
  label=""
  subScores={[
    { label: "Condition", value: score.skin_condition_score ?? 0, weight: 0.35 },
    { label: "Lifestyle", value: score.lifestyle_score ?? 0, weight: 0.20 },
    { label: "Routine", value: score.routine_adherence_score ?? 0, weight: 0.20 },
    { label: "Sleep", value: score.sleep_quality_score ?? 0, weight: 0.15 },
    { label: "Hydration", value: score.hydration_score ?? 0, weight: 0.10 },
  ]}
/>
```

(Confirm these 5 field names against the real `ScoreRead` type in
`web/lib/api-types.ts` before writing this — already confirmed present during
planning: `skin_condition_score`, `lifestyle_score`, `sleep_quality_score`,
`hydration_score`, `routine_adherence_score`, all `number | null`. A `null`
sub-score should render as a `0`-width bar, not crash — the `?? 0` above
already handles this.)

Do NOT change the landing page (`web/components/landing/hero-section.tsx`) or
`web/app/assessment/results/page.tsx`'s existing `SkinScoreRing` calls — they
keep omitting `subScores` and render exactly as before. If you believe
`assessment/results` should also get the mini-bars for consistency, note it as
a recommendation in your report rather than doing it — it's outside this
phase's stated scope (rubric Step 4.1 is the user *dashboard* specifically).

- [ ] **Step 4: Verify in both themes**

Run `cd web && npm run dev`, open `/dashboard` as a real user with a computed
score, screenshot both light and dark themes, and compare against the
wireframe pair. Confirm the ring itself is unchanged (regression check) and the
5 real weighted bars render with real values, not the wireframe's placeholder
"Hydration/Texture/Pigmentation" ones.

- [ ] **Step 5: Run gates**

Run: `cd web && npm run typecheck && npm run lint` (timeout: 120000)

- [ ] **Step 6: Commit**

```bash
git add web/components/skin-score-ring.tsx "web/app/(user)/dashboard/page.tsx"
git commit -m "feat(dashboard): add the real 5 weighted sub-score mini-bars to the Skin Score Ring"
```

---

### Task 2: AM/PM checklist — live-sync polling for future professional overwrites

**Why this exists:** the checklist is already real-time (optimistic mutation +
query invalidation on toggle, confirmed in `useToggleRoutineStep`). The rubric's
literal Step 5 E2E walkthrough (P6, not built yet) requires that when a
dermatologist edits an evening treatment step (P5, not built yet), the user's
dashboard checklist reflects the change **live**, without a manual reload. Since
neither P5 nor P6 exist at this point in the phase order, this task can only add
the client-side half (a refetch/poll interval on the routines query) — the real
end-to-end proof happens in P6 once P5 ships the overwrite endpoint.

**Files:**
- Modify: `web/app/(user)/dashboard/page.tsx`

- [ ] **Step 1: Add a refetch interval to the routines query**

In `web/app/(user)/dashboard/page.tsx`'s `routinesQuery` (`useQuery({queryKey:
["routines", "me"], ...})`), add a `refetchInterval` so a routine change made
elsewhere (e.g. a future professional overwrite) surfaces without a manual
reload:

```typescript
const routinesQuery = useQuery({
  queryKey: ["routines", "me"],
  queryFn: async () => (await api.GET("/api/v1/routine")).data ?? [],
  enabled: scoreQuery.data !== null,
  refetchInterval: 30_000, // P5 dependency: live-sync a professional's routine overwrite without a manual reload
  refetchIntervalInBackground: false,
});
```

(30 seconds is a reasonable default matching the "frozen contract's default
refresh window" language the phase file uses — if `M3R_API_CONTRACT.md` records
a different specific interval elsewhere in this milestone's docs, use that
value instead; check first.)

- [ ] **Step 2: Confirm the toggle mutation still invalidates correctly alongside polling**

Read `web/lib/hooks/use-toggle-routine-step.ts` to confirm its `onSuccess`/
`onSettled` invalidation of `["routines", "me"]` doesn't conflict with the new
interval (it shouldn't — TanStack Query dedupes/resets the interval timer on
any refetch, invalidated or polled). No code change expected here, just confirm
by reading.

- [ ] **Step 3: Run gates**

Run: `cd web && npm run typecheck && npm run lint`

- [ ] **Step 4: Commit**

```bash
git add "web/app/(user)/dashboard/page.tsx"
git commit -m "feat(dashboard): poll the routines query so a future professional overwrite shows up live"
```

---

### Task 3: Rebuild the trend chart on Chart.js, analytics-fed, score + adherence, 7/30/90

**Files:**
- Modify: `web/package.json` (add `chart.js`, `react-chartjs-2`)
- Modify (or replace): `web/components/charts/trend-chart.tsx`
- Modify: `web/app/(user)/dashboard/page.tsx`

**Interfaces:**
- `TrendChart` keeps roughly the same prop shape (state, series, range
  switcher) but `series` becomes two aligned series (score + adherence, both
  keyed by the same `date`), and `rangeOptions`/`rangeValue` become the literal
  `"7"`/`"30"`/`"90"` day-count strings (or a small typed union), not
  "This Week"/"This Month"/"All Time".
- Dashboard fetches `GET /api/v1/analytics/me` (already has `analyticsQuery` in
  scope) instead of building chart data from `progressQuery`'s
  `/progress/me/summary` points — `progressQuery` may become unused for this
  purpose; check whether anything else on the page still needs it before
  removing it entirely (the "Skin Health Progress" card's `footerNote`/
  `scoreDelta` computation currently reads `fullChartData` derived from
  `progressQuery` — re-derive `scoreDelta` from the analytics data instead so
  `progressQuery` can be dropped if genuinely unused elsewhere on this page).

- [ ] **Step 1: Install Chart.js**

Run: `cd web && npm install chart.js react-chartjs-2` (timeout: 120000)

- [ ] **Step 2: Rebuild `TrendChart` on Chart.js**

Replace `web/components/charts/trend-chart.tsx`'s Recharts implementation with
`react-chartjs-2`'s `Line` component, keeping the same empty/loading/error
state handling (`WidgetEmpty`/`WidgetError`/`Skeleton`) and the same
`ChartContainer`-style token-driven theming (read `web/components/ui/chart.tsx`
first to see if its `ChartContainer`/`ChartConfig` abstraction is Recharts-
specific — if so, this task drops that wrapper for this component only and
themes the Chart.js instance directly via CSS custom properties, matching
whatever `var(--secondary)`/`var(--tertiary)` tokens the rest of the app
already uses):

```tsx
"use client";

import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { WidgetEmpty, WidgetError, type WidgetStateProps } from "@/components/dashboard/widget-states";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

interface TrendPoint {
  date: string;
  score: number | null;
  adherence: number | null; // 0-1
}

interface TrendChartProps extends WidgetStateProps {
  points?: TrendPoint[];
  rangeOptions?: readonly string[]; // "7" | "30" | "90"
  rangeValue?: string;
  onRangeChange?: (range: string) => void;
  footerNote?: string;
}

export function TrendChart({
  state = "ready",
  points,
  rangeOptions,
  rangeValue,
  onRangeChange,
  footerNote,
  emptyIcon,
  emptyMessage = "No trend data yet.",
  emptyActionLabel,
  emptyActionHref,
  errorMessage,
  onRetry,
}: TrendChartProps) {
  if (state === "loading") return <Skeleton className="h-48 w-full" />;
  if (state === "error") return <WidgetError message={errorMessage} onRetry={onRetry} />;
  if (state === "empty" || !points || points.length === 0) {
    return <WidgetEmpty icon={emptyIcon} message={emptyMessage} actionLabel={emptyActionLabel} actionHref={emptyActionHref} />;
  }

  const data = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: "Skin score",
        data: points.map((p) => p.score),
        borderColor: "var(--secondary)",
        backgroundColor: "color-mix(in srgb, var(--secondary) 15%, transparent)",
        yAxisID: "y",
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: "Adherence",
        data: points.map((p) => (p.adherence == null ? null : Math.round(p.adherence * 100))),
        borderColor: "var(--tertiary)",
        backgroundColor: "color-mix(in srgb, var(--tertiary) 15%, transparent)",
        yAxisID: "y",
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  };

  return (
    <div className="flex flex-col gap-2">
      {rangeOptions && rangeOptions.length > 0 && (
        <div className="flex justify-end">
          <Select value={rangeValue} onValueChange={(v) => v && onRangeChange?.(v)}>
            <SelectTrigger size="sm" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {rangeOptions.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="h-48 w-full">
        <Line
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { min: 0, max: 100, ticks: { stepSize: 25 } } },
            plugins: { legend: { position: "bottom" } },
          }}
        />
      </div>
      {footerNote && <p className="text-muted-foreground text-xs">{footerNote}</p>}
    </div>
  );
}
```

Note: `var(--secondary)`/`color-mix(...)` inline in a JS object won't resolve
CSS custom properties the same way Tailwind classes do — verify Chart.js
accepts a literal `"var(--secondary)"` string for `borderColor` (it does, since
these render to inline canvas styles which browsers resolve CSS vars for at
paint time same as any other computed style) — if it doesn't render correctly
in a quick manual check, resolve the token to a static hex at render time via
`getComputedStyle` instead, matching however `components/ui/chart.tsx`'s
existing Recharts setup already solved this same problem (check that file
first for the established pattern before inventing a new one).

- [ ] **Step 3: Wire the dashboard to the analytics endpoint with 7/30/90 windows**

In `web/app/(user)/dashboard/page.tsx`:

```typescript
const RANGE_OPTIONS = ["7", "30", "90"] as const;
type Range = (typeof RANGE_OPTIONS)[number];
const [trendRange, setTrendRange] = useState<Range>("30");
```

Replace the `fullChartData`/`chartData` derivation (currently built from
`progressQuery.data`) with a derivation from `analyticsQuery.data.score_vs_adherence`
(the real field Phase 3 built — confirm exact field name in `web/lib/api-types.ts`
before writing this), filtered to the last N days per `trendRange`:

```typescript
const chartPoints = useMemo(() => {
  const points = analyticsQuery.data?.score_vs_adherence ?? [];
  const days = Number(trendRange);
  const windowed = points.slice(-days);
  return windowed.map((p) => ({
    date: p.date,
    score: p.overall_score,
    adherence: p.adherence_ratio,
  }));
}, [analyticsQuery.data, trendRange]);
```

Update the `<TrendChart>` call site to pass `points={chartPoints}`,
`rangeOptions={RANGE_OPTIONS}`, `rangeValue={trendRange}`,
`onRangeChange={(v) => setTrendRange(v as Range)}`. Re-derive `scoreDelta`
(currently computed from `fullChartData`) from `chartPoints` instead — same
first-vs-last comparison logic, just fed from the new source. Check whether
`progressQuery` is still used anywhere else on this page after this change; if
not, remove it and its now-unused import/state entirely (don't leave a dead
query around).

- [ ] **Step 4: Verify in both themes, run gates**

Run: `cd web && npm run dev`, check the chart renders both series correctly in
light/dark, then:
Run: `cd web && npm run typecheck && npm run lint && npm run build` (timeout: 300000)

- [ ] **Step 5: Commit**

```bash
git add web/package.json web/package-lock.json web/components/charts/trend-chart.tsx \
  "web/app/(user)/dashboard/page.tsx"
git commit -m "feat(dashboard): rebuild the trend chart on Chart.js, score + adherence from the analytics endpoint, 7/30/90 windows"
```

---

### Task 4: Recommendations shelf — match %, active-ingredient tags, budget flag

**Files:**
- Modify: `web/components/dashboard/product-carousel.tsx`
- Modify: `web/app/(user)/dashboard/page.tsx`

**Interfaces:**
- `CarouselProduct` gains `matchPercentage: number`, `activeIngredientTags:
  string[]`, `overBudget: boolean`.

- [ ] **Step 1: Extend `CarouselProduct` and render the new fields**

In `web/components/dashboard/product-carousel.tsx`:

```typescript
export interface CarouselProduct {
  key: string | number;
  name: string;
  imageUrl?: string;
  price: number | null;
  currency: string | null;
  rating?: number;
  matchPercentage: number;
  activeIngredientTags: string[];
  overBudget: boolean;
}
```

Add the match-percentage display (replacing/alongside the existing `badge`
prop's "Best Match" text — the rubric wants the literal number, e.g. "94%
Match"), the ingredient tag chips, and a budget-flag indicator. Keep the
existing card layout's overall shape (image, name, price/rating row) and add
below it:

```tsx
<p className="text-secondary mt-1 text-xs font-semibold tabular-nums">
  {product.matchPercentage}% Match
</p>
{product.activeIngredientTags.length > 0 && (
  <div className="mt-1 flex flex-wrap gap-1">
    {product.activeIngredientTags.slice(0, 2).map((tag) => (
      <Badge key={tag} variant="outline" className="px-1.5 py-0 text-[10px]">
        {tag}
      </Badge>
    ))}
  </div>
)}
{product.overBudget && (
  <Badge variant="destructive" className="mt-1 px-1.5 py-0 text-[10px]">
    Over budget
  </Badge>
)}
```

(`slice(0, 2)` keeps the card compact — a 36-wide card can't fit many chips;
check the wireframe/reference screenshot for how many tags it visually shows
before committing to a specific cap, adjust the number if the wireframe shows
more/fewer.)

- [ ] **Step 2: Wire the real fields from the recommendations response**

In `web/app/(user)/dashboard/page.tsx`'s `carouselProducts` derivation, add the
three new fields from the already-fetched `recommendationsQuery.data` (the P2
response shape — `match_percentage`, `active_ingredient_tags`, `over_budget`
all already exist on each entry per Phase 2's work):

```typescript
const carouselProducts: CarouselProduct[] = (recommendationsQuery.data ?? [])
  .slice(0, 8)
  .map((rec) => ({
    key: rec.product.product_id,
    name: rec.product.product_name ?? "Product",
    imageUrl: rec.product.image_url ?? undefined,
    price: rec.product.price,
    currency: rec.product.currency,
    rating: rec.product.rating ?? undefined,
    matchPercentage: rec.match_percentage,
    activeIngredientTags: rec.active_ingredient_tags,
    overBudget: rec.over_budget,
  }));
```

(Delete the old `badge: rec.match_percentage >= 80 ? "Best Match" : undefined`
line and the now-unused `badge` prop/rendering in `product-carousel.tsx` if
nothing else references it — the literal match percentage replaces the
"Best Match" badge, don't keep both showing redundant information.)

- [ ] **Step 3: Verify in both themes, run gates**

Run: `cd web && npm run dev`, check the shelf in both themes against the
wireframe/reference screenshot pair.
Run: `cd web && npm run typecheck && npm run lint`

- [ ] **Step 4: Commit**

```bash
git add web/components/dashboard/product-carousel.tsx "web/app/(user)/dashboard/page.tsx"
git commit -m "feat(dashboard): show match percentage, active-ingredient tags, and budget flags on the recommendations shelf"
```

---

### Task 5: States + a11y + fidelity pass, full gate

**Files:**
- Modify: whatever Task 1-4 touched, if the fidelity pass finds a real gap
- Create: fidelity screenshots under `docs/milestones/milestone_3/build/`
  (mirroring M2's structure — check `docs/milestones/milestone_2/build/` for the
  exact convention: filenames, what's captured)

- [ ] **Step 1: Full click-through against the real running stack**

With the docker-compose stack up and a real seeded user (or a fresh
onboarding), open `/dashboard`:
- Confirm empty states render correctly for a brand-new user (no profile yet →
  the existing `StateCard` "Complete your skin profile" state; after profile
  but before enough data → each widget's individual empty states, already
  implemented via `widgetStateFor`).
- Toggle two checklist items, confirm optimistic UI + real persistence (check
  the Mongo `routine_logs` collection directly to confirm, not just trust the
  UI).
- Confirm the chart renders with real multi-day data once some exists, on all
  three 7/30/90 windows.
- Confirm the recommendations shelf shows match %, tags, and at least one
  over-budget flag if a budget cap scenario can be constructed (reuse the same
  fixture approach Phase 2's tests used: a low `max_price` against a real
  ingested catalog).

- [ ] **Step 2: Accessibility pass**

Keyboard-toggle the checklist items (Tab + Enter/Space) — confirm this already
works (it should, if `ChecklistStrip` uses real `<button>`/checkbox semantics;
if it doesn't, that's a real gap to fix here, not defer). Check the chart and
score ring don't rely on color alone to convey the score band (the ring's
numeral is already always visible, satisfying this without extra work — confirm,
don't assume).

- [ ] **Step 3: Both-themes screenshot comparison**

Screenshot the full dashboard in light and dark, crop against the wireframe
pair, store under `docs/milestones/milestone_3/build/` following M2's naming
convention. Note any structural or token drift found — fix it in this task if
small, or record it as a follow-up if it's a genuinely separate concern (e.g.
"Skin Age" stat card's fixture-vs-real-data status, unrelated to this phase's
work).

- [ ] **Step 4: Full gate**

Run: `cd web && npm run typecheck && npm run lint && npm run build` (timeout: 300000)
Run: `cd backend && uv run pytest -q` (timeout: 1800000) — confirm nothing on
the backend regressed (this phase is frontend-only, so this should be a pure
sanity check matching Phase 3's final green state, aside from the two already-
known, independently-confirmed-flaky ES-isolation tests).

- [ ] **Step 5: Update the ledger and docs**

Mark `M3R-P4-T1` through `M3R-P4-T5` `DONE` in `M3R_TASK_LEDGER.md` with real
evidence (screenshot paths, the Chart.js swap decision reference, real field
names wired). Note in `M3R_GAP_ANALYSIS.md` §4 that the mini-bars/chart/shelf
gaps are closed, and that the checklist's live-sync is client-side-ready but
only provably end-to-end once P5/P6 land.

- [ ] **Step 6: Commit**

```bash
git add docs/milestones/milestone_3/build/ docs/milestones/milestone_3/M3R_TASK_LEDGER.md \
  docs/milestones/milestone_3/M3R_GAP_ANALYSIS.md
git commit -m "docs(m3r): close P4 ledger rows - user dashboard rebuilt to rubric spec"
```

---

## Verification (against the running stack, per the phase file)

Playwright or manual: fresh user → dashboard shows empty states → complete
assessment → gauge + 5 real sub-score bars render → toggle two checklist items
→ Mongo log rows appear (API-verified) → chart renders with real score+adherence
data on all three 7/30/90 windows → shelf shows match % + tags and at least one
over-budget flag with no allergen products. `npm run lint` + `typecheck` +
`next build` green; screenshots both themes attached.

## Exit

Manual self-review (no `gh`/PR, per Phase 1's recorded decision) → merge
`feat/m3r-p4-user-dashboard` to `dev` → delete branch → `graphify update .` →
`PROGRESS.md` entry.
