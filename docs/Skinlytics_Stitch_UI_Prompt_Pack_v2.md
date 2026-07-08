# SKINLYTICS — Google Stitch UI/UX Prompt Pack · v2 (Glass Edition)
**AI Skin Intelligence & Personalized Skincare Planner · 40 screens · 4 phases · shadcn/ui · Glassmorphism · Light + Dark**

> v2 changes: glassmorphism is now a core design pillar ("Frosted Lab Glass"), and all tokens are aligned 1:1 with `docs/DESIGN.md` (Deep Navy / Royal Blue / Teal · Sora / Inter / Geist) so Stitch output maps directly onto the codebase design system.

---

## HOW TO USE THIS PACK IN STITCH

1. Create **one Stitch project (Web app)** and keep every phase inside it — this keeps the design system consistent across all 40 screens.
2. **First message:** paste the entire `MASTER PROMPT` and **attach the architecture diagram image**.
3. Then paste **PHASE 1**. When those screens are done, paste PHASE 2, then 3, then 4.
4. If Stitch caps screens per message, paste page blocks in batches of 2–4 — every block is self-contained.
5. After each phase, paste the **DARK MODE snippet** for dark variants, and the **CONSISTENCY CHECK snippet** if any screen drifts.

---
---

# 🟩 MASTER PROMPT — paste this first (attach the architecture image)

You are a senior product designer creating the complete UI/UX for **Skinlytics** — an AI-powered skin intelligence and personalized skincare planner. The attached image is the full system architecture (12 microservices, AI/ML engine, 5 data stores, external services) — study it to understand every capability the UI must expose. Design a **responsive web app, desktop-first at 1440px**, adapting cleanly to tablet and mobile.

## What Skinlytics does
Skinlytics analyzes a person's skin profile, lifestyle habits, sleep, hydration, and environmental exposure to deliver: an AI skin assessment with a Skin Health Score, personalized morning/evening/weekly routines with seasonal and adaptive updates, ingredient intelligence (suitability, interaction analysis, allergy detection, education), product recommendations with match scoring, comparison, alternatives and budget filters, progress tracking (photos, trends, adherence), analytics, exportable reports (PDF/Excel), smart reminders, and weather/UV-aware advice. Payments via Stripe/Razorpay.

## Users & roles (4 — signup offers the first three; Admin is internal)
1. **User** — improves their own skin
2. **Skincare Consultant** — manages clients, assessments, recommendations
3. **Dermatologist** — clinical patient insights, condition reports, treatment plans
4. **Administrator** — user management, content/data management, platform analytics, system monitoring

## Domain content — use THIS real content everywhere, never lorem ipsum
- **Skin types:** Normal, Dry, Oily, Combination, Sensitive
- **Skin concerns (10):** Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily Skin, Sensitive Skin, Wrinkles, Fine Lines, Redness, Uneven Skin Tone
- **Profile fields:** Skin Type, Age Group, Skin Concerns, Allergies, Sensitivities, Lifestyle Habits, Sleep Quality, Water Intake, Environmental Exposure
- **Skin Health Score (0–100), weighted:** Skin Condition 35% · Lifestyle Habits 20% · Routine Consistency 20% · Sleep Quality 15% · Hydration 10% — wherever the score is broken down, show these five weighted components.
- **Score bands:** 80–100 Excellent (teal `#14B8A6`) · 60–79 Good (royal blue `#2563EB`) · 40–59 Fair (amber `#F59E0B`) · 0–39 Needs care (red `#EF4444`)
- **Routine categories:** Cleansing, Exfoliation, Treatment, Moisturizing, Sun Protection, Night Care
- **Ingredients:** Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs
- **Product categories:** Face Wash, Moisturizer, Sunscreen, Serum, Toner, Treatment Products, Face Masks
- Invent **brand-safe product names** ("HydraBarrier Ceramide Cream", "ClearWave 2% BHA Serum", "SolarShield SPF 50 Fluid") priced in ₹ (primary) and $ (secondary). Diverse, gender-balanced sample names.

