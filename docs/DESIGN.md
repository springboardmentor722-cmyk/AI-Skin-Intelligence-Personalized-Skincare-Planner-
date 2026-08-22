---
name: Skinlytics
# Tokens are the machine-readable source of truth. Values below are normalized to the
# brand palette described in prose (Deep Navy / Royal Blue / Teal). v2 adds: dark theme,
# glass, elevation, motion. v3 (Skin Intelligence System) replaces the dark theme with an
# authoritative palette — the light theme is unchanged. v4 (Milestone 1 foundation
# expansion, Branch 7) is a targeted rebalance of the *light* theme only: neutrals move
# from Tailwind's blue-tinted "slate" scale to the near-hueless "zinc" scale (cool cast
# removed, same lightness tiers), and secondary/success/warning/error each step down one
# notch of saturation from their vibrant Tailwind "600" shades. Brand hues (Navy/Blue/
# Teal), the dark theme, and the score bands are unchanged — this is not a repaint.
# Frontend maps these onto shadcn CSS variables (see §10).
colors:
  surface: '#fafafa'
  surface-dim: '#e9e9eb'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f4f5'
  surface-container: '#ededef'
  surface-container-high: '#e4e4e7'
  surface-container-highest: '#d9d9dc'
  on-surface: '#1f1f22'
  on-surface-variant: '#52525b'
  inverse-surface: '#1f1f22'
  inverse-on-surface: '#f4f4f5'
  outline: '#71717a'
  outline-variant: '#d4d4d8'
  surface-tint: '#2f5fd6'
  primary: '#0f172a'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#e2e8f0'
  inverse-primary: '#93c5fd'
  secondary: '#2f5fd6'
  on-secondary: '#ffffff'
  secondary-container: '#dce6fa'
  on-secondary-container: '#1e3a6e'
  tertiary: '#14b8a6'
  on-tertiary: '#042f2e'
  tertiary-container: '#ccfbf1'
  on-tertiary-container: '#0f766e'
  success: '#0d8a6e'
  warning: '#c1740a'
  error: '#c33838'
  on-error: '#ffffff'
  error-container: '#fbe4e4'
  on-error-container: '#8a2a2a'
  background: '#fafafa'
  on-background: '#1f1f22'
  surface-variant: '#e4e4e7'
# colors-dark v3 "Skin Intelligence System" — Deep Diagnostic Suite. Full authoritative
# palette (supersedes the v2 mechanically-derived extension tokens flagged in
# PROGRESS.md's Known Issues). success/warning aren't redefined by v3 — kept from v2.
colors-dark:
  surface: '#131315'
  surface-dim: '#131315'
  surface-bright: '#39393b'
  surface-container-lowest: '#0e0e10'
  surface-container-low: '#1b1b1d'
  surface-container: '#1f1f21'
  surface-container-high: '#2a2a2b'
  surface-container-highest: '#353436'
  on-surface: '#e4e2e4'
  on-surface-variant: '#c6c6cd'
  inverse-surface: '#e4e2e4'
  inverse-on-surface: '#303032'
  outline: '#909097'
  outline-variant: '#45464d'
  surface-tint: '#bec6e0'
  primary: '#bec6e0'
  on-primary: '#283044'
  primary-container: '#0f172a'
  on-primary-container: '#798098'
  inverse-primary: '#565e74'
  secondary: '#b4c5ff'
  on-secondary: '#002a78'
  secondary-container: '#0053db'
  on-secondary-container: '#cdd7ff'
  tertiary: '#4fdbc8'
  on-tertiary: '#003731'
  tertiary-container: '#001c18'
  on-tertiary-container: '#009182'
  success: '#34d399'
  warning: '#fbbf24'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  background: '#131315'
  on-background: '#e4e2e4'
  surface-variant: '#353436'
  # Fixed-tone extras (Material-3-style) — carried from the v3 spec for completeness;
  # not yet mapped to a shadcn CSS variable (nothing in web/components consumes them).
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#71f8e4'
  tertiary-fixed-dim: '#4fdbc8'
  on-tertiary-fixed: '#00201c'
  on-tertiary-fixed-variant: '#005048'
