# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the visual/positioning gap between `web/app/page.tsx`'s landing page and `web/designs/wireframes/landing-page.html`, while preserving all working plumbing (auth-aware CTAs, routing, real ₹ pricing, the already-correct `ScoreExplainerBand` formula, already-localized imagery) and removing every unsupported claim.

**Architecture:** No new shared components, no new routes, no backend changes. All work is targeted edits to `web/components/landing/*.tsx` plus one file rename (`testimonials-section.tsx` → `trust-strip.tsx`) and one new Playwright spec. Visual work reuses existing design tokens (`docs/DESIGN.md` / `globals.css`) and the existing global `.aurora` — never a new background system.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS v4, shadcn/ui (Base UI), Playwright.

**Spec:** `docs/superpowers/specs/2026-08-19-landing-page-redesign-design.md`

## Global Constraints

- Do NOT create a new `ScoreExplainerBand` — it already exists at `web/components/landing/score-explainer-band.tsx` with the correct real formula (35/20/20/15/10). Only a source-of-truth comment is added.
- Do NOT create a new `AuroraBackground` component and do NOT modify `web/app/layout.tsx` or the `.aurora` rules in `web/app/globals.css` — the existing global aurora is reused as-is.
- Do NOT port or recreate wireframe imagery — all 8 images the wireframe uses are already at `web/public/images/landing/img_*.jpg` and already correctly wired into `hero-section.tsx`, `roles-section.tsx`.
- Do NOT change `pricing-section.tsx`'s ₹0 / ₹499 values or plan logic — visual/micro-interaction polish only.
- Do NOT change any `useCurrentUser()` auth-aware CTA logic in `hero-section.tsx`, `final-cta-section.tsx`, `landing-navbar.tsx`.
- Every fabricated claim removed must be replaced only with statements already supportable from content elsewhere on this same page (cite the source line).
- No new npm dependencies.
- Commit author stays the repo's single contributor identity; never add a Claude/AI co-author trailer (`AGENTS.md` §6).
- Both light and dark themes, plus at least 2 alternate palettes, must be checked for every visual change (`AGENTS.md` §7.6).

---

### Task 1: Branch setup + failing content-integrity e2e tests

**Files:**
- Create: `web/tests/e2e/landing-content-integrity.spec.ts`

**Interfaces:**
- Consumes: nothing (new test file).
- Produces: 4 Playwright tests that Tasks 2-4 will turn green. Test names: `"landing page has no fabricated user-count or testimonial claims"`, `"TrustStrip shows real capability statements"`, `"RolesSection uses title-case role labels matching the wireframe"`.

- [ ] **Step 1: Create the feature branch from latest `dev`**

```bash
git checkout dev
git pull
git checkout -b feature/landing-page-redesign
```

- [ ] **Step 2: Write the failing tests**

```typescript
import { test, expect } from "@playwright/test";

// Landing-page redesign (docs/superpowers/specs/2026-08-19-landing-page-redesign-design.md
// §2/§5) removed 3 fabricated-stat/testimonial locations (hero avatar row, final CTA,
// testimonials quotes) and replaced TestimonialsSection with TrustStrip's real
// capability statements. This locks in that none of them can silently come back.
test("landing page has no fabricated user-count or testimonial claims", async ({ page }) => {
  await page.goto("/");
  const bodyText = await page.locator("body").innerText();
  expect(bodyText).not.toContain("12,000");
  expect(bodyText).not.toContain("Sarah Chen");
  expect(bodyText).not.toContain("Marcus Reed");
});

test("TrustStrip shows real capability statements", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByText("Skin Score weighted across 5 clinical dimensions")
  ).toBeVisible();
  await expect(page.getByText("Advisory AI, never a diagnosis")).toBeVisible();
});

test("RolesSection uses title-case role labels matching the wireframe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "For Individuals" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "For Consultants" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "For Dermatologists" })).toBeVisible();
});
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `cd web && npx playwright test landing-content-integrity`
Expected: all 3 tests FAIL — `"12,000"` is still present, `TrustStrip` text doesn't exist yet, roles are still lowercase.

- [ ] **Step 4: Commit**

```bash
git add web/tests/e2e/landing-content-integrity.spec.ts
git commit -m "test(e2e): add failing landing content-integrity checks"
```

---

### Task 2: Remove fabricated user-count claims from Hero and Final CTA

**Files:**
- Modify: `web/components/landing/hero-section.tsx:86-89`
- Modify: `web/components/landing/final-cta-section.tsx:25-27`

**Interfaces:**
- Consumes: nothing new.
- Produces: no interface change — same exported `HeroSection`/`FinalCtaSection`, text content only.

- [ ] **Step 1: Replace the hero stat line**

In `hero-section.tsx`, replace lines 86-89:

```tsx
              <span className="font-sans text-sm font-medium">
                12,000+ skin profiles analyzed ·{" "}
                <span className="text-secondary">Dermatologist-informed</span>
              </span>
