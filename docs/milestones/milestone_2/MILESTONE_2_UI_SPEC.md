# Milestone 2 — Reverse-Engineered UI Spec

**Source of truth:** the four role screenshots in `docs/milestones/milestone_2/`
(`User.png`, `Consultant.png`, `Derma.png`, `Admin.png`).

**Status:** normative for STRUCTURE (layout, nav trees, anatomy, copy, spacing, type).
**NOT normative for colour** — the project keeps its existing theme; see
`MASTER_PROMPT.md §1a`. Hex values in §1 document the screenshots' palette for reference
and role-mapping only. Where this document and a screenshot disagree on structure, the
screenshot wins — re-open the PNG and correct this document in the same branch.

**Companion files:** `MASTER_PROMPT.md` (operating rules + phase loops),
`VISION_CALIBRATION.md` (measured baseline), `tools/vision/` (the measuring toolkit).
This file is the *what it looks like*; the master prompt is the *how we build it*.

---

## 0. How to read the screenshots

**Use three channels, cross-checked** — native vision for meaning, OCR for verbatim
strings, programmatic pixel analysis for exact values. The full protocol, toolchain, and
failure modes live in `MASTER_PROMPT.md §5`; this is the short form.

Run this extraction pass before writing a single component and commit the output as
`docs/milestones/milestone_2/UI_EXTRACTION.md`:

1. `tools/vision/extract.py probe` each PNG → dimensions and scale factor. These are
   ~1536px captures of a ~1440px viewport, so scale ≈ 1.067 — confirm it, don't assume it.
2. `crop --scale 3` each screenshot into brand block, sidebar (two vertical halves),
   topbar, and every card individually. **Read every crop with native vision.** A 12px
   subtitle in a full-width screenshot is unreadable; at 3× it is obvious.
3. `ocr --tsv` each crop for verbatim strings with bounding boxes, then reconcile word by
   word against what vision read. Where they disagree, vision on the upscaled crop wins.
4. `palette` and `sample` for exact hex: page background, card background, card border,
   primary violet, both active-nav variants, each KPI icon tile, each chart series, each
   badge.
5. `regions` for geometry: sidebar width, card radius, gutter, card padding, row gap,
   column spans. Convert screenshot px → CSS px via the probed scale factor, then round to
   the nearest 4px step.
6. Record **every** string verbatim with its source channel and confidence. Labels,
   subtitles, section headers, button text, badge text, units, suffixes. Copy is part of
   the design and is graded.
7. Map each icon to a specific `lucide-react` export name by reading a 4× crop — never
   infer an icon from its label.
8. Only then map the measured values onto tokens (§1) and start building.

> **OCR caveats that will bite on these four PNGs:** `₹` is unreliable and every currency
> string must be vision-confirmed; Indian digit grouping (`24,80,500`) gets re-grouped or
> split; the 12px sidebar subtitles are garbage below 3× upscale; ✓ → ↑↓ › ✨ 👋 ⋮ are
> glyphs, not text; two-line labels ("Acne &" / "Post Acne Marks") return as separate rows
> and must be rejoined by bounding box. See `MASTER_PROMPT.md §5.4` for the full list.

The hex values in §1 and the spans in §4 are **starting estimates from visual inspection,
not measurements**. Phase 1 replaces every one of them with a measured value.

---

## 1. Design tokens

All four screens share one system. Build it once in `web/app/globals.css` +
`web/lib/themes.ts`; every screen consumes it. No raw hex in components.

### 1.1 Color

**Resolved in P1 (`docs/milestones/milestone_2/UI_EXTRACTION.md`) — per
`MILESTONE_2_MASTER_PROMPT.md` §1a THEME OVERRIDE, no raw hex below enters
`app/globals.css`.** Every role is mapped onto an existing Skinlytics token (all
already present — zero new CSS custom properties needed); the hex values below
document the *screenshot's* colour for reference/role-identification only. See
`UI_EXTRACTION.md §1` for the full role → existing-token table.

