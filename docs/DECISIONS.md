# Decisions (ADRs)

Append-only. When an agent makes a structural choice, add an entry so no future session
undoes it without cause. Format: number · title · status · context · decision ·
consequences. **Precedence rule:** if code disagrees with an accepted ADR, the code is the
bug — or supersede the ADR explicitly with a new one that references it.

---

## ADR-001 — Drop the runtime graph database
**Status:** Accepted (M1)
**Context:** An early ChatGPT draft included a "Graphify" graph store (Neo4j-style) for
relationship queries (ingredient→concern, product→skin-type). The approved system
diagram's data layer contains exactly five stores and no graph DB.
**Decision:** No runtime graph database. Relationship queries are indexed PostgreSQL joins
over junction tables (`ingredient_concern_treats`, `ingredient_skintype_avoid`,
`product_skin_types`, `product_concerns`). Revisit only if genuine 3+ hop path queries
appear in practice.
**Consequences:** One fewer store to sync, back up, and operate. Every former graph query
has an equivalent 1–2 hop SQL join (examples in
`database_schemas/skinlytics_postgresql_schema_v3.sql`). *Not to be confused with
Graphify-the-dev-tool — see ADR-006.*

## ADR-002 — Better Auth is the single auth authority
**Status:** Accepted
**Context:** Next.js frontend, FastAPI backend. We need email/password + OAuth2 social
login + sessions + JWTs for service calls without duplicating auth logic across stacks.
**Decision:** Better Auth (Next.js) owns registration, login, scrypt password hashing,
OAuth2 providers, and sessions. Its JWT plugin issues short-lived asymmetric
(EdDSA/RS256) JWTs and serves JWKS at `/api/auth/jwks`. FastAPI only **validates** JWTs
against the cached JWKS (`kid`, `iss`, `aud`, `exp`/`nbf`). RBAC via the Better Auth
admin plugin (`createAccessControl`); the role travels as a JWT claim and is enforced by
one FastAPI dependency. Redis holds rate limits, caches, and an optional `jti` blacklist
for instant revocation.
**Consequences:** Stateless backend auth; no shared secret; no duplicated auth code.
FastAPI cannot mint tokens — correct, it isn't the authority. Exact config:
`database_schemas/skinlytics_identity_betterauth.md`.

## ADR-003 — User IDs are strings (TEXT); identity tables are Better-Auth-owned
**Status:** Accepted
**Context:** Better Auth uses 32-char string IDs by default. Forcing numeric IDs
(`useNumberId`) is global, 32-bit only, and has documented bugs (admin-plugin breakage,
session overflow, type mismatches).
**Decision:** Accept string IDs. Better Auth owns `user`, `session`, `account`,
`verification`, `jwks` (generated via `npx @better-auth/cli generate`). Every domain
`user_id`/`consultant_id` is `TEXT REFERENCES "user"(id)`. The old serial-integer `users`
and custom `oauth_accounts` tables are removed. Mongo `user_id` → String; Elasticsearch
`user_id` → keyword; vector IDs (`user_{id}`) were already strings.
**Consequences:** Supersedes the v2 schema — this is why v3 exists. Reintroducing integer
user IDs is a golden-rule violation.

## ADR-004 — Frontend: Next.js + Tailwind + shadcn/ui, Recharts, Stitch designs
**Status:** Accepted
**Context:** Requested stack is shadcn + Next.js + Tailwind; the PDF listed
React.js/Chart.js/Plotly; designs are authored in Google Stitch.
**Decision:** Next.js App Router + TypeScript + Tailwind + shadcn/ui (components owned in
`web/components/ui`). Charts via shadcn charts (Recharts); Plotly reserved for heavy
scientific viz. Server state via TanStack Query. Stitch designs are pulled via MCP or
exported into `web/design/` and **rebuilt** as shadcn components — raw exports never ship.
**Consequences:** A cohesive component system replaces the PDF's defaults. Theming is CSS
variables only; accessibility floor (focus, reduced motion, mobile) is part of the
definition of done.

## ADR-005 — Modular monolith for M1–M3, containers at M4
**Status:** Accepted
**Context:** The diagram shows 12 microservices; standing up 12 deployables inside an
8-week build is disproportionate.
**Decision:** One FastAPI deployable with the 12 services as internal modules under
`backend/app/services/*`, each owning its data exclusively. Split into per-service
containers at Milestone 4.
**Consequences:** Fast iteration now, clean seams later. A service never imports another
service's models or touches its tables — cross-service calls go through interface
functions — so the M4 split stays mechanical. Violations are review blockers.

## ADR-006 — Adopt Graphify (the dev tool) for agent context persistence
**Status:** Accepted
**Context:** Development spans multiple agentic tools; each fresh session re-reads the
repo, wasting tokens and re-deriving decisions inconsistently.
**Decision:** Use `safishamsi/graphify` (PyPI `graphifyy`) to compile the repo (code +
SQL + docs) into a committed knowledge graph (`graphify-out/`) that agents query instead
of grepping, plus its work memory (`save-result`/`reflect`). Paired with `AGENTS.md`
(always-on), `PROGRESS.md` (state), and this ADR log. Setup: `docs/AGENT_WORKFLOW.md`.
**Consequences:** All tools share one context; queries return focused subgraphs; lessons
persist across sessions. Independent of ADR-001 (that was a runtime data store).

## ADR-007 — AI is stubbed until Milestone 2
**Status:** Accepted
**Context:** M1's goal is foundation (auth, profiles, data) — explicitly no AI.
**Decision:** Assessment/scoring/recommendation endpoints exist from day one behind
`backend/app/ai/` interfaces returning deterministic, `hash(user_id)`-seeded placeholder
results. Real models land M2–M3 behind the same contracts, selected by config.
**Consequences:** Frontend and API contracts are stable from day one; swapping stubs for
models is an internal change. Contract changes after M1 require their own ADR.

## ADR-008 — "Frosted Lab Glass" design language (glassmorphism on navy/blue/teal)
**Status:** Accepted (product-owner direction, July 2026)
**Context:** The design system (`docs/DESIGN.md`) established a lab-grade minimalist
aesthetic (Deep Navy / Royal Blue / Teal, Sora / Inter / Geist). The product owner has
directed that glassmorphism become a core visual pillar; unconstrained glass harms
readability and rendering performance.
**Decision:** Glass is **level-4 elevation only**: app chrome (navbar, sidebar, header),
overlays (dialogs, sheets, command palette, sticky bars, toasts), and hero/score housings.
Dense data (tables, forms, charts, grids) stays on solid Diagnostic Module cards. One
shared recipe (blur 20px, saturate 160%, tokenized rgba backgrounds/borders), max two
stacked glass layers, a subtle body aurora to make blur legible, and mandatory
`@supports` + `prefers-reduced-transparency` fallbacks. Tokens and guardrails:
`docs/DESIGN.md` §3.
**Consequences:** DESIGN.md v2 and the Stitch prompt pack v2 are the source of truth;
components never define ad-hoc blur values; AA contrast is measured against glass
backdrops; glass misuse (under tables, >2 layers, animated blur) is a review blocker.

