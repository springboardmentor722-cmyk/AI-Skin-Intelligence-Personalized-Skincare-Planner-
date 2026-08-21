# Landing Page Redesign — Design Spec

Date: 2026-08-19
Status: draft, pending user approval
Branch to create after approval: `feature/landing-page-redesign` from latest `dev`

## 1. Goal

Elevate `web/app/page.tsx`'s landing page to feel like a premium AI Skin
Intelligence platform, following `web/designs/wireframes/landing-page.html` as
the compositional reference, while preserving all working plumbing (routes,
auth-aware CTAs, real ₹ pricing, e2e coverage) and removing every unsupported
claim.

## 2. Corrections from verification (read before the rest of this doc)

The original brief assumed the current landing page is a weak/generic
implementation needing a ground-up rebuild. Verification (reading every
`web/components/landing/*.tsx` file directly, not from memory) found the
opposite: **it's a mature, wireframe-derived, previously-hardened
implementation.** This materially narrows scope from what was approved in
brainstorming:

- **`ScoreExplainerBand` already exists** (`score-explainer-band.tsx`) and
  already uses the *real* scoring formula — its own code comment (lines 3-5)
  explicitly rejects the wireframe's invented
  "Hydration/Texture/Elasticity/Tone/Barrier" dimensions in favor of the real
  ones. **No new component needed here** — the "new component" plan item
  from brainstorming is void. Only action: add a comment pointing at
  `backend/app/services/scores/scoring_engine.py:224-261` as the literal
  source of truth (currently only cites docs, not the code).
- **Wireframe imagery is already localized and correctly wired.** All 8
  images the wireframe actually uses (of 12 files in
  `source/images/landing-page/`, 4 are unused Stitch-extraction duplicates)
  are copied to `web/public/images/landing/img_*.jpg` and referenced with the
  exact same section mapping as the wireframe (hero avatars + serum droplet,
  3 role-card photos, 2 testimonial avatars). **No image porting work
  needed.**
- **A global ambient aurora already exists and already wraps this page.**
  `web/app/layout.tsx:52` renders `<div className="aurora" aria-hidden="true" />`
  once, site-wide, above `{children}`. `globals.css:597-621` defines it:
  fixed, low-opacity (`0.05` dark / higher light — see file), radial
  gradients built from `var(--primary)`/`var(--secondary)`/`var(--tertiary)`
  (so it re-themes automatically across all 8 palettes with zero
  component-level work), 60s drift animation gated behind
  `prefers-reduced-motion: no-preference`. `page.tsx`'s own header comment
  says the page is "standalone over the global aurora, same pattern as the
  (auth) screens." **The brainstormed "new shared `AuroraBackground`
  component" is redundant and is dropped.** Building a second, page-local
  aurora system would duplicate `docs/DESIGN.md §3`'s one ambient-aurora
  contract and directly contradicts the user's own approval note ("do not
  modify the global aurora system unnecessarily") — the correct move is to
  rely on the existing one, not add a competing one.
- **A third fabricated-stat location was missed in brainstorming**:
  `final-cta-section.tsx:26-27` — "Join 12,000+ users who have optimized
  their skin health with clinical-grade intelligence." This needs the same
  fix as the hero avatar-row stat and the testimonial quotes.
- **Pricing needs zero data changes** — `pricing-section.tsx` already has
  real ₹0 / ₹499 tiers matching the wireframe's 2-tier + "Popular" badge
  structure. Visual restyle only.
- **Features/FAQ/HowItWorks copy is already wireframe-aligned** (FAQ was
  deliberately rewritten with "not medical advice" framing per its own
  in-file comment — intentional, not a gap).

**Net effect:** this is a smaller, more surgical task than originally
briefed. The real remaining work is (a) removing 3 fabricated-claim
locations, (b) a genuine content rewrite of `TestimonialsSection` →
`TrustStrip`, (c) a visual/spacing/typography refinement pass across the
existing, already-correct sections to close the "premium" gap, and (d) minor
copy fidelity fixes (role-card title casing).

## 3. Revised scope

### Rewrite (content model changes, not just visual)
- `testimonials-section.tsx` → renamed `trust-strip.tsx`, exports
  `TrustStrip`. Drops fake quotes/names/avatars/score claims. Replaces with
  4 real, already-elsewhere-claimed capability statements (see §5).

### Fix in place (small, targeted edits — not a rewrite)
- `hero-section.tsx` — remove "12,000+ skin profiles analyzed" claim
  (line 87), replace with non-numeric capability framing. Keep
  `TRUST_AVATARS` row (photography, not a numeric claim) as-is.
