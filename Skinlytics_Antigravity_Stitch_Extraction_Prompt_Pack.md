<!-- # SKINLYTICS — Antigravity × Stitch MCP Extraction Pack
**80 Stitch screens (40 pages × light/dark) → `web/designs/wireframes/` as standalone HTML, zero redesign, zero guessing.**

> Companion to `Skinlytics_Stitch_UI_Prompt_Pack_v2.md`. That pack *generated* the screens in Stitch. This one *extracts* them into your codebase through Antigravity's Stitch MCP connection. Structured the same way as the original — a Master Prompt you paste first, then phase messages, then reusable snippets — so it reads like a natural sequel to that pack.

---

## HOW TO USE THIS PACK IN ANTIGRAVITY

1. **Stitch MCP must already be connected** — your `StitchMCP` server entry (the `mcp-remote` + `X-Goog-Api-Key` config) is correct as-is. One thing worth knowing: that config only handles authentication — it has no field for pinning a specific Stitch *project*. Which project to use is something you tell the agent in conversation (or store in a workspace Rules file, e.g. `.agents/rules/` — check **Settings → Rules** for the exact path in your version), not something that goes in the JSON. This pack states the project explicitly in the Master Prompt below, so you don't need to do anything extra.
2. **Your project:** Skinlytics AI Interface System — ID `933192060480910018` (`stitch.withgoogle.com/projects/933192060480910018`).
3. **Open the Antigravity workspace at your repo root** (the folder that contains, or should contain, `web/`).
4. Use **one continuous conversation** for the whole extraction — paste the Master Prompt, then Phase 1, then Phase 2, 3, 4, then the reusable snippets at the end, all in the same chat.
5. **Skip anything titled "Shader"** — you generated some WebGL shader artifacts alongside the 80 page screens to power the aurora background animation. Those aren't pages and aren't in the map below. If you want that shader code later, pull it separately into `source/shaders/` — it's outside this pack's scope.
6. If a batch ever gets rejected or truncated, use the **Single-page fallback** snippet at the end instead of the full phase message.

---
--- -->

# 🟩 MASTER PROMPT — paste this first

You are extracting an **already-completed** Stitch project — **Skinlytics AI Interface System**, project ID `933192060480910018` — into this codebase as static wireframe HTML files. Every one of its 80 screens (40 pages, each already built in both light and dark) already exists exactly as designed. You are not redesigning, restyling, simplifying, or regenerating anything from your own understanding of the Skinlytics spec — your only job is to pull each screen out losslessly and save it to disk.

**Step 1 — folder skeleton.** Create this exact empty structure in the workspace (no files yet):
```
web/designs/wireframes/
web/designs/wireframes/source/reference-screenshots/
web/designs/wireframes/source/images/
```
Confirm the tree, then stop and wait.

