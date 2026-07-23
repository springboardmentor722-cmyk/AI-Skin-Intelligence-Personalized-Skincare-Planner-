# UI Extraction — Phase 1

Per `MILESTONE_2_MASTER_PROMPT.md` §1a (THEME OVERRIDE): the four screenshots are
authority for **structure only**, not colour. Skinlytics keeps its existing "Frosted
Lab Glass" tokens (`web/app/globals.css` + `web/lib/themes.ts`, locked per `AGENTS.md`
§4 / ADR-008) — every screenshot colour below is recorded as a **semantic role**, then
mapped onto the existing token that already serves that role. No new hex enters
`globals.css`; where a role had no existing token, one is added *derived from the
current palette*, never from the screenshot. Geometry/typography are measured exactly
as `MASTER_PROMPT.md §5.3` describes — those numbers ARE the target values, unlike
colour.

## 1. Colour — role → existing token mapping

| Role (screenshot) | Screenshot ref. (channel: value) | Existing app token | Notes |
|---|---|---|---|
| primary (active nav solid, brand emphasis) | palette+sample, `#5E36E8`/modal read (`VISION_CALIBRATION.md`, re-confirmed this branch: `palette --accent` on Admin.png → `#5B34E7`/`#6B50E6` centroids, `sample` on User.png → `#7546EC`) | `--primary` (`#0F172A` light / `#BEC6E0` dark) | This app already splits the screenshot's one "violet" into two existing roles — see next row |
| primary (links, chart stroke, ring, lead donut slice) | same as above | `--secondary` (`#2F5FD6` Royal Blue) | `--chart-1`, `--ring`, and `--sidebar-ring` already `= var(--secondary)` — no change needed, already the right role |
| primary-soft (consultant active-nav tint) | vision, `#E3E0FA` | `--primary-container` (light `#1E293B`... — **use `--secondary-container` instead**, `#DCE6FA`, since the soft tint visually reads as a pale blue-violet wash and `--secondary` is this app's "link/active" hue family) | Existing token, no addition |
| primary-pale (consultant hover) | vision, `#F1EEFD` | `--secondary-container` at reduced opacity (Tailwind `bg-secondary-container/50`) | Opacity modifier, not a new token |
| success | measured `#19A957` / soft `#EDF9F2` | `--success` (`#0D8A6E` light / `#34D399` dark) | Already exists; hue family matches (green) |
| warning | measured `#F8A933` / soft `#FFF4DF` | `--warning` (`#C1740A` light / `#FBBF24` dark) | Already exists |
| danger | *est.* `#EF4444` | `--error` (`#C33838` light / `#FFB4AB` dark) | Already exists |
| info (2nd donut slice, secondary chart series) | measured `#499CF4` | `--secondary` (Royal Blue) — `docs/DESIGN.md:244` already names **"info = Royal Blue"** verbatim | Already exists, already named this exact role |
| canvas (page background, incl. sidebar) | measured `#FAFAFE` median | `--background` (`#FAFAFA` light / `#131315` dark) | Already exists |
| card | measured `#FEFEFE` | `--card` (`= --surface-container-lowest`) | Already exists |
| border | *est.* `#EDEEF3` | `--border` (`= --outline-variant`, `#D4D4D8` light / `#45464D` dark) | Already exists |
| muted-foreground | *est.* `#6B7280` | `--muted-foreground` (`= --on-surface-variant`, `#52525B` light) | Already exists |
| section-label | *est.* `#9CA3AF` | `--muted-foreground` at reduced size/weight (11px/600/uppercase), no separate color token | Reuse, don't add |

**Categorical chart palette** (donuts, stacked bars): this app's existing
`--chart-1..5` (`secondary, tertiary, warning, success, error`) already covers 5 of
the screenshots' 6-8 categorical slots. `--chart-1` (Royal Blue) and `--chart-2`
(Teal) already anchor the sequence the way the screenshots' violet/sky do. No new
chart tokens added — components consuming a 6th+ slice repeat with opacity steps
(`/70`, `/40`) rather than minting new named colours, same pattern
`docs/DESIGN.md` already uses for tonal surface tiers.

**Score ramp** (Good/Fair/Poor): implemented this branch as `getScoreBand()` in
`web/lib/score-components.ts`, using `--success`/`--warning`/`--error` directly per
§1a's explicit instruction — **not** the separate theme-invariant `--score-teal/
blue/amber/red` 4-band system (`docs/DESIGN.md` §2), which is a different, already-
designed element (the Skin Score Ring's gradient stroke) left untouched.

**Zero new CSS custom properties were needed.** Every screenshot role maps onto a
token this app already ships.

## 2. Geometry — measured (source: `tools/vision/extract.py grid`/`probe`, P0 + this branch)

| Dimension | Measured (screenshot px → CSS px) | Existing app equivalent |
|---|---|---|
| Sidebar width | 256/240/241/251 → standardised **240px** (`VISION_CALIBRATION.md`) | `w-60` (already Tailwind-standard) |
| Grid gutter | 18/16/14/19 → standardised **16px** | `gap-4` |
| Page padding | measured **24px** | `p-6` |
| Card radius | visual read ≈14-16px, rounds to standard step | `--radius: 1rem` (16px) — **already the exact existing token**, no change |
| Inner element radius (chips/tiles/buttons) | ≈10-12px | `--radius-sm` region / `rounded-lg` (Tailwind default maps close enough; no new token needed) |
| Card padding | 20px compact / 24px content | `p-5` / `p-6` |
| Row gap | 20px | `gap-5` |
| KPI icon tile | ~40-44px, radius ~12px | `size-10`/`size-11` + `rounded-lg` |

All four dimensions round cleanly onto Tailwind's existing 4px-step scale, confirmed
in `VISION_CALIBRATION.md` ("240 = `w-60`, 16 = `gap-4`, 24 = `p-6`") — no custom
spacing scale is introduced.

## 3. Typography

Single family already in place (`docs/DESIGN.md` tri-font: Sora headings / Inter
body / Geist data) — the screenshots' "Inter-like" single-family read is a subset of
what's already shipped, not a conflict. Sizes (26-28px greeting, 14px subtitle,
15-16px card title, 30-34px KPI value, 13px KPI label, 11px section label) map onto
existing Tailwind text-size steps already used elsewhere in `web/`; no new type scale
added.

## 4. Icons

Not mapped in this pass — deferred to P2 (sidebar) and P3 (widget kit), where each
icon is identified against its actual usage context per `MASTER_PROMPT.md §5.5`,
rather than pre-guessed here.

## 5. Confidence / source-channel key

- **measured** — `tools/vision/extract.py sample`/`palette`/`grid`, this branch or
  `VISION_CALIBRATION.md` (re-confirmed this branch, P0).
- **vision** — native-vision read of a 3× crop.
- **est.** — not independently re-sampled this pass; low risk, since the mapped
  target is an existing token already used elsewhere in the app, not a new value.