| Token | Value | Source | Used for |
|---|---|---|---|
| `--primary` | **`#5E36E8`** | measured | active nav pill, primary buttons, chart line, lead donut slice, links |
| `--primary-foreground` | `#FFFFFF` | measured | text on primary |
| `--primary-soft` | **`#E3E0FA`** | measured | active-nav tint (Consultant), insight banners |
| `--primary-pale` | **`#F1EEFD`** | measured | consultant active pill fill, hover |
| `--background` | **`#FAFAFE`** | measured (median of four) | page canvas **and sidebar** — both tinted, neither is white |
| `--card` | **`#FEFEFE`** | measured | every card surface — neutral, no tint |
| `--border` | `#EDEEF3` *est.* | — | 1px card border — visible, low contrast |
| `--foreground` | `#21233E` | measured (Admin) | headings, KPI values, table primary text |
| `--muted-foreground` | `#6B7280` *est.* | — | subtitles, axis labels, secondary table text |
| `--section-label` | `#9CA3AF` *est.* | — | `MAIN MENU`, `QUICK ACTIONS`, `TOOLS & RESOURCES`, `SYSTEM & SECURITY` |
| `--success` | **`#19A957`** | measured | Good scores, ↑ deltas, Active badge, healthy dots |
| `--success-soft` | **`#EDF9F2`** | measured | Active / Good badge background |
| `--warning` | **`#F8A933`** | measured | Fair scores, Follow-up Due badge |
| `--warning-soft` | **`#FFF4DF`** | measured | Follow-up Due badge background |
| `--danger` | `#EF4444` *est.* | — | ↓ deltas, Need Attention, Poor scores |
| `--info` | **`#499CF4`** | measured | second donut slice, secondary chart series |

> The primary is **`#5E36E8`**, not the `#6C47FF` that visual inspection suggested —
> materially darker and more saturated. Every violet derives from this one value.
> k-means centroids read lighter (`#6B50E6`, `#623EE4`) because antialiased edges pull
> them toward the background; the modal read of a flat fill is the trustworthy one.

**Categorical palette** (donuts, stacked bars — fixed order, identical across all roles so a
concern keeps its colour on every screen):

```
1 violet  #5E36E8   2 sky     #499CF4   3 amber  #F8A933
4 rose    #F291AE   5 green   #19A957   6 slate  #CBD5E1
   (violet-mid #9986EF and violet-pale #BBB2F4 for 7th/8th slices)
```

**KPI icon tiles** — a soft tinted rounded square (~40–44px, radius ~12px), one tint per
card position, repeating across roles:
violet-50 → green-50 → sky-50 → amber-50 → rose-50 → teal-50.

**Score colour ramp** (used by every score ring and score chip on every role):

| Range | Colour | Label |
|---|---|---|
| 75–100 | `--success` | Good |
| 60–74 | `--warning` | Fair |
| 0–59 | `--danger` | Poor |

### 1.2 Typography

Single family, Inter-like (`Inter`, `Geist`, or the repo's existing font — do not
introduce a second family; this is a data product, not an editorial page).

| Role | Size / weight | Example |
|---|---|---|
| Page greeting | 26–28px / 700 | "Welcome back, Ananya! 👋" |
| Page subtitle | 14px / 400, muted | "Here's your skin summary and personalized recommendations." |
| Card title | 15–16px / 600 | "Today's Routine" |
| KPI value | 30–34px / 700, tabular-nums | `12,845` |
| KPI label | 13px / 500, muted | "Total Users" |
| Nav item label | 14px / 500 | "My Skin Profile" |
| Nav item subtitle | 12px / 400, muted | "View & update your profile" |
| Section label | 11px / 600, uppercase, `tracking-[0.08em]`, `--section-label` | "MAIN MENU" |
| Table header | 12–13px / 500, muted | "Client Name" |
| Delta chip | 12px / 500 | "↑ 18% this month" |

All numeric columns and KPI values use `font-variant-numeric: tabular-nums`.

### 1.3 Shape, spacing, elevation

| Token | Value |
|---|---|
| Card radius | **resolved P1: `--radius` (1rem/16px), already the exact existing token** |
| Inner element radius (chips, tiles, buttons) | 10–12px |
| Card padding | 20px (compact KPI cards) / 24px (content cards) |
| Grid gutter | 20px |
| Row gap | 20px |
| Page padding | 24px, 28px top |
| Card shadow | Near-invisible: `0 1px 2px rgb(16 24 40 / 0.04)`. The separation comes from the 1px border, **not** the shadow. Do not ship drop-shadowed floating cards. |
| Sidebar width | **240px** (measured; the four screenshots disagree — 240/225/226/235 — standardise on 240 and log it) |
| Grid gutter | **16px** (measured 17/15/13/18 across the four; standardise) |
| Page padding | **24px** (measured) |

### 1.4 The three visual rules that make it look like the screenshot

Miss these and the build reads as "generic shadcn dashboard" even with correct tokens:

