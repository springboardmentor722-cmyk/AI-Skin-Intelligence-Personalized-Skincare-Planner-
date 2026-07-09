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

<!-- Next ADR: ADR-015 — add yours here -->