## ADR-009 — All backend routes versioned under `/api/v1` from day one
**Status:** Accepted
**Context:** Retrofitting API versioning after clients exist forces a breaking-change
scramble; the cost of versioning now is one path prefix.
**Decision:** Every FastAPI route mounts under `/api/v1`. Breaking contract changes go to
`/api/v2` side-by-side; additive changes stay in v1. The typed frontend client pins the
version.
**Consequences:** Stable contracts for the M1 stubs (ADR-007) and any external API
consumers; deprecations become schedulable instead of emergencies.

## ADR-010 — Derived stores sync via transactional outbox + background workers
**Status:** Accepted (worker live by M2; outbox rows written from M1)
**Context:** Elasticsearch and the vector DB are derived, never authored (ARCHITECTURE
§7). Ad-hoc dual writes drift under failure; slow work (embeddings, PDF/Excel rendering,
notification delivery, weather polling) doesn't belong in request handlers.
**Decision:** Writes to products/ingredients/articles/profiles append an outbox row in
the same Postgres transaction. An **arq** worker (on the existing Redis) consumes the
outbox and projects to ES + vector, and runs all slow jobs. Handlers stay fast; a rebuild
command can re-project everything from PG/Mongo.
**Consequences:** Derived stores are eventually consistent (seconds) and always
rebuildable; "single writer per fact" survives failures; one more process in
docker-compose (`worker`). M1 may run a trivial inline projector, but the outbox table
and job contracts exist from day one.

## ADR-011 — Google OAuth auto-links to an existing unverified email/password account
**Status:** Accepted (M1, revisit when email verification is built)
**Context:** Better Auth denies linking a new social account to an existing user by
default unless *either* the incoming provider is a configured `trustedProvider` with a
verified email, *or* the existing local account's own email is already verified
(`account.accountLinking.requireLocalEmailVerified`, default `true` —
`node_modules/better-auth/dist/oauth2/link-account.mjs`). This app has no
email-verification flow (`emailAndPassword` has no `requireEmailVerification`, no
`emailVerification.sendVerificationEmail` — no email-sending integration exists anywhere
in `docs/DATASETS_AND_APIS.md`'s external-services list either). That means
`user.emailVerified` is `false` for every email/password signup, permanently — so the
default config **permanently** blocks "Sign in with Google" for any user who signed up
with email/password first, for every such user, not just an edge case. Hit for real in
M1 testing (`account_not_linked` 500 on `/api/auth/callback/google`).
**Decision:** `web/lib/auth.ts` sets `account.accountLinking.trustedProviders: ["google"]`
and `requireLocalEmailVerified: false`. Google verifies the email on its side before
issuing an ID token, so a Google sign-in is accepted as sufficient proof of address
ownership — but this **does** open a real account-linking risk: someone who registers a
victim's email via email/password first (a password only the attacker knows, never
verified) automatically absorbs the victim's later "Sign in with Google" into that same
attacker-created account row. Accepted as a deliberate, scoped M1 tradeoff — no email
verification exists to close this gap properly yet, and the current user base is
pre-launch/local-dev.
**Consequences:** Building real email verification (`emailAndPassword.
requireEmailVerification` + an email-sending adapter, per `docs/DATASETS_AND_APIS.md`'s
adapter pattern) closes this gap correctly — flip `requireLocalEmailVerified` back to
`true` (or drop it, since `true` is the default) once that exists, rather than leaving
this permanently. Don't silently "fix" this by re-enabling
`requireLocalEmailVerified` without also shipping verification — that reintroduces the
"every OAuth-after-password user is permanently locked out" bug this ADR fixed.

