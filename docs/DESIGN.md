---
name: Skinlytics
# Tokens are the machine-readable source of truth. Values below are normalized to the
# brand palette described in prose (Deep Navy / Royal Blue / Teal). v2 adds: dark theme,
# glass, elevation, motion. Frontend maps these onto shadcn CSS variables (see §10).
colors:
  surface: '#f7f9fb'
  surface-dim: '#e2e6ec'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f8'
  surface-container: '#eaeef4'
  surface-container-high: '#e2e8f0'
  surface-container-highest: '#d9e0ea'
  on-surface: '#0f172a'
  on-surface-variant: '#475569'
  inverse-surface: '#0f172a'
  inverse-on-surface: '#f1f5f9'
  outline: '#64748b'
  outline-variant: '#cbd5e1'
  surface-tint: '#2563eb'
  primary: '#0f172a'
  on-primary: '#ffffff'
  primary-container: '#1e293b'
  on-primary-container: '#e2e8f0'
  inverse-primary: '#93c5fd'
  secondary: '#2563eb'
  on-secondary: '#ffffff'
  secondary-container: '#dbeafe'
  on-secondary-container: '#1e3a8a'
  tertiary: '#14b8a6'
  on-tertiary: '#042f2e'
  tertiary-container: '#ccfbf1'
  on-tertiary-container: '#0f766e'
  success: '#059669'
  warning: '#d97706'
  error: '#dc2626'
  on-error: '#ffffff'
  error-container: '#fee2e2'
  on-error-container: '#991b1b'
  background: '#f7f9fb'
  on-background: '#0f172a'
  surface-variant: '#e2e8f0'
colors-dark:
  background: '#0b1220'
  surface: '#0b1220'
  surface-container-lowest: '#0e1526'
  surface-container-low: '#111a2e'
  surface-container: '#152036'
  surface-container-high: '#1a2740'
  surface-container-highest: '#20304e'
  on-surface: '#e6edf7'
  on-surface-variant: '#94a3b8'
  outline: '#475569'
  outline-variant: '#24304a'
  primary: '#f8fafc'          # dark-mode primary action fill (Linear-style)
  on-primary: '#0f172a'
  secondary: '#3b82f6'
  on-secondary: '#ffffff'
  tertiary: '#2dd4bf'
  on-tertiary: '#042f2e'
  success: '#34d399'
  warning: '#fbbf24'
  error: '#f87171'
glass:
  blur: '20px'
  saturation: '160%'
  bg-light: 'rgba(255,255,255,0.68)'
  bg-light-strong: 'rgba(255,255,255,0.82)'   # when text-heavy content must sit on glass
  bg-dark: 'rgba(13,20,36,0.62)'
  bg-dark-strong: 'rgba(13,20,36,0.78)'
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
  level-3: 'level-2 + 0 4px 20px rgba(37,99,235,0.08) — focused/active diagnostic card'
  level-4: 'glass — app chrome, overlays, hero, score housings'
  z-scale: 'base 0 · sticky 30 · dropdown 40 · modal 50 · toast 60'
typography:
  display-lg: { fontFamily: Sora, fontSize: 48px, fontWeight: '700', lineHeight: 56px, letterSpacing: -0.02em }
  headline-lg: { fontFamily: Sora, fontSize: 32px, fontWeight: '600', lineHeight: 40px, letterSpacing: -0.01em }
  headline-lg-mobile: { fontFamily: Sora, fontSize: 24px, fontWeight: '600', lineHeight: 32px }
  headline-md: { fontFamily: Sora, fontSize: 24px, fontWeight: '600', lineHeight: 32px }
  body-lg: { fontFamily: Inter, fontSize: 18px, fontWeight: '400', lineHeight: 28px }
  body-md: { fontFamily: Inter, fontSize: 16px, fontWeight: '400', lineHeight: 24px }
  label-md: { fontFamily: Geist, fontSize: 14px, fontWeight: '500', lineHeight: 20px, letterSpacing: 0.02em }
  label-sm: { fontFamily: Geist, fontSize: 12px, fontWeight: '600', lineHeight: 16px, letterSpacing: 0.05em }
  data-lg: { fontFamily: Geist, fontSize: 40px, fontWeight: '600', lineHeight: 44px, fontVariantNumeric: tabular-nums }
  code-sm: { fontFamily: Geist, fontSize: 13px, fontWeight: '400', lineHeight: 18px }
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  stack-xs: 4px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
motion:
  duration-fast: 120ms
  duration-base: 200ms
  duration-slow: 320ms
  easing-standard: cubic-bezier(0.2, 0, 0, 1)
  easing-emphasized: cubic-bezier(0.32, 0.72, 0, 1)