glass:
  blur: '20px'
  saturation: '160%'
  bg-light: 'rgba(255,255,255,0.68)'
  bg-light-strong: 'rgba(255,255,255,0.82)'   # when text-heavy content must sit on glass
  bg-dark: 'rgba(15,23,42,0.68)'
  bg-dark-strong: 'rgba(15,23,42,0.82)'
  border-light: 'rgba(15,23,42,0.08)'
  border-dark: 'rgba(255,255,255,0.08)'
  highlight-light: 'rgba(255,255,255,0.65)'    # 1px inset top edge
  highlight-dark: 'rgba(255,255,255,0.14)'
  shadow-light: '0 8px 32px rgba(15,23,42,0.10)'
  shadow-dark: '0 8px 32px rgba(0,0,0,0.45)'
  max-stacked-layers: 2
elevation:
  level-0: 'flat — background only'
  level-1: 'tonal container (surface-container-*) — grouping without borders'
  level-2: '1px outline-variant border on surface-container-lowest — the Diagnostic Module'
  level-3: 'level-2 + 0 4px 20px rgba(37,99,235,0.08) — focused/active diagnostic card (dark: no shadow, one-step-lighter surface + border instead)'
  level-4: 'glass — app chrome, overlays, hero, score housings'
  z-scale: 'base 0 · sticky 30 · dropdown 40 · modal 50 · toast 60'
typography:
  h1:
    fontFamily: Sora
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h1-mobile:
    fontFamily: Sora
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.2'
  h2:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  data-display:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.0'
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
motion:
  duration-fast: 120ms
  duration-base: 200ms
  duration-slow: 320ms
  easing-standard: cubic-bezier(0.2, 0, 0, 1)
  easing-emphasized: cubic-bezier(0.32, 0.72, 0, 1)
---

# Skinlytics design system — "Frosted Lab Glass"

> **Naming note:** this system is referenced elsewhere (`AGENTS.md`, `CLAUDE.md`) as
> "Frosted Lab Glass" and described as locked. The v3 dark-theme update below was
> commissioned under the name "Skin Intelligence System" — same design system, same
> light theme, an authoritative dark-theme repaint. If a genuinely new system name is
> wanted, `AGENTS.md` §3 needs updating too (out of scope for this change — flagged,
> not silently resolved).

## 1. Brand & style

Skinlytics reads as a **medical-grade diagnostic instrument**, not a beauty app. The
personality is **Clinical but Human**: authoritative yet accessible, AI-driven skincare
presented as rigorous data science — avoiding cold sterility in favor of a calm,
data-driven atmosphere. The visual style is **Modern Minimalist with Technical Nuance**,
deliberately avoiding beauty tropes (swashes, pastels, soft-focus photography) and
strictly **gender-neutral** in palette, imagery, and copy.

Glassmorphism gives the interface dimensionality and a "looking through the instrument"
quality — but glass is used with lab discipline: it frames data, it never sits under it.
In light mode this reads as polished laboratory glassware over a quiet neutral bench:
precise, layered, light — the "Airy Lab" (v4: the bench itself moved off a blue-tinted
slate onto a true neutral gray, per Branch 7's targeted rebalance below — still quiet,
no longer reading cool). **v3's dark theme is the same instrument at night**: the "Deep
Diagnostic Suite," a high-end night-time scan — quiet, authoritative, focused, leaning
on heavy "darkspace" rather than whitespace to hold the same reduced cognitive load.

## 2. Color system

Three brand hues with distinct jobs, on a neutral foundation:

- **Deep Navy `#0F172A` — primary (light) / `primary-container` (dark).** Major actions,
  primary buttons, headline emphasis. Grounded and authoritative. In dark mode, primary
  itself shifts to a soft lavender-grey (`#BEC6E0`) for visibility on near-black
  surfaces — navy moves to `primary-container`, still the brand's anchor color, just no
  longer the highest-contrast one.
- **Royal Blue `#2F5FD6` (light) / `#B4C5FF` (dark) — secondary.** High-intent
  navigation, links, focus rings, interactive states, chart series A. v4 (Branch 7):
  light mode's shade steps down one notch of saturation from the original `#2563EB` —
  same hue, reads as calm confirmation rather than alert-level intensity; dark mode's
  periwinkle is unchanged (already soft against near-black).