## ADR-012 — Email verification: real send path, kept optional (not yet required)
**Status:** Accepted (Milestone 1 foundation expansion)
**Context:** `user.emailVerified` was permanently `false` for every email/password
account — no `sendVerificationEmail` callback existed at all (`web/lib/auth.ts`),
matching ADR-011's own observation about this gap. No email-sending provider is
chosen yet (`docs/DATASETS_AND_APIS.md`'s external-services list has none) — the same
real, external blocker class as the OpenWeather/Kaggle adapters, not a code gap to
invent around.
**Decision:** Add a genuine `emailVerification.sendVerificationEmail` callback using
the same dev-mode transport already shipped for password reset (log the link instead
of emailing it — contract-first, ADR-007's own "real logic, stubbed transport"
treatment). `sendOnSignUp: true` so every new signup actually gets a real, followable
verification link in dev/local. `emailAndPassword.requireEmailVerification` stays
`false` — flipping it on would (a) lock out every account created before this
shipped, with no way for them to have verified, and (b) reintroduce ADR-011's exact
"every OAuth-after-password user permanently blocked" failure, since Better Auth ANDs
`requireLocalEmailVerified` account-linking checks against this setting
independently.
**Consequences:** Verification is real and usable today, not required. Once a real
email provider is chosen and verification uptake can be measured, flipping
`requireEmailVerification: true` (and reconsidering `requireLocalEmailVerified`) is a
config change, not a rebuild — don't do it silently without checking both
consequences above still hold.

## ADR-013 — Sign-in lockout via Better Auth's own rate limiter, not a parallel system
**Status:** Accepted (Milestone 1 foundation expansion)
**Context:** No account-lockout protection existed on `/sign-in/email` — confirmed
live, 6+ rapid attempts (right or wrong password) all reached the handler
unthrottled. A hand-rolled lockout system (a `failed_attempts`/`locked_until` column
on `user`, checked in a custom pre-auth hook) would duplicate machinery Better Auth
already ships: a `rateLimit` system with per-path `customRules` and a pluggable
`secondaryStorage` backend.
**Decision:** Configure `rateLimit.customRules["/sign-in/email"]` to a much stricter
window (5 attempts / 15 minutes) than the rest of the API, backed by Redis via a new
`secondaryStorage` adapter (`web/lib/secondary-storage.ts`, using the same Redis
instance `backend/app/core/rate_limit.py` already uses — one Redis, not two).
`rateLimit.enabled: true` is set explicitly since Better Auth defaults this to
production-only, which would have made the control untestable in dev. This throttles
the *endpoint* (scoped by Better Auth's own default IP-based key), not literally "this
one account" — a real, live-verified brute-force lockout, just not a per-account
`locked_until` flag with an explicit admin-unlock action.
**Consequences:** Backed by shared, durable infra (Redis), not in-memory state that
resets on every dev-server restart or isn't shared across server instances in prod.
If a genuinely per-account (not per-IP) lockout with an explicit unlock workflow
becomes a real requirement later, it layers on top of this rather than replacing it —
this ADR doesn't preclude that, it just didn't build it speculatively now.

## ADR-014 — Professional verification gating + a single writer for `audit_logs`
**Status:** Accepted (Milestone 1 foundation expansion)
**Context:** Consultant/Dermatologist need an onboarding → pending → admin-approved/
rejected lifecycle (`consultant_profiles`/`dermatologist_profiles`.`verification_status`,
Branch 1). Two design questions this raises: (1) where does the "is this professional
actually allowed to do the operational thing" check live, and (2) who is allowed to
write `audit_logs`, given both FastAPI (Python) and Better Auth's admin-plugin actions
(TypeScript, e.g. `set-role`) can each independently change state that should be
logged.
**Decision:** `require_verified_professional(*roles)` lives in `backend/app/core/
security.py` next to `require_role` (docs/CONVENTIONS.md already centralizes auth/
ownership dependencies there) — it wraps `require_role` and then checks the matching
profile table's `verification_status == "approved"`, failing closed (wrong role, no
profile row yet, or any non-approved status all 403 identically). It gates *future*
M2+ operational endpoints only — never the profile's own management endpoints (view/
edit/upload-documents), which must stay reachable in every status so a pending/
rejected professional can still act on their own verification.
`audit_logs` gets exactly one write path: `backend/app/services/admin/service.py`'s
`write_audit_log`, reached either directly (the five verification actions — approve/
reject/request-info/suspend/deactivate, each `require_role("admin")`) or via the new
`POST /api/v1/admin/audit-logs` endpoint. The latter exists because Better Auth's
`set-role` admin action has no audit trail of its own and runs entirely in the
Next.js/Better Auth process, not FastAPI — `web/app/api/admin/set-role/route.ts` is a
thin wrapper that calls `auth.api.setRole` then POSTs to that endpoint with its own
freshly-minted JWT, so a role change is never silent. No future code should insert
into `audit_logs` any other way.
**Consequences:** Reject/request-info/suspend require a non-empty `reason` at the
schema level (`VerificationActionWithReasonRequest`, min_length=1) — approve/
deactivate don't, matching the plan's explicit scope rather than requiring one
everywhere by default. `require_verified_professional` has no consumer yet (M2+
operational endpoints don't exist), so its 200/allow path is covered by direct
dependency-level tests (`tests/test_rbac.py`), not a live route — the same discipline
`require_role`'s own tests already used before any real `user`-role routes existed.

## ADR-015 — Self-service role flip via `auth.$context.internalAdapter`, not a raw SQL UPDATE
**Status:** Accepted (Milestone 1 foundation expansion)
**Context:** A "user" account applying to become a Consultant needs its Better Auth
`role` flipped to `consultant` the moment it first submits onboarding (Branch 3's
`require_verified_professional` and the profile's own management endpoints both
assume role is already `consultant` throughout the whole pending/rejected/approved
lifecycle, never still `user`). Better Auth's admin-plugin `set-role` action can't do
this — it's gated on an *admin* session (`adminMiddleware`/`hasPermission`), and this
is a self-service transition on the caller's own account, not an admin one. A raw
`UPDATE "user" SET role = ...` bypasses that gate, but empirically leaves an
already-signed-in session showing the stale role: Branch 2's `secondaryStorage`
(Redis) caches the full session+user object per token
(`node_modules/better-auth/dist/db/internal-adapter.mjs`), refreshed only when
Better Auth's own `updateUser` internal-adapter function runs (it calls
`refreshUserSessions` after writing) — confirmed live, twice, that a raw SQL UPDATE
does not trigger this and the JWT keeps minting the old role until sign-out/sign-in.
**Decision:** `web/app/api/consultant-onboarding/submit/route.ts` calls `(await
auth.$context).internalAdapter.updateUser(userId, { role: "consultant" })` —
`$context` is a documented, typed public property of the Better Auth server instance
(`node_modules/better-auth/dist/types/auth.d.mts`), and `internalAdapter.updateUser`
is the exact function Better Auth's own `/update-user` and `/admin/set-role` routes
call internally. Using it directly gets the session-cache refresh for free, so the
role change is visible on the very next request — no forced re-login. Only fires on
a first-ever submission (`session.user.role === "user"`); a resubmission after
rejection/more-info-requested is already `consultant` and skips it.
**Consequences:** This is the second, narrower exception to "only Better Auth writes
`user.role`" (ADR-014's admin `set-role` wrapper is the first) — both go through a
real Better Auth code path, never a raw UPDATE, so the session-cache-refresh behavior
stays correct everywhere a role can change. Branch 5's dermatologist onboarding reuses
this exact pattern rather than inventing a second one.