1. **Two-line nav items.** Every sidebar entry is a label *plus* a muted subtitle. The
   subtitle is not optional decoration — it is 50% of the sidebar's visual mass and the
   reason the sidebar is 280px instead of 220px.
2. **Flat, bordered, low-contrast cards** on a faintly tinted canvas. White card, `#EDEEF3`
   border, hairline shadow, generous internal whitespace.
3. **Violet is rationed.** It appears on the active nav pill, primary buttons, chart
   strokes, the lead donut slice, and links — nowhere else. Everything else is
   grey/black text on white. The restraint is the look.

---

## 2. Shell anatomy (identical skeleton, four skins)

```
┌────────────────┬──────────────────────────────────────────────────────────┐
│ BRAND          │ TOPBAR                                                    │
│  logo mark     │  greeting + subtitle ......... [search] [bell•] [date ▾] │
│  "Skin Intel." │                                        [avatar + role ▾] │
│  role subtitle │                                       [primary action]   │
├────────────────┼──────────────────────────────────────────────────────────┤
│ MAIN MENU      │ CONTENT — 12-col grid, 20px gutter                        │
│  ▸ nav items   │                                                            │
│                │  Row 1: KPI strip (5 or 6 cards)                          │
│ <SECTION 2>    │  Row 2: primary analysis row                              │
│  ▸ nav items   │  Row 3: secondary analysis row                            │
│                │  Row 4: utility row / full-width banner                   │
│ FOOTER SLOT    │                                                            │
└────────────────┴──────────────────────────────────────────────────────────┘
```

Build **one** `AppShell` + **one** `RoleSidebar` driven by config. Four copies of a
sidebar component is an automatic phase failure.

### 2.1 Brand block (top of sidebar, all roles)

Leaf/face logo mark in violet + wordmark **"Skin Intelligence"** (16–17px / 700) + role
subtitle in violet (12–13px / 500):

| Role | Subtitle |
|---|---|
| user | AI Skincare Companion |
| consultant | Consultant Panel |
| dermatologist | Dermatologist Panel |
| admin | Admin Panel |

### 2.2 Nav item anatomy

```
[icon 18px] Label                    ← 14px/500
            Subtitle                 ← 12px/400 muted
```

- Height ≈ 52–56px, horizontal padding 12px, radius 10px, 2px vertical gap between items.
- **Active (user / dermatologist / admin):** solid `--primary` background, white label,
  white-at-80% subtitle, white icon.
- **Active (consultant):** `--primary-soft` background, `--primary` label, primary icon.
  *(Both variants appear in the screenshots — implement `activeVariant: "solid" | "soft"`
  as a per-role sidebar prop rather than picking one and losing the difference.)*
- **Hover:** `--primary-soft` at 50%, no movement, no scale.
- Icons: `lucide-react`, 18px, `strokeWidth={1.75}`.

### 2.3 Topbar per role

| Role | Greeting | Subtitle | Search | Bell | Primary action | Avatar caption |
|---|---|---|---|---|---|---|
| user | Welcome back, {firstName}! 👋 | Here's your skin summary and personalized recommendations. | — | 3 | — | Premium User |
| consultant | Welcome back, Dr. {lastName}! 👋 | Here's what's happening with your clients today. | "Search clients, assessments…" | 3 | **+ Add New Client** | Skincare Consultant |
| dermatologist | Welcome back, Dr. {name} 👋 | Here's an overview of your patients and clinical insights. | "Search patients, assessments…" | 5 | — | Dermatologist |
| admin | Welcome back, Admin! 👋 | Here's what's happening on your platform today. | "Search users, reports, assessments…" | 5 | — | Super Administrator |

All roles show a date pill (calendar icon + `May 21, 2025` + chevron) and an avatar
cluster (image, name, role caption, chevron). Bell has a red count badge.

---

## 3. Sidebar navigation — exact trees

Transcribed verbatim from the screenshots. These strings are the acceptance criteria for
the sidebar phase: label, subtitle, order, and grouping must all match.

Implement in `web/lib/nav-config.ts` as `Record<Role, NavSection[]>`, gated by
`web/lib/permissions.ts`. Every item needs a real `href`; routes that don't exist yet get
a stub page with a titled empty state — **no dead links, no `href="#"`**.

### 3.1 User — `AI Skincare Companion`

**MAIN MENU**

