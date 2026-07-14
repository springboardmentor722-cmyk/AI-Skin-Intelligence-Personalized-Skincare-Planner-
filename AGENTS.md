# Skinlytics — Agent Rules & Core Architecture

> Read this in full before writing any code in this repository. It applies to every coding agent working here — Claude Code, Antigravity, Cursor, Codex, or otherwise. `CLAUDE.md` imports this file directly; other tools should treat this as their primary instruction file too.

---

## 0. The rule that matters most: don't invent, look it up

This repo has three sources of truth. Before touching any of them, read the matching source first — never rely on the general Skinlytics description below, or on chat/session history, as a substitute.

| Before you... | Read this first | Never |
|---|---|---|
| Build or modify any UI screen, component, layout, spacing, or copy | The matching file(s) in `web/designs/wireframes/` + its pair in `source/reference-screenshots/` | Invent a visual pattern, spacing value, color, or component not already present in the wireframes |
| Build or modify any database model, migration, query, or API payload shape | `database_schemas/` (and `docs/` for surrounding context) | Invent a table, column, relationship, or field that isn't documented there |
| Make an architectural call — new service, new endpoint, new data flow, new integration | `docs/` | Design a service boundary or contract from scratch without checking whether one already exists |

If what you need isn't in any of these, say so and ask — don't guess and proceed as if it were confirmed.

> `docs/` and `database_schemas/` are referenced throughout as top-level folders. If your actual paths differ, correct them here once, in this file, rather than letting every agent guess independently.

### 0.1 Milestone rubric docs are a fourth source of truth