- **Teal `#14B8A6` — tertiary, "data-active."** Reserved for AI processing states, positive
  skin metrics, healthy selections, chart series B. Teal appearing means "the intelligence
  layer is speaking." Dark mode: `#4FDBC8`. Untouched by Branch 7 — score bands and the
  Score Ring stay exactly as designed.

Semantic set (light, v4): success `#0D8A6E`, warning `#C1740A`, error `#C33838`, info =
Royal Blue — each one notch less saturated than the original Tailwind "600" shade it came
from (`#059669`/`#D97706`/`#DC2626`), same reasoning as secondary above. Semantic set
(dark, unchanged): success `#34D399`, warning `#FBBF24`, error `#FFB4AB` — already soft
enough against near-black that Branch 7 left them alone.
**Score bands** (Skin Health Score 0–100, theme-invariant, unchanged by Branch 7): 80–100
Teal · 60–79 Royal Blue (the score-band reference, not the rebalanced secondary shade
above — score bands are fixed diagnostic colors) · 40–59 Amber `#F59E0B` · 0–39 Red
`#EF4444`.

Neutrals are the tiered surface tokens: `background` → `surface-container-*` tiers
distinguish page, grouping, and module layers **tonally**, so depth rarely needs shadows.
**Light mode (v4, Branch 7)** moved off Tailwind's blue-tinted "slate" scale onto the
near-hueless "zinc" scale — same lightness tiers (`surface` `#FAFAFA` → `surface-
container-highest` `#D9D9DC`), the cool cast removed; `on-surface` also eased off pure
near-black navy (`#0F172A`, shared with `primary`) to a warmer near-black (`#1F1F22`),
so body text is no longer the identical tone as primary-brand emphasis. **Dark mode (v3)
is a true near-black neutral ramp** (`#131315` base, not a navy-tinted one) — navy is now
reserved specifically for `primary-container`, a deliberate accent rather than the
ambient surface color; Branch 7 didn't touch dark mode's neutrals, only light's.

Contrast floor: body text ≥ 4.5:1, large text and UI glyphs ≥ 3:1 — **measured against the
effective backdrop, including glass surfaces** (see §3 guardrails).

### 2a. Alternate palettes (Theme system, Phase 3)

Users can pick one of 8 **color palettes** from Settings → Appearance
(`components/settings/appearance-settings.tsx`), independent of light/dark mode. A
palette is a color choice only — it re-points `primary`/`secondary`/`tertiary` (+ their
`on-*`/`*-container` pairs) to different values in `app/globals.css`'s
`[data-palette="…"]` blocks; everything else in this document (glass, spacing, radius,
tri-font, the Score Ring's own gradient) is unchanged by any palette, per this file's own
"Design system is locked, not proposed" rule (AGENTS.md §3). Every component already
consumes these token names, so a palette switch needs zero component-level changes.

Deliberately **not** varied per palette: the neutral surface/on-surface/outline ramp
(this is what keeps every palette reading as unmistakably Frosted Lab Glass, not a
repaint — 7 hand-tuned neutral scales without real design-tool iteration risk looking
muddy); success/warning/error (status color should mean the same thing regardless of
palette); score bands (already theme-invariant, see above).

"Skinlytics Default" is exactly §2's Navy/Blue/Teal system above. The other 7:

| Palette | Light: primary / secondary / tertiary | Dark: primary / secondary / tertiary |
|---|---|---|
| Emerald | `#064E3B` / `#059669` / `#84CC16` | `#6EE7B7` / `#34D399` / `#BEF264` |
| Ocean | `#0C4A6E` / `#0284C7` / `#06B6D4` | `#7DD3FC` / `#38BDF8` / `#67E8F9` |
| Lavender | `#3B0764` / `#7C3AED` / `#C026D3` | `#C4B5FD` / `#A78BFA` / `#F0ABFC` |
| Sunset | `#7C2D12` / `#EA580C` / `#DB2777` | `#FDBA74` / `#FB923C` / `#F9A8D4` |
| Slate | `#1E293B` / `#475569` / `#D97706` | `#CBD5E1` / `#94A3B8` / `#FBBF24` |
| Rose | `#881337` / `#E11D48` / `#0D9488` | `#FDA4AF` / `#FB7185` / `#5EEAD4` |
| Forest | `#14532D` / `#4D7C0F` / `#A16207` | `#86EFAC` / `#BEF264` / `#FCD34D` |

Each palette's `*-container`/`on-*` pairs and `surface-tint` live in `app/globals.css`
next to this table's values — update both together (this file's own golden rule).
Storage: one `user_appearance_preferences` row per user (any role), Postgres is the
source of truth, `localStorage` is a same-device instant-paint cache only
(`components/providers/palette-provider.tsx`). See `docs/DECISIONS.md` ADR-019 for the
full architecture rationale.

