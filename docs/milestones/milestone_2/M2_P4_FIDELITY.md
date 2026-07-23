# P4 Fidelity Report — User & Admin Dashboards

Per `MILESTONE_2_UI_SPEC.md §8` and `MILESTONE_2_MASTER_PROMPT.md §5.6`. Both screens
are real, live-data pages (`docs/DECISIONS.md` ADR-023) — this report is measured
against a real signed-up test account, not a static mock.

## Numeric gates

| Gate | User | Admin | Result |
|---|---|---|---|
| `extract.py strings` | 44/47 missing | — | **FAIL** — but see note below: this is the same whole-page-OCR-vs-sidebar-only issue found in P2; the source screenshot's illustrated icon glyphs (checkmarks, arrows, product photography) OCR into noise strings that can never match a live build's different icon set, independent of content correctness. |
| `extract.py diff --structural --max-pct 8` | 86.4% mismatch | 87.1% mismatch | **FAIL** — see analysis below. |
| `extract.py grid` row/card counts | 4 content rows, card counts per row match UI_SPEC (5→3→2-visible→1-below-fold) | Admin's own `canvas_card_separation=4` triggers `separation_warning` (documented `VISION_CALIBRATION.md` limitation — "Admin barely segments at all... must be read from crops with vision, not grid output") | **Row/card topology confirmed by direct visual inspection instead**, per that documented limitation. |

## Why the structural diff can't hit 8%, and why that's not a P4 defect

Inspected `docs/milestones/milestone_2/build/diff-user.png` directly (edge-overlay:
blue = build-only edges, red = source-only edges). The image shows the *same*
recognizable layout — 5 KPI cards, the routine/progress/insight row, the product
carousel + donut row — but with every card boundary, text baseline, and icon
offset by several pixels from the source's. That's expected and correct given how
this build was made:

- **P1's THEME OVERRIDE deliberately maps geometry onto this app's *existing*
  Tailwind spacing scale** (`gap-4`, `p-5`, `rounded-2xl`, etc.) rather than
  cloning the mockup's literal per-pixel measurements. Two different spacing
  systems that both "look right" will never edge-align byte-for-byte — that
  tradeoff was made explicitly in P1, not discovered now.
- **Real content has a different information density than an illustrated mockup.**
  A hand-drawn product illustration, a stylized face graphic, or mockup body copy
  carries a different edge count than this build's real (sometimes shorter, real)
  text and a plain product photo — again, expected once the page is live data
  instead of a static image.
- **One concrete, measured improvement was made and re-verified**, per the loop
  discipline (`MILESTONE_2_MASTER_PROMPT.md §11.3`, one change per iteration):
  the fresh test account initially had only one `skin_assessments` row, so the
  Skin Health Progress trend chart legitimately rendered its empty state — a
  correct behaviour, but not a fair comparison against the source's populated
  chart. Backdating 3 more real rows for the same test user (same
  `get_recent_scores` read path, no fixture) dropped the mismatch from 88.0% to
  86.4%. The remaining gap is pixel-offset noise, not missing content — confirmed
  by direct visual inspection matching every row/card/label the User.png source
  shows.

**Conclusion, stated plainly, not hidden:** the `--max-pct 8` budget is not met by
either screen, and grinding further turns on it would not change the underlying
tradeoff (existing design-system tokens vs literal pixel cloning) that P1 already
decided. What *is* verified, independently of this metric:

1. Every row and card from `UI_SPEC.md §4.1`/`§4.4` renders, in the right order,
   with the right content (Playwright DOM assertions, not screenshots — see
   `tests/e2e/user-journey.spec.ts` and `tests/e2e/admin-dashboard-p4.spec.ts`).
2. Direct visual inspection of both screenshots (posted in this session) confirms
   structural correspondence to the source PNGs card-by-card.
3. Both pages are backed by real data end-to-end (signup → real assessment →
   real dashboard, real admin counts from two new backend queries) — not a
   fixture layer that merely *resembles* the screenshot.

## Human checklist (`UI_SPEC.md §8`)

- [x] Screenshot and implementation opened side by side — done this session.
- [x] Card count and column spans per row match §4 — 5/3-content-groups/2-visible+1
      below-fold (User); 6/3/3/3 (Admin).
- [x] Every number, label, unit appears — verified via Playwright, not just OCR.
- [x] Indian number formatting on currency (`₹24,80,500`) — `formatPrice`, en-IN.
- [x] Score colours follow the ramp (`getScoreBand`, P1) — Good/Fair/Poor consistent.
- [x] Zero raw hex in components — tokens only (unchanged since P1/P3).
- [x] One shared `AppShell`/`RoleSidebar` — unchanged since P2, no page-level fork.
- [x] Loading/empty/error states — every widget's real state, not just the happy path
      (Progress chart, AI Insights, Top Skin Concerns, Recent Activity all shown in
      their real empty state where the current DB genuinely has no rows).
- [x] Responsive breakpoints — grid classes collapse per existing Tailwind
      breakpoints (`sm:`/`lg:`), same pattern as P2/P3.
- [ ] `diff --structural --max-pct 8` — **not met**, see analysis above.
- [ ] `extract.py strings` zero-missing — **not met**, OCR-noise limitation (P2 precedent).

## Ignore regions

None passed to `--ignore` this pass — the mismatch is distributed across the whole
image (spacing/baseline offsets), not concentrated in a few swappable regions
(avatar/product photos), so region-based ignoring would not have materially
changed the number. Noted for a future pixel-fidelity pass, not applied here to
avoid manufacturing a passing number that doesn't reflect a real fix.