| # | Label | Subtitle | Suggested route |
|---|---|---|---|
| 1 | Dashboard | *(none — active item shows label only)* | `/dashboard` |
| 2 | My Skin Profile | View & update your profile | `/profile` |
| 3 | Skin Assessment | Analyze your skin condition | `/assessment` |
| 4 | My Routine | Your personalized routine | `/routine` |
| 5 | Product Recommendations | Products for your skin | `/recommendations` |
| 6 | Ingredient Analyzer | Check ingredients & safety | `/ingredients` |
| 7 | Progress Tracking | Track your skin progress | `/progress` |
| 8 | Lifestyle & Habits | Sleep, water & lifestyle | `/check-in` |
| 9 | Reports | View & download reports | `/insights` |
| 10 | Reminders | Routine & habit reminders | `/reminders` |
| 11 | Settings | Account & preferences | `/settings` |

**QUICK ACTIONS**

| Label | Subtitle |
|---|---|
| Skin Scan | Start new skin assessment |
| Ask AI | Get skincare guidance |
| Upload Photo | Analyze your skin |

**FOOTER:** "Upgrade to Premium" card — diamond icon, violet-tinted panel, body copy
"Unlock AI insights, advanced reports & more.", full-width solid violet **Upgrade Now**
button.

### 3.2 Consultant — `Consultant Panel`

**MAIN MENU**

| # | Label | Subtitle |
|---|---|---|
| 1 | Dashboard | Overview & key metrics |
| 2 | Clients | Manage client profiles |
| 3 | Assessments | Skin assessments & analysis |
| 4 | Routine Plans | Create & manage routines |
| 5 | Product Recommendations | View & recommend products |
| 6 | Progress Tracking | Track client progress |
| 7 | Reports | Client reports & analytics |
| 8 | Follow-ups & Notes | Notes & follow-up history |
| 9 | Reminders | Appointments & reminders |

**TOOLS & RESOURCES**

| # | Label | Subtitle |
|---|---|---|
| 10 | Ingredient Database | Search & analyze ingredients |
| 11 | Skin Concerns Guide | Reference & solutions |
| 12 | Treatment Protocols | Clinical treatment guides |

**FOOTER:** "Ask AI Assistant / Get AI-powered suggestions" — violet-tinted card, sparkle
icon, trailing chevron.

### 3.3 Dermatologist — `Dermatologist Panel`

**MAIN MENU**

| # | Label | Subtitle |
|---|---|---|
| 1 | Dashboard | Overview & key insights |
| 2 | Patients | Manage patient profiles |
| 3 | Assessments | Skin assessments & analysis |
| 4 | Clinical Insights | AI insights & risk analysis |
| 5 | Treatment Plans | Create & manage plans |
| 6 | Progress Tracking | Monitor patient progress |
| 7 | Prescriptions | Manage prescriptions |
| 8 | Reports | Clinical reports & analytics |
| 9 | Consultations | Appointments & notes |
| 10 | Follow-ups | Follow-up tracking |
| 11 | Reminders | Treatment reminders |

**TOOLS & RESOURCES**

| # | Label | Subtitle |
|---|---|---|
| 12 | Ingredient Database | Search & analyze ingredients |
| 13 | Treatment Protocols | Clinical treatment guides |
| 14 | Skin Conditions Guide | Reference & solutions |
| 15 | Research & Publications | Latest dermatology research |

**FOOTER:** "Ask AI Assistant / Get AI-powered clinical support".

> Note the deliberate divergence from Consultant: dermatologist says **Skin Conditions
> Guide** (clinical), consultant says **Skin Concerns Guide** (cosmetic). Do not normalise
> these into one string.

### 3.4 Admin — `Admin Panel`

**MAIN MENU**

| # | Label | Subtitle |
|---|---|---|
| 1 | Dashboard | Overview & Analytics |
| 2 | User Management | Manage users & roles |
| 3 | Role & Permissions | Manage roles & access |
| 4 | Skin Assessments | View all assessments |
| 5 | Routine Management | Manage routines & plans |
| 6 | Product Management | Manage products |
| 7 | Ingredient Database | Manage ingredients |
| 8 | Content Management | Manage articles & resources |
| 9 | Reports & Analytics | Platform reports |
| 10 | Notifications | System notifications |
| 11 | System Settings | Configure platform settings |

**SYSTEM & SECURITY**

| # | Label | Subtitle |
|---|---|---|
| 12 | Audit Logs | System activity logs |
| 13 | Security & Access | Manage security settings |
| 14 | Backup & Restore | Data backup & restore |