**Step 2 — sanity check.** List the screens in the Skinlytics AI Interface System project and confirm the total count is 80 (give or take any Shader artifacts, which don't count). If it's meaningfully off, stop and tell me before we go further — don't proceed on a guess.

**Step 3 — wait for phase messages.** I'll send you one phase at a time. Each phase message gives you a table of exactly 10 pages, and for each page, the **exact Stitch screen title** for its light version and its exact title for its dark version. Match screens by that literal title string, not by memory, not by approximate similarity, not by position/order in the screen list (creation order does *not* line up with page order — titles are the only reliable key).

**Ground rules, no exceptions, for every single screen:**
1. Fetch each screen's actual generated code through the Stitch MCP (the code-export tool — something like `get_screen_code` / `fetch_screen_code`), using its exact title to locate it. Never write or reconstruct HTML from memory of the design spec, even when you recognize the page. If a fetch fails or comes back incomplete, stop and tell me — don't fill the gap yourself.
2. Do not use any Stitch tool that *generates* or *regenerates* a screen (e.g. `generate_screen_from_text`, `build_site`, "extract design context and rebuild"). We only ever want the exact existing screen, never a new interpretation of it.
3. Preserve the fetched markup byte-for-byte — same classes, same inline styles, same structure, same attributes. Don't reformat it, don't move inline styles into a stylesheet, don't rename anything. If it needs a `<!DOCTYPE html>`/`<head>`/`<body>` wrapper to open standalone in a browser, add only that wrapper around the untouched content.
4. Every image the screen references (hero art, product photos, icons, 3D illustrations, avatars) gets downloaded through the Stitch MCP's image tool into `source/images/<page-slug>/`, then the HTML's `src`/`href` gets rewritten to that local relative path. Never leave a live `stitch.withgoogle.com` or `googleusercontent.com` URL in a saved file.
5. Also save the full reference screenshot for each screen into `source/reference-screenshots/<page-slug>.png` (or `<page-slug>-dark.png` for dark) — this is our visual ground truth for spotting drift later.
6. If a title from my table doesn't turn up an exact match in Stitch, don't substitute the closest-sounding screen — list the discrepancy and ask me before saving anything for that page.
7. Work one screen at a time: fetch code → fetch images → fetch screenshot → write file → one-line confirmation with the filename → next screen. No silent bulk runs.
8. Never touch or re-pull a screen we've already saved unless I explicitly ask for a re-pull.

I will send screens in **phases of ten pages**, in the same phase order they were designed. Keep these rules locked across every phase. Wait for Phase 1.

---
---

# 🟦 PHASE 1 — Public site, Auth & Skin Assessment (pages 1–10)

Extract these 10 pages per the Master Prompt rules. For each row, find the screen with the exact Light title, fetch + save it as the Light filename; find the screen with the exact Dark title, fetch + save it as the Dark filename.

| # | Page | Exact Light Stitch title | Exact Dark Stitch title | Save as (light) | Save as (dark) |
|---|---|---|---|---|---|
| 1 | Landing — `/` | Skinlytics \| AI Skincare Intelligence | Skinlytics \| AI Skincare Intelligence (Dark) | `landing-page.html` | `landing-page-dark.html` |
| 2 | Sign Up — `/signup` | Sign Up \| Skinlytics | Join the Lab \| Skinlytics (Dark) (Updated Sign Up) | `signup.html` | `signup-dark.html` |
| 3 | Login — `/login` | Login \| Skinlytics | Secure Sign In \| Skinlytics (Dark) (Updated Login) | `login.html` | `login-dark.html` |
| 4 | Assessment Intro — `/assessment` | Welcome to Your Assessment \| Skinlytics | Welcome to Your Assessment \| Skinlytics (Dark) | `assessment-intro.html` | `assessment-intro-dark.html` |
| 5 | Forgot & Reset Password — `/forgot-password` | Reset Password \| Skinlytics | Reset Password \| Skinlytics (Dark) | `forgot-password.html` | `forgot-password-dark.html` |
| 6 | Assessment Step 1 — Basics & Goals | Assessment: Basics & Goals \| Skinlytics | Assessment: Basics & Goals \| Skinlytics (Dark) | `assessment-step-1-basics.html` | `assessment-step-1-basics-dark.html` |
| 7 | Assessment Step 2 — Skin Type | Assessment: Skin Type \| Skinlytics | Assessment: Skin Type \| Skinlytics (Dark) | `assessment-step-2-skin-type.html` | `assessment-step-2-skin-type-dark.html` |
| 8 | Assessment Step 3 — Concerns & Priority | Assessment: Concerns & Priority \| Skinlytics | Assessment: Concerns & Priority \| Skinlytics (Dark) | `assessment-step-3-concerns.html` | `assessment-step-3-concerns-dark.html` |
| 9 | Assessment Step 4 — Sensitivities & Lifestyle | Assessment: Lifestyle & Sensitivities \| Skinlytics | Assessment: Lifestyle & Sensitivities \| Skinlytics (Dark) | `assessment-step-4-lifestyle.html` | `assessment-step-4-lifestyle-dark.html` |
| 10 | Assessment Results — `/assessment/results` | Your Skin Intelligence Results \| Skinlytics | Your Skin Intelligence Results \| Skinlytics (Dark) | `assessment-results.html` | `assessment-results-dark.html` |

> Note on rows 2 & 3: Stitch renamed these on the dark pass ("Join the Lab", "Secure Sign In"). That's expected — match by the exact title given, not by assuming light/dark share a name.

---

# 🟦 PHASE 2 — User app core (pages 11–20)

Same process as Phase 1.

| # | Page | Exact Light Stitch title | Exact Dark Stitch title | Save as (light) | Save as (dark) |
|---|---|---|---|---|---|
| 11 | User Dashboard — `/app/dashboard` | User Dashboard \| Skinlytics | User Dashboard \| Skinlytics (Dark) | `app-dashboard.html` | `app-dashboard-dark.html` |
| 12 | My Routine — `/app/routine` | My Routine \| Skinlytics | My Routine \| Skinlytics (Dark) | `app-routine.html` | `app-routine-dark.html` |
| 13 | Edit Routine — `/app/routine/edit` | Edit Routine \| Skinlytics | Edit Routine \| Skinlytics (Dark) | `app-routine-edit.html` | `app-routine-edit-dark.html` |
| 14 | Daily Check-in — `/app/checkin` | Daily Check-in \| Skinlytics | Daily Check-in \| Skinlytics (Dark) | `app-checkin.html` | `app-checkin-dark.html` |
| 15 | Products — `/app/products` | Products \| Skinlytics | Products \| Skinlytics (Dark) | `app-products.html` | `app-products-dark.html` |
| 16 | Product Detail — `/app/products/:id` | Product Details \| Skinlytics | Product Details \| Skinlytics (Dark) | `app-product-detail.html` | `app-product-detail-dark.html` |
| 17 | Compare Products — `/app/products/compare` | Compare Products \| Skinlytics | Compare Products \| Skinlytics (Dark) | `app-products-compare.html` | `app-products-compare-dark.html` |
| 18 | Ingredient Library — `/app/ingredients` | Ingredient Library \| Skinlytics | Ingredient Library \| Skinlytics (Dark) | `app-ingredients.html` | `app-ingredients-dark.html` |
| 19 | Ingredient Detail — `/app/ingredients/:id` | Ingredient Details \| Skinlytics | Ingredient Details \| Skinlytics (Dark) | `app-ingredient-detail.html` | `app-ingredient-detail-dark.html` |
| 20 | Progress Tracking — `/app/progress` | Progress Tracking \| Skinlytics | Progress Tracking \| Skinlytics (Dark) | `app-progress.html` | `app-progress-dark.html` |

---

# 🟦 PHASE 3 — User secondary + Consultant workspace (pages 21–30)

Same process.

| # | Page | Exact Light Stitch title | Exact Dark Stitch title | Save as (light) | Save as (dark) |
|---|---|---|---|---|---|
| 21 | Insights & Analytics — `/app/insights` | Insights & Analytics \| Skinlytics | Insights & Analytics \| Skinlytics (Dark) | `app-insights.html` | `app-insights-dark.html` |
| 22 | Reports & Export — `/app/reports` | Reports & Export \| Skinlytics | Reports & Export \| Skinlytics (Dark) | `app-reports.html` | `app-reports-dark.html` |
| 23 | Notifications & Reminders — `/app/notifications` | Notifications & Reminders \| Skinlytics | Notifications & Reminders \| Skinlytics (Dark) | `app-notifications.html` | `app-notifications-dark.html` |
| 24 | Profile & Settings — `/app/settings` | Profile & Settings \| Skinlytics | Profile & Settings \| Skinlytics (Dark) | `app-settings.html` | `app-settings-dark.html` |
| 25 | Plans & Billing — `/app/billing` | Plans & Billing \| Skinlytics | Plans & Billing \| Skinlytics (Dark) | `app-billing.html` | `app-billing-dark.html` |
| 26 | Consultant Dashboard — `/consultant/dashboard` | Consultant Dashboard \| Skinlytics AI | Consultant Dashboard \| Skinlytics AI (Dark) | `consultant-dashboard.html` | `consultant-dashboard-dark.html` |
| 27 | Clients List — `/consultant/clients` | Clients \| Skinlytics AI | Clients \| Skinlytics AI (Dark) | `consultant-clients.html` | `consultant-clients-dark.html` |
| 28 | Client Detail — `/consultant/clients/:id` | Client Detail \| Skinlytics AI | Client Detail \| Skinlytics AI (Dark) | `consultant-client-detail.html` | `consultant-client-detail-dark.html` |
| 29 | Recommendation Management — `/consultant/recommendations` | Recommendations \| Skinlytics AI | Recommendations \| Skinlytics AI (Dark) | `consultant-recommendations.html` | `consultant-recommendations-dark.html` |
| 30 | Dermatologist Dashboard — `/derm/dashboard` | Dermatologist Portal \| Skinlytics AI | Dermatologist Portal \| Skinlytics AI (Dark) | `derm-dashboard.html` | `derm-dashboard-dark.html` |

> No separate `/pricing` screen exists — only one "Plans & Billing" screen per theme, matching the original spec's "reuse for `/pricing`" note. See the **Pricing page** snippet at the end to derive `pricing.html`/`pricing-dark.html` from these two files without another Stitch fetch.

---

# 🟦 PHASE 4 — Dermatologist clinical tools + Admin + system states (pages 31–40)

Same process.

| # | Page | Exact Light Stitch title | Exact Dark Stitch title | Save as (light) | Save as (dark) |
|---|---|---|---|---|---|
| 31 | Patients List — `/derm/patients` | Patient Roster \| Skinlytics AI | Patient Roster \| Skinlytics AI (Dark) | `derm-patients.html` | `derm-patients-dark.html` |
| 32 | Patient Detail & Condition Report — `/derm/patients/:id` | Clinical Case Review \| Skinlytics AI | Clinical Case Review \| Skinlytics AI (Dark) | `derm-patient-detail.html` | `derm-patient-detail-dark.html` |
| 33 | Treatment Plan Builder — `/derm/treatments` | New Treatment Plan \| Skinlytics AI | Treatment Plan Builder \| Skinlytics AI (Dark) | `derm-treatments.html` | `derm-treatments-dark.html` |
| 34 | Dermatologist Analytics — `/derm/analytics` | Cohort Analytics \| Skinlytics AI | Cohort Analytics \| Skinlytics AI (Dark) | `derm-analytics.html` | `derm-analytics-dark.html` |
| 35 | Admin Dashboard — `/admin/dashboard` | System Overview \| Skinlytics Admin | System Overview \| Skinlytics Admin (Dark) | `admin-dashboard.html` | `admin-dashboard-dark.html` |
| 36 | Admin — User Management — `/admin/users` | User Management \| Skinlytics Admin | User Management \| Skinlytics Admin (Dark) | `admin-users.html` | `admin-users-dark.html` |
| 37 | Admin — Content & Data — `/admin/content` | Knowledge & Assets \| Skinlytics Admin | Knowledge & Assets \| Skinlytics Admin (Dark) | `admin-content.html` | `admin-content-dark.html` |
| 38 | Admin — Monitoring & System Reports — `/admin/monitoring` | Platform Health \| Skinlytics Admin | Platform Health \| Skinlytics Admin (Dark) | `admin-monitoring.html` | `admin-monitoring-dark.html` |
| 39 | Admin — Platform Settings — `/admin/settings` | Platform Infrastructure \| Skinlytics Admin | Platform Infrastructure \| Skinlytics Admin (Dark) | `admin-settings.html` | `admin-settings-dark.html` |
| 40 | System & Edge States | System & Edge States \| Skinlytics | System & Edge States \| Skinlytics (Dark) | `system-states.html` | `system-states-dark.html` |

> **Row 33 flag:** the light screen is titled "New Treatment Plan" but its dark counterpart is titled "Treatment Plan Builder" — a genuine rename between passes, not a typo in this table. Match each to its own exact title.
> **Row 40:** the whole 404/500/empty-states/skeletons/success-dialog/offline-banner/cookie-consent bundle lives on one screen per theme, not split into sub-screens — save it as the single file shown.

---
---

# 🟨 REUSABLE SNIPPETS

**Build the index gallery — paste after all 4 phases are saved:**
> All 80 screens are now saved under `web/designs/wireframes/`. Build `web/designs/wireframes/index.html`: a plain, undecorated HTML/CSS gallery page (no framework, no build step) grouping links by section — Public & Auth, Assessment, User App, Consultant, Dermatologist, Admin, System States. Each entry shows the page title, its route, a light/dark toggle between the two saved files, and a thumbnail pulled from `source/reference-screenshots/`. This index page is new scaffolding you're building now, not a Stitch export — keep it simple, it's a table of contents, not a 41st design.

**Pricing page — paste after Phase 3:**
> Duplicate `app-billing.html` and `app-billing-dark.html` into `pricing.html` and `pricing-dark.html` in the same folder. Don't change any content or styling — this mirrors the original spec's instruction to reuse the billing screen for the `/pricing` route. Just update the sidebar/nav active-state indicator if the markup has one, nothing else.

**Final fidelity audit — paste last:**
> Audit every file in `web/designs/wireframes/` except `index.html`. Confirm: (a) no `stitch.withgoogle.com` or `googleusercontent.com` URLs remain anywhere in any file, (b) all 80 screens (40 pages × light/dark, plus the two pricing duplicates) are present, (c) every file is valid standalone HTML that opens correctly on its own, (d) every filename matches the phase tables exactly. List anything missing or mismatched — don't silently fix it, tell me first.

**Single-page fallback — paste if a phase batch gets rejected or drifts:**
> Extract only **page [N] — [name]** using the Master Prompt rules, with this exact title pair: Light = "[exact light title]", Dark = "[exact dark title]". Save as `[light filename]` and `[dark filename]`.

---

## One thing to keep in mind

Stitch's code export is Stitch's own generated HTML/CSS — it was *designed* to follow the shadcn/ui + glassmorphism system from your original prompt pack, but the exported markup itself won't literally be shadcn component imports (`@/components/ui/button` etc.). Treat everything in `web/designs/wireframes/` as a pixel-accurate **visual and structural reference** — exactly what got approved in Stitch — not as production component code. Building the real React/shadcn app off of these is a separate, later step.
