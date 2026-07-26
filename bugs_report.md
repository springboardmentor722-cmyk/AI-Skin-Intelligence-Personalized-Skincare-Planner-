# Skinlytics — Full-App UI/Functionality Test Pass

Date: 2026-07-26
Scope: Landing page → register/login → all 4 roles (user, consultant, dermatologist,
admin) → every nav item reachable from each role's sidebar.
Method: Live click-through in Chrome against `docker compose` data stores + local
`uvicorn`/`next dev`, with backend/DB cross-checks for anything that looked like a data
bug (not just a screenshot read).

Legend: 🔴 fixed in this pass · 🟡 confirmed bug, **not** fixed (needs a product call or
is out of scope for a UI pass) · ⚪ minor/cosmetic, noted only.

---

## 🔴 Fixed

### 1. Three "Add New Client"/"View Full Routine"-style buttons broke native button semantics
Base UI's `<Button render={<Link .../>}>` requires `nativeButton={false}` whenever the
`render` target isn't a real `<button>` — every other call site in the codebase already
sets it (`grep`-confirmed against all ~30 usages). Three call sites were missing it,
throwing `Base UI: A component that acts as a button expected a native <button>...` in
the console on the User dashboard, the Consultant/Dermatologist/Admin topbar ("Add New
Client"), and the shared sidebar footer CTA on every role.

- `web/app/(user)/dashboard/page.tsx:422` — "View Full Routine" button
- `web/components/app-shell/app-sidebar.tsx:141` — sidebar footer CTA (shared by all
  roles that have one)
- `web/components/app-shell/glass-topbar.tsx:111` — topbar primary action button
  ("Add New Client" for consultants)

**Fix:** added the missing `nativeButton={false}` prop, matching the existing pattern.
Verified the console error is gone after the fix on all three surfaces.

### 2. "Today's lifestyle" form on the Skin Profile page never loaded existing data
`web/components/skin-profile/lifestyle-form.tsx`'s `LifestyleForm` initialized its state
from a hardcoded `emptyForm` and had no data-fetching at all — every time a user opened
**My Skin Profile**, the "Today's lifestyle" card (sleep hours, water intake, stress
level, sun exposure, etc.) showed blank, even on a day they'd already logged one (e.g.
via the onboarding assessment or the Daily Check-in page). Confirmed via Mongo
(`lifestyle_logs` collection) that the day's real data existed server-side the whole
time — this was a pure frontend read gap, not missing data.

Worse than cosmetic: clicking **Save today's log** with the blank form would silently
**overwrite today's real entry with nulls/defaults** (sleep quality/stress/diet quality
reset to `5`, sleep hours/water intake/sun hours cleared) — a real data-loss risk on a
"logged once per day, saving again updates today's entry" form.

**Fix:** added a `GET /api/v1/lifestyle-logs/me` fetch (same `["lifestyle-logs", "me"]`
query key the save mutation already invalidated) and a `formFromLog()` mapper, mirroring
the existing `SkinProfileForm`/`formFromProfile` pattern in the same directory. The form
now lazily initializes from today's log if one exists. Verified: reloading the profile
page now shows the real saved values (7.5h sleep, 2L water, 3h sun) instead of blanks.

---

## 🟡 Confirmed bugs — not fixed (flagged, need a call)

### 3. Onboarding assessment asks "How old are you?" and then throws the answer away
Step 1 of the guided assessment wizard (`/assessment/basics`) requires an age group
(`ageGroup` in `web/lib/schemas/assessment.ts`) before you can continue. That answer is
never sent anywhere: `AssessmentSubmitRequest` (the "P0-frozen contract",
`backend/app/services/assessment/schemas.py`) has no `age_group` field, and
`submit_assessment` (`backend/app/services/assessment/service.py:198`) never passes one
to `skin_profile_service.create_profile`.

End-to-end effect (reproduced live): complete the whole assessment, answer "18-24" on
step 1, land on the dashboard — the **Skin Age** stat card still shows its empty state
("Set an age group on your profile to see this"), because `skin_profile.age_group` was
never actually set. The user has to separately re-enter the exact same answer on the
Skin Profile page (which *does* have its own working `age_group` field and *does*
persist it) to get the Skin Age card to populate. From a user's perspective, the app
asked a question and then acted like it never had.

This isn't a typo-level fix — `AssessmentSubmitRequest` is explicitly documented as a
frozen contract (M2 milestone ledger), so wiring `age_group` through it is a real schema
change, not a one-liner. Flagging per `AGENTS.md` §8 rather than silently patching a
frozen contract: either (a) wire `age_group` into the assessment payload → profile sync,
or (b) drop the age question from the wizard's step 1 if it's meant to be
non-persisted/cosmetic. Recommend (a).