## Design language — "Frosted Lab Glass" (Modern Minimalist with Technical Nuance)
Lock this system on EVERY screen. Never restyle between screens.

- **Personality:** a medical-grade diagnostic instrument, not a beauty app — calm, precise, data-driven, **strictly gender-neutral** (no pink tropes, no gendered imagery; diverse skin tones and all genders shown equally). Inspiration: Linear's utility density × Oura's physiological data calm, wrapped in frosted glass.
- **Glassmorphism — where glass lives (the signature):**
  - **App chrome is glass:** the public navbar, the app sidebar, and the top header are frosted panels — `backdrop blur 20px, saturation 160%`, background `rgba(255,255,255,0.68)` light / `rgba(13,20,36,0.62)` dark, 1px border `rgba(15,23,42,0.08)` light / `rgba(255,255,255,0.08)` dark, inset 1px top highlight, soft shadow `0 8px 32px rgba(15,23,42,0.10)`.
  - **Overlays are glass:** dialogs, sheets, dropdowns, the ⌘K command palette, sticky action/compare bars, toasts.
  - **Hero & score housings are glass:** the landing hero panel and the Skin Score Ring sit inside frosted glass containers floating over the ambient background.
  - **Data stays solid:** dense content — tables, charts, forms, product grids — lives on solid white "Diagnostic Module" cards (1px slate border, 16px radius) so readability never suffers. Glass frames the data; it never sits under it.
  - **Ambient background:** a very subtle aurora — soft navy→royal-blue→teal mesh gradient blobs at 6–10% opacity drifting behind the glass on the body background. This is what makes the blur visible. Never busy, never distracting.
  - **Rules:** max 2 stacked glass layers; text on glass only for nav/labels/headings (never paragraphs of body copy); everything meets WCAG AA contrast.
- **Depth (rich, subtly 3D, never heavy):** tonal surface layers + 1px hairline borders as the base; one soft blue-tinted diffuse shadow `0 4px 20px rgba(37,99,235,0.08)` for focused cards; glass for chrome; sparing **soft matte clay-style 3D illustrations** (serum droplet, bottle on pedestal, orbiting ingredient spheres, shield) in the hero, score ring, empty states, and step icons only. Cards lift 2px on hover. No heavy textures, no neon, generous whitespace.
- **Component system: shadcn/ui.** Compose from shadcn primitives and block patterns: collapsible icon **Sidebar (sidebar-07)** + header shell for app pages (both rendered as glass), **split-screen auth (login-03/04)**, **dashboard-01** stat grids, Card, Tabs, Button, Badge, Avatar, Progress, Slider, Switch, Select, Dialog, Sheet, Command, Data Table, Calendar, Accordion, Tooltip, Skeleton, Sonner toasts, shadcn Charts (Recharts).
- **Signature element — the Skin Score Ring:** a circular radial gauge inside a frosted glass housing — teal→royal-blue gradient stroke, subtle inner shadow and soft outer glow, large **Geist** numeral centered with the band label under it, and the five weighted component mini-bars beside it (35/20/20/15/10). Identical treatment everywhere the score appears, at any size.
- **Technical nuance details:** charts use 2px strokes in Royal Blue or Teal over a faint **dot-grid background**; Diagnostic Module cards carry a small **Geist "Confidence 92%"** label in the top-right when AI-derived; chips are fully pill-shaped with 10%-opacity category tint and no border.