## 3. Glassmorphism — the elevation crown

Glass is **level-4 elevation**: the highest layer, reserved for chrome and moments.

**Where glass lives — every one of these, in both themes:**
1. **App chrome:** the marketing navbar, the app sidebar, and the top header are frosted
   panels floating over the ambient background.
2. **Overlays:** dialogs, sheets, dropdown menus, popovers, the ⌘K command palette, sticky
   action/compare bars, toasts.
3. **Hero & signature housings:** the landing hero panel and the Skin Score Ring housing.

**Where glass is forbidden:** under dense data. Tables, forms, charts, and product grids
live on solid **Diagnostic Module** cards (level-2/3). Glass frames data; it never
backgrounds it.

**The recipe (use tokens, never ad-hoc values)** — 20px backdrop blur, 160% saturation,
in both themes:

```css
.glass {
  background: var(--glass-bg);                       /* bg-light | bg-dark */
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  backdrop-filter: blur(20px) saturate(160%);
  border: 1px solid var(--glass-border);
  box-shadow: inset 0 1px 0 var(--glass-highlight),  /* top edge catch-light */
              var(--glass-shadow);
  border-radius: var(--rounded);                     /* 16px default */
}
/* Fallbacks — mandatory */
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: var(--surface-container); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: var(--surface-container); backdrop-filter: none; -webkit-backdrop-filter: none; }
}
```

Dark mode's glass background is `color-mix(in oklch, var(--primary-container) 32%, transparent)`
— each palette's own deep brand tone, not a literal, so glass chrome reads as a distinct
branded layer per palette over the neutral darkspace, the same way `primary-container`
carries brand color while `surface` went neutral. This replaced a hardcoded-navy-for-all-
palettes bug (ADR-052); the mix % was tuned down twice on owner feedback (2026-08-22 —
sidebar/navbar read too bright/saturated across all 8 palettes): 68%/82% → 46%/60% →
32%/46%, each step letting more of the near-black backdrop show through.

**The ambient aurora.** Blur is invisible over a flat background, so the `body` carries a
fixed aurora: 3 large radial-gradient blobs in primary → secondary → tertiary at
**20% opacity** (10% in dark mode — raised from an earlier 6–10%/4–6% pass that read as
"plain paper" against the glass panels), softly blurred, optionally drifting over ~60s
(disabled under `prefers-reduced-motion`). It must never compete with content.

**Gradient token system** (v2 rebalance, ported from the `demo_ui.html` theme preview).
Every gradient in the app derives from three aliases that auto-correct per palette —
`--gradient-start`/`--gradient-mid`/`--gradient-end` (= `--primary`/`--secondary`/
`--tertiary`) — so no gradient is ever hand-tuned per palette:
- `--gradient-ambient` / `--gradient-ambient-opacity` — the aurora above.
- `--gradient-hero` / `--gradient-hero-opacity` (34% light, 16% dark) — a two-stop radial
  wash for hero-band-style panels.
- `--gradient-cta` — a 135° primary→secondary linear gradient, for a future gradient CTA
  treatment (not yet wired into the shared Button component — existing solid-fill CTAs,
  including the landing page's already-tuned hero/pricing/final-CTA gradients, are
  deliberately left as is pending a real design decision to unify them).
- `--gradient-card-featured-opacity` (14%) — reserved for a "featured" card overlay
  variant; no component consumes it yet.
- `--brand-start`/`--brand-mid`/`--brand-end` (teal → `#1f9fbc` → royal blue) — the Skin
  Score Ring's gradient stroke. Deliberately **not** aliased to `--gradient-*`: the ring
  is palette-invariant by design (§9), so it keeps its own fixed anchors regardless of
  which palette is active.