---

# Skinlytics design system — "Frosted Lab Glass"

## 1. Brand & style

Skinlytics reads as a **medical-grade diagnostic instrument**, not a beauty app. The
personality is authoritative yet accessible: AI-driven skincare presented as rigorous data
science. The visual style is **Modern Minimalist with Technical Nuance** — Linear's
utility density crossed with Oura's physiological-data calm — deliberately avoiding beauty
tropes (swashes, pastels, soft-focus photography) and strictly **gender-neutral** in
palette, imagery, and copy.

v2 evolves the surface language with **glassmorphism**. Frosted glass gives the interface
dimensionality and a "looking through the instrument" quality — but glass is used with
lab discipline: it frames data, it never sits under it. The result should feel like
polished laboratory glassware over a quiet slate bench: precise, layered, light.

## 2. Color system

Three brand hues with distinct jobs, on a slate neutral foundation:

- **Deep Navy `#0F172A` — primary.** Major actions, primary buttons, headline emphasis.
  Grounded and authoritative.
- **Royal Blue `#2563EB` — secondary.** High-intent navigation, links, focus rings,
  interactive states, chart series A.
- **Teal `#14B8A6` — tertiary, "data-active."** Reserved for AI processing states, positive
  skin metrics, healthy selections, chart series B. Teal appearing means "the intelligence
  layer is speaking."

Semantic set: success `#059669`, warning `#D97706`, error `#DC2626`, info = Royal Blue.
**Score bands** (Skin Health Score 0–100): 80–100 Teal · 60–79 Royal Blue · 40–59 Amber
`#F59E0B` · 0–39 Red `#EF4444`.

Neutrals are the tiered slate surfaces in the tokens: `background` → `surface-container-*`
tiers distinguish page, grouping, and module layers **tonally**, so depth rarely needs
shadows. Dark mode inverts onto a deep navy-slate ramp (`#0B1220` base); the primary
action fill flips to near-white on navy for maximum affordance, Royal Blue and Teal
brighten one step (`#3B82F6`, `#2DD4BF`).

Contrast floor: body text ≥ 4.5:1, large text and UI glyphs ≥ 3:1 — **measured against the
effective backdrop, including glass surfaces** (see §3 guardrails).

## 3. Glassmorphism — the elevation crown (new in v2)

Glass is **level-4 elevation**: the highest layer, reserved for chrome and moments.

**Where glass lives**
1. **App chrome:** the marketing navbar, the app sidebar, and the top header are frosted
   panels floating over the ambient background.
2. **Overlays:** dialogs, sheets, dropdown menus, the ⌘K command palette, sticky
   action/compare bars, toasts.
3. **Hero & signature housings:** the landing hero panel and the Skin Score Ring housing.

**Where glass is forbidden:** under dense data. Tables, forms, charts, and product grids
live on solid **Diagnostic Module** cards (level-2/3). Glass frames data; it never
backgrounds it.

**The recipe (use tokens, never ad-hoc values)**

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

**The ambient aurora.** Blur is invisible over a flat background, so the `body` carries a
very subtle fixed aurora: 2–3 large radial-gradient blobs in navy → royal blue → teal at
**6–10% opacity** (4–6% in dark mode), softly blurred, optionally drifting over ~60s
(disabled under `prefers-reduced-motion`). It must never compete with content.

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

## 4. Typography — tri-font strategy

1. **Sora** — headlines and hero statements. Geometric, slightly futuristic; tight
   letter-spacing at large sizes. Weights 600/700 only.
2. **Inter** — all body copy and primary UI text. Neutral, highly readable.
3. **Geist** — labels, metadata, and **all data**: metrics, prices, confidence scores, the
   Skin Score numeral (`data-lg`). Always `tabular-nums` so columns of numbers align.
   Increased tracking (+0.02–0.05em) at small sizes.

Rules: sentence case everywhere; no font outside these three; numbers never render in
Sora/Inter when they represent data.

## 5. Layout & spacing

Fixed-fluid hybrid: content centered in a **1280px** container, 12-column grid, 24px
gutters; single column with 16px margins on mobile. A strict **4px baseline** governs
vertical rhythm via the `stack-*` scale. Two density modes: **data-dense** (dashboards,
tables — stack-sm/md) and **breathable** (onboarding, education — stack-lg/xl). AI
insights are always visually separated from raw tracking data by containment, not just
whitespace.

## 6. Elevation & depth — five levels

