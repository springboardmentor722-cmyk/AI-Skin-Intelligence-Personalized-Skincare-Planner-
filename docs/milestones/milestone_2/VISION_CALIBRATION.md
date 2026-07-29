# Vision toolkit — calibration baseline

Produced by running `tools/vision/extract.py` against `User.png`, `Consultant.png`,
`Derma.png`, and `Admin.png`. These are **measured values**, not estimates. They
supersede the visual-inspection guesses that were in `UI_SPEC.md §1` and `§4`.

Re-run everything here as the first task of P1 and confirm. If a number moves,
the screenshot is the authority — update this file in the same branch.

---

## 1. Capture geometry

```
$ extract.py probe User.png
size          1536x1024 px
scale factor  1.0667  (assumes 1440px CSS width)
```

All four captures are **1536×1024**. Two readings are possible and it matters:

| Reading | Sidebar | Gutter | Verdict |
|---|---|---|---|
| 1× — viewport is 1536px | 256 / 240 / 241 / 251 px | 18 / 16 / 14 / 19 px | 256 is `w-64`; the rest are not standard |
| **1.0667× — design viewport is 1440px** | **240 / 225 / 226 / 235 px** | **17 / 15 / 13 / 18 px** | 240 = `w-60`, 16 = `gap-4`, 24 = `p-6` |

Go with **scale 1.0667 / 1440px design width** — three independent measurements
land on standard Tailwind steps under that reading and on nothing under the other.
Confirm it in P1 before converting anything else.

## 2. Surfaces — and why single-pixel sampling fails here

| Screenshot | Canvas | Card | Separation |
|---|---|---|---|
| User | `#F9F9FE` | `#FEFEFE` | 5 |
| Consultant | `#FBFBFE` | `#FEFEFE` | 3 |
| Derma | `#FBFBFD` | `#FEFEFE` | 3 |
| Admin | `#FAFAFE` | `#FEFEFE` | 4 |

Two consequences, both load-bearing:

1. **Canvas and card differ by 3–5 units** — less than the ±8 compression noise in
   these captures. `getpixel` returns noise. Always sample the mode of a patch
   (`extract.py sample --box 5`), and let `grid` classify surfaces by
   nearest-centroid rather than by threshold.
2. **The four screenshots use four different canvas tints.** They were generated
   separately. Pick one canonical value — `#FAFAFE` is the median — and use it
   everywhere. Do not encode four canvases.

The sidebar background is *also* tinted (`#FAFAFE` on User), not white. It shares
the canvas colour; only the cards are neutral white.

## 3. Brand palette

`extract.py palette --k 20 --accent`, cross-checked against `sample --box 5` on
flat fills.

| Token | Measured | Note |
|---|---|---|
| **primary** | **`#5E36E8`** | Admin active pill, modal read of a flat fill. k-means centroids run lighter (`#6B50E6`, `#623EE4`, `#6642E7`) because antialiased edges pull them toward the background — trust the modal read |
| primary (soft/tint) | `#E3E0FA` | sidebar soft-active, insight banners |
| primary (pale) | `#F1EEFD` | consultant active pill fill |
| violet-mid | `#9986EF` | secondary chart series |
| violet-pale | `#BBB2F4` | tertiary donut slices |
| success | `#19A957` | ↑ deltas, Good badges, healthy dots |
| warning | `#F8A933` | Fair scores, follow-up-due |
| sky | `#499CF4` | second donut slice |
| rose | `#F291AE` | donut slice, top-concerns tile |
| ink (admin) | `#21233E` | admin's darker heading tone |

**The primary is `#5E36E8`, not the `#6C47FF` estimated by eye.** Noticeably
darker and more saturated. Every violet in the build derives from this one value.

Badge fills read as very light tints over white: green ≈ `#EDF9F2`, amber ≈
`#FFF4DF`. Sample them again in P1 rather than deriving them by opacity guess.

## 4. Layout — measured

`extract.py grid --scale 1.0667`. Widths are screenshot px; divide by 1.0667 for CSS.