- Per-palette light-mode `--background` gets a subtle atmospheric tint (e.g. Ocean
  `#f8fafc`, Forest `#f9fbf8`) instead of the flat neutral `#fafafa`; dark mode stays one
  shared `#131315` across every palette.
- `--chart-bar` — per-palette override for single-series bar-chart fills, falling back to
  `--chart-1` (`var(--chart-bar, var(--chart-1))`) where a component uses it. Only Slate
  (both modes, → `--chart-2`) and Forest dark (→ `--chart-3`) override it — their
  `--chart-1` reads flat/washed-out or too neon-lime in that one context.

**Guardrails**
- Maximum **2 stacked glass layers** (e.g., glass header over glass hero — never a third).
- Text on glass is limited to nav items, labels, and headings. Paragraph copy on glass
  requires the `*-strong` background variant, and still must pass AA.
- Never place glass over imagery with high local contrast (e.g., photos of faces) — use a
  scrim first.
- **Performance:** `backdrop-filter` is expensive. Keep glass regions few and large, never
  animate `blur()`, don't apply glass to list items, and add `transform: translateZ(0)`
  only where paint profiling shows a win. Skeleton loaders are solid, not glass.
- Every glass component must render correctly with the two fallbacks above — test them.
- **No heavy drop shadows anywhere in glass or diagnostic surfaces** — depth comes from
  translucency and tonal layering, not shadow. Transitions between elevation states
  should be smooth (the existing `duration-base`/`duration-slow` motion tokens), never
  abrupt.

## 4. Typography — tri-font strategy

1. **Sora** — headlines and hero statements (`h1`/`h1-mobile`/`h2`/`h3`). Geometric,
   slightly futuristic; tight letter-spacing at large sizes. Weights 600/700 only.
2. **Inter** — all body copy and primary UI text (`body-lg`/`body-md`). Neutral, highly
   readable, legible across all skin-tone backgrounds and density levels.
3. **Geist** — labels, metadata, and **all data** (`label-caps`/`data-display`): metrics,
   prices, confidence scores, the Skin Score numeral. Always `tabular-nums` so columns of
   numbers align. Increased tracking at small sizes (`label-caps` is +0.05em).

Rules: sentence case everywhere; no font outside these three; numbers never render in
Sora/Inter when they represent data. `label-caps` doubles as the "medical-ledger" section
header / status-indicator style.

## 5. Layout & spacing

**Fluid Grid**, max-width **1440px** container. Desktop: 12-column grid, 24px gutters.
Tablet: 8-column grid, 20px gutters. Mobile: 4-column grid, 16px gutters. A strict
**4px base unit** governs rhythm via the `spacing` scale. Diagnostic modules are
separated by `2xl` (48px) spacing — a whitespace-heavy (in dark mode, "darkspace-heavy")
professional environment; internal card padding is strictly `lg` (24px) so data never
feels cramped. Aurora mesh gradients respect "safe areas" and never interfere with the
legibility of primary data points.

## 6. Elevation & depth — five levels

| Level | Treatment | Used for |
|---|---|---|
| 0 | flat background | page canvas |
| 1 | tonal container (`surface-container-*`) | grouping, wells, input backgrounds |
| 2 | solid + 1px `outline-variant` border | **Diagnostic Module** cards, tables |
| 3 | level-2 + `0 4px 20px rgba(37,99,235,0.08)` (light only) | focused/hovered diagnostic cards |
| 4 | glass (§3) | chrome, overlays, hero, score housing |

No other shadows exist — depth is **Material Realism**, tonal layering and translucency,
not drop shadows. Dark mode drops the level-3 shadow entirely in favor of a one-step
lighter surface plus border; the Score Ring gains a faint teal glow instead.

## 7. Shape

Consistently **pill-influenced**, suggesting safety, organic skin forms, and modern tech:
base radius **16px**; large diagnostic containers 32px (`lg`) and hero panels 48px (`xl`);
**buttons, chips, and inputs are fully pill-shaped** (full radius) to distinguish them
from the structural containers. Circles are reserved for avatars and progress/score
rings — nothing else. Lucide icons carry a 1.5px stroke weight.

## 8. Motion