## Design tokens (mirror of docs/DESIGN.md)
- **Typography (tri-font):** Headlines — **Sora** (600/700, tight −0.01/−0.02em); Body/UI — **Inter** (400/500); Labels & data — **Geist** (500/600, +0.02–0.05em tracking, tabular figures for all numbers). If Geist is unavailable in Stitch, substitute Space Grotesk for labels. Scale: display 48/56, H2 32/40, H3 24/32, body 16/24 & 18/28, label 14 & 12, data numerals 40–44.
- **Radius:** base 16px; large diagnostic containers 32px; buttons & chips fully pill-shaped; inputs 16px. **Icons:** Lucide, 1.5px stroke.
- **LIGHT:** background `#F7F9FB` · card `#FFFFFF` · muted `#ECEFF3` · border `#E2E8F0` · text `#0F172A` · secondary text `#475569` · **primary (Deep Navy)** `#0F172A` on `#FFFFFF` · **secondary (Royal Blue)** `#2563EB` · **tertiary/data-active (Teal)** `#14B8A6` · success `#059669` · warning `#D97706` · error `#DC2626` · brand gradient `#2563EB → #14B8A6`.
- **DARK:** background `#0B1220` · card `#111A2E` · elevated `#1A2740` · border `#24304A` · text `#E6EDF7` · secondary `#94A3B8` · primary button `#F8FAFC` on `#0F172A` · secondary `#3B82F6` · tertiary `#2DD4BF` · glass bg `rgba(13,20,36,0.62)` with border `rgba(255,255,255,0.08)`. Minimal shadows; faint teal/blue glow on primary elements and the Score Ring.
- Every screen ships in both themes; the app header always includes a sun/moon **theme toggle**.

## App shell & navigation — identical on all in-app screens
- **Glass left sidebar** (collapsible to icons): "Skinlytics" wordmark + droplet-scan mark, role-specific nav, bottom: Settings + user mini-card.
- **Glass top header:** page title + breadcrumb, ⌘K global search, **Weather & UV chip** ("☀️ UV 7 · High — SPF advised"), notification bell with badge, theme toggle, avatar menu.
- **User nav:** Dashboard, My Routine, Daily Check-in, Products, Ingredients, Progress, Insights, Reports, Notifications, Settings.
- **Consultant nav:** Dashboard, Clients, Assessments, Recommendations, Reports, Settings.
- **Dermatologist nav:** Dashboard, Patients, Condition Reports, Treatment Plans, Analytics, Settings.
- **Admin nav:** Dashboard, Users, Content & Data, Monitoring, System Reports, Settings.

## Global rules
- Every table/list has search, filters, pagination, and an **empty state** (small 3D illustration + one primary action).
- Forms: shadcn patterns, labels above fields, inline validation, sticky glass action footers on multi-step flows.
- Charts: dot-grid backgrounds, legends, axis labels, 7D/30D/90D range tabs.
- Accessibility: WCAG AA contrast (including all text over glass), visible focus rings, 44px touch targets.
- Buttons name the action ("Save routine", "Generate report"), never "Submit". Sentence case everywhere.
- A persistent, quiet **"Not medical advice"** line appears in the footer of assessment/derm-adjacent screens.

I will request screens in **phases of ten pages, in user-flow order**. Keep this design system locked across all phases. Wait for my phase instructions.

---
---

# 🟦 PHASE 1 — Pages 1–10 · Public site, Auth & Skin Assessment flow
*(Flow: Landing → Sign up with roles → Login → Assessment steps → Results → Dashboard)*

**Page 1 · Landing Page — `/`**
Sticky **glass navbar** over the aurora background: logo, Features, How it works, For Professionals, Pricing, Login (ghost), "Start free assessment" (pill, navy). **Hero inside a large frosted glass panel:** left — Sora H1 "Skincare intelligence, personalized to your skin.", subline on AI analyzing skin, lifestyle, sleep and environment, two pill CTAs, trust row ("12,000+ skin profiles analyzed · Dermatologist-informed"); right — clay-3D serum droplet and orbiting ingredient spheres around a glowing **Skin Score Ring (82)** in its glass housing. Below: "How it works" 3 lifted cards (Assess → Get your AI routine → Track progress); 6-card feature grid (AI Skin Assessment, Personalized Routines, Ingredient Intelligence, Product Match Scoring, Progress Tracking, Smart Reminders); a glass score-explainer band showing the weighted formula (35/20/20/15/10); "Built for every role" — three cards (User / Consultant / Dermatologist); testimonial carousel (gender-balanced, diverse skin tones); pricing teaser (Free vs Pro); FAQ accordion; final gradient CTA band; solid footer.