| Level | Treatment | Used for |
|---|---|---|
| 0 | flat background | page canvas |
| 1 | tonal container (`surface-container-*`) | grouping, wells, input backgrounds |
| 2 | white + 1px `outline-variant` border | **Diagnostic Module** cards, tables |
| 3 | level-2 + `0 4px 20px rgba(37,99,235,0.08)` | focused/hovered diagnostic cards |
| 4 | glass (§3) | chrome, overlays, hero, score housing |

No other shadows exist. Dark mode drops the level-3 shadow in favor of a one-step lighter
surface plus border; the Score Ring gains a faint teal glow.

## 7. Shape

Organic-technical: base radius **16px**; large diagnostic containers 32px (`lg`) and hero
panels 48px (`xl`); **buttons, chips, and inputs are pill-influenced** (buttons fully
rounded). Circles are reserved for avatars and progress/score rings — nothing else.

## 8. Motion

Fast and physical: 120ms micro-interactions, 200ms standard transitions, 320ms
overlays/sheets, with the two easings in tokens. Cards lift 2px on hover (transform +
shadow, level-2→3). One orchestrated moment per flow (e.g., the score-reveal count-up on
assessment results); everything else stays quiet. `prefers-reduced-motion` disables
transforms, parallax, and the aurora drift — opacity fades remain.

## 9. Components

- **Buttons.** Primary: Deep Navy fill, white text, pill. Secondary: transparent, 1px slate
  border, pill. AI actions: Royal Blue fill with a Geist icon-label. Destructive: error
  red. Focus: 2px Royal Blue ring, offset 2px.
- **Inputs.** Geist label above field; 16px radius; level-1 tonal fill; focus = 1px Royal
  Blue border + soft blue outer glow. Inline validation below, error red.
- **Diagnostic Module (the core card).** Level-2 surface, 16–32px radius, Sora `headline-md`
  title, Geist metadata row; AI-derived modules carry a top-right **Geist "Confidence 92%"**
  label; clinical (dermatologist) modules carry a "Clinical" tag instead — the two must
  never be confusable.
- **Skin Score Ring (signature).** Radial gauge, teal→royal-blue gradient stroke, subtle
  inner shadow, `data-lg` Geist numeral centered, band label beneath, the five weighted
  bars (35/20/20/15/10) alongside; housed in glass at hero sizes, borderless at inline
  sizes. Identical construction at every size.
- **Chips & tags.** Fully pill; 10%-opacity tint of the category color; high-contrast text;
  no borders. Severity chips use the score-band colors.
- **Charts.** Recharts via shadcn charts. 2px strokes, Royal Blue series A, Teal series B;
  faint **dot-grid** plot background; Geist axis labels; gradient area fills at 15%
  opacity; annotations for routine/product events.
- **Selection controls.** Radios circular; checkboxes 6px-rounded squares; checked state
  fills **Teal** (healthy/positive semantics).
- **Glass components.** `GlassBar` (header/nav), `GlassPanel` (hero, score housing),
  overlay primitives (Dialog/Sheet/Command) — all consume the §3 recipe via one shared
  class; no component defines its own blur values.

## 10. Theming implementation (shadcn mapping)

Tokens are exposed as CSS variables on `:root` / `.dark` and mapped to shadcn's semantic
variables: `--background`←background, `--card`←surface-container-lowest,
`--muted`←surface-container, `--border`←outline-variant, `--primary`←primary,
`--secondary`←secondary, `--accent`←tertiary-container, `--destructive`←error, plus the
`--glass-*` family from the frontmatter. Components in `web/components/ui` reference
variables only — **hard-coded colors are a review blocker** (see `docs/CONVENTIONS.md`).
Dark mode = `.dark` class strategy (`next-themes`), system-aware, toggle in the app header.

## 11. Accessibility floor

AA contrast everywhere including over glass; visible keyboard focus on every interactive
element; 44px minimum touch targets; `prefers-reduced-motion` and
`prefers-reduced-transparency` honored (§3, §8); form errors announced via
`aria-describedby`; charts accompanied by accessible summaries; face-map and photo
components carry descriptive alt text.

## 12. Do / Don't

**Do:** glass for chrome and moments · tonal layers for grouping · Geist for every number ·
teal only when the AI/positive-health layer speaks · design empty, loading, and error
states for every module · keep clinical vs AI outputs visually distinct.

**Don't:** glass under tables or forms · more than 2 glass layers · animated blur · new
shadow recipes · pink/gendered styling · numbers in Sora/Inter · colors outside the tokens.