**FOOTER:** "Platform Status" card — green pulse dot + "All systems operational" +
"Uptime: 99.9%".

---

## 4. Dashboard layouts

Column spans are on a 12-column grid, 20px gutter. Spans are read off the screenshots;
verify against the PNG before committing.

### 4.1 User dashboard

| Row | Cards |
|---|---|
| 1 | **5 KPI cards, unequal widths** — measured `[292, 219, 237, 220, 202]` screenshot px. Skin Health Score is ~45% wider than Hydration Level. This is a 12-col row with an uneven split, **not** `grid-cols-5` |
| 2 | Today's Routine (4) · Skin Health Progress (4) · AI Skin Insights (4) |
| 3 | Recommended Products for You (7) · Skin Concerns Overview (5) |
| 4 | Daily Checklist (12, full width) |

**Row 1 detail**

- **Skin Health Score** — big value `78` + `/100`, green "Good" pill, `↑ 8% improvement
  this week`, and a violet progress **ring** on the right with a smiley face in the
  centre. The ring is the hero element of the whole screen.
- **Skin Type** — value `Combination` in violet, an illustrated face graphic, and two
  breakdown lines (`T-Zone: Oily`, `Cheeks: Normal`), ghost button **View Details**.
- **Top Concerns** — two-line violet value (`Acne &` / `Post Acne Marks`), a rose-tinted
  icon tile, ghost button **View Analysis**.
- **Skin Age** — `24`, caption `Your actual age` + `21`, tinted icon tile, **View Details**.
- **Hydration Level** — `Good` in green, `Water Intake: 1.8 L / 2.5 L`, a green progress
  bar with `72%` at its right end.

**Row 2 detail**

- **Today's Routine** — two labelled sub-sections (sun icon "Morning Routine", moon icon
  "Evening Routine"). Each is a horizontal chain of circular step icons joined by `→`
  arrows, with the step name below and a small green check badge on completed steps. The
  last evening step (Eye Cream) is unchecked — an empty ring. Footer: full-width tinted
  **View Full Routine →** button.
- **Skin Health Progress** — area chart, violet stroke over a light violet gradient fill,
  dotted markers, y-axis `0/25/50/75/100`, x-axis `May 1 / May 7 / May 14 / May 21`,
  floating tooltip card (`May 21` / `78/100`), `This Month ▾` select in the header,
  footer sentence "Your skin health has improved by 12% this month."
- **AI Skin Insights** — sparkle icon in the title. First insight is a violet-tinted
  panel with a droplet icon and **bolded ingredient names**. Below it, 3 plain rows each
  with a distinct tinted icon. Footer: tinted **View All Insights →** button.

**Row 3 detail**

- **Recommended Products for You** — `View All` link top-right, horizontal carousel with
  circular ‹ › arrows overlapping the card edges. Each product card: image on white,
  optional green **Best Match** badge, 3-line name, `₹349` price, `★ 4.6` rating.
- **Skin Concerns Overview** — donut with centred two-line label ("Primary" / "Concerns"),
  legend on the right with colour dot + name + right-aligned percentage
  (Acne 40%, Post Acne Marks 25%, Uneven Tone 15%, Oiliness 10%, Redness 10%).

**Row 4 detail**

- **Daily Checklist** — left: icon + title + `3 / 5 tasks completed` + progress bar.
  Right: a horizontal row of checkbox chips (Morning Routine ✓, Drink Water (8 glasses) ✓,
  Sunscreen Applied ✓, Night Routine ○, 8 hrs Sleep ○) and a circular ❯ at the far right.

### 4.2 Consultant dashboard

| Row | Cards |
|---|---|
| 1 | **5 KPI cards** — Total Clients `128` (+12%) · Assessments Done `86` (+18%) · Active Routines `92` (+15%) · Avg. Improvement `24%` (+6%) · Upcoming Follow-ups `14` (View Calendar →) |
| 2 | Client Overview table (**8**) · right column (**4**): Clients by Skin Type donut **stacked above** Top Skin Concerns bars — measured `837:399` ≈ 68/32, not the 7/5 split originally assumed |
| 3 | Client Progress Overview (5) · Recent Assessments (3.5) · Upcoming Follow-ups (3.5) |
| 4 | Consultant Tip banner (12) |

- **KPI cards here differ from the user role**: circular tinted icon tile on the *left*,
  label above value, coloured delta beneath. The 5th card swaps the delta for a
  `View Calendar →` link.