```

with:

```tsx
              <span className="font-sans text-sm font-medium">
                AI-powered skin analysis ·{" "}
                <span className="text-secondary">Personalized routines</span>
              </span>
```

- [ ] **Step 2: Replace the final-CTA supporting line**

In `final-cta-section.tsx`, replace lines 25-27:

```tsx
          <p className="mb-10 font-sans text-lg opacity-80">
            Join 12,000+ users who have optimized their skin health with clinical-grade
            intelligence.
          </p>
```

with:

```tsx
          <p className="mb-10 font-sans text-lg opacity-80">
            AI-powered skin analysis, weighted scoring, and a routine built around your
            own data.
          </p>
```

- [ ] **Step 3: Run the content-integrity test and confirm the first test now passes**

Run: `cd web && npx playwright test landing-content-integrity -g "no fabricated"`
Expected: PASS (the other 2 tests in the file still fail — TrustStrip/casing not done yet).

- [ ] **Step 4: Commit**

```bash
git add web/components/landing/hero-section.tsx web/components/landing/final-cta-section.tsx
git commit -m "fix(web): remove fabricated 12,000+ user-count claims from landing hero and final CTA"
```

---

### Task 3: Rewrite TestimonialsSection into TrustStrip

**Files:**
- Delete: `web/components/landing/testimonials-section.tsx`
- Create: `web/components/landing/trust-strip.tsx`
- Modify: `web/app/page.tsx:7,27`

**Interfaces:**
- Consumes: nothing new (no props, matches every other landing section's zero-prop pattern).
- Produces: `export function TrustStrip()` — replaces `export function TestimonialsSection()` in `page.tsx`'s composition. No other file imports `TestimonialsSection` (landing-only component).

- [ ] **Step 1: Create `trust-strip.tsx`**

```tsx
import { Activity, Database, ShieldCheck, Target } from "lucide-react";

// Replaces fabricated Sarah Chen / Marcus Reed testimonials (removed per
// docs/superpowers/specs/2026-08-19-landing-page-redesign-design.md §5) with
// capability statements already claimed elsewhere on this page — nothing here is a
// new claim: dimensions match score-explainer-band.tsx, the data-point count matches
// how-it-works-section.tsx, product scoring matches features-grid.tsx, and the
// advisory framing matches faq-section.tsx.
const PROOF_POINTS = [
  {
    icon: Target,
    title: "Skin Score weighted across 5 clinical dimensions",
    body: "Skin condition, lifestyle, routine adherence, sleep quality, and hydration — not a single guess.",
  },
  {
    icon: Activity,
    title: "50+ lifestyle and environmental data points",
    body: "Correlates your skin scan with sleep, hydration, UV exposure, and daily habits.",
  },
  {
    icon: Database,
    title: "Ingredient-level product match scoring",
    body: "Cross-references your profile against ingredient interactions before you buy.",
  },
  {
    icon: ShieldCheck,
    title: "Advisory AI, never a diagnosis",
    body: "Every result carries a confidence score. Skinlytics complements, never replaces, professional care.",
  },
];