**Page 2 · Sign Up — `/signup`**
Split-screen auth: **left glass panel** over the aurora with a 3D droplet and rotating value props; right solid card: **Step A "Who are you?"** — three selectable role cards: *User — "Improve my own skin"*, *Skincare Consultant — "Guide my clients"* (small "verification required" badge), *Dermatologist — "Manage patients clinically"* (badge). **Step B** — full name, email, password with strength meter, **consent checkbox (Terms + skin-photo processing — required)**, pill "Create account", divider, "Continue with Google", link to login.

**Page 3 · Login — `/login`**
Mirrored split-screen: email, password with show/hide, remember me, "Forgot password?", pill "Log in", Google OAuth, sign-up link. Include one inline error state ("Incorrect email or password").

**Page 4 · Forgot & Reset Password — `/forgot-password`**
Centered glass card over the aurora, three states: enter email → success ("Check your inbox", 3D paper-plane) → reset form (new password + confirm, strength meter, "Set new password").

**Page 5 · Assessment Intro — `/assessment`**
Welcome for role = User: "Hi Aarav — let's understand your skin." Glass panel explaining the 5-step ~3-minute assessment and what the AI analyzes, a privacy reassurance line + photo-consent reminder, horizontal stepper preview, pill "Begin assessment", ghost "Skip for now".

**Page 6 · Assessment Step 1 of 5 — Basics & Goals**
Glass progress header (20%) with step chips (Basics · Skin type · Concerns · Sensitivities & lifestyle · Done). Solid form card: **Age group** pills (13–17, 18–24, 25–34, 35–44, 45–54, 55+); **Primary goals** multi-select cards (Clearer skin, Even tone, Anti-aging, Deep hydration, Calm sensitivity); **Location** input, helper "Used for weather & UV-based advice". Sticky glass footer: Back / Continue.

**Page 7 · Step 2 of 5 — Skin Type**
Progress 40%. Five large visual cards — Normal, Dry, Oily, Combination, Sensitive — each with a soft 3D texture orb, one-line description, "how it feels" hints; single-select. "Not sure? Take the 30-second quiz" opens a glass Dialog with 3 quick questions.

**Page 8 · Step 3 of 5 — Concerns & Priority**
Progress 60%. Multi-select pill grid of the 10 concerns with icons; selections drop into a **"Your priorities" drag-to-rank list** (top 3 highlighted), each with a Mild/Moderate/Severe segmented control.

**Page 9 · Step 4 of 5 — Sensitivities & Lifestyle**
Progress 80%. Sections: **Allergies** tag input (Fragrance, Essential oils, Lanolin, Sulfates, Nuts); **Sensitivities** toggles (Reacts to actives, Sun-sensitive, Redness-prone); **Lifestyle** — sleep hours slider + quality select, water-intake stepper (glasses/day, target 8), sun exposure select, stress slider, environment pills (Urban, Coastal, Dry, Humid).

**Page 10 · Assessment Results — `/assessment/results`**
Reveal moment on the aurora: large animated **Skin Score Ring in a glass housing** (e.g., **68 — "Fair, improving"**) with the five weighted bars; ranked concern chips with severity; "Top 3 risk factors" (each with a Geist confidence label); AI summary on a Diagnostic Module card; preview of the generated routine (3 AM + 3 PM mini timeline cards). CTAs: pill "Open my dashboard", ghost "Download report (PDF)". Quiet "Not medical advice" footer line.

---
---

# 🟦 PHASE 2 — Pages 11–20 · User app core

**Page 11 · User Dashboard — `/app/dashboard`**
Glass shell + 12-col grid. **Row 1:** greeting + date; **Skin Score Ring card** (68, "+4 vs last week", sparkline); **Today's Routine** (AM 4/4 ✅, PM 0/5 checklist); **Weather & UV card** ("UV 7 · High — reapply SPF at 1 pm"). **Row 2:** four Geist-numbered stat cards (Hydration 5/8 · Sleep 6.5 h · Streak 12 days · Adherence 86%); 30-day score **area chart on a dot-grid**. **Row 3:** "Recommended for you" carousel (match-% rings), Reminders list, one AI Insight card with a Confidence 87% label ("Your redness improves on nights with 7+ hours of sleep").