- **Client Overview** — columns: Client Name (avatar + name + `24, Female` sub-line),
  Skin Type (coloured text, sortable ▾), Top Concern (two lines), Skin Health Score
  (small ring + `/100`), Last Assessment, Status (pill), Next Follow-up, ⋮ menu.
  Header link `View All Clients ▾`.
- **Clients by Skin Type** — donut, centre `128` / `Total Clients`, legend with count and
  percent: Combination 45 (35%), Oily 32 (25%), Dry 26 (20%), Sensitive 15 (12%),
  Normal 10 (8%).
- **Top Skin Concerns** — horizontal bar rows, label left, violet track, percent right:
  Acne & Post Acne Marks 42%, Hyperpigmentation 24%, Dryness 18%, Uneven Skin Tone 9%,
  Sensitivity & Redness 7%.
- **Client Progress Overview** — line/area chart, `This Month ▾`, y-axis in percent,
  and a **3-cell stat footer** inside the card: `24% Avg. Improvement ↑6%`,
  `18 Clients Improved ↑8%`, `7 Need Attention ↓2%`.
- **Recent Assessments** — rows of avatar + name + `May 18, 2025 • 10:30 AM` + score chip
  (`78/100` over `Good`, tinted by the score ramp) + chevron.
- **Upcoming Follow-ups** — rows of calendar tile + name + datetime + a right-aligned
  days-left pill (`7 days left`, `Tomorrow`).
- **Consultant Tip** — full-width violet-tinted banner, icon, bold "Consultant Tip",
  one line of body copy, right-aligned **View AI Insights ✨** button.

### 4.3 Dermatologist dashboard

Structurally identical to Consultant with clinical vocabulary and a **4-cell** stat footer.

| Row | Cards |
|---|---|
| 1 | Total Patients `156` (+14%) · Assessments Done `203` (+18%) · Active Treatment Plans `128` (+16%) · Patients Improving `68%` (+8%) · Follow-ups Due `23` (View all follow-ups →) |
| 2 | Patients Overview table (**8**) · Skin Concerns Distribution donut + Top Skin Concerns bars (**4**) — measured `847:418` ≈ 68/32 |
| 3 | Patient Progress Overview (5) · Recent Assessments (3.5) · Upcoming Follow-ups (3.5) |
| 4 | AI Clinical Insights banner (12) — **two lines** of body copy |