- `web/app/assessment/basics/page.tsx` (collects it)
- `web/lib/assessment/context.tsx:26` (holds it in wizard state, also discarded)
- `backend/app/services/assessment/schemas.py` / `service.py:198` (never receives/uses it)

### 4. Notification bell shows a fake unread count and does nothing when clicked
Every role's topbar bell (`web/components/app-shell/glass-topbar.tsx:143-154`) renders a
red badge with a number (3 for user/consultant, 5 for dermatologist/admin) — but that
number is a **hardcoded fixture** in `web/lib/nav-config.ts:704/711/718/725`
(`bellCount: 3` / `5`), not real notification data, and the `<button aria-label=
"Notifications">` has **no `onClick` at all**. Clicking it does nothing — no panel, no
dropdown, no navigation — confirmed by clicking it repeatedly on the User and Consultant
dashboards.

This is different from `Reports`/`Reminders`, which are honestly labeled "Soon" in the
sidebar. The bell isn't labeled as unfinished, and its badge actively implies there's
something to see. Given the Notification service is explicitly still-to-be-built per
`AGENTS.md` §5 (M3–M4 scope), building the real panel is out of scope for this pass —
but the current state (fake count + dead click target) is worse than either finishing it
or hiding it. Recommend: drop the badge (or the whole button) until the real service
exists, same treatment as the "Soon" nav items get.

### 5. Consultant's "Add New Client" button is a dead end
`web/lib/nav-config.ts:713-714`: `primaryActionLabel: "Add New Client"`,
`primaryActionHref: "/consultant/clients"`. Clicking it just links to the Clients list
page — which, per its own empty state ("Clients are assigned by an admin — once someone
is assigned to you, they'll appear here"), a consultant has no way to add a client from.
So the button's label promises an action the role can't actually perform; clicking it
while already on `/consultant/clients` visibly does nothing at all.
Recommend removing the button (assignment is admin-only per the data model) or pointing
it at something real (e.g., a "request a client" flow), not silently inventing new
functionality here.

---

## ⚪ Minor / cosmetic (noted only)

### 6. Landing page footer + legal links are all `href="#"`
Confirmed via `read_page`: **AI Diagnostic, Routine Builder, Pro Portal, Our Research,
Clinical Partners, Careers, Privacy Policy, Terms of Service, HIPAA Compliance**, plus
the social icons in the footer, are all placeholder `#` links. Expected for pre-launch
marketing content (not one of the 12 required modules), but flagging since Privacy
Policy/Terms/HIPAA Compliance being dead links is a bit more than cosmetic once the app
is public.

---

## What worked well (spot-checked, no issues found)

- Landing page: theme toggle, hero, pricing section, all render correctly in light/dark.
- Signup: role picker (User/Skincare Consultant/Dermatologist), password strength meter,
  validation — all correct. Admin has no signup path, as designed (internal-only).
- Full onboarding wizards for Consultant and Dermatologist applications (4-step
  background/practice/contact/review flow) — field validation, tag inputs, review
  screen, submission, and the resulting "pending review" dashboard state all worked
  exactly as specced.
- **Skin Health Score math verified by hand**: dashboard showed `CONDITION 93 · LIFESTYLE
  44 · ROUTINE 100 · SLEEP 80 · HYDRATION 67`, weights `.35/.20/.20/.15/.10` → computed
  80.05, UI showed 80. Matches `AGENTS.md` §2 rule 7 exactly.
- Settings → Appearance: all 8 alternate palettes + light/dark/system switch live-update
  correctly and persist (`Saved` toast, confirmed with a reload).
- Admin verification queue: approved a real pending Consultant application end-to-end —
  `consultant_profiles.verification_status` flipped to `approved` in Postgres, and a
  `verification_approve` row landed in `audit_logs` via the single `write_audit_log`
  path, exactly as `AGENTS.md` §6 requires.
- Admin → Monitoring: real (non-fixture) API latency percentiles and a live, filterable
  audit trail — showed my actual test actions from this session.
- Search bar and Reports/Reminders/system-reports/settings-platform stubs all fail
  *honestly* ("Search isn't wired to a real endpoint yet.", "Coming soon.") rather than
  erroring or dead-linking — good pattern, kept consistent across all 4 roles.
- Ownership-scoped empty states ("No clients/patients assigned yet — assigned by an
  admin") correct for both Consultant and Dermatologist.