**Page 12 · My Routine — `/app/routine`**
Tabs AM / PM / Weekly. Step timeline cards — number, category badge, product thumb + name, duration, expandable instructions, done state; AM sun / PM moon 3D icons. Weekly: 7-day strip with treatment chips (Exfoliation Tue/Fri, Face Mask Sun). Glass banner: "Seasonal update — winter adjustments ready" + Review. Header: "Regenerate with AI", "Edit routine".

**Page 13 · Edit Routine — `/app/routine/edit`**
Two-pane: left draggable step list (reorder handles, add, remove); right step editor — category, product picker (glass Dialog with match scores), frequency, notes. Inline **conflict warning**: "Retinoid + AHA in the same routine — move AHAs to alternate nights." Sticky glass save bar with unsaved-changes dot.

**Page 14 · Daily Check-in — `/app/checkin`**
Today card: AM/PM checklists; **hydration tracker** (8 fillable glasses); **sleep log** (hours slider + quality faces); "How does your skin feel today?" pills (Great / Okay / Irritated); **progress photo card** — camera frame with neutral face-outline guide + lighting tips; completion fires a streak toast ("🔥 12-day streak").

**Page 15 · Products — `/app/products`**
Left filter rail (7 categories, concern, skin-type suitability, budget ₹ slider, allergy-safe toggle, sort by Match). Grid of product cards: image on soft pedestal, name, category badge, price ₹/$, **Match Score ring**, key-ingredient pills, allergy-alert dot, compare checkbox, "Add to routine". A **sticky glass compare bar** slides up when 2–3 selected.

**Page 16 · Product Detail — `/app/products/:id`**
Left: product on a 3D pedestal + thumbs. Right: name, category, price + "cheaper alternatives" link, **Match Score ring** with "Why this matches you" expandable, **ingredient table** (name · function · suitability ✓/!/– · allergy flag), interaction check vs current routine, how-to-use, review summary. CTAs: Add to routine · Compare · Save.

**Page 17 · Compare Products — `/app/products/compare`**
Three-column table, sticky glass product headers (image + match ring): price, category, suitability, key ingredients, concerns targeted, texture, allergy flags, AI pros/cons row; "highlight best value" toggle; per-column "Choose this".

**Page 18 · Ingredient Library — `/app/ingredients`**
Search, A–Z pills, category filters (Actives, Hydrators, Exfoliants, Barrier support). Cards for Retinoids, Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs — 3D molecule icon, one-line benefit, personalized badge ("For you: ✓ Suitable" / "! Use with care"). **"Check interactions"** opens a glass Dialog: pick 2+ → verdict card (Safe together / Alternate days / Avoid) with plain-language why.

**Page 19 · Ingredient Detail — `/app/ingredients/:id`**
Hero: 3D molecule, name + aliases, personalized suitability banner ("Suitable for your combination skin — start 2×/week at night"). Sections: What it does · Concerns it targets · How to use (strength, AM/PM, frequency) · **Pairs well with / Avoid mixing** (✓/✗ chips) · allergy note · "Backed by research" citation list. Related products carousel.

**Page 20 · Progress Tracking — `/app/progress`**
Range tabs 7D/30D/90D/All. **Before/After card** — two photos, center drag-slider, date badges, "Add today's photo". Score **trend chart on dot-grid** with event annotations ("Routine changed", "Added Niacinamide serum"). Five small-multiples for the weighted components. **Adherence calendar heatmap**. Milestones ("First 30-day streak 🏅", "Score +10 🎉").

---
---

# 🟦 PHASE 3 — Pages 21–30 · User secondary + Consultant workspace

**Page 21 · Insights & Analytics — `/app/insights`**
AI insight feed cards with Geist confidence labels + Helpful/Dismiss; **factor-impact bar chart** (Sleep, Hydration, Adherence, UV vs score change); engagement stats; "Monthly recap" glass card with Share/Export.

**Page 22 · Reports & Export — `/app/reports`**
Report-type cards: Skin Assessment · Routine · Product Recommendations · Progress · Skin Health Summary, each "Generate" → glass config Dialog (date range, section toggles, **PDF / Excel** radio). Recent reports table (name, type, date, format, Download/Share). **Scheduled reports** section (frequency, email toggle).

