# `tools/vision` — screenshot reverse-engineering & fidelity gates

Measures screenshots so design work stops being an opinion. Two roles:

1. **Extraction** (before building) — pull exact colours, geometry, and verbatim
   strings out of a design screenshot.
2. **Verification** (after building) — screenshot the build and prove numerically
   that it matches, in CI.

## Install

```bash
sudo apt-get update && sudo apt-get install -y tesseract-ocr libtesseract-dev
uv pip install pillow pytesseract opencv-python-headless numpy scikit-learn
tesseract --version   # verify
```

If tesseract cannot be installed, `ocr` and `strings` degrade with a clear error;
`probe`, `sample`, `palette`, `grid`, `crop`, and `diff` still work. Record the
degradation rather than working around it silently.

## The three channels

Nothing in here decides what a thing *is*. It measures. Meaning comes from reading
crops with vision. Use all three and cross-check:

| Channel | Gives you | Blind to |
|---|---|---|
| This toolkit — pixels & geometry | exact hex, spans, gutters, mismatch % | what anything means |
| This toolkit — OCR | verbatim strings + bounding boxes | glyphs, symbols, low-contrast text |
| Model vision on 3× crops | structure, icon identity, intent | exact values, precise measurement |

A value enters the spec when two channels agree, or when vision on a 3× crop
settles a disagreement.

## Commands

```bash
V=tools/vision/extract.py

python $V probe   docs/milestones/milestone_2/User.png
python $V palette docs/milestones/milestone_2/User.png --k 20 --accent
python $V sample  docs/milestones/milestone_2/Admin.png --points "200,142;60,142" --box 5
python $V grid    docs/milestones/milestone_2/User.png --scale 1.0667
python $V crop    docs/milestones/milestone_2/User.png --box 0,90,256,620 --scale 3 \
                  --out build/crops/user/sidebar.png
python $V ocr     build/crops/user/sidebar.png --upscale 1 --psm 6
python $V strings source.png build.png                  # exits 1 if any string is missing
python $V diff    source.png build.png --max-pct 2 --out build/diff.png
```

Every command takes `--json <path>`. `strings` and `diff` exit non-zero on a
threshold breach, so they drop straight into CI.

## How each measurement works, and where it lies to you

**`probe`** — size, scale factor, dominant colours. The scale factor assumes a
1440px design viewport; pass `--css-width` if that is wrong. Confirm it before
trusting any CSS-px conversion downstream.

**`sample`** — modal colour of a patch, never a single pixel. These captures carry
lossy-compression noise: a flat violet fill varies by up to ±8 units between
adjacent pixels. `getpixel` on such an image returns noise, not the token value.
The reported `spread` tells you how noisy the patch was.

**`palette --accent`** — k-means with neutrals dropped. Centroids sit *lighter*
than the true fill because antialiased edges pull them toward the background.
Use the palette to enumerate which brand colours exist, then `sample` a flat
interior to pin the exact value.

**`grid`** — two-pass projection profiling.
- Pass 0 finds the sidebar divider as the most **consistent** full-height vertical
  edge. Summed gradient energy does not work: a column of nav icons outscores a
  1px divider. Scoring by *fraction of rows* carrying a strong gradient does; a
  real divider scores 1.00.
- Pass 1 finds row bands. Pass 2 finds each row's columns **within that band
  only**. A single global column profile cannot work: the gutter between two
  row-1 cards is covered by a card in row 3, so it never reads as canvas over the
  full image height.
- Canvas vs card is decided by **nearest-centroid assignment** between two
  auto-detected colours, not a fixed threshold. Here canvas and card differ by
  only 3–5 units and each screenshot uses a different tint, so any absolute
  threshold that works on one fails on the next. When `canvas_card_separation`
  is ≤4 the output carries a `separation_warning` — verify every row against the
  screenshot with vision before using it.
- When a row under-segments, sweep `--purity` (0.85–0.95). Rows containing a
  full-width card legitimately merge with their neighbours.

**`ocr`** — word-level boxes grouped into lines, with per-line confidence and a
`suspect` flag. Coordinates come back in **original image space**, not upscaled
space, so they line up with `grid` output.

**`diff`** — per-pixel max-channel delta above a threshold. Pass `--ignore x,y,w,h`
(repeatable) for avatar photos, product images, and illustrations, which
legitimately differ between design and build.

## OCR failure modes on this design system

Verified against the four milestone-2 dashboards. At **3× upscale with `--psm 6`
every sidebar label and subtitle came back verbatim**, including
`View & update your profile`, `Check ingredients & safety`, `Sleep, water & lifestyle`,
and `Routine & habit reminders`. Below 3× the 12px subtitles are unusable.

What still breaks, every time:

| Failure | Example | Handling |
|---|---|---|
| Icons read as characters | `ff Dashboard`, `© Skin Assessment`, `(2) Product Recommendations`, `£93 Settings` | Strip leading non-alphabetic tokens; identify the icon from a 4× crop with vision |
| `₹` unreliable | reads as `2`, `R`, `%`, or vanishes | Vision-confirm **every** currency string |
| Indian digit grouping | `₹24,80,500` re-grouped or split | Reassemble by bounding box, then vision-confirm |
| Glyphs are not text | `✓ → ↑ ↓ › ✨ 👋 ⋮ ▾` | Vision only; never expect OCR to see them |
| Two-line labels split | `Acne &` / `Post Acne Marks` | Rejoin by x-overlap and vertical adjacency |
| Suffixes detach | `/100`, `/ 10`, `%`, `L` | Reassemble by proximity |
| Numbers on coloured arcs | score-ring values | Low confidence by design — read with vision |

Anything flagged `suspect` in the output is a line you must confirm before it
enters a spec or a test assertion.

## CI usage

```bash
python tools/vision/extract.py strings \
    docs/milestones/milestone_2/User.png \
    docs/milestones/milestone_2/build/user-dashboard.png

python tools/vision/extract.py diff \
    docs/milestones/milestone_2/User.png \
    docs/milestones/milestone_2/build/user-dashboard.png \
    --max-pct 2 --ignore 1330,20,60,50 --out build/diff-user.png
```

Both exit 1 on failure. Wire them into `.github/workflows/frontend-ci.yml` so the
UI cannot drift away from the design without the build going red.