export function TrustStrip() {
  return (
    // primary-container (not primary) — a fixed dark navy accent band in both themes,
    // unlike `primary` which inverts per theme (docs/DESIGN.md's colors-dark tokens).
    <section className="bg-primary-container text-on-primary-container py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-heading mb-12 text-3xl font-bold">Real skin. Real data.</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PROOF_POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
            >
              <point.icon className="text-secondary mb-6 size-8" strokeWidth={1.5} />
              <p className="mb-2 font-sans text-lg leading-snug font-bold">{point.title}</p>
              <p className="text-on-primary-container/60 font-sans text-sm">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Delete the old file**

```bash
git rm web/components/landing/testimonials-section.tsx
```

- [ ] **Step 3: Update `page.tsx`**

In `web/app/page.tsx`, change line 7:

```tsx
import { TestimonialsSection } from "@/components/landing/testimonials-section";
```

to:

```tsx
import { TrustStrip } from "@/components/landing/trust-strip";
```

and change line 27:

```tsx
        <TestimonialsSection />
```

to:

```tsx
        <TrustStrip />
```

- [ ] **Step 4: Run the content-integrity tests and confirm all 3 now pass**

Run: `cd web && npx playwright test landing-content-integrity`
Expected: PASS — no more `"12,000"`/`"Sarah Chen"`/`"Marcus Reed"`, `TrustStrip` text visible. (Roles-casing test still fails — Task 4.)

- [ ] **Step 5: Commit**

```bash
git add web/components/landing/trust-strip.tsx web/app/page.tsx
git commit -m "feat(web): rewrite landing TestimonialsSection into TrustStrip with real capability statements"
```

---

### Task 4: Fix RolesSection title casing

**Files:**
- Modify: `web/components/landing/roles-section.tsx:11,19,25`

**Interfaces:**
- Consumes: nothing new.
- Produces: no interface change — string literals only.

- [ ] **Step 1: Fix the 3 title strings**

In `roles-section.tsx`, change:

```tsx
    title: "For individuals",
```
```tsx
    title: "For consultants",
```
```tsx
    title: "For dermatologists",
```

to:

```tsx
    title: "For Individuals",
```
```tsx
    title: "For Consultants",
```
```tsx
    title: "For Dermatologists",
```

(exact casing from `web/designs/wireframes/landing-page.html:446,455,464`).

- [ ] **Step 2: Run the full content-integrity spec and confirm all 4 tests pass**

Run: `cd web && npx playwright test landing-content-integrity`
Expected: all 4 PASS.

- [ ] **Step 3: Commit**

```bash
git add web/components/landing/roles-section.tsx
git commit -m "fix(web): title-case RolesSection headings to match wireframe"
```

---

### Task 5: ScoreExplainerBand source-of-truth comment

**Files:**
- Modify: `web/components/landing/score-explainer-band.tsx:1-5`

**Interfaces:**
- Consumes: nothing new.
- Produces: no interface/behavior change — comment only. `SCORE_COMPONENTS` values (35/20/20/15/10) are unchanged.

- [ ] **Step 1: Extend the existing comment with a code pointer**

Replace lines 3-5:

```tsx
// Real Skin Health Score weights (docs/AGENTS.md §4 / docs/AI_ML.md) — not the
// wireframe's invented "Hydration/Texture/Elasticity/Tone/Barrier" figures, which
// don't match the actual scoring engine used everywhere else in the app.
```

with:

```tsx
// Real Skin Health Score weights (docs/AGENTS.md §4 / docs/AI_ML.md) — not the
// wireframe's invented "Hydration/Texture/Elasticity/Tone/Barrier" figures, which
// don't match the actual scoring engine used everywhere else in the app. Canonical
// source: calculate_skin_health_score in
// backend/app/services/scores/scoring_engine.py:224-261 (weights are config-driven
// from the `scoring_weights` table there — these are static marketing copies of the
// current defaults, not a live read, since this is a public unauthenticated page).
```

- [ ] **Step 2: Verify no behavior changed**

Run: `cd web && npx playwright test landing-content-integrity` (still all green — this file has no test of its own beyond what already exists).

- [ ] **Step 3: Commit**

```bash
git add web/components/landing/score-explainer-band.tsx
git commit -m "docs(web): point ScoreExplainerBand's weight comment at scoring_engine.py"
```

---

### Task 6: Final CTA — local depth texture + primary CTA micro-interaction

The wireframe's final-CTA band layers a second, locally-scoped shader wash (`opacity-30`) on top of its dark `primary-container` background, in addition to the page's global ambient aurora — giving that one high-impact moment more visual depth than a flat fill. Reproducing this without a second aurora *system*: one inline decorative gradient `div`, local to this component only, using the existing brand tokens, fully static (per the spec's already-approved "CSS gradient, no WebGL" call and the "no new background system" constraint — this is not reusable, not global, not animated).

**Files:**
- Modify: `web/components/landing/final-cta-section.tsx`

**Interfaces:**
- Consumes: existing CSS custom properties `--secondary`, `--tertiary` (already defined globally in `globals.css`, already used by the `.aurora` rule itself — same tokens, different scope).
- Produces: no interface change — visual only.

- [ ] **Step 1: Add the local gradient overlay and give the content wrapper a stacking context**

In `final-cta-section.tsx`, change:

```tsx
      <div className="bg-primary-container text-on-primary-container rounded-[3rem] p-16 text-center">
        <div className="mx-auto max-w-2xl">
```

to:

```tsx
      <div className="bg-primary-container text-on-primary-container relative overflow-hidden rounded-[3rem] p-16 text-center">
        {/* Local depth texture only — not the global .aurora (layout.tsx), scoped to
            this one high-impact CTA band, static (no WebGL/animation), matches
            wireframe's locally-layered shader wash at equivalent low opacity. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, var(--tertiary), transparent 55%), radial-gradient(circle at 80% 80%, var(--secondary), transparent 55%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
```

(The gradient `div` self-closes, and the content wrapper is the same existing `<div className="mx-auto max-w-2xl">` with `relative z-10` added to its className — no new nesting level, no extra closing tag. Total closing `</div>` count for the section is unchanged: outer band + content wrapper, same as before.)

- [ ] **Step 2: Add shadow + press micro-interaction to the primary CTA button only**

Change the signed-out primary button's className (the "Start assessment" `Button`, not the "View pricing" outline one):

```tsx
                className="h-auto bg-white px-10 py-4 text-base text-black hover:bg-white/90"
```

to:

```tsx
                className="h-auto bg-white px-10 py-4 text-base text-black shadow-xl transition-transform hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
```

Apply the same className change to the signed-in "Go to Dashboard" variant of the button (both branches render the same button styling, only the `render` prop differs — keep them visually identical).

- [ ] **Step 3: Manual visual check**

Run: `cd web && npm run dev`, open `http://localhost:3000`, scroll to the final CTA band. Confirm: subtle teal/royal-blue glow visible against the dark navy background (not overpowering — 30% opacity over an already-dark fill), primary button scales slightly on hover, no layout shift. Check both light and dark theme (the band's own colors are theme-fixed `primary-container`, so it should look the same in both — confirm it does).

- [ ] **Step 4: Commit**

```bash
git add web/components/landing/final-cta-section.tsx
git commit -m "feat(web): add local depth texture and CTA micro-interaction to landing final CTA band"
```

---

### Task 7: Hero and Pricing Pro CTA micro-interaction polish

Wireframe's primary hero CTA (`hover:scale-[1.02] active:scale-[0.98]` + `shadow-xl`) and Pro pricing CTA (`hover:scale-[1.02]`) both carry a tactile press/lift interaction the current build's plain `Button` doesn't have (`button.tsx` confirmed — no scale/shadow in any variant). Adding it locally via `className` override on these two specific buttons only, not to `button.tsx` itself (that's a shared file used by the entire app — scope this to the landing page's highest-intent CTAs, matching exactly where the wireframe applies it).

**Files:**
- Modify: `web/components/landing/hero-section.tsx:56-62`
- Modify: `web/components/landing/pricing-section.tsx:60-62`

**Interfaces:**
- Consumes: nothing new.
- Produces: no interface change — visual only.

- [ ] **Step 1: Hero primary CTA**

In `hero-section.tsx`, change the signed-out primary button's className:

```tsx
                className="h-auto px-8 py-4 text-base"
```

to:

```tsx
                className="h-auto px-8 py-4 text-base shadow-xl transition-transform hover:scale-[1.02] active:scale-[0.98]"
```

Apply the same className to the signed-in "Go to Dashboard" variant (both branches, same visual treatment).

- [ ] **Step 2: Pricing Pro CTA**

In `pricing-section.tsx`, change:

```tsx
          <Button size="lg" className="h-auto bg-white py-4 text-black hover:bg-white/90">
            Get Pro now
          </Button>
```

to:

```tsx
          <Button
            size="lg"
            className="h-auto bg-white py-4 text-black transition-transform hover:scale-[1.02] hover:bg-white/90"
          >
            Get Pro now
          </Button>
```

(Standard tier's "Start free" button keeps its plain style — the wireframe only applies the scale micro-interaction to the highlighted "Popular" plan's CTA.)

- [ ] **Step 3: Manual visual check**

Run: `cd web && npm run dev`. Hover/click the hero primary CTA and the Pricing "Get Pro now" button — confirm a subtle scale + shadow on hover, slight press-down on click, no jank, no layout shift, works in both themes.

- [ ] **Step 4: Commit**

```bash
git add web/components/landing/hero-section.tsx web/components/landing/pricing-section.tsx
git commit -m "feat(web): add CTA micro-interactions to landing hero and pricing Pro button"
```

---

### Task 8: Full-page visual verification against the wireframe

The remaining sections (`landing-navbar.tsx`, `how-it-works-section.tsx`, `features-grid.tsx`, `roles-section.tsx`'s layout, `pricing-section.tsx`'s layout, `faq-section.tsx`, `landing-footer.tsx`) were compared line-by-line against `web/designs/wireframes/landing-page.html` during planning and already match its structure, spacing scale, and radius tokens closely (e.g. `how-it-works-section.tsx`'s `hover:-translate-y-2 transition-transform duration-300` is already verbatim-equivalent to the wireframe). This task is the mandatory browser-verification pass (`AGENTS.md` §4/§7.6) to confirm that holds in the real running app — not a re-guess — and to fix anything that doesn't.

**Files:**
- Potentially modify: any `web/components/landing/*.tsx` file where the checklist below finds a real deviation. No changes are pre-specified because none were found during static comparison — this task's job is to verify that against the rendered page, not to invent work.

- [ ] **Step 1: Start the dev server and open the reference wireframe side-by-side**

```bash
cd web && npm run dev
```

Open `http://localhost:3000` in one window and `web/designs/wireframes/landing-page.html` (or its screenshot at `web/designs/wireframes/source/reference-screenshots/landing-page.png` if present) in another.

- [ ] **Step 2: Section-by-section checklist (desktop, 1440px, light theme, default palette)**

For each: Navbar · Hero · ScoreExplainerBand · HowItWorksSection · FeaturesGrid · RolesSection · TrustStrip · PricingSection · FaqSection · FinalCtaSection · Footer — confirm: spacing/padding reads as equivalent to the wireframe (not necessarily pixel-identical, since real tokens supersede the wireframe's Stitch-only arbitrary values per `AGENTS.md` §0), heading hierarchy and weight look intentional, card radius/border treatment matches the "glass frames data, solid cards hold data" rule (`AGENTS.md` §4), no orphaned/awkward line breaks, no element overflowing its container. Fix any genuine deviation directly in the relevant component file using existing token classes (never a new arbitrary hex/px value) and note the file:line changed.

- [ ] **Step 3: Responsive check**

Resize to 375×667 (mobile) and 768×1024 (tablet). Confirm: navbar collapses sensibly (no overflow — `md:flex` nav links already hide below `md`), hero stacks to single column, feature/role grids reflow to 1-2 columns, pricing cards stack, no horizontal scrollbar anywhere on the page at any width.

- [ ] **Step 4: Theme and palette check**

Toggle dark mode (theme toggle in navbar). Then, via Settings → Appearance (or `PaletteProvider`'s test hook if one exists), switch through at least 2 alternate palettes. Confirm at each: text contrast holds, `TrustStrip`/`FinalCtaSection`'s `primary-container` bands stay legible (per `AGENTS.md` §4 they're deliberately theme-fixed navy, not inverting), CTA buttons stay visible, borders/glass panels stay coherent, the new final-CTA gradient overlay (Task 6) still reads as subtle depth, not a color clash.

- [ ] **Step 5: Accessibility spot-check**

Tab through the page keyboard-only from the top: confirm every interactive element (nav links, CTAs, accordion triggers, footer links, theme toggle) gets a visible focus ring and is reachable in a sane order. Confirm heading hierarchy is `h1` (hero) → `h2` (section headings) → `h3`/`h5` (card titles) with no level skipped in a way that breaks screen-reader navigation.

- [ ] **Step 6: Commit any fixes found**

```bash
git add <changed files>
git commit -m "fix(web): landing page visual-comparison fixes against wireframe"
```

(Skip this commit if step 2-5 found nothing to fix — that's a valid, expected outcome given the pre-verification already done during planning.)

---

### Task 9: Final validation and PROGRESS.md update

**Files:**
- Modify: `PROGRESS.md`

- [ ] **Step 1: Lint and typecheck**

```bash
cd web && npm run lint && npm run typecheck
```

Expected: no errors. Fix any and re-run before continuing.

- [ ] **Step 2: Full production build**

```bash
cd web && npm run build
```

Expected: build succeeds, no new warnings about the touched files.

- [ ] **Step 3: Full e2e suite for the landing page**

```bash
cd web && npx playwright test landing-content-integrity landing-footer authenticated-landing-header
```

Expected: all PASS — confirms this work didn't regress the two pre-existing landing suites.

- [ ] **Step 4: Update `PROGRESS.md`**

Add an entry under the current milestone's log describing what shipped: fabricated-claim removal (3 locations), `TestimonialsSection` → `TrustStrip` rewrite, role-card casing fix, `ScoreExplainerBand` source comment, final-CTA depth texture, hero/pricing CTA micro-interactions, and the outcome of the Task 8 visual-comparison pass (what if anything was fixed). State plainly that this was scope-corrected from a full rebuild to a targeted refinement after verification found the existing implementation already wireframe-faithful and tested — don't overstate it as a ground-up redesign.

- [ ] **Step 5: Final commit**

```bash
git add PROGRESS.md
git commit -m "docs: update PROGRESS.md for landing page redesign"
```

- [ ] **Step 6: Report final state for user approval — do not merge**

Run `git log --oneline dev..feature/landing-page-redesign` and `git status`, and report both to the user alongside the Task 8 checklist results, screenshots/description of the browser verification, and build/test/lint results. Wait for explicit approval before merging `feature/landing-page-redesign` into `dev` — this plan does not include the merge step.