**Page 23 · Notifications & Reminders — `/app/notifications`**
Tabs: **Inbox** — Today/Earlier groups: routine reminders, progress alerts, replenishment ("SolarShield SPF ~5 days left"), hydration nudges, platform notices; unread dots + Mark all read. **Reminder settings** — a card per type (Morning 7:30 · Evening 9:30 · Hydration every 2 h 9–7 · Sleep wind-down 10 PM · Replenishment auto) with Switch, time picker, channel pills (Push / Email).

**Page 24 · Profile & Settings — `/app/settings`**
Sub-nav: Account, Skin Profile, Appearance, Notifications, Privacy & Data, Billing. Account: avatar, name/email, password, connected Google. Skin Profile: editable assessment summary + "Retake assessment". **Appearance: Light / Dark / System cards with live glass mini-previews.** Privacy & Data: export my data, **photo-storage consent toggle**, danger zone (delete account — purges photos too).

**Page 25 · Plans & Billing — `/app/billing` (reuse for `/pricing`)**
Monthly/Yearly toggle ("Save 20%"). Free · **Pro ₹499/mo** (most-popular glass-framed card with gradient border) · Clinic/Team, with feature checklists. Payment glass Sheet: **Stripe / Razorpay**, card fields + UPI, order summary. Billing history + invoice downloads.

**Page 26 · Consultant Dashboard — `/consultant/dashboard`**
KPIs: Active clients 24 · Avg client score 71 · Assessments this week 9 · Avg adherence 78%. **"Needs attention"** list (dropping scores / low adherence, severity dots). Recent assessments table. Client progress mini-leaderboard. Quick actions: Add client · New recommendation.

**Page 27 · Clients List — `/consultant/clients`**
Toolbar (search, filters: score band, adherence, top concern; "Add client"). **Data Table:** avatar + name, age group, skin type, top-concern chip, Score mini-ring, adherence %, trend arrow, last check-in, row menu. Hover lift; pagination.

**Page 28 · Client Detail — `/consultant/clients/:id`**
Glass header: avatar, name, tags, Score ring + trend, actions (Message · New recommendation · Export report). Tabs: Overview (profile + five weighted components) · Assessment report (concern breakdown, risk factors) · Progress (photos + charts) · Routine (read-only AM/PM) · Notes (timeline + composer).

**Page 29 · Recommendation Management — `/consultant/recommendations`**
Builder: pick client → template or blank; drag product/ingredient cards from a right glass library panel into AM/PM slots; inline conflict warnings; note field; "Send for client approval" with status chips (Draft / Sent / Accepted). History table with outcomes ("+6 score in 30 days").

**Page 30 · Dermatologist Dashboard — `/derm/dashboard`**
Clinical tone. KPIs: Patients 132 · High-risk flags 6 · Avg improvement +9 · Reports pending 4. **Condition distribution donut** from the concern list; high-risk alert list with severity badges; recent condition reports; today's follow-ups. Clinical outputs visually distinct from AI suggestions (solid cards, Geist "Clinical" tag vs AI confidence tag).

---
---

# 🟦 PHASE 4 — Pages 31–40 · Dermatologist clinical tools + Admin + system states

**Page 31 · Patients List — `/derm/patients`**
Data Table: patient, age group, condition tags, severity, **risk badge** (Low/Medium/High), last visit, treatment status (On plan / Review due); risk & condition filters; bulk export.

**Page 32 · Patient Detail & Condition Report — `/derm/patients/:id`**
Glass header with risk badge + score ring. Tabs: **Condition report** — severity matrix table, **affected-area face map** (neutral gender-ambiguous line-art with highlighted zones), risk-factor analysis, AI observations each with a Geist confidence % badge; History; Photos (clinical dated grid); Documents.

**Page 33 · Treatment Plan Builder — `/derm/treatments`**
Structured clinical form: diagnosis summary, goals, "Clinical recommendation" section (prescription-strength), OTC routine section, duration + follow-up Calendar, patient instructions rich text, automatic **contraindication alerts** (allergies/interactions), "Review & send" with sign-off. Right pane: live **PDF preview**.