- `final-cta-section.tsx` — remove "Join 12,000+ users..." (lines 26-27),
  replace with non-numeric supporting line.
- `roles-section.tsx` — casing fix only: `"For individuals"` →
  `"For Individuals"` etc. (3 strings), matching wireframe title case.
- `score-explainer-band.tsx` — add one comment line citing
  `scoring_engine.py` alongside the existing docs citation. No data/logic
  change.

### Visual/typography/spacing refinement pass (no content model change)
Applied via `/ui-ux-pro-max` + `/frontend-design` + `/ponytail:ponytail ultra`
guidance, in place, on: `landing-navbar.tsx`, `how-it-works-section.tsx`,
`features-grid.tsx`, `roles-section.tsx`, `pricing-section.tsx`,
`faq-section.tsx`, `landing-footer.tsx`, plus the fixed sections above. This
is deliberately not itemized line-by-line here — it's a design-quality pass
(spacing rhythm, hierarchy, section transitions) applied against the
wireframe and reviewed visually in-browser (§7), not a content spec.

### Explicitly out of scope (do not build)
- New `AuroraBackground` component — global `.aurora` already covers this.
- Any change to `layout.tsx`'s global aurora or `globals.css`'s `.aurora`
  rules.
- New imagery/asset sourcing — all needed assets already exist.
- Pricing data/tier changes.
- Backend/API changes of any kind.

## 4. `page.tsx` composition

Unchanged section order. Only the import/JSX name changes for the renamed
component:

```
LandingNavbar
HeroSection
ScoreExplainerBand
HowItWorksSection
FeaturesGrid
RolesSection
TrustStrip        <!-- was TestimonialsSection -->
PricingSection
FaqSection
FinalCtaSection
LandingFooter
```

## 5. TrustStrip content (replaces fabricated testimonials)

Keep the existing dark `bg-primary-container` band styling and 2-column card
grid (`testimonials-section.tsx:25-49`'s structure is fine visually — it's
the *content* that's fabricated, not the layout). Replace the 2
person-quote cards with 4 capability/proof-point statements, each already
supportable by content that exists elsewhere in this same page or the wider
product — not invented:

1. "Skin Score weighted across 5 clinical dimensions" — matches
   `ScoreExplainerBand`'s real formula.
2. "50+ lifestyle and environmental data points" — same claim already made
   in `how-it-works-section.tsx:7`.
3. "Ingredient-level product match scoring" — same claim already made in
   `features-grid.tsx`'s "Product Match Scoring" card.
4. "Advisory AI — every result carries a confidence score, never a
   diagnosis" — same framing already in `faq-section.tsx:11-14`.

Heading: keep `"Real skin. Real data."` (not itself a numeric/unverifiable
claim). Icon: swap `Quote` for something proof-point-appropriate (e.g.
`BadgeCheck` or reuse the relevant `features-grid.tsx` icons) — implementer's
call within the ladder, not spec-mandated.

Drop the now-unused `img_007`/`img_008` testimonial-avatar `Image` usage;
leave the files in `public/images/landing/` (unused-but-committed, no
cleanup requested).

## 6. Data flow

None new. Fully static marketing content, no client fetches added (perf
rule, `AGENTS.md §22`/brief §22).

## 7. Testing

- Update `tests/e2e/landing-footer.spec.ts` and
  `tests/e2e/authenticated-landing-header.spec.ts` only if this work changes
  any text/selector they assert on (CTA strings, header/footer links are
  unchanged by this spec, so likely no update needed — confirm during
  implementation, don't assume).
- Add assertions (new or extended spec file) that:
  - `ScoreExplainerBand` renders `35`, `20`, `20`, `15`, `10` (percentages).
  - No page content contains the string `"12,000"` or `"12,000+"` anywhere
    (catches all 3 removed locations at once).
  - `TrustStrip` renders the 4 capability statements, not a person name.
- Manual verification (§8 of the original brief): light, dark, 2+ alternate
  palettes (`PaletteProvider`), mobile (375×667), tablet (768×1024), desktop
  (1440px+). Confirm the aurora still re-themes correctly under
  `prefers-reduced-motion`.
- `npm run lint`, `npm run typecheck`, full `npm run build`.

## 8. Definition of done

Matches `AGENTS.md §7`: wireframe/design-system fidelity checked against the
file (not memory), both themes + alt palettes checked, quality gates pass,
verified in a running browser (not just tests), `PROGRESS.md` updated in the
same change.
