# Wireframes — Milestone 1, Part 4

Spec for the seven M1 screens. The HTML wireframes in `web/design/wireframes/` are the
visual blueprint; this doc is the machine/agent-readable companion — components, data,
states, role visibility, and **acceptance criteria** per screen. High-fidelity visuals
come from Google Stitch (v2 "Frosted Lab Glass" prompt pack) and are rebuilt as shadcn
components mapped to `docs/DESIGN.md` tokens (`ARCHITECTURE.md` §11).

Open `web/design/wireframes/index.html` to browse all seven.

## App shell (screens 3–7, authenticated)
- **Glass sidebar** (role-dependent nav, collapsible to icons) + **glass topbar** (page
  title, ⌘K search, weather/UV chip, notification bell, theme toggle, account menu) +
  solid content canvas over the subtle aurora (`DESIGN.md` §3). Data renders on solid
  Diagnostic Module cards — never on glass.
- Nav lists per role are defined once, canonically, in `AGENTS.md` §3 — not repeated here
  to avoid the two docs drifting (they did: this section previously listed different,
  shorter nav sets than `AGENTS.md`; `AGENTS.md` wins per `CLAUDE.md`'s precedence rule,
  so that's the version to build against).
- Screens 1–2 (login, registration) are standalone centered **glass cards** over the
  aurora — no shell.
- **The wireframe HTML's sidebar text is not binding.** The `app-*.html` files under
  `web/designs/wireframes/` mostly share one generic Stitch draft nav (Dashboard /
  Analyses / Consultants / Settings, with one slot relabeled per screen) — that's a rough
  pass, not the finished per-role information architecture. Per `CONVENTIONS.md` ("raw
  exports never ship"), use the wireframe HTML only for the glass sidebar's visual
  treatment (blur, spacing, icon style, collapse behavior) — the actual nav items come
  from `AGENTS.md` §3.

## Global patterns (every screen inherits these)
- **Loading:** solid skeletons matching final layout (never glass skeletons); per-card,
  not whole-page.
- **Empty:** small 3D illustration + one primary action ("An empty screen is an
  invitation to act").
- **Error:** per-card error state with cause + Retry; envelope `error.message` shown,
  `request_id` in a tooltip for support.
- **A11y:** visible focus, AA contrast incl. over glass, reduced-motion/-transparency
  honored, 44px targets, mobile responsive.
- **Copy:** sentence case, active voice; a control keeps its name through its flow.
- Assessment-adjacent screens carry the quiet **"Not medical advice"** footer line.

## 1. Login
- **Components:** email, password (show/hide), remember-me, forgot-password link,
  "Sign in" (pill, navy), Google OAuth, link to Registration.
- **Auth:** Better Auth — `POST /api/auth/sign-in/email`; Google via
  `/api/auth/sign-in/social`.
- **States:** default · invalid credentials (inline destructive alert) · loading
  (disabled + spinner) · rate-limited (429 message with wait hint) · success → Dashboard
  (or Skin profile if none exists yet).
- **Accept:** all four roles can sign in; JWT reaches FastAPI and verifies; keyboard-only
  path works; both themes pass AA.

## 2. Registration
- **Components:** first/last name, email, password + confirm (strength meter), **consent
  checkbox (Terms + skin-photo processing — required)**, "Create account", Google
  sign-up, link to Login.
- **Auth:** Better Auth `POST /api/auth/sign-up/email`; new users default to role `user`
  (consultant/dermatologist upgrades happen via admin verification — see role screens).
- **Rules:** submit disabled until consent checked (skin photos are sensitive data —
  `SUGGESTIONS.md` P0); password rules inline; email-taken handled inline.
- **States:** default · email taken · password mismatch · consent unchecked · loading ·
  success → Skin assessment (screen 5) — the guided wizard, not the plain Skin profile
  form directly (product-owner decision, 2026-07-09; was "→ Skin profile" originally).
  Assessment results' own "Complete your skin profile" CTA is what leads to screen 4.
- **Accept:** consent stored with timestamp + policy version; no account without consent.

## 3. User dashboard
- **Components:** **Skin Score Ring** (0–100, `data-lg` Geist numeral) with the weighted
  breakdown (35/20/15/20/10 — condition/lifestyle/sleep/adherence/hydration) · today's
  checklist · personalized routine (AM/PM steps) · recommended products (3, match rings) ·
  progress mini-chart (dot-grid).
- **Data:** `GET /api/v1/assessment/score` · `/routine` · `/recommendations/me` ·
  `/progress/me/summary`; weights from PG `scoring_weights`.
- **M1 note:** routine + recs are deterministic stubs (ADR-007) — UI shows the stub's
  `confidence` labels exactly as it will show real ones.
- **States:** first-time (no profile → CTA to complete Skin profile) · per-card skeletons ·
  per-card error with retry.
- **Accept:** score math on screen matches `scoring_weights` row; all five components
  visible wherever the score is broken down; TTI within budget (`ARCHITECTURE.md` §1).

## 4. Skin profile & lifestyle (PDF Module 2; M1 parts 8–9)
- **Profile:** age group · gender (optional, inclusive options) · skin type
  (Normal/Dry/Oily/Combination/Sensitive) · concerns multi-select (the 10, each with
  severity 1–10) · allergies (tag input) · sensitivities (toggles).
- **Lifestyle:** sleep duration + quality · water intake · exercise frequency · stress ·
  diet · environmental exposure (sun hours, pollution level, AC hours).
- **Data:** profile → PG `skin_profiles` + `skin_profile_concerns`
  (`POST /api/v1/skin-profiles`); lifestyle → Mongo `lifestyle_logs`
  (`POST /api/v1/lifestyle-logs`, one/day upsert).
- **Behavior:** saving a profile invalidates `recommendation:cache:{user_id}`.
- **States:** empty (guided first setup) · editing · range validation (1–10) · saving ·
  saved toast ("Saved").
- **Accept:** allergy entries later act as hard filters in recs; optimistic save with
  rollback on error.

## 5. Skin assessment
- **Components:** a 5-screen questionnaire wizard, not a photo-capture flow — intro →
  Step 1 basics (age group, goals, location) → Step 2 skin type → Step 3 concerns
  (multi-select, mild/moderate/severe severity) → Step 4 lifestyle (sleep, water,
  stress, sun exposure) → results (Skin Score Ring, weighted component breakdown,
  identified-concerns chips, "Complete your skin profile" / "Go to dashboard" CTAs).
  Matches `web/designs/wireframes/assessment-{intro,step-1-basics,step-2-skin-type,
  step-3-concerns,step-4-lifestyle,results}.html` exactly — no camera/upload UI in any
  of those files.
- **Data:** wizard state lives client-side only (`sessionStorage`, via
  `AssessmentProvider`) for the length of the wizard. No dedicated Skin Assessment
  backend exists (ADR-007-stubbed, not built), so the results screen computes its score
  deterministically in the browser from the wizard's own answers, using the same
  weighted formula (35/20/20/15/10) the real Skin Health Score uses. On reaching
  results, the answers that overlap with screen 4's fields are also POSTed to the real
  `/api/v1/skin-profiles` and `/api/v1/lifestyle-logs` endpoints (mapping in
  `web/lib/assessment/save.ts`) so `/profile` opens pre-filled instead of asking the
  same questions twice — non-blocking, so results still render if the save fails.
- **States:** step 1–4 (validated, back/next) · results (always reachable — no
  analyzing/uploading state, since nothing is uploaded) · background save
  succeeded/failed toast on results.
- **Accept:** "Not medical advice" disclaimer visible on results; assessment answers
  and `/profile`'s own fields never silently diverge — the mapping in
  `web/lib/assessment/save.ts` is the single place that reconciles their shapes.

## 6. Product recommendations
- **Components:** filter rail (category · budget min/max · concern chips · brand ·
  preferences vegan/fragrance-free) · sort · ranked product cards (image, name, brand,
  ₹ price, match %, reason line) · Compare (2–3 drawer) · Alternatives (modal).
- **Data:** `GET /api/v1/recommendations/me` + filter params. Pipeline: relational
  pre-filter → vector → ES → XGBoost rank; Redis-cached (`ARCHITECTURE.md` §10). Filters
  map to the ES stage.
- **States:** skeleton grid · no matches ("Relax filters" CTA that actually relaxes) ·
  budget conflict notice · compare drawer · alternatives modal.
- **Accept:** an allergy-conflicting product can never render (hard filter proven by
  test); each card's "why" comes from the API `reasons[]`, not frontend guesses.

## 7. Progress tracking
- **Components:** week selector · before/after images (drag-slider) · improvement score
  (Δ points) · skin-score trend chart (score/adherence/hydration series, dot-grid,
  event annotations) · concern-changes table (before/after/Δ) · milestones · "Upload this
  week's photo" · export entry point.
- **Data:** photos → S3; records → Mongo `progress_logs`; `GET /api/v1/progress/me`;
  exports (PDF/Excel) via Report Service → S3 `/exports/` (async job + toast on ready).
- **States:** no history (start tracking) · single week (no comparison yet) · chart
  loading · export in progress → ready toast with download.
- **Accept:** photos only ever load via signed URLs; delete-my-data removes them from
  this screen and storage.

## Instrumentation (wire from M1 so M3 analytics has history)
`auth_signed_up` · `assessment_started/completed` · `profile_saved` ·
`checklist_step_done` · `rec_viewed/compared/added_to_routine` · `photo_uploaded` ·
`report_exported` — each with `request_id`, role, and screen. No health-data values in
event payloads, only ids.

## Handoff to build (Part 5+)
Route groups per role under `web/app/` (`CONVENTIONS.md`). Each screen becomes a route +
components; forms use the typed client in `web/lib/api.ts`; server components fetch reads,
client components own interactivity. M1 returns real data for auth/profile/lifestyle and
stubs for assessment/recommendations — swap-in is invisible to the UI (ADR-007).