## ADR-016 — Admin panel: identity reads via Better Auth, domain reads via FastAPI
**Status:** Accepted (Milestone 1 foundation expansion)
**Context:** The admin platform (Users, Verification queue, Monitoring, Content &
Data) needs data from two different owners: Better Auth owns identity (`user` role/
ban state), FastAPI owns domain data (verification profiles, `audit_logs`,
`ingredients`, `products`). Mixing them behind one ad-hoc surface risks either
FastAPI reaching into identity tables it doesn't own, or the frontend re-implementing
Better Auth's own listUsers/ban/unban logic.
**Decision:** Every admin mutation on a `user` row goes through a thin, audit-logged
Next.js wrapper — `set-role` (ADR-014), and now `ban-user`/`unban-user`, added this
branch, sharing one helper (`web/lib/admin-audit-log.ts`) instead of three copies of
the same fetch-and-log code. `GET /api/admin/users` is the read-only equivalent
(no audit needed for a read), a passthrough to Better Auth's own `listUsers`. Every
other admin screen reads through new FastAPI endpoints instead: `GET /admin/audit-
logs` (paginated, filterable — the write side already existed from ADR-014),
`GET /admin/dashboard-stats` (pending-verification counts + recent activity — real
counts only, no invented KPIs), and `GET /admin/ingredients`/`GET /admin/products`
(read-only views over already-seeded data, backed by new interface functions —
`ingredients/service.py` didn't exist before this branch; `recommendations/
service.py` gained `list_all_products` — full CRUD on either stays M3 scope,
docs/SUGGESTIONS.md). `GET /api/admin/dashboard-stats` (Next.js) merges Better
Auth's per-role user counts with FastAPI's dashboard-stats response into one call the
dashboard page makes, rather than the page juggling two data sources itself.
Document review needed a new `GET /admin/verification-queue/{role}/{user_id}/
documents/{document_id}/url` endpoint — verification documents are private objects
(ADR from Branch 1's storage adapter), so the admin review UI needs a presigned URL
to actually display one, not just its metadata.
**Consequences:** Two DB reads for one page-load isn't unusual here (dashboard stats,
audit-log-list route) — accepted as the cost of respecting the actual data-ownership
boundary rather than duplicating one side's data into the other's store. Any future
admin surface reading `user` rows should extend `/api/admin/*`, never call FastAPI
for identity data or Better Auth's client SDK for domain data.

## ADR-017 — Light-theme color rebalance: zinc neutrals, one-notch-down saturation
**Status:** Accepted (Milestone 1 foundation expansion, Branch 7)
**Context:** Direct product-owner feedback: "colors feel slightly off," explicitly
*not* asking for a high-contrast redesign — "create a balanced professional
healthcare SaaS design." The light theme's neutrals (`surface`/`on-surface`/
`outline*`) were Tailwind's "slate" scale verbatim — a blue-tinted cool gray — and
`on-surface` was literally the same hex as `primary` (`#0F172A`, Deep Navy), so body
text carried the same visual weight as brand emphasis. Secondary/success/warning/
error were each Tailwind's vibrant "600" shade, more "alert siren" than "calm
confirmation."
**Decision:** Two changes, both scoped to **light theme only** (dark mode's neutrals
are already a true near-black ramp per ADR/v3, and its secondary/semantic tones are
already soft pastels against near-black — neither exhibited the complaint):
1. Neutrals move from Tailwind "slate" to "zinc" (same lightness tiers, blue cast
   removed) and `on-surface` splits from `primary` (`#1F1F22`, not `#0F172A`) so body
   text and brand-navy buttons are no longer the identical tone.
2. `secondary` (Royal Blue), `success`, `warning`, `error` each step down one notch
   of saturation from their original Tailwind "600" shade — same hue, same brand
   architecture, just calmer. Score bands, tertiary (Teal), and dark mode are
   untouched — they're diagnostic/data-visualization colors, not ambient chrome, and
   weren't part of the complaint.
Exact hex values were tuned with live Playwright screenshots (light theme, public
pages, an authenticated dashboard) rather than picked from color theory alone —
`docs/DESIGN.md` §1/§2 and its frontmatter `colors:` block carry the final values;
`web/app/globals.css` mirrors them exactly (CONVENTIONS.md golden rule 7). No
component was touched — every color lives behind a CSS variable already.
**Consequences:** `on-surface` and `primary` diverging is a deliberate, permanent
split — a future change to either must consider both independently now, they're no
longer guaranteed to match. AGENTS.md §3's inlined hex list was also stale (its dark
values didn't even match `docs/DESIGN.md`'s real v3 palette) — corrected here to
point at `docs/DESIGN.md` as the source of truth instead of repeating numbers that
will drift again otherwise.

## ADR-018 — e2e suite runs `workers: 1`; one shared account/rate-limit helper module
**Status:** Accepted (Milestone 1 foundation expansion, Branch 8)
**Context:** This suite deliberately hits a real, shared backend (Postgres, Redis,
MinIO) rather than mocks — the project's established testing philosophy throughout
this session. By Branch 8 there are 7 spec files that each sign real accounts up/in,
and Better Auth's rate limiter keys are IP-scoped (`{ip}|{path}`,
`createRateLimitKey`) — shared across every file, not just within one. Running the
full suite with Playwright's default `fullyParallel`/multi-worker scheduling caused
real, reproducible failures: different files' real signups landing in the same
window tripped either the general default rate-limit ceiling or each other's
lockout-clearing, independent of any single file's own internal
`test.describe.configure({ mode: "serial" })`. It wasn't just a parallelism problem
either — several files (`auth-hardening.spec.ts`, most notably) never cleared the
*general* ceiling at all (only the `/sign-in/email`-specific one from ADR-013),
which could still fail even running fully sequential.
**Decision:** `playwright.config.ts` sets `workers: 1` — the whole suite runs
sequentially, trading speed for determinism against a suite that intentionally
exercises the real stack. Every file's previously-duplicated `pool()`/
`deleteTestUser()`/`promoteRole()`/rate-limit-clearing helpers are consolidated into
`tests/e2e/helpers.ts`; `clearRateLimits()` (broadened to clear every `*|*` key, not
just one path) is now called before every real signup/sign-in in every file, not
just the two that happened to need it originally. Also fixed in the same pass:
`auth-hardening.spec.ts`'s two tests silently leaked their own test accounts on
every run (no `deleteTestUser` call ever existed for either) — a real, pre-existing
gap found while investigating the rate-limit failures, not a hypothetical.
**Consequences:** The full e2e suite is slower (sequential) but now deterministic —
confirmed by running it repeatedly, both themes, zero flakes and zero leaked test
data. Any new e2e file that signs a real account up or in should import from
`helpers.ts` and call `clearRateLimits()` first, rather than reinventing a ninth
version of the same three functions.

## ADR-019 — Theme system: palettes are color-token swaps, not alternate design systems
**Status:** Accepted (Phase 3)
**Context:** The brief asked for a full SaaS-grade theme system — multiple named
palettes (Emerald, Ocean, Lavender, Sunset, Slate, Rose, Forest, alongside the
existing Default), each with light+dark, switchable from Settings → Appearance,
persisted server-side. This is in real tension with AGENTS.md §3's "Design system is
locked, not proposed" — Frosted Lab Glass's glass recipe, spacing, radius, tri-font,
and the Skin Score Ring's own gradient logic are a deliberate, singular identity, not
something 8 palettes should each reinterpret independently.
**Decision:** A palette varies **only** `primary`/`secondary`/`tertiary` and their
`on-*`/`*-container` pairs (`app/globals.css`'s `[data-palette="…"]` blocks, docs/
DESIGN.md §2a has the full table) — every other token (neutral surface/on-surface/
outline ramp, glass, radius, typography) stays exactly as §2/§3/§4/§7 already specify,
regardless of which palette is active. `success`/`warning`/`error` and the Skin
Health Score bands are also deliberately constant across every palette — status
color and diagnostic bands should mean the same thing no matter which palette a user
picked; theming "danger" away from red would hurt usability, not polish it. Every
component already themes via these token *names* (`--color-primary` etc.), so
switching palettes needed zero component-level changes — confirmed live, the exact
same sidebar/topbar/chart/dialog markup re-colors automatically.
Two independent axes, combined orthogonally: **palette** (a new `data-palette`
attribute PaletteProvider manages, `components/providers/palette-provider.tsx`, hand-
rolled with the same blocking-inline-script anti-flash technique next-themes uses
internally) and **mode** (`next-themes`' own existing `light`/`dark`/`system`,
completely unchanged — no reason to reinvent a solved problem for the one dimension
it already owns).
Storage: a new `user_appearance_preferences` table (one row per user, any role — a
Consultant/Dermatologist/Admin account needs a theme as much as a User does, so it
references `"user"` directly rather than through the User-role-only `user_profiles`).
Postgres is the source of truth; `localStorage` is a same-device instant-paint cache
only (mirroring `next-themes`' own no-flash approach for the one extra attribute it
doesn't manage) — `components/app-shell/appearance-sync.tsx` reconciles server state
into local state once per authenticated mount, so a new device/browser picks up the
saved preference rather than silently defaulting.
**Consequences:** Adding a 9th palette later is a CSS-only change (one more
`[data-palette="…"]` block + a `PALETTES`/`PALETTE_META` entry, frontend; one more
CHECK-constraint value, backend) — no component touches a hard-coded color, so
nothing else needs updating. `accent_color`/`font_size`/`density`/
`motion_preference` columns exist now (nullable, unused by the v1 UI) specifically so
those future settings don't need a second migration. Org/white-label branding
(mentioned as a future direction) would extend this same pattern — a palette scoped
to an organization instead of a user — not replace it.

## ADR-020 — Milestone 2 UI-fidelity pack: operating contract + scope, resolved against PROGRESS.md's "already delivered" state
**Status:** Accepted (M2-P0)
**Context:** A second M2 planning pack landed in `docs/milestones/milestone_2/`
alongside the original one, under different literal filenames: `MILESTONE_2_MASTER_PROMPT.md`
(1398 lines, 15 phases P0–P14, full UI+backend rebuild) and `MILESTONE_2_UI_SPEC.md`,
next to the original `MASTER_PROMPT.md` (307 lines, gitignored via `.gitignore:92`,
6 phases, the already-executed `skin_scores→skin_assessments` literal rename) and
`mile_2.docx`. A second docx (`MILESTONE 2.docx`, untracked, Jul 23) also sits next
to the original `mile_2.docx` (tracked, Jul 21). This is exactly the ambiguity
AGENTS.md §0 says to stop and ask about rather than silently guess.
Compounding it: `MILESTONE_2_MASTER_PROMPT.md`'s own P0 contract-freeze section names
`POST /api/v1/assessment/submit` and `GET /api/v1/assessment/score/{id}` as canonical —
but `PROGRESS.md` (canonical, tracked, audited 2026-07-22) already declared M2 fully
delivered under different endpoint names (`/api/v1/assessment/evaluate`,
`/api/v1/assessment/score`, both already docx-aliased per the original
`MASTER_PROMPT.md` Phase 1, see `backend/app/services/scores/router.py`'s own
inline comment). `MILESTONE_2_UI_SPEC.md §7` (the doc's own contradiction-resolution
list) does not cover this gap — it only resolves UI-content questions, not
"does the backend already exist." This is the plan's own stated STOP condition
("two source-of-truth documents conflict... and the conflict is not already
answered in UI_SPEC.md §7") — surfaced to the user rather than silently resolved
in a branch.
**Decision (user-confirmed, 2026-07-24):**
1. `MILESTONE_2_MASTER_PROMPT.md` + `MILESTONE_2_UI_SPEC.md` are the operating
   contract for this run — not the old `MASTER_PROMPT.md` (that plan's rename work
   is done and stays done; nothing in it is reopened).
2. The assessment endpoint contract is renamed to the new pack's literal names
   (`POST /api/v1/assessment/submit`, `GET /api/v1/assessment/score/{id}`) rather
   than treating P6–P12 as "verify existing service only" — a real, deliberate
   second rename layered on top of the 2026-07-15 one, executed the same way (new
   canonical routes, old paths kept as deprecated aliases until `web/` consumers are
   swept, then removed). `PROGRESS.md`'s "M2 delivered, nothing pending" framing is
   superseded for this one surface by this decision; every other M2 claim in
   `PROGRESS.md` (scoring formula, routine generation, rename migration) still
   stands and is not being rebuilt from scratch.
3. **Diffed in full (P0, this branch) — they are two different documents, not two
   copies of one.** `mile_2.docx` (tracked, Jul 21) is the step-by-step build tutorial
   the *original* rename work was executed against — it's what every existing
   router/schema comment cites, and it never states a literal hydration number
   ("compare... against standard recommendations"). `MILESTONE 2.docx` (untracked,
   Jul 23) is a materially different, later requirements pass — it's where
   `skin_types.json`/`skin_concerns.json`'s literal content, the wizard's worked
   payload example, the `/assessment/submit` + `/assessment/score/{id}` endpoint
   table (confirmed in its embedded `image1.png`, extracted this branch — Method/
   Endpoint/Description table verbatim), and the literal **"3.0L daily fluid
   benchmark"** all come from. `MILESTONE_2_MASTER_PROMPT.md` and
   `MILESTONE_2_UI_SPEC.md` were written against `MILESTONE 2.docx`, not
   `mile_2.docx` — confirmed by direct text match (its P8 worked example, its P10
   formula text, and its Appendix A endpoint table are verbatim quotes from
   `MILESTONE 2.docx`, not `mile_2.docx`). **`MILESTONE 2.docx` is therefore the
   canonical spec for every task this pack drives**; `mile_2.docx` remains the
   accurate record of what the *original*, already-merged M2 rename work (old
   `MASTER_PROMPT.md`) was built against and stays correct for that slice.
**Consequences:** `docs/milestones/milestone_2/M2_GAP_ANALYSIS.md`,
`M2_API_CONTRACT.md`, and `M2_TASK_LEDGER.md` (this same P0 branch) are written
against this resolution — they describe a UI-fidelity + endpoint-rename pass on top
of a largely-complete backend, not a from-scratch build, despite P6–P12's phase
prompts reading as if nothing exists yet. A later session must not reopen point 1
or 2 without a new user conversation; a stale `PROGRESS.md` claim that this decision
touches should be corrected in place, not read as still authoritative.

## ADR-021 — UI_SPEC.md §7 (C1–C7) resolutions — two corrected against actual code, not rubber-stamped
**Status:** Accepted (M2-P0)
**Context:** `MILESTONE_2_UI_SPEC.md §7` lists seven contradictions (C1–C7) between
`mile_2.docx`, the four dashboard screenshots, and the existing schema, each with a
"recommended resolution." Per this pack's own contract-freeze instruction, these
needed checking against the live code, not adopted on the spec's say-so — two of the
seven turned out to be wrong about current code and are corrected here rather than
copied forward.
**Decision, per item:**
- **C1 (5th skin type "Normal"):** Adopt as recommended. `skin_types` is a plain
  lookup table (`database_schemas/skinlytics_postgresql_schema_v3.sql:113`,
  `skin_type_id SERIAL PRIMARY KEY, skin_type_name VARCHAR(50) UNIQUE`), not a CHECK-
  constrained enum — adding Normal is a seed-data INSERT, not a migration. Simpler
  than the spec assumed; no schema change needed.
- **C2 (10 concerns, not 4):** Adopt as recommended. `skin_types.json` /
  `skin_concerns.json` don't exist anywhere in the repo yet (confirmed, P6 is a real
  gap) — build both files with all 10 from a clean slate, docx's 4 verbatim + 6 more
  in the same shape.
- **C3 (hydration benchmark 3.0 L vs 2.5 L goal) — RE-VERIFIED against the actual
  governing docx, reversing this ADR's own first-pass correction below:** an
  earlier draft of this entry called the spec's "3.0 L" premise wrong, reasoning
  from the live code (`scoring_engine.py:113`'s `/2.0`) and the *original*
  `mile_2.docx` (which only says "compare against standard recommendations," no
  literal number). That comparison used the wrong docx. Per point 3 above,
  `MILESTONE 2.docx` — the actual document this pack is built from — states
  explicitly and twice ("Evaluated against a 3.0L daily fluid benchmark") that 3.0 L
  is the real, current, literal benchmark. **Adopt as recommended, reversed:** the
  scoring benchmark changes from 2.0 L to **3.0 L** (P10 task, a real code change
  with a real docx citation, not a documentation-only fix); the dashboard ring's
  2.5 L is a separate, correctly-distinct per-user display goal (both numbers, both
  now correctly sourced). The lesson, not just the fix: this is exactly why P0 exists
  — an unverified paraphrase (this ADR's own first draft, `UI_SPEC.md §7`, and the
  old `MASTER_PROMPT.md` Phase 2 all independently got this wrong by not checking
  the actual current docx) would have shipped a wrong number with high confidence.
- **C4 (flat payload fields vs. list-of-concerns) — CORRECTED, not adopted as
  written:** the spec's premise is wrong. The live payload
  (`backend/app/services/skin_profile/schemas.py:24,41`) is already
  `concerns: list[SkinProfileConcernInput]` with `severity_rating: int` per concern
  — the exact shape C4 recommends, already built, already superior to the docx's
  flat-field illustration. No adapter, no deprecation shim, no code change needed
  here; this item is already resolved and closes as a documentation correction only.
- **C5 (asset paths under `web/public/assets/...`):** Adopt as recommended.
  Directories don't exist yet (confirmed) — create them in P6 so the docx's literal
  `image_url` values resolve unchanged.
- **C6 (Skin Age formula):** Adopt as recommended. Confirmed genuinely absent from
  the codebase (`grep` for `skin_age`/`skinAge` returns nothing) — a real gap, not a
  hardcoded screenshot number. Formula (derived from the skin-condition sub-score
  and actual age) is designed and unit-tested in the phase that builds it (P4/P10),
  not invented here.
- **C7 (screenshot numbers are fixture data):** Adopt as recommended. `web/lib/
  fixtures/` doesn't exist yet (confirmed) — built in P4/P5 as typed, contract-shaped
  mocks matching the schemas this ADR and `M2_API_CONTRACT.md` freeze.
**Consequences:** `MILESTONE_2_UI_SPEC.md §1`'s C3 line and §7's C4 row are stale
against this ADR — a later editing pass should update the spec file itself to match,
but the spec is normative for structure/copy only (per its own header), not for
backend numbers, so this ADR — not the spec text — governs the hydration benchmark
and the payload shape going forward.

## ADR-022 — Role sidebar: two real features kept beyond MILESTONE_2_UI_SPEC.md §3's literal trees
**Status:** Accepted (M2-P2)
**Context:** `MILESTONE_2_MASTER_PROMPT.md` P2 says to transcribe the four nav trees
from `UI_SPEC.md §3` exactly — labels, subtitles, order, grouping. Two items already
live in this app aren't in those screenshot-derived trees at all: User's `/insights`
(M3-F, real correlation analytics over logged history) and Admin's `/monitoring`
(real system-health screen). Both are real, already-shipped, already-tested
features — a literal transcription would silently remove them from the nav
entirely, which is a regression dressed up as fidelity, not fidelity itself.
**Decision:** Keep both, placed sensibly rather than dropped: User's Insights sits
in MAIN MENU alongside the docx's own (separate, still-unbuilt) "Reports" item —
different PDF modules, Module 8 (Progress Tracking & Analytics) vs Module 11
(Reports & Export). Admin's Monitoring sits in the new SYSTEM & SECURITY section
alongside the three new stub items, since system health is already that section's
theme. Every other item in both roles' trees is the literal UI_SPEC transcription,
unchanged.
**Consequences:** The User and Admin nav trees each carry one more real item than
`UI_SPEC.md §3` literally lists (11+1 and 11+1 respectively, footnoted in
`lib/nav-config.ts`'s own comments). A future session diffing nav-config.ts against
the spec should read this as documented, deliberate scope, not drift to silently
"fix." If either underlying feature is ever deprecated for real, remove the nav
item in the same change — this ADR licenses keeping working features, not carrying
dead ones forever.

## ADR-023 — P4 dashboards: real data wherever it exists, fixtures only for genuinely unbuilt concepts
**Status:** Accepted (M2-P4)
**Context:** `MILESTONE_2_MASTER_PROMPT.md` §12's sequencing rule says P1–P5 build
against typed fixtures, with P14 swapping to live calls later. That rule assumes a
UI built from zero — but `app/(user)/dashboard/page.tsx` and
`app/admin/dashboard/page.tsx` already exist as real, tested, live-data-driven
pages (5+ real TanStack Query hooks on User's side; a real BFF route on Admin's).
Rebuilding them against fixtures and waiting for P14 to "swap back" to the data
they already have would be a real regression for two weeks of milestone work, not
fidelity — the same category of mistake ADR-022 already named for the sidebar.
**Decision:** P4 rewrites both pages' *layout* to match `UI_SPEC.md §4.1`/`§4.4`'s
row structure using the P3 widget kit, keeping every existing real data source
wired in (scores, routines, recommendations, progress, lifestyle logs, analytics/
insights on User; role counts, pending verification, audit log on Admin) rather
than replacing them with static numbers. Two small backend additions
(`PlatformCounts`, `TopConcernStat` — `backend/app/services/admin/{schemas,
service,router}.py`, both real `COUNT`/`GROUP BY` queries, tested) extend Admin's
real KPI surface to cover 4 of the screenshot's 6 top-row cards and the "Top Skin
Concerns" bars, rather than fixturing numbers a cheap real query already answers.
Fixtures are used **only** where the screenshot names a concept this app
genuinely has no backing for yet — logged per item, not silently:
- **User: Skin Age.** Confirmed absent from the codebase (ADR-021 C6) — a fixture
  placeholder until P10 builds the real derivation, at which point P14 wires it.
- **Admin: Platform Revenue, System Uptime.** No billing/payments processing and
  no uptime-monitoring service exist in this app at all — not a missing query,
  a missing *system*. Fixture, revisit if/when M3/M4 actually builds either.
- **Admin: Assessments Overview (Completed/In Progress/Pending) donut.** The
  screenshot's 3-state workflow doesn't correspond to anything in the schema —
  `skin_assessments` rows are synchronous compute-and-store, never "pending" or
  "in progress." Fixture; do not invent a status column to make this real.
- **Admin: User Growth trend chart.** Would require day-bucketed historical counts
  from Better Auth's identity tables; `listUsers` has no such endpoint, and
  querying the underlying table directly from FastAPI would violate ADR-016
  ("identity reads via Better Auth, domain reads via FastAPI"). Fixture; a real
  version needs either a Better Auth admin API addition or a scheduled snapshot
  table — out of scope for a UI phase.
- **Admin: Platform Analytics (Page Views/Active Sessions/Bounce Rate/Avg
  Session).** Web-analytics metrics this app has no instrumentation for at all
  (not a domain concept the backend owns). Fixture.
- **Admin: System Health tiles.** Display-only status tiles with no live
  healthcheck endpoint wired to the frontend yet. Fixture; a real version would
  ping `/health`/`/health/ready` (already existing infra probes, `AGENTS.md` §2
  rule 2) from the frontend, deferred as a small, separable follow-up.
**Consequences:** `web/lib/fixtures/` holds only the six items above, typed to the
P0-frozen contract shapes exactly (so a later real implementation is a fetch swap,
matching P14's intent) — not a wholesale fixture layer for content this app
already computes for real. Both dashboard pages stay functionally live for every
returning user during this milestone; nothing regresses to a static number a real
user would previously have seen computed from their own data.

## ADR-024 — P5 clinical dashboards: fixtures-first, reversing ADR-023's default
**Status:** Accepted (M2-P5)
**Context:** ADR-023 established "real data wherever it exists" for P4 because
`app/(user)/dashboard/page.tsx` and `app/admin/dashboard/page.tsx` already existed
as real, live-data pages before this UI pack — rebuilding them against fixtures
would have regressed working functionality. Consultant and Dermatologist
dashboards are a materially different starting point: today, both pages are
**entirely** the professional verification-status gate (pending/approved/
rejected review copy, document upload) — real and staying untouched — with the
approved-state body being three literal "Coming soon, later milestone" cards.
There is no existing real clinical dashboard content to preserve here; ADR-023's
regression concern doesn't apply.
Checked what a real backend response could actually provide
(`ClientSummaryRead`/`ClientListPage`, `backend/app/services/clinical_review/`):
`user_id, name, email, skin_type_name, primary_concern_name, overall_score,
routine_adherence_score, score_trend, last_sync` — no age, gender, status pill, or
next-follow-up date at all, materially narrower than `UI_SPEC.md §4.2`/`§4.3`'s
roster columns. And a real professional account in this environment has zero
assigned clients/patients by default (assignment is a real, deliberate action, not
automatic) — even wiring the real endpoint would show an honest empty state, not
the screenshot's "128 clients" scale. Producing that scale of realistic
demonstration data (128+ assigned clients/patients with plausible names, ages,
follow-up schedules) is explicitly `MILESTONE_2_MASTER_PROMPT.md` P14's seed-data
job ("Seed data ... produces a database that renders all four dashboards with
plausible values ... enough users, assessments, routines"), not a UI phase's.
**Decision:** Build one shared `ClinicalDashboard` component
(`web/components/clinical-review/clinical-dashboard.tsx`), role-configured
(consultant vs dermatologist vocabulary, footer cell count, banner copy, guide
label), consuming **typed, contract-shaped fixtures**
(`web/lib/fixtures/clinical-dashboard-fixtures.ts`) matching the master prompt's
own explicit P5 instruction ("Fixtures use the exact screenshot values ... 128
clients / 156 patients ... the follow-up dates and days-left pills") — the
opposite of P4's default, for the reasons above, not an inconsistency. The
existing verification-status gate is untouched; the fixture-driven dashboard
replaces only the three "Coming soon" placeholder cards, for approved
professionals only.
**Consequences:** P14 ("Live integration") is where this pair's fixtures get
swapped for the real `clients`/`patients` endpoints once real assignment/seed
data exists to back them meaningfully — tracked as a real, not-yet-closed item,
same as User/Admin's own fixture-only cells from ADR-023. A future session
should not read the presence of fixtures here as an oversight; it's the
documented, deliberate choice for this specific pair, made for the opposite
reason ADR-023's "real wherever possible" default was chosen for User/Admin.

## ADR-025 — P6 visual datasets: the 10th concern is "Sensitive Skin", not "Post Acne Marks"; no migration needed
**Status:** Accepted (M2-P6)
**Context:** `MILESTONE_2_MASTER_PROMPT.md` P6's own phase text says to extend
`skin_concerns.json` to 10 by adding "Dark Spots, Dry Skin, Oily Skin, Fine Lines,
Uneven Skin Tone, and Post Acne Marks." Re-read `MILESTONE 2.docx` directly (not
the master prompt's paraphrase, per this project's own standing discipline —
`docs/DECISIONS.md` ADR-021's C3 correction was exactly this same mistake made
once already) before writing the JSON: the docx's literal "Common Skin Concerns"
list (paragraph 21-31) is **Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily
Skin, Sensitive Skin, Wrinkles, Fine Lines, Redness, Uneven Skin Tone** — ten
items, and the tenth is "Sensitive Skin," not "Post Acne Marks." "Post Acne Marks"
never appears in this list at all; it's a phrase from the *dashboard screenshots'*
"Top Concerns" display text ("Acne & Post Acne Marks"), a different document
context the master prompt's own author appears to have conflated with this list
when paraphrasing it.
Independent confirmation, found while checking whether a migration was needed:
`backend/app/migrations/versions/a9c3d2f81b47_seed_reference_data.py` (already
merged, 2026-07-14, unrelated to this UI pack) seeds Postgres `skin_types` with
exactly `Normal, Dry, Oily, Combination, Sensitive` and `skin_concerns` with
exactly `Acne, Hyperpigmentation, Dark Spots, Dry Skin, Oily Skin, Sensitive Skin,
Wrinkles, Fine Lines, Redness, Uneven Skin Tone` — the *exact* 5 types and 10
concerns this ADR and ADR-021 (C1/C2) call for, "Sensitive Skin" included, "Post
Acne Marks" absent. Two independent sources (the docx's own literal text, and a
production migration written before this UI pack existed) agree; only the master
prompt's own paraphrase disagrees.
**Decision:** `skin_concerns.json`'s 10th entry is `CONCERN_SENSITIVE_SKIN`
("Sensitivity"), not a "Post Acne Marks" entry. No Alembic migration is written
this phase — the reference data the JSON's `backend_enum`/`backend_field` values
map onto already exists, seeded by `a9c3d2f81b47`. The schema-validation test
(`backend/tests/test_visual_datasets.py`) queries the live `skin_types`/
`skin_concerns` tables directly to confirm every JSON entry resolves to a real
row, rather than asserting against a hardcoded expected list that could itself
drift from the database.
**Consequences:** If a future session's paraphrase of this milestone (a summary,
a different agent's re-reading) says "Post Acne Marks" is one of the ten
concerns, that paraphrase is wrong — this ADR and the two sources above are what
to trust instead.

## ADR-026 — Structured allergy list: additive junction table, not a column replacement
**Status:** Accepted (M2-P7)
**Context:** `MILESTONE_2_MASTER_PROMPT.md` P7's own guardrail: "the allergy list
is stored as structured ingredient ids, not free text" — needed so P12's allergy
detection can match a user's allergies against real ingredient rows directly.
`skin_profiles.allergies` is a plain `TEXT` column (confirmed: `database_schemas/
skinlytics_postgresql_schema_v3.sql:124`, matched exactly by the live model) — the
frontend already treats it as a tag list in the UI (`skin-profile-form.tsx`'s
`splitTags`/comma-join), but persists it as one joined free-text string, which
`ingredient_id`-based matching can't parse reliably (typos, synonyms, INCI vs.
marketing names).
**Decision:** Add `skin_profile_allergies (skin_profile_id, ingredient_id)`, the
same junction-table shape `skin_profile_concerns` already uses, with a real
`UNIQUE (skin_profile_id, ingredient_id)` constraint (concerns' own schema
deliberately has none, per its comment, but a duplicate allergy entry has no
legitimate case). `skin_profiles.allergies` (TEXT) is **not** dropped or
repurposed — it stays as an unrelated, still-nullable free-text fallback for
whatever a structured ingredient id can't capture, per this repo's standing
non-destructive-migration discipline. `SkinProfileCreate`/`SkinProfileRead` gain
`allergy_ingredient_ids: list[int]` / `allergy_ingredients: list[AllergyIngredientRead]`
as additive fields; the existing `allergies: str | None` field is unchanged in
shape, so no existing consumer breaks.
The frontend's allergy input becomes a real ingredient search (existing
`GET /api/v1/ingredients?q=...`, already supports a query param — no new backend
search endpoint needed) instead of a free-typed tag, so what a user picks is
always a real `ingredient_id` from day one, not a string this ADR's whole point
was to stop relying on.
**Consequences:** P12's ingredient-allergy matching reads
`skin_profile_allergies` directly — a real join, not a text-parsing heuristic.
A future session should not "clean up" the now-secondary `allergies` TEXT column
without checking whether real free-text notes have accumulated there first.

## ADR-027 — P9 builds a real payload-accepting POST /assessment/submit, superseding ADR-020 point 2's "rename only" plan
**Status:** Accepted (M2-P9)
**Context:** `M2_GAP_ANALYSIS.md` (written at P0, before P8 executed) concluded the
three FastAPI endpoints needed only a rename — `POST /api/v1/assessment/evaluate`
→ `POST /api/v1/assessment/submit`, same handler, still "recompute the score for
the current user's already-saved profile," no request body. That was correct
*at the time*: nothing yet depended on the endpoint accepting the P0-frozen
payload shape. P8 changed that — by explicit product-owner decision (AskUserQuestion,
that session), the assessment wizard now builds `buildAssessmentSubmitPayload`'s
exact contract shape (flat `{concern}_severity` fields alongside the canonical
`concerns[]` array, plus a `lifestyle` sub-object) and submits it against a fixture,
specifically so a later phase could wire it to a real endpoint accepting that shape.
A bare rename with no body would leave that payload with nowhere real to go.
**Decision:** P9 builds the real thing the master prompt's own P9 phase text
describes, superseding ADR-020 point 2 on this one item: a new
`backend/app/services/assessment/` module (`schemas.py`/`service.py`/`router.py`/
`models.py`) with `POST /api/v1/assessment/submit` accepting the full frozen
payload, hard-validating `skin_type` and every `concerns[].id` against the real
`skin_types`/`skin_concerns` lookup tables (service-layer, not a hardcoded Pydantic
enum — both are lookup tables, not true enums), and the flat severity fields via
Pydantic `Field(ge=0, le=10, deprecated=True)` (automatic 422s for out-of-range
values, no service code needed). On success it: syncs a new versioned
`skin_profiles` row and today's `lifestyle_logs` document (through the Skin
Profile service's existing interface functions, single-writer rule, AGENTS.md §2
rule 4 — this module never touches those tables directly), computes a real score
via the existing `scores_service.compute_and_store_score` (P10 improves that
engine's own math in place; P9 only calls it), and persists an immutable
`assessment_submissions` row (new table, `raw_payload` JSONB, append-only — a
re-assessment always inserts, never updates). Returns `assessment_id` = the
computed `SkinScore.score_id`, which is what P10's `GET /assessment/score/{id}`
takes — not the raw-submission row's own id.
`user_id` is never accepted from the request body (the docx's own worked example
includes one, `"user_id": "usr_99"`, purely as illustrative JSON) — it always
comes from `Depends(require_role("user"))`, matching every other endpoint in this
codebase; trusting a client-supplied id for whose data to write would be a real
authorization hole.
Concern prioritisation (`prioritize_concerns`) and risk-factor analysis
(`derive_risk_factors`) are pure, unit-tested functions per the master prompt's
own ask — ranked by severity descending, ties broken by original submission order
(Python's stable sort), thresholds for risk factors documented in the function's
own docstring rather than invented per call site.
**Consequences:** `POST /api/v1/assessment/evaluate` (aliased to the old
`compute_and_store_score`-only handler) is untouched and still mounted — this is
an addition, not a replacement of the existing scores router. A future session
should not read `M2_GAP_ANALYSIS.md`'s "rename only" conclusion as still
authoritative for this endpoint; this ADR is the corrected record. Also fixed
`app/core/errors.py`'s `StarletteHTTPException` handler in the same branch: it
previously stringified any `HTTPException(...).detail` into one flattened
`message` string regardless of shape, so a list-valued `detail` (this module's own
field-level 422 errors) never reached the envelope's `details` array the way
`RequestValidationError`'s handler already does for Pydantic-level failures — now
a list `detail` populates `details` structured, matching that existing convention.
Zero other endpoint in the codebase passed a list-valued `detail` before this
branch, confirmed by a full-repo grep, so this is a strict widening with no
existing-behavior change elsewhere.