- **Patients Overview** columns: Patient, Age / Gender *(own column, unlike Consultant
  where it's a sub-line)*, Primary Concern, Skin Health Score, Last Assessment, Status,
  Next Follow-up, ⋮.
- **Skin Concerns Distribution** — centre `156` / `Total Patients`; legend carries both
  count and percent: Acne & Post Acne Marks 38 (24%), Hyperpigmentation 28 (18%),
  Dryness 22 (14%), Sensitive Skin 20 (13%), Oily Skin 18 (12%), Others 30 (19%).
- **Stat footer (4 cells):** `68% Avg. Improvement ↑8%`, `106 Patients Improved ↑12%`,
  `28 Stable —`, `22 Need Attention ↓6%`. Note the neutral em-dash delta on "Stable".
- Patient roster is mixed-gender (includes `Rohit Sharma, 32, Male`, concern
  "Hair Fall & Dandruff") — the fixtures must not be all-female.

### 4.4 Admin dashboard

| Row | Cards |
|---|---|
| 1 | **6 KPI cards** — Total Users `12,845` (+18%) · Assessments Completed `8,932` (+22%) · Active Routines `6,742` (+16%) · Total Products `1,248` (+12%) · Platform Revenue `₹24.8L` (+20%) · System Uptime `99.9%` (All systems healthy) |
| 2 | User Overview donut (4) · User Growth line chart (4) · Assessments Overview donut (4) |
| 3 | Top Skin Concerns bars (4) · Revenue Overview (4) · Recent Activity (4) |
| 4 | System Health (4) · Quick Actions (3.5) · Platform Analytics (4.5) |

- Each row-2/row-3 card carries its own `This Month ▾` select in the header.
- **User Overview** — donut centre `12,845` / `Total Users`; legend Users 10,243 (79.7%),
  Consultants 1,542 (12.0%), Dermatologists 687 (5.3%), Admins 373 (2.9%); footer
  full-width ghost button **View All Users →**.
- **User Growth** — line chart, y-axis `0–14K` in 2K steps labelled `Users`, x-axis
  `Apr 21 … May 19`, floating tooltip (`May 21, 2025` / `12,845 Users`), footer
  `↑ 18% growth compared to last month`.
- **Assessments Overview** — donut centre `8,932` / `Total Assessments`; Completed 6,742
  (75.4%), In Progress 1,452 (16.2%), Pending 738 (8.3%); footer **View All Assessments →**.
- **Top Skin Concerns** — bars with **count and percent** (`3,245 (36%)`), footer
  **View Full Report →**.
- **Revenue Overview** — `Total Revenue` caption, `₹24,80,500` (Indian digit grouping —
  use `Intl.NumberFormat('en-IN')`, never a naive thousands separator), `↑ 20% vs last
  month`, area chart with `₹0 … ₹35L` axis, footer **View Financial Report →**.
- **Recent Activity** — feed rows: tinted icon tile, bold title, muted detail line,
  right-aligned relative time (`2 min ago`, `1 hour ago`). Footer **View All Activity →**.
- **System Health** — 4 mini status tiles (Database, API Services, Storage, Email
  Service), each with an icon and a green "Healthy" label.
- **Quick Actions** — 4 square tiles with icon above label: Add New User, Add Product,
  Create Routine, Generate Report.
- **Platform Analytics** — 4 metric cells with icon + label + value + delta: Page Views
  125,430 ↑14%, Active Sessions 8,245 ↑17%, Bounce Rate 32.6% ↓5%, Avg. Session 04:32 ↑8%.

---

## 5. Shared widget kit

Build these once in `web/components/dashboard/` and `web/components/charts/`. Every card
above must be an instance of one of these — if a screen needs a shape that isn't here,
add it to the kit rather than writing a one-off.

| Component | Props (sketch) | Consumed by |
|---|---|---|
| `StatCard` | `label, value, delta?, deltaDirection, icon, tint, layout: "left-icon" \| "right-icon", footerLink?` | all 4 roles |
| `ScoreRing` | `value, max=100, size, showFace?` | user hero, table cells, chips |
| `ScoreChip` | `value, max=100` → auto label + tint | recent-assessment lists |
| `DonutBreakdown` | `data[], centerValue, centerLabel, legend: "percent" \| "count-percent"` | user, consultant, derma, admin ×2 |
| `TrendChart` | `series[], xKey, yFormat, rangeSelect?, tooltip, gradient` | all 4 roles |
| `RankedBarList` | `items[{label, value, percent}], showCount` | consultant, derma, admin |
| `RosterTable` | `columns[], rows[], sortable, rowMenu` | consultant, derma |
| `TimelineList` | `items[], leading: "avatar" \| "calendar-tile", trailing: "chip" \| "pill" \| "chevron"` | recent assessments, follow-ups, activity feed |
| `ChecklistStrip` | `tasks[], completedCount` | user |
| `RoutineChain` | `steps[{icon,label,done}], period: "AM" \| "PM"` | user |
| `ProductCarousel` | `products[], badge?` | user |
| `InsightBanner` | `variant: "tip" \| "clinical", title, lines[], action` | consultant, derma |
| `StatusTileGrid` | `tiles[{icon,label,status}]` | admin |
| `QuickActionGrid` | `actions[{icon,label,href}]` | admin, user quick actions |

Every widget ships with **loading (skeleton), empty, and error** states. The screenshots
only show the happy path; the other three states are your call and are graded on
consistency, not invention — a skeleton that matches the card's real geometry, an empty
state with one line of direction and an action, an error state that says what failed.

---

## 6. Responsive, accessibility, and quality floor

The screenshots are desktop-only at ~1440px. These rules are non-negotiable regardless:

- **≥1280px** — as drawn. **1024–1279px** — KPI strip wraps 5→3, row-2/3 collapse to 2
  columns, sidebar stays. **768–1023px** — sidebar becomes an off-canvas sheet behind a
  hamburger; content is single-column with KPI cards 2-up. **<768px** — everything
  single-column; tables become stacked cards, not horizontally scrolling grids.
- Sidebar is keyboard-navigable, active item carries `aria-current="page"`, section
  labels are real headings or `aria-labelledby` targets.
- Every chart has a text alternative: a visually-hidden data table or `aria-label`
  summarising the trend. Colour is never the only channel — score chips carry the word
  ("Good"/"Fair"), status pills carry the word, deltas carry ↑/↓ glyphs.
- Contrast ≥ 4.5:1 for body text. The muted subtitle colour is the risky one — verify it.
- `prefers-reduced-motion` respected; chart entrance animations disabled under it.
- Focus rings visible on every interactive element, including nav items and table row menus.
- Dark mode: `web/designs/wireframes/` already contains light **and** dark Stitch screens.
  Token-drive it so dark mode works, but light mode is what is graded against the PNGs.

---

## 7. Contradictions to resolve (do not silently pick one)

These are real conflicts between `mile_2.docx`, the screenshots, and the existing schema.
Each needs a written decision in `docs/DECISIONS.md` before the affected phase merges.

| # | Conflict | Recommended resolution |
|---|---|---|
| C1 | Doc's `skin_types.json` has **4** types (Oily, Dry, Combination, Sensitive). Consultant donut shows **5** — includes **Normal** (10, 8%). | Seed 5 types. Add `SKIN_TYPE_NORMAL` with `backend_enum: "Normal"`. Confirm the Postgres enum in `database_schemas/skinlytics_postgresql_schema_v3.sql` allows it; migrate if not. |
| C2 | Doc §3 lists **10** common concerns; `skin_concerns.json` defines **4**. | Seed all 10. The doc's 4 entries are copied **verbatim** (ids, titles, descriptions, `backend_field`); the other 6 follow the same shape. |
| C3 | Scoring benchmark is **3.0 L/day**; the user dashboard shows a **2.5 L** goal with 1.8 L = 72%. | Scoring uses the spec's 3.0 L benchmark. The UI ring shows a **per-user configurable daily goal** defaulting to 2.5 L. Two different numbers, both correct, both documented. |
| C4 | Payload uses flat fields (`acne_severity`, …) which cannot express 10 concerns. | Canonical request body is `concerns: [{id, severity}]`. Accept the doc's flat fields via an adapter for backward compatibility and mark them deprecated in the OpenAPI description. |
| C5 | Dataset `image_url` values are `/assets/skin_types/oily.svg`, but Next.js serves `web/public/`. | Create `web/public/assets/skin_types/` and `web/public/assets/concerns/` so the doc's literal paths resolve unchanged. Do not rewrite the paths in the JSON. |
| C6 | "Skin Age" (24 vs actual 21) appears on the dashboard but is defined nowhere in the doc. | Derive it from the condition sub-score and age; publish the formula in `docs/DECISIONS.md` and unit-test it. Never render a hardcoded number. |
| C7 | Screenshot numbers (128 clients, ₹24.8L revenue, 99.9% uptime) are design fiction. | They live in `web/lib/fixtures/` as typed, contract-shaped mock data so the pixel comparison is exact — and every widget takes its data as props so the swap to live APIs is a one-line change per screen. |

---

## 8. Fidelity checklist (run before every UI phase merges)

**Numeric gates** (via `tools/vision/`, per `MASTER_PROMPT.md §5.6` — these are the ones
that can't be fudged):

- [ ] Playwright screenshot captured at 1440×900 and saved to
      `docs/milestones/milestone_2/build/<role>-dashboard.png`.
- [ ] `ocr` string set of the build diffed against the source screenshot →
      **missing strings: 0**. Added/altered strings explained.
- [ ] `palette` run on both → colour deltas within tolerance, no unexpected hues.
- [ ] `regions` run on both → card count, column spans, and gutters match.
- [ ] `diff` run on both → **pixel mismatch < 2%** on layout regions, ignoring avatar
      photos, product images, and illustrated graphics.

**Human gates:**

- [ ] Screenshot and implementation opened side by side at the same viewport width.
- [ ] Every sidebar label **and subtitle** matches §3 character for character.
- [ ] Section headers present, uppercase, correctly grouped.
- [ ] Sidebar footer slot correct for the role (Upgrade / Ask AI ×2 wordings / Platform Status).
- [ ] Card count and column spans per row match §4.
- [ ] Every number, label, and unit in the screenshot appears in the build (₹ symbols,
      `/100` suffixes, `+18% this month`, `72%`, `3 / 5 tasks completed`).
- [ ] Indian number formatting on all currency (`₹24,80,500`, `₹24.8L`).
- [ ] Score colours follow the ramp; the same concern has the same colour on every screen.
- [ ] Zero raw hex values in components — tokens only.
- [ ] One shared `AppShell` + one `RoleSidebar`; no per-role duplicates.
- [ ] Loading / empty / error states exist for every widget.
- [ ] Keyboard tab order sane; focus visible; `aria-current` on the active nav item.
- [ ] Responsive breakpoints behave per §6.
- [ ] `pnpm lint && pnpm typecheck && pnpm build` clean; Playwright green.