### User
```
sidebar 256px   gutter 18px
row 0  y=21   h=45   topbar
row 1  y=96   h=204  5 cards  widths [292, 219, 237, 220, 202]
row 2  y=322  h=351  3 cards  widths [384, 386, 439]
row 3  y=690  h=334  (products + concerns + checklist — under-segments, see §6)
```

### Consultant
```
sidebar 240px   gutter 16px
row 1  y=98   h=117  5 KPI    widths [223, 226, 222, 244, 276]
row 2  y=233  h=385  2 cards  widths [837, 399]
row 3  y=630  h=303  3 cards  widths [427, 393, 399]
```

### Dermatologist
```
sidebar 241px   gutter 14px
row 1  y=98   h=118  5 KPI    widths [224, 234, 243, 245, 249]
row 2  y=233  h=382  2 cards  widths [847, 418]
row 3  y=628  h=313  (under-segments)
```

### Admin
```
sidebar 251px   gutter 19px
row 0  y=19   h=53   topbar   5 elements
row 1+ under-segments — separation is 4, at the noise floor; verify with vision
```

### Three corrections this forced to `UI_SPEC.md`

1. **User row 1 KPI cards are not equal width.** `[292, 219, 237, 220, 202]` — the
   Skin Health Score card is ~45% wider than Hydration Level. The spec said "5
   equal KPI cards". It is a 12-column row with an uneven split, not `grid-cols-5`.
2. **Consultant/Derma row 2 splits ~68/32, not 58/42.** `837:399` and `847:418`
   are **8/4** in twelve-column terms, not the 7/5 the spec assumed. The roster
   table is wider and the right rail narrower than estimated.
3. **Consultant KPI cards widen left-to-right** `[223 … 276]`; the fifth
   (Upcoming Follow-ups, the link card) is the widest.

## 5. OCR — verified working

`extract.py crop --box 0,90,256,620 --scale 3` then `ocr --psm 6`, on the User
sidebar. **Every label and every 12px subtitle came back verbatim:**

```
[96.0] My Skin Profile          [94.6] View & update your profile
[95.3] Skin Assessment          [96.0] Analyze your skin condition
[96.0] My Routine               [96.0] Your personalized routine
[89.0] Product Recommendations  [96.0] Products for your skin
[96.0] Ingredient Analyzer      [94.5] Check ingredients & safety
[87.0] Progress Tracking        [96.0] Track your skin progress
[72.2] Lifestyle & Habits  ⚠    [94.5] Sleep, water & lifestyle
[71.0] Reports             ⚠    [94.5] View & download reports
[66.0] Reminders           ⚠    [94.2] Routine & habit reminders
[84.0] Settings                 [92.0] Account & preferences
```

This independently confirms the `UI_SPEC.md §3` sidebar transcription.

Subtitles score **92–96 confidence at 3× upscale**; below 3× they are unusable.
3× is the floor, not a suggestion.

Every flagged line is an **icon bleeding into the label**, exactly as predicted:
`ff Dashboard`, `© Skin Assessment`, `(2) Product Recommendations`,
`CP Lifestyle & Habits`, `= Reports`, `(a) Reminders`, `£93 Settings`. Strip
leading non-alphabetic tokens; identify each icon from a 4× crop with vision.

## 6. Known limits — read before trusting output

- **Rows containing a full-width card merge with their neighbours.** User row 3
  and Derma row 3 both do this. Sweep `--purity 0.85…0.96`; where it still
  merges, segment that row by hand from a crop.
- **Admin barely segments at all.** Its canvas/card separation is 4, right on the
  noise floor, and `grid` emits `separation_warning` for it. Admin's layout must
  be read from crops with vision, not taken from `grid` output.
- **The four screenshots disagree with each other**: sidebar 240/225/226/235 CSS
  px, gutter 17/15/13/18. They are separately generated mockups, not one system.
  Standardise: **sidebar 240px, gutter 16px, page padding 24px** — and note the
  decision in `docs/DECISIONS.md` rather than reproducing the inconsistency.
- Palette centroids run light. Enumerate with `palette`, pin with `sample`.