Fast and physical: 120ms micro-interactions, 200ms standard transitions, 320ms
overlays/sheets, with the two easings in tokens. Cards lift 2px on hover (transform +
shadow in light mode; transform + border-brighten in dark mode, no shadow). One
orchestrated moment per flow (e.g., the score-reveal count-up on assessment results);
everything else stays quiet. `prefers-reduced-motion` disables transforms, parallax, and
the aurora drift — opacity fades remain.

## 9. Components

- **Buttons.** Primary: pill, Deep Navy fill + white text (light) / Royal Blue
  (`secondary`) fill + white text (dark, for visibility against near-black surfaces).
  Secondary/Action: pill, transparent background, 1px border. Destructive: error red.
  Focus: 2px Royal Blue ring, offset 2px.
- **Chips.** Pill-shaped; soft Teal or Blue backgrounds at 20% opacity with 100%-opacity
  text for status indicators.
- **Inputs.** Full pill-shape (v3). Geist label above field; level-1 tonal fill; focus =
  Royal Blue border + a subtle 2px outer glow (0 blur, not a soft/diffuse glow).
- **Diagnostic Module (the core card).** Level-2 surface, 16–32px radius, Sora `h3`
  title, Geist metadata row; AI-derived modules carry a top-right **Geist "Confidence
  92%"** label; clinical (dermatologist) modules carry a "Clinical" tag instead — the two
  must never be confusable. No shadow, ever — a 1px border only (`rgba(255,255,255,0.08)`
  in dark mode, `outline-variant` in light).
- **Skin Score Ring (signature).** Radial gauge, teal→`#1f9fbc`→royal-blue gradient
  stroke (`--brand-start`/`--brand-mid`/`--brand-end` — fixed, palette-invariant), subtle
  inner shadow, `data-display` Geist numeral centered, band label beneath, the five
  weighted bars (35/20/20/15/10) alongside; housed in glass at hero sizes, borderless at
  inline sizes. Identical construction at every size, in both themes.
- **Lists.** Item names in Inter; associated technical values/timestamps in Geist.
  Separate items with a 1px border at 8% opacity.
- **Charts.** Recharts via shadcn charts. 2px strokes, Royal Blue series A, Teal series B;
  faint **dot-grid** plot background; Geist axis labels; gradient area fills at 15%
  opacity; annotations for routine/product events.
- **Selection controls.** Radios circular; checkboxes 6px-rounded squares; checked state
  fills **Teal** (healthy/positive semantics).
- **Glass components.** `GlassBar` (header/nav), `GlassPanel` (hero, score housing),
  overlay primitives (Dialog/Sheet/Popover/DropdownMenu/Command) — all consume the §3
  recipe via one shared class; no component defines its own blur values.

## 10. Theming implementation (shadcn mapping)

Tokens are exposed as CSS variables on `:root` / `.dark` and mapped to shadcn's semantic
variables: `--background`←background, `--card`←surface-container-lowest,
`--muted`←surface-container, `--border`←outline-variant, `--primary`←primary,
`--secondary`←secondary, `--accent`←tertiary-container, `--destructive`←error, plus the
`--glass-*` family from the frontmatter. Components in `web/components/ui` reference
variables only — **hard-coded colors are a review blocker** (see `docs/CONVENTIONS.md`).
Dark mode = `.dark` class strategy (`next-themes`), system-aware, toggle in every header
(`web/components/theme-toggle.tsx`, shared by the app-shell topbar and the public navbar).

## 11. Accessibility floor

AA contrast everywhere including over glass; visible keyboard focus on every interactive
element; 44px minimum touch targets; `prefers-reduced-motion` and
`prefers-reduced-transparency` honored (§3, §8); form errors announced via
`aria-describedby`; charts accompanied by accessible summaries; face-map and photo
components carry descriptive alt text.

## 12. Do / Don't

**Do:** glass for chrome and moments · tonal layers for grouping · Geist for every number ·
teal only when the AI/positive-health layer speaks · design empty, loading, and error
states for every module · keep clinical vs AI outputs visually distinct · pill-shape every
interactive element (buttons, chips, inputs).

**Don't:** glass under tables or forms · more than 2 glass layers · animated blur · new
shadow recipes · heavy drop shadows anywhere · pink/gendered styling · numbers in
Sora/Inter · colors outside the tokens.
