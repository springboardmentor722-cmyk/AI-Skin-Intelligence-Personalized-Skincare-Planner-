# P5 Fidelity Report — Consultant & Dermatologist Dashboards

Per `MILESTONE_2_UI_SPEC.md §8`. Same measurement methodology and root-cause analysis
as `M2_P4_FIDELITY.md` — not re-derived here, referenced.

## Numeric gates

| Gate | Consultant | Dermatologist |
|---|---|---|
| `extract.py diff --structural --max-pct 8` | 87.6% mismatch — **FAIL** | 88.0% mismatch — **FAIL** |
| `extract.py grid` row/card counts | 5→5→2→3, matches source's 5→5→2→3 exactly | 5→5→2→(3, source reads 1 merged — known `separation_warning` limitation, `VISION_CALIBRATION.md`) |

**Root cause: identical to P4's finding** — P1's existing-design-system-token
geometry mapping (vs. literal pixel cloning) and real-content vs. illustrated-mock
edge density produce whole-image pixel/baseline offsets that dominate the
structural-diff metric regardless of correct row/card topology. Re-verified here
rather than assumed: the grid tool's card *counts* match the source almost
exactly (both dashboards: 5 KPI / 5 KPI / roster+sidebar / 3-card, in that order),
confirming the layout itself is correct and the 87–88% number is measuring
pixel-offset noise, not missing or misplaced content.

## Deliberate divergences — all confirmed present (Playwright, `clinical-dashboard-p5.spec.ts`)

| Divergence | Consultant | Dermatologist | Verified |
|---|---|---|---|
| Stat footer cell count | 3 cells | 4 cells (incl. neutral "Stable") | ✓ both asserted, "Stable" explicitly asserted absent for Consultant |
| Guide label | "Skin Concerns Guide" | "Skin Conditions Guide" | ✓ each asserted absent on the other role |
| Insight banner | "Consultant Tip" (1 line) | "AI Clinical Insights" (2 lines) | ✓ |
| Roster demographics | Age/Gender as sub-line under name | Age/Gender as its own column | ✓ (`ClinicalDashboard`'s `rosterColumns`, conditional column) |
| Roster gender mix | All-female (fixture) | Mixed — includes Rohit Sharma, 32, Male, "Hair Fall & Dandruff" | ✓ |
| Vocabulary | "Clients" | "Patients" | ✓ throughout KPIs/headings |

## Shared-layout guardrail

One component, `web/components/clinical-review/clinical-dashboard.tsx`, takes a
single `role: "consultant" | "dermatologist"` prop — confirmed via `find .
-iname "*clinical-dashboard*"` returning exactly one component file (plus its
fixtures module). Both `/consultant/dashboard/page.tsx` and
`/dermatologist/dashboard/page.tsx` are thin wrappers: the pre-existing real
verification-status gate (unchanged) for non-approved professionals, `<ClinicalDashboard
role="..." />` for approved ones.

## Human checklist (`UI_SPEC.md §8`)

Same as `M2_P4_FIDELITY.md`'s checklist — all items checked except the two
numeric gates, for the same documented reasons.