**Page 34 · Dermatologist Analytics — `/derm/analytics`**
Cohort outcomes: avg improvement by condition (grouped bars), treatment-effectiveness comparison, adherence-vs-outcome scatter, time-to-improvement stat cards; range tabs; Export. All charts on dot-grid.

**Page 35 · Admin Dashboard — `/admin/dashboard`**
Platform KPIs: Total users 12.4k · DAU/MAU · signups line · retention % · recommendations served · MRR. **System health strip** (API latency, uptime, error rate, status dots). Role-distribution donut. Activity feed.

**Page 36 · Admin — User Management — `/admin/users`**
Data Table: user, **role badge** (4 roles), status (Active / Suspended / Pending verification), joined, last active, actions. **Professional-verification drawer** (credentials preview, Approve/Reject). Invite dialog; bulk actions bar.

**Page 37 · Admin — Content & Data — `/admin/content`**
Tabs: **Products DB** (table + add/edit glass Sheet: name, category, ingredient multi-select, price, images) · **Ingredients DB** (editor + interaction-pair matrix) · **Knowledge base** (article list + editor) · **Data sources** — sync cards for Skincare Product DBs, Ingredient DBs, Dermatology KBs, Research Publications, with last-synced timestamps + Sync buttons.

**Page 38 · Admin — Monitoring & System Reports — `/admin/monitoring`**
Model-performance cards with trends: recommendation relevance %, suitability accuracy, concern-classification accuracy, scoring consistency. **Flagged-recommendations queue** (review drawer). System reports: API response-time chart, dashboard load, concurrent capacity, error-log table; Export.

**Page 39 · Admin — Platform Settings — `/admin/settings`**
Sections: **Integrations** (Weather & UV API key card, Stripe/Razorpay toggles + keys, Cloud storage AWS S3 / Azure Blob, email provider); Notification templates; Feature flags; Security (enforce 2FA, session timeout); Backup & data (last backup, retention, "Run backup now").

**Page 40 · System & Edge States**
One set: **404** (lost 3D droplet + "Back to dashboard") and **500**; empty states ("No products match your filters", "No clients yet", "No progress photos yet") each with a 3D illustration + one action; **loading skeletons** of Dashboard and Products; success/confirmation glass dialog; offline banner; cookie-consent glass banner for the landing page.

---
---

# 🟨 REUSABLE SNIPPETS

**Dark mode request (paste after each phase):**
> Render pages [X–Y] in **dark mode**: background `#0B1220`, card `#111A2E`, elevated `#1A2740`, border `#24304A`, text `#E6EDF7`, secondary `#94A3B8`, primary button `#F8FAFC` on navy, secondary `#3B82F6`, teal `#2DD4BF`. Glass becomes `rgba(13,20,36,0.62)` with `rgba(255,255,255,0.08)` borders and a faint inner top highlight. Keep layouts identical — swap tokens only, reduce shadows, add a soft teal/blue glow to the Skin Score Ring and primary elements. The aurora background dims to 4–6% opacity.

**Consistency check (paste if any screen drifts):**
> Audit the last screens against the Skinlytics "Frosted Lab Glass" system and fix drift: Sora headlines + Inter body + Geist labels/data; 16px base radius, pill buttons; Deep Navy `#0F172A` primary, Royal Blue `#2563EB` secondary, Teal `#14B8A6` data-active; glass ONLY on chrome/overlays/hero/score housings (blur 20px, saturate 160%, the exact rgba recipes); dense data on solid white Diagnostic Module cards with 1px `#E2E8F0` borders; dot-grid chart backgrounds; Lucide icons; identical glass sidebar + header on every app page; the Skin Score Ring exactly as defined. Do not introduce new colors, fonts, shadows, or glass recipes.

**Single-page fallback (if Stitch rejects a big batch):**
> Design only **Page [N] — [name]** from my phase list, using the locked Skinlytics design system. [paste that page's block]