`docs/milestones/<milestone>/` holds the actual graded requirement doc for that milestone (e.g. `docs/milestones/milestone_2/mile_2.docx` + its extracted `.md`), handed down externally — treat it the same as the three sources above: read the real doc before building against a milestone, don't rely on a prior session's summary of it or on general "what a skincare app milestone probably needs" reasoning. If a milestone doc's literal names (tables, endpoints, file names) conflict with what's already built or with `database_schemas/`'s canonical schema, that's a real conflict to flag and resolve with the user, not something to silently reconcile in either direction — see `PROGRESS.md` for how the Milestone 2 conflict (mile_2.docx's `skin_assessments`/`skincare_routines` vs. the already-built `skin_scores`/`routines`) was resolved, as precedent for the next one.

### 0.2 Missing data or credentials get a conversation, not a workaround

If a task depends on a dataset, file, or credential that isn't actually present in the repo/`.env*` — not "probably fine," actually check — **stop and ask the user to provide or download it**, the same way `backend/app/services/admin/ingest/products.py`'s `KaggleCredentialsError` already fails loudly instead of letting a missing Kaggle token surface as an opaque network error three layers down. Never any of:
- Silently stub the missing data and let a later step quietly consume the stub as if it were real.
- Claim a data-dependent feature/pipeline is "done" in `PROGRESS.md` or in chat when the actual data was never present to run it against.
- Fabricate rows, files, or API responses to unblock yourself.

`training_dataset/MANIFEST.md` is the canonical list of what dataset should exist where — check it before assuming a file is (or isn't) there.

---

## 1. What Skinlytics is

An AI-powered skin intelligence and personalized skincare planner. It analyzes a person's skin profile, lifestyle, sleep, hydration, and environmental exposure to produce an AI skin assessment (Skin Health Score), personalized routines, ingredient intelligence, product recommendations, progress tracking, analytics, exportable reports, and reminders. Four roles: **User**, **Skincare Consultant**, **Dermatologist**, **Administrator** (Admin is internal, not signup-facing).

---

## 2. Repo layout

```
Skinlytics
├── .agents
│   └── rules
│       └── skinlytics-stitch.md
├── database_schemas
│   ├── README_v3_changes.md
│   ├── skinlytics_elasticsearch_schema_v2.txt
│   ├── skinlytics_identity_betterauth.md
│   ├── skinlytics_infrastructure_layer_v2.txt
│   ├── skinlytics_mongodb_schema_v3.txt
│   ├── skinlytics_postgresql_schema_v3.sql
│   └── skinlytics_vector_db_schema_v3.txt
├── docs
│   ├── AGENT_WORKFLOW.md
│   ├── AI_ML.md
│   ├── ARCHITECTURE.md
│   ├── CONVENTIONS.md
│   ├── DATASETS_AND_APIS.md
│   ├── DECISIONS.md
│   ├── DESIGN.md
│   ├── GRAPHIFY_SETUP.md
│   ├── Skinlytics_Stitch_UI_Prompt_Pack_v2.md
│   ├── SUGGESTIONS.md
│   ├── WIREFRAMES.md
│   └── milestones
│       └── milestone_2
│           ├── mile_2.docx                ← the actual graded M2 requirement doc
│           └── AI Skin Intelligence & Personalized Skincare Planner .md  ← its extracted text
├── dataset_and_API_reference
│   └── AI_Skin_Datasets_APIs_Research.docx  ← dataset/API research doc (§0.1)
├── training_dataset
│   ├── MANIFEST.md                        ← exact folder/filename per dataset (§0.2)
│   ├── README.md
│   ├── raw/                               ← gitignored downloads, one subfolder per dataset
│   └── processed/                         ← gitignored intermediate normalized files
├── backend                                ← FastAPI modular monolith (§4)
├── web
│   └── designs
│       └── wireframes
│           ├── source
│           │   ├── images/                ← Localized assets
│           │   └── reference-screenshots/ ← UI reference screenshots
│           ├── index.html                 ← Compiled Stitch gallery
│           └── ... (82 extracted Stitch HTML files for light & dark themes)
├── AGENTS.md                     ← Canonical, tool-agnostic rules
├── AGENTS1.md                    ← Alternate agent configuration
├── CLAUDE.md                     ← Claude Code entry point
├── CLAUDE1.md                    ← Alternate Claude configuration
├── docker-compose.yml            ← Local service topology
└── Skinlytics_Antigravity_Stitch_Extraction_Prompt_Pack.md
```

The directories above are the canonical project structure. Agents must reference these locations directly and must not create duplicate folders or alternate layouts unless the project architecture is intentionally updated.

---

## 3. Frontend architecture

**Stack assumption — flag if wrong, since every rule below depends on it:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. This is the only stack that can faithfully reproduce the wireframes' component system without a rewrite; if the project ends up on something else, update this section *before* frontend work starts.

**Design system is locked, not proposed — "Frosted Lab Glass."** Full spec lives in `docs/` (e.g. `DESIGN.md`); the essentials, so nobody has to go hunting mid-task:
- **Glass lives in:** the app sidebar, top header, public navbar, dialogs/sheets/dropdowns/command palette, sticky action bars, toasts, the landing hero panel, and the Skin Score Ring housing. `backdrop-blur 20px`, `saturation 160%`.
- **Data stays solid:** tables, charts, forms, product grids live on solid white "Diagnostic Module" cards (1px neutral border, 16px radius). Glass frames data; it never sits under it.
- **Typography (tri-font):** Sora for headlines, Inter for body/UI, Geist for labels & data (tabular figures for all numbers; substitute Space Grotesk for Geist if unavailable).
- **Color tokens** — kept here only as a quick pointer; `docs/DESIGN.md` §2/§10 (with the CSS variables in `web/app/globals.css`) is the actual source of truth and wins on any conflict, per this file's own rule below. As of the Branch 7 targeted rebalance (Milestone 1 foundation expansion): Light: bg `#FAFAFA` · card `#FFFFFF` · border `#D4D4D8` · text `#1F1F22` · primary (Deep Navy) `#0F172A` · secondary (Royal Blue) `#2F5FD6` · tertiary (Teal) `#14B8A6`. Dark: bg `#131315` · card `#0E0E10` · elevated `#2A2A2B` · border `#45464D` · text `#E4E2E4`. Every screen ships in both themes; the header always has a theme toggle. "Locked" describes the *system* (glass, spacing, radius, typography), not the palette specifically — users can pick one of 8 alternate color palettes from Settings → Appearance (Phase 3, `docs/DESIGN.md` §2a / `docs/DECISIONS.md` ADR-019); the values above describe "Skinlytics Default," still the one every new screen should be designed against first.
- **Signature element:** the Skin Score Ring — circular gauge in frosted glass, teal→royal-blue gradient stroke, Geist numeral, five weighted mini-bars (35/20/20/15/10) beside it. Identical treatment everywhere it appears.
- **Radius:** base 16px, large containers 32px, buttons/chips fully pill-shaped. **Icons:** Lucide, 1.5px stroke.

If any of the above conflicts with `docs/DESIGN.md`, the docs file wins — update this section to match, don't silently follow whichever you saw first.

**Four role-based navs**, each a fixed set — don't add, remove, or rename an item without a matching wireframe:
- **User:** Dashboard, My Routine, Daily Check-in, Products, Ingredients, Progress, Insights, Reports, Notifications, Settings
- **Consultant:** Dashboard, Clients, Assessments, Recommendations, Reports, Settings
- **Dermatologist:** Dashboard, Patients, Condition Reports, Treatment Plans, Analytics, Settings
- **Admin:** Dashboard, Users, Content & Data, Monitoring, System Reports, Settings

**Components:** only shadcn primitives already used in the wireframes — Card, Tabs, Button, Badge, Avatar, Progress, Slider, Switch, Select, Dialog, Sheet, Command, Data Table, Calendar, Accordion, Tooltip, Skeleton, Sonner toasts, shadcn Charts (Recharts). Check whether shadcn already ships something before writing a custom component.

**Before marking any screen "done":** open the matching file in `web/designs/wireframes/` and its screenshot in `source/reference-screenshots/` side-by-side with the built version. Structural or token drift is a bug, not a style choice.

---

## 4. Backend architecture

**Stack assumption — flag if wrong:** Python + FastAPI microservices, consistent with the AI/ML tooling (PyTorch/TensorFlow, LangChain, RAG pipelines) used elsewhere in this project.

- **Dual database:** PostgreSQL is system-of-record for structured/relational data (per `database_schemas/`, ~43 tables); MongoDB holds whatever `database_schemas/` documents as its collections. Don't assume which store a given entity belongs to feature-by-feature — that split is defined in `database_schemas/`, not guessed.
- **Roles map 1:1 to the four frontend navs above.** Every endpoint declares which role(s) can call it, and that must match what the corresponding wireframe's nav exposes to that role. A role that can't see a nav item shouldn't have a working endpoint behind it either.
- **Skin Health Score** (0–100, weighted Skin Condition 35% · Lifestyle Habits 20% · Routine Consistency 20% · Sleep Quality 15% · Hydration 10%) is cross-cutting — it appears in wireframes, docs, and schema alike. If you change how it's computed or stored, update all three, not just one.
- **Payments** via Stripe/Razorpay, dual currency (₹ primary, $ secondary). Check `docs/` for the actual integration contract before wiring anything — don't assume a provider's default flow is what this project uses.
- **"Not medical advice"** is a compliance requirement on assessment/dermatologist-adjacent screens per the design spec. Any AI-generated clinical-sounding output from the backend should carry confidence/advisory framing consistent with that — never present itself as a diagnosis.

---

## 5. Cross-cutting rule: UI and API stay in lockstep

Every wireframe implies a data shape; every schema entity implies a UI somewhere. Before adding a backend field with no UI to show it, or a UI element with no backend field to back it, check both `web/designs/wireframes/` and `database_schemas/` first — a mismatch usually means one of them is stale, not that you should guess the other into existence.

---

## 6. When something is missing or ambiguous

Stop and ask, or clearly flag the assumption you're making — don't fill the gap from general skincare-app or SaaS conventions. This project has a real, checkable answer for almost everything that matters; the failure mode to avoid is a plausible-sounding invention quietly replacing it.
