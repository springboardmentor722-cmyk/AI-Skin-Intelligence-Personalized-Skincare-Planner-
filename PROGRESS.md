# Skinlytics — Progress

Canonical task-state doc, per `docs/CONVENTIONS.md` and `docs/ARCHITECTURE.md`'s doc map.
Update this in the same PR as any completed task. Session context should read this file
first, then the rest of `docs/`.

**Current milestone:** M1 (weeks 1–2) — architecture, DB schema, wireframes, env setup,
Better Auth + RBAC, profile & lifestyle modules, seed data. No AI (ADR-007).
**M1 status: independently verified, not just claimed complete** — a full audit
(`audit/milestone-1-verification`, see Completed below) traced every M1 requirement
against the live Docker Postgres/Mongo/Redis and the running backend/frontend rather
than trusting this file's own prior "functionally complete" claim, found 21 real gaps
(the fresh-DB migration crash and MongoDB verification this file used to list as
merely "pending" turned out to be genuine bugs, not just unverified), and fixed and
re-verified all 21 live.

**Since that audit, M1 was substantially expanded beyond its original User-role-only
scope** (`.claude/plans/validated-questing-firefly.md`, "Milestone 1 — Production-Grade
Foundation Expansion") — the plan's own framing: M1's exit criteria only ever covered
the User role, but a real SaaS foundation needs the other three roles' identity layer,
an admin platform to operate it, and hardened auth, not just seven screens. Delivered
across 9 sequential feature branches, each merged to `dev` only after its own
`ruff`/`mypy --strict`/`pytest` (backend) and `tsc`/`eslint`/`next build` (frontend)
passed and its own live/e2e verification ran — see Completed for the per-branch detail:

1. `feature/database` — `consultant_profiles`, `dermatologist_profiles`,
   `verification_documents`, `audit_logs` tables + a real MinIO/S3 storage adapter.
2. `feature/authentication` — real (optional) email verification, Redis-backed
   account lockout, refresh-token/MFA posture documented.
3. `feature/rbac` — `require_verified_professional`, admin verification endpoints,
   audit-logged role assignment.
4. `feature/consultant-module` — onboarding wizard → pending → admin-review →
   approved/rejected lifecycle, real backend service.
5. `feature/dermatologist-module` — same shape, medical-specific fields.
6. `feature/admin-panel` — Dashboard/Users/Content & Data/Monitoring/System
   Reports/Settings all real, mapped onto the fixed 6-item admin nav.
7. `feature/ui-improvements` — targeted light-theme color rebalance (slate→zinc
   neutrals, on-surface split from primary, desaturated secondary/semantic colors)
   + `Field`/`FieldGroup` adoption on every new form.
8. `feature/testing` — real-DB backend tests for every new endpoint, full
   cross-role Playwright e2e journey, suite-wide rate-limit-sharing fix
   (`workers: 1` + `tests/e2e/helpers.ts`).
9. `feature/documentation` — this sweep.

The one standalone known bug this expansion deliberately deferred
(`scores/service.py`'s day-boundary duplicate-score issue) has since been fixed
(`fix/scores-day-boundary`, see Completed). Remaining items are either genuinely
blocked on external credentials (Kaggle, OpenWeather/OpenUV) or explicit
scope/tradeoff decisions — not unverified claims, see Pending and Known issues.
M2 (real skin assessment engine replacing the ADR-007 stub,
routine-generation refinement, real scoring/recommendation models) is the natural next
feature milestone; the Consultant/Dermatologist *clinical* review workflow (the tables
exist, `consultant_clients`/`consultant_notes`, but need real assessment data to review
against) is a natural M2+ companion now that the identity/verification layer it sits
behind is real.

---

## Completed

- ✔ Architecture & decisions — `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` (ADR-001–010)
- ✔ Database design (on paper) — PostgreSQL v3, MongoDB v3, Vector DB v3, Elasticsearch
  v2, infra layer v2, Better Auth identity schema — all in `database_schemas/`
- ✔ UI wireframes — 83 HTML files (light+dark) in `web/designs/wireframes/`, covering the
  7 M1 screens plus consultant/dermatologist/admin surfaces, with reference screenshots
- ✔ Convention & workflow docs — `docs/CONVENTIONS.md`, `DESIGN.md`, `AI_ML.md`,
  `DATASETS_AND_APIS.md`, `AGENT_WORKFLOW.md`, `GRAPHIFY_SETUP.md`, `SUGGESTIONS.md`
- ✔ Local data-store topology — `docker-compose.yml` (postgres, mongo, redis,
  elasticsearch)
- ✔ Environment setup — `.gitignore`, `.env.example`, `.env.development`,
  `.env.production`, `Makefile`, `setup.sh`
- ✔ Frontend scaffold — Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 +
  shadcn/ui (`base-nova` preset, `@base-ui/react`) in `web/`. Design tokens in
  `app/globals.css` wired 1:1 from `docs/DESIGN.md` (light/dark, glass recipe, ambient
  aurora, tri-font Sora/Inter/Geist via `next/font/google`, Skin Health Score band
  colors). `next-themes` wired (`class` strategy, system-aware) — no visible toggle yet,
  that belongs to the app-shell/topbar screen. One shadcn component installed (Button,
  patched to the pill-shape DESIGN.md §7/§9 requires — the generated default used
  `rounded-lg`). Playwright configured (`chromium-light`/`chromium-dark` projects) with
  one smoke test; component-test framework deferred until a real form exists. ESLint +
  Prettier + `prettier-plugin-tailwindcss`. `npm run {dev,lint,typecheck,test}` all pass;
  verified visually in both themes (screenshots, not committed).
- ✔ Backend scaffold — FastAPI modular monolith in `backend/` (Python 3.11+ floor, `.venv`
  pinned to 3.12 via `uv`). `app/main.py` app factory: request-id middleware, CORS
  (origin = `BETTER_AUTH_URL`), standard error envelope (`CONVENTIONS.md`) registered on
  `starlette.exceptions.HTTPException` (not `fastapi.HTTPException` — the latter misses
  Starlette's own routing-level 404/405s), `/health` (unversioned) + empty `/api/v1`
  router ready for service routers. `app/core/security.py` — `require_user`/`require_role`
  JWT-via-JWKS validation verbatim from the identity doc, extended with the Redis
  `auth:blacklist:{jti}` check the doc describes separately. `app/db/{postgres,mongo,redis}.py`
  wired (async SQLAlchemy/asyncpg, motor, redis.asyncio) — Elasticsearch and the vector DB
  intentionally **not** wired yet (ADR-010: derived stores, worker lands M2, no reason to
  hold an unused client). Alembic scaffolded (`app/migrations/`, async template,
  `target_metadata = Base.metadata`) but **no migrations written yet** — no service owns
  any tables until the next service-building task. `structlog` JSON/console logging.
  `ruff`/`mypy --strict`/`pytest` all pass; verified against a real running server
  (`uvicorn`), not just tests. `docker-compose.yml`/Dockerfiles for `api`/`web` were
  **not** added — Docker isn't installed in this dev sandbox, so I didn't want to commit
  unverified container config (see Known Issues).
- ✔ Docs reconciled — `docs/WIREFRAMES.md`'s four per-role nav lists had drifted from
  `AGENTS.md` (different item counts/wording), and the actual wireframe HTML disagreed
  with both (mostly a generic Stitch draft nav, not real per-role IA). `WIREFRAMES.md`
  now points to `AGENTS.md` §3 as the single source and notes the wireframe HTML's
  sidebar text isn't binding.
- ✔ App shell — `web/components/app-shell/{app-shell,glass-sidebar,glass-topbar}.tsx`.
  Glass sidebar (role-based nav from `AGENTS.md` §3 via `lib/nav-config.ts`, active-link
  state, collapsible to icons) + glass topbar (page title auto-derived from the route,
  ⌘K command palette, weather/UV stub chip, notification bell, working theme toggle,
  account dropdown) + solid content canvas over the global aurora. Route groups:
  `app/(user)/...` stays bare (`/dashboard`); `app/consultant/...`,
  `app/dermatologist/...`, `app/admin/...` are real (non-grouped) folders prefixed by
  role, since Next.js route groups don't add URL segments and all four roles having their
  own `/dashboard` would collide — this wasn't resolved by `CONVENTIONS.md`'s route tree,
  flagged and decided with the user. One stub `dashboard/page.tsx` per role group (shell
  smoke test, not designed screens). `npm run {lint,typecheck,build}` all pass; verified
  in a real browser (light+dark screenshots, all 4 roles, collapse, account menu, ⌘K) and
  with new Playwright e2e tests (`tests/e2e/app-shell.spec.ts`, 4 tests × 2 themes).
  `playwright.config.ts`'s `webServer` now builds+starts production instead of running
  `next dev` — the dev-mode overlay physically intercepts clicks on fixed bottom-left
  chrome (our sidebar's collapse toggle included), unrelated to any app bug. Three real
  runtime bugs caught by actually testing (not just typecheck) before they shipped: (1)
  the sidebar's `collapsed` state wasn't lifted to the layout, so the content margin
  wouldn't have followed the sidebar's width; (2) this shadcn preset uses `@base-ui/react`
  (not Radix) — `asChild` doesn't exist, it's `render={<Element />}`; (3) Base UI's
  `DropdownMenuLabel` throws at runtime unless wrapped in `DropdownMenuGroup`, and this
  version's `CommandDialog` doesn't auto-wrap children in the `Command` root the way
  older shadcn versions did.
- ✔ Authentication (Better Auth wiring, frontend side) — `web/lib/auth.ts` (server
  instance: email/password, Google social provider config with blank credentials so the
  button works the moment real ones land in `.env`, `jwt()` + `admin()` plugins,
  `nextCookies()`), `web/lib/auth-client.ts` (`createAuthClient` from `better-auth/react`
  + `jwtClient`/`adminClient`), `web/app/api/auth/[...all]/route.ts`,
  `web/lib/permissions.ts` (the four roles declared via `createAccessControl` — admin
  gets Better Auth's default user-management permissions, the other three get none; a
  fine-grained per-resource ACL matrix is the dedicated **RBAC** task, not this one).
  Three real screens — `app/(auth)/{login,register,forgot-password}/page.tsx` — built
  against `docs/WIREFRAMES.md`'s component/state spec with react-hook-form + zod
  (`lib/schemas/auth.ts`), standalone glass cards over the aurora (no shell), all states
  from the spec (inline validation, show/hide password, password-strength meter, required
  consent checkbox, loading spinner, rate-limit message, Google OAuth button). Verified
  in a real browser: Zod validation errors render inline, the strength meter updates
  live, and — critically — submitting against a database-less backend fails gracefully
  with an inline error rather than crashing, proving the full request/response cycle
  works end-to-end at the HTTP layer.
  **Two real bugs found and fixed:** (1) Next.js only auto-loads `.env` from `web/`'s own
  directory, not the repo-root `.env` the environment-setup task established — symlinked
  `web/.env -> ../.env` rather than duplicating the file; (2) the identity doc's claim
  that "Better Auth has no `useSession` hook" is stale against the installed version
  (1.6.23), which does export one from `better-auth/react` — used the real, reactive hook
  instead of the doc's manual `getSession()`-in-an-effect workaround.
  **No live database verification** — Docker isn't available in this sandbox, so
  `npx @better-auth/cli generate/migrate` couldn't run (confirmed: `generate` itself
  needs a live Postgres connection to introspect, not just static config). See "Database
  status" for the exact commands to run.
- ✔ Backend `app/services/user/` — `GET /api/v1/users/me` (`router.py` + `schemas.py`;
  no `service.py`/`models.py`/`deps.py` yet — no business logic beyond auth exists until
  the User Profile task). Returns `{id, role}` straight from the validated JWT claims, no
  DB read (the domain profile itself is the User Profile module's job, not this one) —
  proves the full pipeline: frontend Better Auth JWT → FastAPI JWKS validation → response.
  Mounted at `/api/v1/users/me`, tagged in the OpenAPI schema. Tests use
  `app.dependency_overrides[require_user]` rather than hand-crafting a real JWT — this
  endpoint's job is to prove the claims flow through, not re-test JWKS verification
  itself (already covered by `core/security.py`'s own responsibility).
  **Bug found and fixed while verifying with a real garbage bearer token:**
  `core/security.py`'s JWT-decode failure path echoed the raw library exception message
  back to the client (e.g. a UTF-8 codec error) — now logs the real cause server-side via
  `structlog` and returns a generic "Invalid or expired token" to the client.
  `ruff`/`mypy --strict`/`pytest` pass; verified against a real running server, including
  the 401 error-envelope shape and the OpenAPI schema.
- ✔ User Profile + Skin Profile & Lifestyle backend — `app/services/user/` gained
  `models.py`/`service.py` (the `user_profiles` table) and `GET`/`PUT /api/v1/users/me/profile`.
  New `app/services/skin_profile/` service owns `skin_types`/`skin_concerns` (reference
  data), `skin_profiles`/`skin_profile_concerns` (versioned — `is_current` flags the
  active row, priors are kept not overwritten), and Mongo `lifestyle_logs` (one
  upsert per user per day). Endpoints: `GET /skin-types`, `GET /skin-concerns`,
  `GET/POST /skin-profiles(/me)`, `POST /lifestyle-logs`, `GET /lifestyle-logs/me`.
  Saving a profile invalidates `recommendation:cache:{user_id}` in Redis per
  `docs/WIREFRAMES.md`'s spec. **This is the first real Alembic migration** —
  `app/migrations/versions/50e82a643bf9_...py`.

  **Major mid-task discovery, not silently worked around:** while generating that
  migration, discovered Postgres is actually live in this session (the user had loaded
  `database_schemas/skinlytics_postgresql_schema_v3.sql` directly, all 32 tables +
  Better Auth's identity tables + 2 real signed-up users already present) — confirmed
  with the user before touching anything, since a naive `alembic upgrade` on the
  autogenerated diff would have **dropped ~15 real tables**. Reconciled per the user's
  choice ("stamp baseline, no DDL"):
  - Fixed a real SQLAlchemy issue along the way: FK columns referencing Better Auth's
    unmanaged `"user"` table need *some* registered `Table` object in the same
    `MetaData` for dependency-sorting to work at all (not just DB connectivity) — added
    `app.db.postgres.external_user_table`, a column-`id`-only stub, and an
    `include_object` hook in `env.py` so Alembic never tries to create/alter it, or
    propose dropping any other not-yet-modeled table (the incremental per-service
    adoption `env.py` already described, now actually enforced).
  - My models had several nullability/type mismatches against the SQL file's literal
    DDL (I'd defaulted to NOT NULL / generic String where the schema only has a
    DEFAULT, or specifies TEXT) — fixed to match exactly, verified via an empty
    autogenerate diff, not by inspection.
  - The live `user_profiles` table has 3 columns not in the documented v3 schema —
    `email`, `role`, `is_active` — confirmed with the user this came from their direct
    SQL load (likely v2-era leftovers; v3's identity/role moved to Better Auth per
    ADR-003). Added to the model to match reality, but flagged as drift to clean up
    later, not accepted as correct design.
  - The migration's `upgrade()`/`downgrade()` are **hand-written**, not autogenerated —
    since the live DB already matched, autogenerate produced an empty diff, which
    would silently fail to create these tables on any genuinely fresh database. Written
    to mirror the (now-verified-correct) models exactly, then applied via
    `alembic stamp head` (zero DDL executed against the live, populated database).
    **`upgrade()` has not been tested against a real empty database** — no second
    Postgres instance was available to verify a fresh install actually works.

  **Two more real bugs found via actual end-to-end testing** (signed up a fresh test
  user through the real login/register flow, pulled a real JWT via
  `/api/auth/token`, hit every new endpoint against the live server — not mocked):
  1. `core/security.py`'s JWT decode failed on every real token with
     `"EdDSA requires 'cryptography' to be installed"` — PyJWT's EdDSA support needs
     the `cryptography` package, which wasn't a dependency. Added it. (This is exactly
     why the earlier fix logging the real cause server-side mattered — the client-facing
     401 alone gave no hint what was wrong.)
  2. An unhandled exception (triggered for real: MongoDB isn't running in this session,
     only Postgres + Redis are, so the lifestyle-logs endpoints hit a real connection
     error) fell through to Starlette's default plain-text 500, bypassing the error
     envelope entirely. Added a catch-all `Exception` handler in `core/errors.py` that
     logs the real cause via `structlog` and returns the standard envelope.

  **Verified for real against the live database** (then cleaned up — deleted the test
  user, confirmed `ON DELETE CASCADE` correctly cleared its profile/skin-profile/concern
  rows, confirmed the 2 pre-existing real users were untouched): full JWT round-trip,
  `GET`/`PUT /users/me/profile`, `GET /skin-types` (5 real seeded rows) and
  `/skin-concerns`, `POST`/`GET /skin-profiles(/me)` including the concerns junction
  table, and the new catch-all error envelope. **Not verified live:** the
  Mongo-backed `lifestyle-logs` endpoints (MongoDB isn't running this session) and a
  genuinely fresh `alembic upgrade head` — both pass `ruff`/`mypy --strict`, no more.
- ✔ Skin profile & lifestyle screen — `docs/WIREFRAMES.md` screen 4, `app/(user)/profile/`.
  Not in `AGENTS.md`'s User nav list (a real gap, not guessed at) — reached from the
  post-registration redirect (`register/page.tsx` now sends new users here instead of
  `/dashboard`, matching the documented Registration "success" state) and will need an
  account-menu or onboarding entry point once that's designed. Two Diagnostic Module
  cards: skin profile (skin type, age group, gender, the 10 concerns each with
  severity/priority 1–10, allergies + sensitivities as tag inputs — WIREFRAMES says
  "toggles" for sensitivities but no toggle option set is documented anywhere, so it
  uses the same tag-input pattern as allergies rather than inventing one) and today's
  lifestyle (sleep, water, exercise, stress, diet, smoking, alcohol, environmental
  exposure). Each section saves independently (matching the two separate backend
  writes). Optimistic save + rollback, "Saved" toast (Sonner), first-setup vs editing
  copy, range validation.

  **New foundational infra this task, not just the screen:** `lib/api.ts` (typed FastAPI
  client — `openapi-fetch` + `openapi-typescript`, attaches the Better Auth JWT via
  `authClient.$fetch("/token")`, since `jwtClient()` only wraps a `jwks()` convenience
  method, not a `token()` one), `lib/api-types.ts` (generated from the real backend via
  `make openapi`, committed; the intermediate `openapi.json` is gitignored),
  `QueryProvider` (TanStack Query) and `Toaster` (Sonner) wired into the root layout.
  Fixed a real bug in the `Makefile`'s `openapi` target while first running it —
  `uv run --project backend` doesn't change the working directory, so `import app.main`
  failed; needed an explicit `cd backend` first.

  **Four real bugs found by actually driving this screen in a browser against the live
  database** (signed up fresh test users, filled and saved both forms, reloaded the
  page to check persistence — not just typecheck):
  1. A stale `next start` process was still bound to port 3000 from an earlier task,
     serving HTML that referenced chunk hashes from a build that no longer existed on
     disk — looked exactly like a broken form (native GET submission instead of the
     JS handler intercepting it) until traced to 404s on `_next/static/chunks/*`.
     Not a code bug; documented so it isn't re-chased next time.
  2. The optimistic-update `onMutate` spread `{...previous}` where `previous` is `null`
     for a first-time profile (no profile yet, GET 404s) — the resulting object silently
     had no `concerns` field, and crashed the form-hydration logic (`.map()` on
     `undefined`) the instant the optimistic patch landed, right after clicking Save.
     Fixed by building the full optimistic object explicitly instead of spreading.
  3. The Skin type `<Select>` correctly showed the picked label right after an
     interactive selection, but silently reverted to its placeholder after a page
     reload — even though the checkbox and tag-input fields on the *same* fetched data
     hydrated correctly. Root cause: the form was initialized to empty defaults and
     patched via a `useEffect` after the data arrived, so Base UI's `Select` mounted
     with `value={undefined}` and never properly picked up the later transition to a
     real value (Base UI's `items` prop and an explicit `Select.Value` render-children
     function both failed to fix this — the actual fix was structural: split the
     component so the form's `useState` initializer reads the already-loaded query data
     directly, guaranteeing the `Select` mounts with the correct value on its first
     render, no post-mount transition at all).
  4. Along the way, confirmed `Makefile`'s `openapi` target bug (above).

  `ruff` N/A (frontend), `typecheck`/`lint` clean. All test users created during
  verification were deleted afterward; confirmed `ON DELETE CASCADE` cleaned up their
  profile/skin-profile rows and the 2 pre-existing real users were untouched.
- ✔ `run.py` — one-command local dev bootstrap (stdlib only, no install needed to run
  it): `docker compose up -d`, waits for Postgres to report healthy, creates the root
  `.env` from `.env.development` and the `web/.env` symlink if either is missing (a
  fresh clone wouldn't have either — `.env*` is gitignored by design), then runs the
  backend (`uv run uvicorn --reload`) and frontend (`npm run dev`) as subprocesses with
  their output streamed live. Ctrl+C stops both cleanly; if either process dies on its
  own (e.g. a startup crash) the other is stopped too rather than left running against
  nothing. Docker containers are left running on exit, matching `make dev`'s behavior.
  Falls back to Docker Desktop's known macOS CLI location
  (`/Applications/Docker.app/Contents/Resources/bin/docker`) when `docker` isn't on
  PATH — a common Docker Desktop install state, not a broken one — instead of failing
  `require_on_path`. Stdout is forced to line-buffering at startup so the script's own
  progress messages aren't silently held back when stdout isn't a TTY (found while
  verifying end-to-end: subprocess output appeared live, but this script's own `print()`
  calls didn't, since Python fully-buffers stdout by default when it's not a TTY).
  **Verified end-to-end** on the maintainer's actual Mac: `docker compose up -d` pulled
  and started postgres/mongo/redis/elasticsearch (postgres reported `healthy`), then the
  backend (Uvicorn on `:8000`) and frontend (Next.js, fell back to `:3001` — an unrelated
  stray process already held `:3000`) both came up clean. Along the way, found and fixed
  a real environment issue on that machine, unrelated to run.py's own logic: the
  installed Docker Desktop (4.81.0) required macOS 14+, but the machine was on macOS
  12.7.6 — reinstalled Docker Desktop 4.41.2 (the last release supporting macOS 12) to
  resolve it. Not a code change; noted here since it blocked verification.
- ✔ User dashboard backend (`docs/WIREFRAMES.md` screen 3) — four new services behind
  `GET /api/v1/scores/me`, `/routines/me`, `/recommendations/me`, `/progress/me/summary`:
  - **Skin Health Scoring** (`app/services/scores/`) — the exact weighted formula from
    `docs/AI_ML.md` §"Weighted skin-health score": `skin_condition` from real declared
    concern severities (the ADR-007 `ConcernDetector` stub's documented output *is* the
    declared severities, so no extra randomization on top); `sleep_quality` (60% duration
    band + 40% self-rated, most recent log); `hydration` (glasses/8 via the standard
    250ml-glass conversion, 7-day avg of `lifestyle_logs.water_intake_liters`);
    `lifestyle` (equal-weighted sub-index of exercise/stress/diet/sun-exposure, 30-day
    window — the doc names these 4 components but not their sub-weights, an assumption,
    not an invented field); `routine_adherence` — no completed-checklist-steps tracking
    exists anywhere in the documented schema, so this one component is an ADR-007
    deterministic `hash(user_id)`-seeded stub, same pattern the docs already sanction for
    unbuilt AI surfaces. One `skin_scores` row per user per day (collapses repeat views).
  - **Routine Planner** (`app/services/routines/`) — deterministic rule-based AM/PM
    routine assembly over the `product_skin_types`/`product_concerns` junction tables
    (ADR-001: indexed joins, not a graph DB) with a seeded pick where multiple products
    qualify. No dedicated AI surface exists for routine generation (`AI_ML.md`'s 7 model
    surfaces don't include one). Generated once per user, reused after — regenerating
    automatically after a skin-profile update isn't built (`routines` has no
    `skin_profile_id` column to key off), a known gap.
  - **Product Recommendation** (`app/services/recommendations/`) — stub `Recommender`
    per `AI_ML.md`: filters by skin type + concern junctions, emits real `reasons[]`.
    `AI_ML.md`'s stub semantics say "sorts by rating", but the live `products` table has
    no rating column — ranks by concern-overlap count (a real relational signal) with a
    `hash(user_id)`-seeded tiebreak instead, matching ADR-007's determinism requirement
    without inventing a schema column. Cached in Redis (`recommendation:cache:{user_id}`,
    TTL 24h, already invalidated on profile save by the Skin Profile service).
  - **Progress Tracking** (`app/services/progress/`) — deliberately minimal M1 slice:
    just the dashboard's score-trend mini-chart, reading `skin_scores` through the
    Scoring service's interface function. The full Progress screen (before/after photos,
    Mongo `progress_logs`, milestones — `WIREFRAMES.md` screen 7) is separate, larger
    scope, not built here.
  - **Product seed** (`app/db/seed.py`, wired to the pre-existing `make seed` /
    `python -m app.db.seed` target) — 14 hand-written placeholder products (clearly a
    stand-in, not the real Kaggle ingestion pipeline per `DATASETS_AND_APIS.md` §2, which
    isn't built yet) spanning Cleanser/Treatment/Moisturizer/Sunscreen, linked to real
    `skin_types`/`skin_concerns` rows via `product_skin_types`/`product_concerns`.
    Idempotent (dedupes by brand+name).
  - **Two real bugs found and fixed during live verification:** (1) all new timestamp
    columns (`created_at`/`updated_at`/`calculated_at`) were mapped with SQLAlchemy
    client-side `default=None`, which explicitly sends `NULL` in the `INSERT` and
    shadows the DB's own `DEFAULT CURRENT_TIMESTAMP` — fixed to `server_default=func.now()`
    matching `skin_profile/models.py`'s already-correct pattern. (2) the score
    day-collapse query (`ORDER BY calculated_at DESC LIMIT 1`) picked up a stray
    `NULL`-`calculated_at` row left over from bug (1) — Postgres sorts `NULL` first in
    `DESC` order by default — so it kept creating new rows instead of updating today's;
    fixed with `.desc().nulls_last()`, which is correct regardless of whether any bad
    rows exist.
  - `env.py`'s model-import block updated to include all four new services (autogenerate
    couldn't otherwise see their tables at all, silently vacuous-passing a "no drift"
    check) — the real check then surfaced 6 missing indexes vs the live DDL
    (`idx_routines_user`, `idx_routines_user_active`, `idx_routine_steps_routine`,
    `idx_product_skin_types_product`, `idx_product_concerns_product`,
    `idx_skin_scores_user_time`), added to match exactly; autogenerate now reports a
    genuinely empty diff.
  - `ruff`/`mypy` clean. **Verified live, end-to-end**, with a disposable test user (Oily
    skin type, Acne + Oily Skin concerns, a real lifestyle log): all 5 score sub-scores
    hand-verified against the formula and matched exactly; routines correctly picked
    Oily/Acne-matching products and stayed stable across repeat calls; recommendations
    returned 3 correctly-ranked, correctly-reasoned products and were confirmed
    Redis-cached (identical on repeat call); progress summary returned real trend points.
    Test user deleted afterward; `ON DELETE CASCADE` confirmed clean (skin_scores/
    routines/skin_profiles all zeroed for that user), shared `products` catalog and the
    2 real pre-existing users untouched.
  - **Major incident during this task, unrelated to the dashboard code itself:** the
    session's earlier disk-full event (see `run.py`'s entry above) had corrupted Docker
    Desktop's VM-internal storage badly enough that a full Docker restart was needed
    (`com.docker.backend.log` showed `no space left on device` / `read-only file system`
    / `input/output error` writing Docker's own metadata store at the exact time of the
    disk-full event). After restarting Docker, its Postgres *container* came back with
    an empty database — but this turned out to be a red herring, not real data loss: a
    **native Homebrew Postgres 14** (`brew services`, running since before this session)
    was silently shadowing `localhost:5432`, and had been the actual database the whole
    project used all along — Docker's Postgres container had never held the real data.
    Confirmed via direct inspection (the native instance had the 2 real users + all
    session data intact) before touching anything further. Resolved by migrating the
    real data into Docker's Postgres (`pg_dump`/`pg_restore`, `--clean --if-exists`,
    verified row-for-row including the undocumented `user_profiles` drift columns) and
    stopping the native service (`brew services stop postgresql@14` — confirmed it no
    longer auto-starts). Docker's Postgres is now genuinely the system of record, no
    more port ambiguity. **Nothing was actually lost**, but this cost significant time —
    worth remembering that `localhost:<port>` can silently resolve to a non-Docker
    listener on this machine.
- ✔ Public landing page (`web/app/page.tsx`) — `web/designs/wireframes/landing-page.html`
  (light) chosen as the copy/structure source; the light and dark wireframes turned out
  to be **different Stitch drafts with diverged copy**, not a re-skin of each other
  (product-owner decision: use light's copy, re-skinned for both themes via the app's
  real token system, not the wireframe's own bespoke Tailwind config). Sections: sticky
  glass navbar, hero (with the new shared `SkinScoreRing` — see below), score-explainer
  band, "how it works" (3 steps), 6-card feature grid, 3 role cards, testimonials,
  pricing, FAQ (shadcn `Accordion`), final CTA, solid footer. No WebGL shader canvas
  from the wireframe — `docs/DESIGN.md` §3's real ambient-aurora spec is CSS radial
  gradients (already implemented, rendered once globally in `app/layout.tsx`), so the
  page just sits over that, consistent with every other screen.
  - **Two content reconciliations against more-authoritative docs, not the wireframe:**
    (1) the "weighted formula" band showed fictional labels/numbers in both wireframes
    (light: Hydration/Texture/Elasticity/Tone/Barrier; dark: different labels again) —
    replaced with the real Skin Health Score breakdown (`docs/AGENTS.md` §4: Skin
    Condition 35% · Lifestyle 20% · Routine Consistency 20% · Sleep 15% · Hydration
    10%). (2) the pricing teaser showed an invented "$12/month" — replaced with the
    real, documented figure (`Skinlytics_Stitch_UI_Prompt_Pack_v2.md`'s Billing spec,
    "Pro ₹499/mo", which explicitly says "reuse for /pricing").
  - **New shared component: `SkinScoreRing`** (`web/components/skin-score-ring.tsx`) —
    docs/AGENTS.md calls this "the signature element... identical treatment everywhere
    it appears"; built once now (circular gauge, frosted glass housing, teal→royal-blue
    gradient stroke, animated fill, Geist numeral) so the future Dashboard screen task
    reuses it with real data instead of building its own. Deliberately doesn't include
    the 5 weighted mini-bars — `docs/WIREFRAMES.md` screen 3 describes those as
    "beside it", a sibling composition concern for whoever builds that screen.
  - **New shared component: `ThemeToggle`** (`web/components/theme-toggle.tsx`) — the
    app-shell topbar already had a working theme toggle inline (`glass-topbar.tsx`,
    missed on an initial grep with a bad regex — it did exist), so rather than build a
    second one for the landing navbar, extracted it into a shared component both now
    use. Also drops an `eslint-disable-next-line react-hooks/set-state-in-effect` the
    inline version needed (the `mounted`-state hydration guard, standard with
    `next-themes`) — the extracted version renders both icons always and swaps via a
    `dark:` CSS variant instead, so there's no synchronous `setState`-in-effect and no
    hydration-mismatch flash either.
  - Added shadcn `Card` and `Accordion` (`npx shadcn add`) — first use of either in this
    codebase.
  - Copied the wireframe's 9 localized Stitch-generated photos into `web/public/images/
    landing/` for actual use in the built page. **Flagging clearly:** these are
    placeholder photography from the Stitch extraction, not licensed production
    imagery — real photography sourcing is a content/legal task, not a coding one.
  - **Three real bugs found and fixed during live browser verification** (Playwright,
    both themes, console/network inspection — not just a visual glance): (1) Base UI's
    `Button` logged a runtime error on every `render={<Link>...}` usage (6 places) —
    needs an explicit `nativeButton={false}` when the rendered element isn't a native
    `<button>`, undocumented in the generated component but required. (2) the
    `ThemeToggle`'s natural `mounted`-state hydration-guard pattern (common with
    `next-themes`) triggered this repo's React Compiler ESLint rule against synchronous
    `setState` in an effect — rewritten as a CSS-only dual-icon toggle (`dark:hidden` /
    `dark:block`) instead, which also has no hydration-mismatch flash. (3) the
    testimonials section, final CTA band, and pricing "Pro" card all used `bg-primary`
    intending a fixed dark-navy accent band (matching the wireframe's literal navy) —
    but the app's real `--primary` token *inverts* per theme (by design, for buttons),
    so these sections flipped to a light background in dark mode. Fixed to
    `bg-primary-container`, which — unlike `primary` — is genuinely fixed-dark in both
    `docs/DESIGN.md` themes.
  - `npm run lint`/`typecheck` clean (only 2 pre-existing, unrelated warnings on
    `(auth)/login` and `(auth)/register` remain). Verified visually end-to-end in both
    themes via Playwright screenshots across the full page — not just typecheck/lint.
- ✔ Design system v2 — dark-mode "Deep Diagnostic Suite" (`feature/ui-design-system-auth-
  assessment` branch, merged to `dev`) — rewrote `docs/DESIGN.md` and `web/app/globals.css`
  from the light "Airy Lab" v1 tokens to the dark navy/blue/teal palette, updated shadcn
  primitives (button, command, dialog, dropdown-menu, input, select) to the glassmorphism
  recipe (backdrop blur, pill radii, no heavy shadows). Verified in both themes via
  Playwright screenshots.
- ✔ Login + Signup rebuilt on shadcn `login-02`/`signup-02` — moved out of the `(auth)`
  route group into standalone `/login` and `/signup` routes with a two-column split
  layout (`AuthSplitLayout`: illustration + form), matching the new design system.
  Registration renamed to Signup throughout (`registerSchema`→`signupSchema`,
  `RegisterValues`→`SignupValues`); added a requested-role selector (User/Consultant/
  Dermatologist) per `web/designs/wireframes/signup.html` — new accounts still default to
  role `user` at signup (Better Auth), the requested role is captured for admin-driven
  verification later, not self-service elevation (no backend endpoint consumes it yet).
  Auth functionality (Better Auth email/password + Google) unchanged. `npm run
  {lint,typecheck,build}` clean.
- ✔ Assessment flow (`web/app/assessment/*`) — 4-step wizard (Basics → Skin Type →
  Concerns → Lifestyle) + Results, against `web/designs/wireframes/assessment-*.html`.
  Shared `AssessmentShell` (glass progress header/stepper + sticky footer) and
  `AssessmentProvider` (state persisted to `sessionStorage`, not a backend — no Skin
  Assessment service exists yet, ADR-007). Skin type/concerns steps hit the real
  `/skin-types`/`/skin-concerns` endpoints; Results computes a Skin Health Score
  client-side using the real 35/20/20/15/10 weighting (`docs/AI_ML.md`), framed as an
  estimate, not a diagnosis. **Bug found and fixed via live Playwright verification:**
  when the backend was unreachable, both API-backed steps retried silently then rendered
  a blank grid with no way to proceed — added a retry-capable error state (reused the
  existing skeleton/empty-state visual language) to both.
- ✔ RBAC fine-grained ACL matrix (backend enforcement) — every User-role domain endpoint
  (`users/me/profile`, `skin-profiles*`, `lifestyle-logs*`, `scores/me`, `routines/me`,
  `recommendations/me`, `progress/me/summary`) now requires `require_role("user")`
  instead of the role-agnostic `require_user` — a consultant/dermatologist/admin JWT gets
  a real 403, not empty/nonsensical self-scoped data. `GET /users/me` deliberately stays
  role-agnostic (every role calls it to learn which dashboard to land on). New
  `backend/tests/test_rbac.py`: unit tests for `require_role`'s allow/deny logic plus a
  parametrized test asserting all 10 affected routes 403 a non-`user` role (via
  `dependency_overrides`, never touching Postgres — the 403 fires before `get_db` is
  ever resolved). `ruff`/`mypy --strict`/`pytest` (19 tests) all pass.
- ✔ Ingredient seed data (`backend/app/db/seed.py`, `backend/app/services/ingredients/
  models.py`) — curated `ingredients` + `ingredient_concern_treats` +
  `ingredient_skintype_avoid` rows for the PDF's 8 named categories (Retinoids,
  Niacinamide, Vitamin C, Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/
  BHAs) per `docs/DATASETS_AND_APIS.md` §3's prescribed approach (hand-curated common
  dermatological knowledge, not scraped — no public API exists for INCIDecoder/COSDNA).
  New `ProductIngredient` model (`recommendations/models.py`, a `product_*` junction) and
  2 new products (Glycolic Acid exfoliant, Peptide serum) link real seeded products to
  the new ingredients. New hand-written Alembic migration
  (`ccb49f9b0f47_ingredients_and_product_ingredients.py`) — **not verified against a live
  database this session** (Docker wasn't running); its docstring flags the same known gap
  the baseline migration has (no earlier migration creates `products`, so `upgrade()`
  will fail on a genuinely fresh DB until that's separately closed) and that on the real
  project database it should be applied via `alembic stamp`, not `upgrade`, after
  confirming an empty autogenerate diff — same reconciliation precedent as the baseline
  migration. `ruff`/`mypy --strict`/`pytest` pass (no DB needed for these).
- ✔ Three remaining M1 screens — Dashboard, Product Recommendations, Progress Tracking
  (`web/app/(user)/{dashboard,recommendations,progress}/page.tsx`), completing all 7 M1
  screens from `docs/WIREFRAMES.md`:
  - **Dashboard** (screen 3): Skin Score Ring + weighted breakdown, today's AM/PM routine
    checklist (client-side check state only — no `checklist_step_done` persistence
    exists anywhere in the schema, matching why the Scoring service already stubs
    `routine_adherence`), recommended products (3, match rings), progress mini-chart.
    First-time state (no skin profile → `scores/me` 404) shows a CTA to `/profile`
    instead of five broken cards. Dropped the wireframe's weather/reminders/AI-insight
    modules — none are in `WIREFRAMES.md`'s documented component list and none have a
    backing endpoint (`CONVENTIONS.md` "raw exports never ship").
  - **Product Recommendations** (screen 6): category/brand/budget filter rail + sort,
    all client-side over the single `recommendations/me` stub response (no filter query
    params exist on the endpoint yet — added would be guessing at an unbuilt contract);
    Compare drawer (shadcn `Sheet`, up to 3) and Alternatives dialog, both real
    interactions over the fetched data. Dropped the wireframe's vegan/fragrance-free
    preference filters — no such columns exist on `products`.
  - **Progress Tracking** (screen 7): week/range selector (7D/30D/90D) driving a real
    `days` query param — added to `GET /progress/me/summary` (the service function
    already took `days`, it just wasn't reachable from the API); Skin Score trend chart
    (shadcn `chart`/Recharts, first use in this codebase) + improvement-score (Δ) card.
    Before/after photos, concern-changes table, milestones, and export are shown as
    clearly-labeled "Coming soon" cards, not invented — none of Mongo `progress_logs`,
    the Report Service, or S3 upload exist yet (`progress/service.py`'s own docstring
    already flagged this as separate, larger scope).
  - New shared components: `ProductRecommendationCard` + `MatchRing` (used by both
    Dashboard's preview and the full Recommendations grid), `RoutineChecklistCard`.
    Added shadcn `chart`, `sheet`, `skeleton` (first use of each) — patched `sheet.tsx`'s
    content to the `glass glass-strong` recipe (ADR-008) since the generated default used
    a plain solid popover. Added `formatPrice` to `lib/utils.ts` (INR via
    `Intl.NumberFormat`, not a hard-coded ₹).
  - **Verified against realistic mocked API data** (Playwright route interception, since
    no backend/Docker was available this session) in addition to the real error-state
    paths: score ring/breakdown, routine checkbox toggling, product cards, compare
    drawer, alternatives modal, and the trend chart all confirmed rendering correctly
    with zero console/page errors, both light and dark.
  - `ruff`/`mypy --strict`/`pytest` (backend) and `npm run {lint,typecheck,build}`
    (frontend) all clean.
- ✔ Milestone 1 documentation — `project_docs/milestone_1/` (system architecture with a
  Mermaid diagram, database schema with an ER diagram, the real API endpoint list
  generated from the live OpenAPI schema — not hand-typed, actual folder structure, setup
  instructions). Consolidates and cross-links `docs/`/`database_schemas/` for the
  milestone-close deliverable rather than duplicating them as the ongoing source of truth.
- ✔ App shell sidebar migrated to shadcn `sidebar-07` primitives — replaced the hand-
  rolled `GlassSidebar` (manual `collapsed` state lifted through `AppShell`) with
  `AppSidebar` (`components/app-shell/app-sidebar.tsx`) built on `components/ui/sidebar.tsx`
  (`SidebarProvider`/`Sidebar`/`SidebarMenuButton`/`SidebarRail`, first use in this
  codebase). Content is still ours, not sidebar-07's demo data: the real per-role
  `NAV_ITEMS` (`lib/nav-config.ts`), Skinlytics branding, and the same active-link logic
  — sidebar-07's Team Switcher/Projects/nested collapsible groups don't apply to this
  app's flat per-role nav and weren't adopted. Patched `ui/sidebar.tsx`'s inner surface to
  the `glass` recipe (ADR-008), same precedent as `dialog.tsx`/`sheet.tsx`. Gained for
  free: cookie-persisted collapse state, ⌘/Ctrl+B shortcut, and a real mobile Sheet
  fallback (glass, since `Sheet` was already patched) — none of which `GlassSidebar` had.
  Added a `SidebarTrigger` to `GlassTopbar` (left of the page title) as the explicit
  toggle button. **Bug found and fixed:** the generated `hooks/use-mobile.ts` used an
  effect that calls `setState` synchronously on mount — this repo's React Compiler ESLint
  rule flags that (the same class of issue `ThemeToggle` hit earlier); rewritten with
  `useSyncExternalStore` instead of an effect, which sidesteps the rule and is the more
  correct pattern for reading external (non-React) state like viewport width. Verified in
  a real browser: expanded/collapsed/dark mode/mobile-sheet, `npm run
  {lint,typecheck,build}` clean.
- ✔ Git housekeeping — merged `feature/ui-design-system-auth-assessment` into `dev`
  (fast-forward, no conflicts), deleted 15 other local branches already fully merged into
  `dev` (`git branch --merged` confirmed each before deletion). Only `main`/`dev` remain
  locally. No GitHub remote existed in this session (no `gh` CLI either) — wiring one is
  a user-driven step (see Known Issues).
- ✔ GitHub remote wired — user added `origin`
  (`https://github.com/Satya-Sai-Tharun/Skinlytics.git`) and pushed `dev` themselves;
  confirmed via `git fetch` (`origin/dev` matched local `dev` exactly before this
  session's new commits). `main` is not yet pushed (`origin` currently only has a `dev`
  branch) — push it whenever a PR-based flow off `main` is actually needed, not blocking
  anything today. Also confirmed no real `.env` file was ever committed — `.gitignore`
  excludes `.env`/`.env.local`/`.env.*.local`; only the three template files
  (`.env.example`/`.env.development`/`.env.production`, all blank secrets) are tracked.
- ✔ `run.py` split into `docker_run.py` / `backend_run.py` / `web_run.py`, one script per
  concern, then `run.py` deleted. `docker_run.py` owns Docker discovery, the `.env` /
  `web/.env` bootstrap, `docker compose up -d`, and waiting for Postgres; `backend_run.py`
  and `web_run.py` each just start their one process (uvicorn / `next dev`) and assume
  `docker_run.py` already ran. Each is run in its own terminal now, rather than one script
  managing both child processes' lifecycle together — simpler, and a backend restart no
  longer requires taking the frontend down too. Verified each new script actually starts
  its process cleanly (backend: uvicorn reload + app startup complete; frontend: `next
  dev` ready) — Docker itself still isn't available in this sandbox, so `docker_run.py`'s
  own `docker compose` calls aren't live-verified this session, same constraint the
  original `run.py` always had here. Updated the `run.py` references in
  `project_docs/milestone_1/` (01, 04, 05) to match; `.claude/settings.local.json`'s
  permission entries still mention `run.py` but that's local tool config, not project
  code — left alone, harmlessly stale.
- ✔ **Bug fix** (`fix/run-scripts-missing-datastore-check`) — the `run.py` split above
  had a real regression: the single combined script always brought Docker up before
  starting the backend/frontend, but the three split scripts don't enforce that order.
  Running `web_run.py` (or `backend_run.py`) alone with Postgres/Mongo/Redis down — as
  the user hit for real — surfaces as a raw `ECONNREFUSED` `AggregateError` deep in
  Better Auth's own error handler (a 500 on `/api/auth/sign-in/social`) instead of a
  clear message pointing at the actual cause. Added a preflight check to both scripts:
  parse the relevant `.env` URL(s) (`DATABASE_URL` for `web_run.py`;
  `DATABASE_URL`/`MONGO_URI`/`REDIS_URL` for `backend_run.py`), probe the host:port with
  a plain `socket.create_connection`, and print an explicit "run `docker_run.py` first"
  warning up front if anything's unreachable — non-blocking (matches `docker_run.py`'s
  own existing "warn and continue" style for a slow Postgres healthcheck), so it doesn't
  stop someone who genuinely just wants the dev server up.
  **Second bug found while verifying the first fix:** the warning also silently
  disappeared when this script's own stdout wasn't a TTY (piped/redirected) — the exact
  buffering issue `docker_run.py` already documents and guards against
  (`sys.stdout.reconfigure(line_buffering=True)`), which got dropped when the single
  `run.py` was split into three files. Re-added to both. Verified live: with Postgres/
  Mongo down in this sandbox, both scripts now print the warning immediately and still
  start their process; confirmed the warning is not lost under output redirection.
- ✔ **Bug fix** (`fix/google-oauth-account-linking`) — "Sign in with Google" 500'd with
  `account_not_linked` for any user who had already signed up via email/password (hit for
  real by the user, on their own machine, with real Google credentials in `.env`). Root
  cause, traced through the actual installed `better-auth` source
  (`node_modules/better-auth/dist/oauth2/link-account.mjs`), not guessed: Better Auth's
  auto-link guard requires the *existing local* account's email to already be verified
  (`requireLocalEmailVerified`, default `true`) — a check that's independent of
  `trustedProviders` and not satisfied by it. This app has no email-verification flow
  anywhere (`emailAndPassword` has no `requireEmailVerification`; no email-sending
  adapter exists in `docs/DATASETS_AND_APIS.md`'s external-services list), so
  `user.emailVerified` is `false` for every email/password signup, forever — meaning this
  wasn't an edge case, it permanently blocked Google sign-in for every such user.
  `web/lib/auth.ts` now sets `account.accountLinking.trustedProviders: ["google"]` +
  `requireLocalEmailVerified: false`. **Real security tradeoff, deliberately accepted and
  documented, not silently introduced** — see `docs/DECISIONS.md` ADR-011 for the exact
  account-linking risk this opens (an attacker who front-registers someone else's email
  via password signup would auto-absorb that person's later Google sign-in) and what
  closes it correctly (real email verification, not built yet). Also updated
  `database_schemas/skinlytics_identity_betterauth.md`'s config snippet + Gotchas to
  match, since `auth.ts` claims to mirror it. `npm run {lint,typecheck,build}` clean.
  **Not live-verified against a real Google OAuth callback this session** — no
  Postgres/Docker in this sandbox; the fix is grounded directly in the installed
  library's actual source condition, not assumption, but the real end-to-end callback
  flow should still be exercised on a machine with the data stores up.
- ✔ **Bug fix** (`fix/dashboard-hydration-mismatch`) — the Dashboard's greeting/date row
  threw a real hydration mismatch (server rendered "Thursday, July 9", client rendered
  "Thursday 9 July"): `new Date().toLocaleDateString(undefined, ...)` uses whichever
  locale each environment defaults to, and the server (Node) and browser don't
  necessarily agree. The greeting text had the same class of bug via `getHours()`
  (server/client can be in different timezones). Fixed with `useSyncExternalStore`
  (`getServerSnapshot` returns a fixed, locale/timezone-agnostic placeholder for the SSR
  + hydration pass; the real client-local value renders immediately after) — the same
  pattern already established in this codebase for `hooks/use-mobile.ts`, instead of a
  "mounted"-flag state-in-effect this repo's React Compiler lint rule disallows. Verified
  live: no hydration-related console errors on `/dashboard`, date renders correctly.
  `npm run {lint,typecheck,build}` clean.
  **Separately reported, not a bug in our code:** a "Encountered a script tag while
  rendering React component" dev-console notice traced to `next-themes`' own
  `ThemeProvider` (`node_modules/next-themes/dist/index.mjs`) — it intentionally renders
  a `<script>` element (already flagged `suppressHydrationWarning`) to set the theme
  class before hydration and prevent a flash of the wrong theme; there's no prop we're
  omitting that changes this, and no newer stable `next-themes` release exists (latest is
  what's installed; the only newer version is an unreleased `1.0.0-beta`). This is a
  known Next.js 16 / React 19 dev-only diagnostic about a legitimate third-party
  technique, not something to patch around — doing so risks breaking the anti-flash
  behavior for a cosmetic dev-mode-only warning. Left as-is; noted here rather than
  silently ignored.
- ✔ **Bug fix** (`fix/skin-profile-select-controlled`) — Base UI's Select warned "changing
  the uncontrolled value state ... to be controlled" on the Skin profile screen's Skin
  type dropdown. Root cause, traced through the installed `@base-ui/react` source
  (`@base-ui/utils/useControlled.mjs`): whether a Select is controlled is decided **once**,
  on its first render, purely by whether `value` is `undefined` — never re-evaluated
  after. `form.skin_type_id ? String(form.skin_type_id) : undefined` mounted the Select
  uncontrolled on first-time setup (`skin_type_id` starts at the `0` sentinel), then
  flipped it to controlled the instant a skin type was picked. Fixed by passing `null`
  instead of `undefined` for "nothing selected" — Base UI's own `Select.Root`'s
  `defaultValue` is `null`, confirming `null` (not `undefined`) is the library's
  intended empty-selection sentinel; a Select mounted with `value={null}` is controlled
  from render one and never switches. Same latent bug (not yet reported, same root
  cause) also existed on Age group + Gender (`skin-profile-form.tsx`, both always start
  `undefined` for a first-time profile) and Alcohol consumption + Pollution level
  (`lifestyle-form.tsx`, `emptyForm` sets both `undefined` always) — fixed all four the
  same way while in the file. Verified live (Playwright, mocked 404 skin-profile
  response simulating the exact first-time-setup scenario reported): picking "Oily"
  produces zero controlled/uncontrolled console warnings and the Select correctly
  displays the picked value. `npm run {lint,typecheck,build}` clean.
- ✔ Buttons/interactive elements get `cursor: pointer` (`chore/shadcn-init-pointer`) —
  traced the requested `npx shadcn@latest init --pointer` through the actual installed
  CLI (`node_modules/shadcn/dist/index.js`) before running it: `--pointer` isn't a
  persisted `components.json` field at all (confirmed — it only appears in the `init`
  command's own CLI-args schema, never read back from the config file on later `add`
  calls); it's a one-time query param telling shadcn's *registry server* which source
  variant to serve while fetching components. Re-running `init` against this
  already-initialized, heavily-customized project (declined its
  "overwrite components.json?" prompt) would either refuse to proceed non-interactively
  or risk re-fetching already-installed components (button, dialog, sheet, sidebar —
  all patched for the glass recipe / pill-shape) from the registry and silently
  clobbering those customizations for a purely cosmetic cursor change. Applied the
  equivalent fix directly instead: a global `button:not(:disabled), [role="button"]
  :not([aria-disabled="true"]) { cursor: pointer }` rule in `globals.css` — Tailwind's
  preflight resets native `<button>` to `cursor: default`, and this restores the
  "clickable" affordance for every current *and future* button-like element in one
  place, with zero registry-refetch risk. Verified live: submit button computes
  `cursor: pointer`, a disabled button still computes `cursor: default`. `npm run
  {lint,typecheck,build}` clean.
- ✔ UI/UX refinement, Milestone 1 (`feature/shadcn-ui-revamp`) — scoped explicitly to
  refining *within* the locked "Frosted Lab Glass" design system (AGENTS.md: "Design
  system is locked, not proposed"), not replacing it — confirmed with the user before
  starting, since the initial ask described a full Vercel/Linear/Stripe-style visual
  redesign, which would have meant abandoning a decision this project's own docs call
  locked. Audited the app for hand-rolled markup duplicating an existing (or
  official-but-uninstalled) shadcn primitive, then fixed only the real, valuable hits:
  - **5 near-identical hand-rolled "error + retry" / "empty + CTA" blocks** (dashboard,
    recommendations ×2, progress, assessment skin-type, assessment concerns) replaced
    with one new `components/state-card.tsx`, built on shadcn's official `Empty`
    primitive (`components/ui/empty.tsx`, newly installed — not a bespoke one, per
    "don't reinvent a component that already exists"). Standardized the retry/CTA
    action on shadcn `Button` everywhere too — some instances used a raw `<button>`
    before.
  - **4 hand-rolled progress-bar `<div>` pairs** (dashboard score breakdown, assessment
    results score breakdown, assessment-shell's step header bar) replaced with shadcn's
    official `Progress` (`components/ui/progress.tsx`, newly installed) — patched to
    accept `trackClassName`/`indicatorClassName` (not in the generated default) since
    this app's bars use the secondary token and a thinner track than shadcn's own
    default styling.
  - **2 raw `<input type="range">` + 1 raw `<select>`** (assessment/lifestyle — sleep
    hours, stress level, sleep quality) replaced with the shadcn `Slider`/`Select`
    already used identically elsewhere in this codebase (skin-profile-form.tsx,
    lifestyle-form.tsx) — same visual output, real keyboard/ARIA semantics for free.
  - **Routine checklist's hand-rolled circular toggle** (`routine-checklist-card.tsx`)
    replaced with shadcn `Checkbox` styled circular via `className`, instead of a
    bespoke `<button><span>` pair reimplementing checkbox semantics from scratch.
  - Verified live in a real browser (Playwright): all five state-card sites render
    correctly (including fixing a real visual bug caught during verification — `Empty`'s
    own dashed border wasn't actually overridden by adding `border`, since `border`
    only sets width, not style; needed explicit `border-solid`), the new
    Slider/Select/Checkbox are interactive, zero console/page errors. `npm run
    {lint,typecheck,build}` clean throughout, one milestone at a time as instructed.
  - **Not yet done, deliberately scoped as further milestones, not attempted in one
    pass:** full accessibility audit, full responsive audit across breakpoints,
    remaining screens not yet reviewed (auth screens, admin/consultant/dermatologist
    stubs), broader Tabs/Data Table/Calendar adoption where applicable. Flagged rather
    than rushed.
- ✔ Skeleton loading states consolidated onto shadcn's `Skeleton` — `Skeleton` itself
  was already installed and used on Dashboard/Recommendations/Progress; audited for
  remaining hand-rolled `animate-pulse` divs duplicating it and found 3: assessment
  skin-type's and concerns' loading grids, and `skin-profile-form.tsx`'s whole-form
  loading state. Replaced all three — same visual pulse animation, one shared
  component instead of four different hand-typed copies of `animate-pulse rounded-xl
  bg-muted`. Verified live (Playwright, caught mid-load): all three render identically
  to before. `npm run {lint,typecheck,build}` clean.
- ✔ **Bug fix: sign-out did nothing.** Root cause: the account dropdown's "Sign out"
  `DropdownMenuItem` (`glass-topbar.tsx`) had no `onClick` at all — purely decorative
  markup, never wired to `authClient.signOut()`. Fixed, plus found and fixed the same
  "looks clickable, does nothing" bug on the adjacent "Settings" item (now a real `Link`
  to the role's `/settings` nav entry from `lib/nav-config.ts`). New
  `lib/use-current-user.ts` (`useCurrentUser`) wraps Better Auth's real
  `authClient.useSession()`, replacing the hard-coded `userName="Alex Rivera"`-style stub
  every role layout still passes with the actual signed-in user's name/email/avatar —
  falls back to that stub name only while the session is loading or genuinely absent.
  Verified live: sign-out click → `POST .../sign-out` → `200 {"success":true}` →
  redirects to `/login` (took ~2-3s end to end in this session, not instant — the first
  Playwright check used too short a wait and looked broken until re-verified with a
  longer one and real network-response logging).
- ✔ Sidebar NavUser footer, matching `sidebar-07`'s own pattern (explicitly requested) —
  new `components/app-shell/nav-user.tsx`: avatar + name + email in the sidebar's
  bottom-left, `DropdownMenu` with Settings/Sign out, using the same `useCurrentUser`
  hook and the same real actions as the topbar's account menu (not a second, divergent
  implementation). Both surfaces now exist — the topbar's account menu already shipped
  and removing it wasn't asked for, this adds the sidebar-07 position alongside it.
  Collapses to just the avatar when the sidebar is collapsed to icons via
  `SidebarMenuButton`'s existing `overflow-hidden`/icon-size classes, no extra markup
  needed (same mechanism `sidebar-07`'s own `NavUser` relies on). Verified live:
  dropdown opens with real content, Settings/Sign out both work.
- ✔ **Bug fix: UI "taking long to render, slower than usual."** Not a code regression —
  root cause was environmental, accumulated over this very long single session: (1)
  orphaned `next dev`/`next-server` processes and two orphaned `backend_run.py`
  (uvicorn) processes left running from earlier verification passes that were never
  fully killed (confirmed this Claude Code session runs directly on the user's own Mac,
  not an isolated sandbox — `whoami`/`hostname` both resolved to the real machine — so
  every imperfectly-cleaned-up dev server from today was a real, resource-consuming
  process competing for CPU/memory); (2) `web/.next` had bloated to 881 MB from dozens
  of hot-reload cycles and hard `pkill` kills (not graceful shutdowns) across the
  session. Killed all stray processes (confirmed via `lsof` that ports 3000/8000 were
  clear), deleted `.next` entirely (safe, fully regenerable). Verified: a fresh `next
  dev` now serves `/dashboard` in ~100ms per request, vs. the multi-second feel before.
- ✔ Signup redirects to Skin assessment, not Skin profile — product-owner decision,
  2026-07-09. Was intentional, documented behavior (`docs/WIREFRAMES.md`'s Registration
  spec said "success → Skin profile", matching the code exactly) — user asked why, and
  on reflection preferred the guided assessment wizard as the actual onboarding step
  over landing straight on a plain form, since assessment results already offers
  "Complete your skin profile" as its own next action. Changed `web/app/signup/page.tsx`
  to `router.push("/assessment")` and updated `docs/WIREFRAMES.md` screen 2 to match —
  the doc is the source of truth, so it moved with the code, not after it. Login's own
  "success → Dashboard (or Skin profile if none exists yet)" spec was deliberately left
  alone — only Registration's target changed, this wasn't asked to extend further.
  Verified live (Playwright, mocked `/api/auth/sign-up/email` 200 response): full
  round-trip confirmed — POST fires, 200 returns, client-side navigation lands on
  `/assessment`. `npm run {lint,typecheck,build}` clean.
- ✔ **Assessment wizard now saves into the real skin-profile/lifestyle-log backend.**
  User asked directly: is the assessment wizard just asking the same questions as
  `/profile`? Answer: substantial real overlap (skin type, concerns, allergies,
  sensitivities, sleep, water, stress, sun exposure) but genuine shape mismatches
  (severity categorical vs. 1–10 numeric, priority via pick-order vs. an explicit
  slider, sensitivities as 3 fixed booleans vs. freeform tags, water in glasses vs.
  liters, sun exposure as a category vs. hours) and real gaps `/profile`'s lifestyle
  form asks that the wizard never does (gender, diet quality, exercise frequency,
  smoking, alcohol, pollution level, AC hours). Previously the wizard computed its
  client-side score estimate and then discarded every answer — finishing it and opening
  `/profile` asked the same questions from scratch. New `web/lib/assessment/save.ts`
  maps `AssessmentState` onto the real `SkinProfileCreate`/`LifestyleLogCreate` request
  shapes (documented per-field, including the approximations — e.g. sun-exposure
  category → representative hours, pick-order → a descending 1–10 priority scale) and
  `app/assessment/results/page.tsx` now POSTs both on reaching results
  (`POST /api/v1/skin-profiles`, `POST /api/v1/lifestyle-logs`), non-blocking so the
  results screen still renders from local state if the save fails, with a success/
  failure Sonner toast. Fields the wizard never asks are left `null`, not guessed —
  `/profile` still has real, non-redundant work to do. Corrected `docs/WIREFRAMES.md`
  screen 5, which described a stale photo-capture AI flow that matched neither the real
  Stitch wireframes (`assessment-{intro,step-1..4,results}.html`, all titled as a
  questionnaire, no camera/upload markup) nor the actual built wizard — rewrote it to
  describe the real 5-screen flow and this save behavior.
- ✔ **Bug fix (found live while verifying the save above): hydration mismatch on
  `/assessment/results`.** `AssessmentProvider`'s old lazy `useState` initializer read
  `sessionStorage` directly — fine on a client-side `<Link>` transition, but on any full
  page load/refresh landing on a mid-wizard or results screen, the server's HTML (no
  `window`, so `DEFAULT_STATE`) didn't match the client's first hydration render (real
  answers already in `sessionStorage`). React discarded and fully re-rendered the tree —
  caught by Playwright as a literal score flash (81 → 53) plus a hydration-mismatch
  console error, not by reading the code. Rewrote `web/lib/assessment/context.tsx` to
  back the wizard's state with a small external store (`useSyncExternalStore`, the same
  pattern `app/(user)/dashboard/page.tsx`'s `useGreeting` already uses for its own
  server/client mismatch): a fixed `SERVER_SNAPSHOT` for SSR and the first hydration
  pass, swapping to the real `sessionStorage` value synchronously right after — no
  hydration-mismatch warning, and (unlike an effect-based fix, which this repo's React
  Compiler lint rule flags as "setState synchronously within an effect") no wasted
  cascading render either. Added a `hydrated` flag to the context so the new
  save-to-profile effect above waits for real data instead of firing on
  `DEFAULT_STATE` before the provider's own sync completes. Verified live: no more
  hydration error, correct score renders immediately, wizard click-through
  (`/assessment/basics` → select answers → Continue → `/assessment/skin-type`) still
  writes real answers to `sessionStorage` via `update()`.
- ✔ **Dashboard/Progress chart code-splitting** (why pages "took long to render after a
  click," part 1). Root cause of the broader complaint, timed directly rather than
  guessed: Next.js dev-mode's per-route on-demand Turbopack compile — first visit to
  Dashboard took 3.3s, Progress 1.7s, cold; the same routes warm (already compiled) were
  ~250ms. Not a runtime bug, but Dashboard and Progress were both compiling
  recharts — this app's single heaviest dependency — as part of their own first-visit
  bundle even before a user had any score data to chart. New
  `components/charts/skin-score-trend-chart.tsx` consolidates the two screens'
  near-identical inline `AreaChart` blocks (`compact` for Dashboard's mini-chart, `full`
  for Progress's own trend chart) into one component, now `next/dynamic`-imported
  (`ssr: false`, `Skeleton` fallback) from both pages instead of statically imported —
  keeps recharts out of each route's own first-compile and initial JS payload. Verified:
  `npm run build` clean, live Playwright check confirms both chart variants render
  identically to before.
- ✔ **Progress range selector → real `ToggleGroup`** (UI pass via
  `.agents/skills/shadcn/`, requested explicitly). The 7D/30D/90D segmented control was
  a hand-looped `<button>` array with manual active-state `cn()` logic — exactly the
  anti-pattern `shadcn/rules/forms.md` calls out ("Option sets (2–7 choices) use
  ToggleGroup... don't manually loop Button components with active state"). Installed
  `toggle-group` via `npx shadcn@latest add toggle-group` (this project's base-nova
  preset, so single-select is `defaultValue`/`value` as a one-item array, not Radix's
  `type="single"` — see `shadcn/rules/base-vs-radix.md`). Kept the exact wireframe pill
  visual (`bg-muted` pill housing, `bg-secondary`/`text-secondary-foreground` active
  state) via `className` on `ToggleGroupItem`, guarded `onValueChange` against Base UI's
  single-select allowing a second click to deselect down to an empty array (would have
  left no range selected). Verified live: pixel-identical to the old buttons, real
  keyboard/ARIA group semantics gained, re-clicking the active pill correctly stays
  selected. `npm run {lint,typecheck,build}` clean throughout this whole batch.
- ✔ **Milestone 1 verification audit** (`audit/milestone-1-verification`) — this
  file's own "M1 functionally complete" claim was treated as unverified, not trusted.
  With Docker genuinely live this session (Postgres/Mongo/Redis/Elasticsearch all up,
  unlike prior sessions), four parallel research passes (database, backend, frontend,
  security) traced every M1 exit criterion in `docs/ARCHITECTURE.md` §13 against the
  real running stack, not static reading. 21 real findings, all fixed and
  re-verified live, 11 commits (one concern each):
  - **DB integrity**: Alembic was stuck one migration behind head while that
    migration's own `upgrade()` referenced a table (`products`) no earlier migration
    created — 17 live tables had never been captured in any migration at all, meaning
    a fresh install/CI database could never be stood up. Two new migrations close the
    gap, verified against a real scratch database (created, migrated, diffed, dropped)
    before touching live data. Also: a duplicate active `scoring_weights` row (new
    partial unique index prevents recurrence), `ingredients` reported seeded but
    actually empty (the idempotent seed script had never been re-run against this
    Postgres instance — now has), 3 MongoDB `lifestyle_logs` documents orphaned by
    deleted Postgres users (Mongo has no FK to catch this), missing documented Mongo
    indexes, and `user_profiles`' `email`/`role`/`is_active` drift columns (confirmed
    redundant with Better Auth's own `user` table before dropping).
  - **Security**: zero frontend route protection existed — confirmed live,
    unauthenticated `curl /dashboard` returned a full 200 page shell. New `proxy.ts`
    (Next 16 renamed the `middleware.ts` convention) closes this. Password reset was
    decorative (server-side `RESET_PASSWORD_DISABLED`, unhandled promise rejection, a
    dead `/reset-password` link) — now genuinely works end to end, verified with a
    real captured reset link followed through Better Auth's own token flow. Signup
    consent was validated client-side only and never persisted — added Better Auth
    `additionalFields`, verified a real signup lands a real timestamp + policy
    version. Rate limiting had a reserved comment and unused Redis wiring for months —
    now real, verified via a genuine 429 at request #301 of a burst. Also: security
    headers on the web app (`next.config.ts`), and a native Homebrew Redis silently
    shadowing Docker's (the exact same shadowing bug already fixed once for Postgres,
    recurring on a different service — stopped it).
  - **Frontend**: 7 of the User nav's 10 sidebar items led to a 404 (confirmed live);
    unbuilt items now render disabled with a "coming soon" state instead of a dead
    link, "Products" repointed at the real built Recommendations screen. Fixed a blank
    topbar title on `/profile`. Design-system cleanup: the shadcn skill's
    `space-y-*`/`space-x-*` ban was violated in ~70 places across 20 files (converted
    to `gap-*`, verified visually against a real session before/after); the primary
    button size didn't reach the documented 44px touch-target floor (now does).
  - **Backend & tests**: coverage was 60% overall but 19–32% on the actual business
    logic (scoring, routines, recommendations) — 47 new tests added against the real
    live databases (not mocked), in a rollback-safe transaction fixture verified to
    leave zero trace; surfaced two further real bugs (the Postgres engine and Mongo
    client were both unsafe to reuse across pytest-asyncio's per-test event loops).
    69 tests now pass (was 19). Also typed an untyped API response, deleted dead code
    in `app/ai/`, and reconciled `docs/CONVENTIONS.md`'s DB-naming section (it
    described `TIMESTAMPTZ`/`ix_`/`fk_`, the real schema has always used
    `TIMESTAMP`/`idx_`/auto-generated FK names) to describe real practice instead of
    fiction nobody followed.
  - **Deliberately left open, not oversights**: a full CSP (needs dedicated testing
    across the OAuth flow — a wrong one silently breaks sign-in), ADR-010's outbox
    table (doesn't exist anywhere despite the ADR's "day one" commitment — needs a
    decision, not a silent build), and full `Field`/`FieldGroup`/`InputGroup` adoption
    (installed, still unused on every form — a larger rewrite than the mechanical
    spacing fix this audit did complete).
  - Full report: see the audit artifact linked in the conversation that ran this.
    `ruff`/`mypy --strict`/`pytest` (backend) and `tsc`/`eslint`/`next build`
    (frontend) all clean throughout.
- ✔ **Milestone 1 foundation expansion — professional verification, admin platform,
  auth hardening, color rebalance** (`.claude/plans/validated-questing-firefly.md`),
  9 sequential feature branches, each `--ff-only`-merged to `dev` only after its own
  full verification pass:
  - **Branch 1 (`feature/database`)**: new `consultant_profiles`/
    `dermatologist_profiles` tables (1:1 with `"user"`, `ON DELETE CASCADE`,
    `verification_status` enum `pending|approved|rejected|more_info_requested|
    suspended|deactivated`), a polymorphic `verification_documents` table, and a
    general-purpose `audit_logs` table (the one place this schema uses `JSONB` —
    genuinely unstructured per-action metadata, unlike domain relational data).
    Real MinIO added to `docker-compose.yml` + a genuine `aioboto3` S3-compatible
    storage adapter (`backend/app/core/storage.py`) — not a stub, since
    `.env.example`'s `S3_*` vars already existed and MinIO is just another local
    container, not a blocked third-party account. Two hand-written Alembic
    migrations (`0f62a9b1cdf4`, `a7e9f4e50c45`).
  - **Branch 2 (`feature/authentication`)**: real (optional, not yet required —
    ADR-011's own caution stands) email verification using the same dev-log
    `sendResetPassword` pattern; Redis-backed account lockout reusing
    `app/core/rate_limit.py`'s fixed-window shape. Refresh-token rotation and MFA
    were reviewed and documented (not rebuilt) — the short-lived-JWT + Better Auth
    session-cookie mechanism was found sound, and `twoFactor` was confirmed to slot
    in later without restructuring `web/lib/auth.ts`.
  - **Branch 3 (`feature/rbac`)**: `require_verified_professional(*roles)` in
    `core/security.py` (checks JWT role *and* live `verification_status`, reserved
    for future M2+ operational endpoints — profile-management endpoints stay
    reachable while pending, on purpose). New `admin/router.py` verification-queue
    endpoints (list/view/approve/reject/request-info/suspend/deactivate), each
    `require_role("admin")` and each writing an `audit_logs` row. Role assignment
    wraps Better Auth's existing `set-role` admin action so it's audit-logged too,
    instead of being called directly and silently.
  - **Branch 4 / 5 (`feature/consultant-module`, `feature/dermatologist-module`)**:
    real `consultant_profile`/`dermatologist_profile` backend services (mirroring
    `skin_profile/`'s router/service/schemas/models anatomy) plus a genuinely new
    multi-step onboarding wizard for each (no wireframe existed for this — designed
    fresh against `docs/DESIGN.md`, reusing the `assessment/` step-tab pattern).
    Replaced both roles' dashboard smoke tests with a real state machine: no
    profile → onboarding; pending → locked dashboard (profile view/edit/document-
    upload/status only, every other nav item still `built: false`); approved →
    real operational dashboard shell.
  - **Branch 6 (`feature/admin-panel`)**: took Admin from a smoke test to a real
    platform, mapped onto the **fixed** 6-item admin nav (no new sidebar items
    invented) — Dashboard (real role counts + pending-verification count + recent
    `audit_logs` feed), Users (search/ban/unban/set-role via Better Auth's
    admin-plugin actions, now actually surfaced in UI, each audit-logged through a
    shared `web/lib/admin-audit-log.ts` helper), Users → Verification (the actual
    review queue + per-professional detail view with presigned document URLs),
    Content & Data (read-only product/ingredient list views over already-seeded
    data — full CRUD write endpoints stay explicit M3 scope, not silently skipped),
    Monitoring (filterable `audit_logs` table), System Reports/Settings (honest
    "coming soon" panels, same pattern as Progress Tracking's before/after-photos
    card — never a fake toggle).
  - **Branch 7 (`feature/ui-improvements`)**: targeted light-theme color rebalance
    responding to "colors feel slightly off, don't make it high-contrast" feedback
    — kept the Navy/Blue/Teal brand architecture and Frosted Lab Glass system
    intact (both load-bearing for the Score Ring/charts/score bands), rebalanced
    the neutral ramp (slate → zinc, less blue-tinted), split `on-surface` from
    `primary` (previously identical), and desaturated secondary/success/warning/
    error one notch off Tailwind's vibrant defaults. Dark theme and score bands
    deliberately untouched. Verified with live side-by-side screenshots before
    finalizing hex values, not guessed. Also closed the M1 audit's one deferred
    item: adopted `Field`/`FieldGroup`/`FieldLabel`/`FieldError` on every new
    onboarding/document-upload form (scoped to the new forms, not a retrofit of
    every existing M1 form in the same branch).
  - **Branch 8 (`feature/testing`)**: real-DB-fixture backend tests for every new
    endpoint and verification-state transition; a full cross-role Playwright e2e
    journey (`cross-role-verification-journey.spec.ts` — consultant submits, admin
    rejects with a reason, consultant resubmits, admin approves, consultant's
    dashboard unlocks, all through the real UI). Found and fixed a systemic
    suite-wide issue while adding it: Better Auth's rate limiter keys are always
    `{ip}|{path}`, shared across every spec file's real signups against the same
    IP — running the full suite in parallel (or even sequentially, since several
    older spec files never cleared it) produced real 429 cascades unrelated to any
    single test's logic. Fixed with a shared `tests/e2e/helpers.ts`
    (`clearRateLimits`/`deleteTestUser`/`promoteRole`) retrofitted into all 7
    real-auth spec files, plus `playwright.config.ts`'s `workers: 1`. Also found
    and fixed a real, silent account leak in `auth-hardening.spec.ts` (neither of
    its two tests had ever called cleanup, since Branch 2) and rewrote
    `app-shell.spec.ts`/`scaffold.spec.ts` from scratch against live-inspected DOM
    ground truth — both predated real implementations they no longer matched (a
    placeholder homepage, an app-shell before the real shadcn Sidebar landed).
  - **Deliberately deferred, tracked separately, not silently dropped**: a dynamic
    permission-matrix editor (no concrete case needs per-permission granularity
    yet — Role Management is a real assignment view, not a speculative ACL
    editor), the Consultant/Dermatologist *clinical* review workflow itself (the
    tables are ready, needs real assessment data to review against — M2+), and a
    real day-boundary bug found in `scores/service.py`'s `compute_and_store_score`
    (compares local-timezone `date.today()` against a UTC `calculated_at`,
    duplicate-scoring for ~5–6 hours daily near local midnight) — out of scope for
    this expansion (unrelated service), logged as its own standalone fix task, not
    fixed opportunistically mid-branch.
  - `ruff`/`mypy --strict`/`pytest` (backend) and `tsc`/`eslint`/`next build`
    (frontend) clean at every branch boundary; each branch's own live/e2e
    verification ran against the real Docker Postgres/Redis/MinIO stack before
    merging, not mocked.
- ✔ **`scores/service.py` day-boundary fix** (`fix/scores-day-boundary`, the standalone
  task the foundation expansion deliberately deferred) — `compute_and_store_score`'s
  same-day upsert check compared `calculated_at` (`server_default=func.now()`, the
  DB server's UTC clock) against `date.today()` (the app process's local timezone),
  producing a duplicate score row for ~5–6 hours daily whenever local time had
  crossed midnight but UTC hadn't. Now uses
  `datetime.datetime.now(datetime.UTC).date()` on both sides, matching
  `get_recent_scores`'s existing correct pattern in the same file. Reproduced live
  (the suite's own upsert test flaked exactly this way at 2026-07-10 03:00 UTC /
  08:30 local, before the fix) and confirmed stable after it; `ruff`/`mypy
  --strict`/`pytest` (151 tests) all clean.
- ✔ **Cross-role dashboard-redirect fix** (`fix/role-based-dashboard-redirect`) —
  `(user)/layout.tsx` predated Better Auth session wiring entirely: no session/role
  check at all (still hardcoded `userName="Alex Rivera"`), unlike the admin/consultant/
  dermatologist layouts which already gated on `session.user.role`. Combined with
  login's post-sign-in redirect defaulting to `/dashboard` regardless of who signed in
  (and every other layout's mismatched-role fallback also hardcoded to `/dashboard`),
  any admin/consultant/dermatologist account landing there was silently rendered as a
  plain User — found live when a freshly-promoted admin account was asked to "complete
  your skin profile." Fixed with a new `ROLE_HOME` map (`web/lib/nav-config.ts`) used by
  login's redirect and all four layouts' fallback. Verified live (admin account now
  lands on `/admin/dashboard`) and via the full e2e suite.
- ✔ **Signup page redesign** (`feature/signup-page-redesign`, superseding an earlier,
  smaller `feature/signup-ui-refinement` pass that was left un-merged and is now
  obsolete) — `web/designs/wireframes/signup-dark.html` used as inspiration only (per-
  role icon tinting, full-width role rows, the "OR CONTINUE WITH" divider), not copied:
  its two-step wizard (a separate role-selection screen, then a details screen) was
  deliberately not adopted since this app already has dedicated post-signup onboarding
  wizards for the two professional roles — a second, pre-signup wizard step would be
  redundant friction. Card widened (`AuthSplitLayout`'s new `formClassName`/
  `sectionClassName` props, login's own defaults unchanged) and spacing tightened at
  `lg:` so the full form fits 1366×768/1280×800 with zero vertical scroll, verified via
  Playwright, not estimated. Role selector rebuilt on Base UI's `RadioGroup`
  (`components/ui/radio-group.tsx`, new, customized to accept card-style children) as
  real full-width `role="radio"` rows — the old markup used `sr-only` native radios
  with no shared `name`, so arrow-key navigation never worked. Adopted
  `Field`/`FieldGroup`/`FieldLabel`/`FieldError` and Geist uppercase labels
  (`docs/DESIGN.md` §9's documented spec, previously unmet by login/signup); every
  required input now has a real `required` attribute (previously none did); fixed the
  input focus state to actually show the documented Royal Blue border (`border-none`
  meant no border could ever appear); fixed the "OR CONTINUE WITH" divider's
  `bg-transparent` label letting the rule line show through. Found and fixed two real,
  general CSS bugs at the shared component level along the way: native `<fieldset>`'s
  UA-stylesheet `min-width: min-content` (`components/ui/field.tsx`'s `FieldSet` now
  sets `min-w-0`) and CSS Grid's default `min-width: auto` on grid items (the role-row
  `RadioGroupItem`s now set it directly) — both caused real horizontal overflow on
  narrow viewports, invisible until a `FieldSet`/`RadioGroup` held something wider than
  a plain label+input. Same business logic throughout (still defaults to role `user`,
  same redirect-by-role, same consent gate). Full e2e suite green in both themes;
  `tsc`/`eslint`/build clean.
- ✔ **`main` brought current** — it was still the repository's very first commit (docs/
  schema scaffolding only, no `web/` app on it at all), 63 commits behind `dev`, because
  nothing had ever promoted work onto it. Fast-forwarded to match `dev` exactly and
  pushed; both branches are now on `origin` and identical.
- ✔ **Milestone 1 re-audit (Phase 1)** — a full engineering audit, not assumed
  complete: `tsc`/`eslint`/build (web) and `ruff`/`mypy --strict`/`pytest` (151 tests,
  backend) all clean; zero `TODO`/`FIXME`/`XXX` anywhere in the repo; every "coming
  soon" state confirmed genuinely out-of-scope and documented, not a silent gap;
  `web/lib/api-types.ts` confirmed byte-identical to a fresh `make openapi`
  regeneration (no drift); full e2e suite (14 specs × 2 themes) green end to end. Two
  real, concrete findings fixed: PROGRESS.md said the GitHub remote was both done
  (a Completed entry) and still pending (a contradicting Pending bullet + Next-task
  mention) — the stale half removed; and `user_profiles`'s own CRUD
  (`get_or_create_profile`/`update_profile`) had zero test coverage, the only service
  package with none — closed in the same pass that added the new appearance-
  preference tests (see below), not a separate afterthought.
- ✔ **Theme system (Phase 3)** — a full Appearance settings feature, not a dark-mode
  toggle: 8 named color palettes (Skinlytics Default, Emerald, Ocean, Lavender,
  Sunset, Slate, Rose, Forest), each with light **and** dark, switchable from
  Settings → Appearance for all four roles, instant (no refresh), persisted in
  Postgres, cached in `localStorage` for same-device instant paint. Full architecture
  rationale in `docs/DECISIONS.md` ADR-019 and the palette table in `docs/DESIGN.md`
  §2a — in short: a palette only re-points `primary`/`secondary`/`tertiary` (+ their
  `on-*`/`*-container` pairs) to different values; the Frosted Lab Glass system
  itself (glass, spacing, radius, typography, the Score Ring's gradient) and the
  semantic success/warning/error/score-band colors are untouched by any palette —
  every existing component already themes via these token names, so switching
  palettes needed zero component-level changes (confirmed live: the identical
  sidebar/topbar/chart/dialog markup re-colors automatically under every palette,
  both modes).
  - **Database**: new `user_appearance_preferences` table (migration
    `a1e009276345`), one row per user, any role — references `"user"` directly, not
    through the User-role-only `user_profiles`, since a Consultant/Dermatologist/
    Admin account needs a theme too. `accent_color`/`font_size`/`density`/
    `motion_preference` columns exist now (nullable, unused by the v1 UI) so those
    genuinely future settings don't need a second migration later.
  - **Backend**: `GET`/`PUT /users/me/appearance` + `POST /users/me/appearance/reset`
    (`app/services/user/` — schemas/service/router extended, not a new service
    package, since this is account-level metadata the User service already owns the
    adjacent concept for), all `require_user` (role-agnostic, like `/me`). 8 new
    service-level tests (real DB, rollback-wrapped) plus the profile-CRUD tests noted
    above. Verified live via real curl round trips (GET/PUT/reset/invalid-palette-
    rejected) against the running dev server before any frontend work started.
  - **Frontend**: `web/lib/themes.ts` (the fixed palette set + per-palette preview
    swatches, kept in lockstep with the backend's `PaletteId` and the migration's
    CHECK constraint), `components/providers/palette-provider.tsx` (a hand-rolled
    `data-palette` attribute manager with the same blocking-inline-script anti-flash
    technique `next-themes` uses internally for its own `light`/`dark`/`system` —
    which is otherwise completely unchanged, no reason to reinvent a solved problem),
    `components/app-shell/appearance-sync.tsx` (reconciles Postgres into local state
    once per authenticated mount — a new device/browser picks up the real saved
    preference instead of silently defaulting), and
    `components/settings/appearance-settings.tsx` (the actual UI: a `ToggleGroup`
    mode segmented control, a `RadioGroup`-based palette card grid reusing the same
    customized primitive the signup redesign built, a live "Saving…/Saved" indicator,
    loading/error states, a reset button — auto-saves on every change rather than a
    manual Save button, a deliberate call since appearance is a low-stakes,
    frequently-toggled preference). Mounted at `/settings` (User),
    `/consultant/settings`, `/dermatologist/settings` (both newly built — Settings
    flips from `built: false` to a real page), and folded into `/admin/settings`
    alongside its existing "coming soon" platform panels.
  - Found and fixed two real, general CSS bugs while building the palette card grid
    (same class as the signup redesign's fieldset/grid-item bugs, not a coincidence —
    both are "wide content inside a narrow flex/grid ancestor" cases): none new here,
    reused the already-fixed `FieldSet`/`RadioGroupItem` `min-w-0` fixes directly.
  - New e2e spec `tests/e2e/appearance-settings.spec.ts` — real signup → switch
    palette → instant re-theme (checked via the actual computed `--primary` CSS
    value, not just a snapshot) → direct Postgres check → switch mode → reload →
    both survive → reset → both survive, both themes. Caught two real test-authoring
    bugs before they could flake in CI: reloading before the background save
    confirmably landed, and a hardcoded light-mode hex checked after dark mode was
    already active — fixed by waiting for the real "Saved" indicator and by tracking
    which mode was active at each assertion, not by loosening the test.
  - `tsc`/`eslint`/build (web) and `ruff`/`mypy --strict`/`pytest` (159 tests,
    backend) all clean; full e2e suite (16 specs × 2 themes) green.
- ✔ **Authenticated landing header** (`feature/authenticated-landing-header`) —
  `components/landing/landing-navbar.tsx` (the public "/" page's header) had no
  session awareness at all: an already-authenticated visitor (e.g. clicking the
  sidebar's Skinlytics logo, which has always linked to "/") was shown Login/"Start
  free assessment" regardless, asking them to re-authenticate despite holding a
  valid Better Auth session. `lib/use-current-user.ts` — the same session hook
  `GlassTopbar`'s and `NavUser`'s account menus already use — is extended (not
  duplicated) with `role`/`isPending`, since the landing page has no parent
  role-layout to hand `role` down as a prop the way every authenticated shell does.
  While signed in, the navbar now shows a shadcn `DropdownMenu` account menu (name,
  email, Dashboard via `ROLE_HOME`, Skin Profile + Progress Tracking for `user` role
  only, Settings via the same `NAV_ITEMS[role]` lookup `GlassTopbar` already does,
  Sign out) instead of Login/Signup; unauthenticated visitors see the exact same
  experience as before, unchanged. Skin Profile also finally gives `/profile` a real
  nav entry point — tracked as Pending since Milestone 1 with no path to it beyond
  the post-signup redirect.
  A loading skeleton (not a guess at either state) covers the brief `isPending`
  window a hard refresh can show — an in-app `Link` click shares Better Auth's
  already-resolved client state, so this almost never appears there. Verified live,
  all named scenarios: fresh login, hard refresh (no flash), an injected
  invalid/garbage session cookie (falls back cleanly, zero crashes), logout (server
  session actually invalidated — confirmed a protected route redirects to `/login`
  immediately after, not just that the UI changed), and role-appropriate menu
  content (Admin sees Dashboard/Settings only; User additionally sees Skin
  Profile/Progress Tracking).
  New e2e spec `tests/e2e/authenticated-landing-header.spec.ts` (7 tests, real
  accounts, both themes) — found and fixed a real, pre-existing, unrelated bug while
  writing the "no console errors" check: `next/image` returns 400 ("isn't a valid
  image") for every hero/testimonial JPEG on the landing page
  (`public/images/landing/*.jpg`), reproducing with zero auth code involved at all —
  filtered out of this spec's own assertion (documented inline) and logged as its
  own separate follow-up below, not fixed in this pass (out of scope for a header
  change). `tsc`/`eslint`/build clean; full e2e suite (22 specs × 2 themes) green.
- ✔ **Authenticated landing hero/final-CTA** (`feature/authenticated-landing-ctas`)
  — the header fix above didn't cover the rest of "/": `components/landing/
  hero-section.tsx`'s "Get started free" and `final-cta-section.tsx`'s "Start
  assessment" still sent an already-signed-in visitor back into the signup flow
  they'd already completed. Both are now `"use client"` and call the same
  `useCurrentUser()` hook the header/`GlassTopbar`/`NavUser` already share — signed
  in, both buttons become "Go to Dashboard" (via `ROLE_HOME[role]`); signed out,
  unchanged. A `Skeleton` (matched to each section's own background —
  `bg-white/20` on final-CTA's dark `primary-container` band) covers the same brief
  `isPending` window the header already handles, for the same reason.
  Two real, unrelated bugs found and fixed while wiring this up:
  - `app/globals.css` had a stray literal `*/` inside a `/* ... */` comment written
    during the earlier theme-system work (`--on-*` immediately followed by
    `/--*-container` in prose) — this silently prematurely closed the comment.
    Production `next build`/`next start` tolerated it; `next dev` (Turbopack) did
    not, failing every request to `/` with a hard 500
    (`Parsing CSS source code failed ... Unexpected token Delim('*')`). Found by
    running `next dev` for the first time this pass while chasing the bug below.
    Fixed by rephrasing the comment so no literal `*/` substring survives.
  - Adding two more independent `useCurrentUser()` consumers to a statically
    prerendered route ("/" has no per-request context at build time, so
    `isPending` freezes `true` forever in the static HTML) exposed a real React
    hydration mismatch (minified error #418): depending on exactly when
    `authClient.useSession()`'s underlying store resolves relative to React's
    hydration pass, a real browser's very first client render could already
    disagree with the frozen static skeleton — a race no authenticated role layout
    ever hits, since those already gate their whole subtree on one `isPending`
    check before rendering `GlassTopbar`/`NavUser` at all. Fixed inside the shared
    `lib/use-current-user.ts` itself (not per-consumer) via `useSyncExternalStore`
    — its server-snapshot argument is the primitive React ships specifically for
    "must match the frozen build-time render on the very first client pass,"
    reporting real data only once React itself confirms hydration is done. (A
    first attempt used the older manual `useState` + `useEffect(() => setMounted
    (true), [])` "mounted gate" pattern `next-themes` popularized — functionally
    equivalent, but `eslint-plugin-react-hooks`' `set-state-in-effect` rule
    correctly flags synchronous `setState` in an effect body as unnecessary here,
    since `useSyncExternalStore` covers this exact case without one.)
  New e2e test added to `authenticated-landing-header.spec.ts` (hero/final-CTA
  buttons: signup-linked for anon, "Go to Dashboard" ×2 for a signed-in visitor,
  both themes) — also surfaced that shadcn's `Button` with `render={<Link>}`
  exposes `role="button"` in the accessibility tree, not `role="link"`, matching
  the same gotcha already logged below. `tsc`/`eslint`/build clean; full e2e suite
  (23 specs × 2 themes) green.

## Partially Completed

- ◐ `docker-compose.yml` — `minio` now added (Branch 1); still missing `web`, `api`,
  `worker` services. `backend/` and `web/` now exist so this is unblocked, but adding
  Dockerfiles/compose entries needs verification against a real Docker daemon first.
- ◐ `app/services/ingredients/` — now has a real, live-verified **read-only** API
  surface (`GET /admin/ingredients`, admin-only, added in Branch 6), but no
  standalone ingredients router, no write endpoints, and no consumer-facing (User
  role) routes yet — full CRUD stays explicit M3 scope, not silently skipped.

## Pending

- ☐ Two small support branches (`base/pre-login-role-redirect`,
  `fix/login-role-redirect`) are pushed to `origin` backing a standalone,
  already-open PR that isolates just the login-redirect fix for focused review — not
  merged/closed yet (no `gh` CLI in this sandbox to check status), so left alone
  rather than deleted during branch cleanup.
- ☐ **Nav entry point for `/profile` — partially resolved.** It's now reachable from the
  landing page's authenticated account menu (`components/landing/landing-navbar.tsx`,
  "Skin Profile") — one of the options this bullet already named. Still not in
  `AGENTS.md`'s User sidebar nav list itself, so it's unreachable from inside the
  authenticated app shell (only from "/"); adding it there would need an `AGENTS.md`
  nav-list update, a bigger, deliberate call this pass didn't make unprompted.
- ☐ **`next/image` returns 400 for every landing-page hero/testimonial JPEG**
  (`public/images/landing/*.jpg`, "The requested resource isn't a valid image") —
  found while adding `authenticated-landing-header.spec.ts`'s console-error check,
  reproduces with zero auth/session code involved (unauthenticated visit alone
  triggers it). The files themselves report valid JPEG headers/dimensions via `file`,
  so this is either a stricter validation failure inside Next's `sharp`-based
  optimizer or a `sharp`/native-binary issue specific to this sandbox — not
  diagnosed further, out of scope for a header-focused change.
- ☐ Playwright e2e coverage for the skin profile & lifestyle, assessment, dashboard,
  recommendations, and progress screens — all verified manually (real browser, both
  themes; mocked-API for the three newest), no automated test suite written yet, unlike
  the app-shell/auth screens' coverage.
- ☐ Full product/ingredient seeding from Kaggle (the real ingestion pipeline, not the
  curated placeholder set in `seed.py`, which *is* idempotent and now actually run
  against the live DB — see the Milestone 1 audit entry) is separate, larger scope
  (`docs/DATASETS_AND_APIS.md`) blocked on a Kaggle API token.
- ☐ `api`/`web` Dockerfiles + docker-compose entries — needs a Docker-available session
- ☐ **OpenWeather/OpenUV adapters never built** — `backend/app/integrations/` is empty
  (just `__init__.py`), despite `docs/DATASETS_AND_APIS.md`'s own milestone mapping
  naming this as M1 scope ("wire OpenWeather/OpenUV adapters (cached)"). Blocked on
  missing `OPENWEATHER_API_KEY`/`OPENUV_API_KEY` (confirmed blank in `.env`) — same
  class of external-credential blocker as the Kaggle item above, not a code gap.
  Topbar's weather/UV chip is already an honest stub (`—`), not faked. Found during the
  Milestone 1 audit; wasn't tracked here before that.
- ☐ **ADR-010's outbox table doesn't exist** — the ADR commits to it existing "from M1,
  day one" regardless of whether the worker consumes it yet, but no `outbox` table
  appears anywhere (not the SQL schema doc, not a migration, no model). Elasticsearch/
  vector DB are correctly, deliberately unwired for M1 (no consumers exist), but the
  table itself was promised independent of that. Needs a decision: add a minimal table
  now (cheap, no consumer required to exist), or formally push this specific ADR-010
  sub-promise to M2 alongside the worker in a new ADR note — not resolved silently
  either way. Found during the Milestone 1 audit.
- ☐ Graphify setup (ADR-006) — explicitly deferred by product owner, revisit later
  (2026-07-08 decision, see Known Issues)
- ☐ Consultant/Dermatologist *clinical* review workflow — `consultant_clients`/
  `consultant_notes` tables exist and are ready, but their UI needs real assessment
  data to review against (M2+ territory); the identity/onboarding/verification layer
  they'll sit behind is now real (see Completed).
- ☐ A dynamic permission-matrix editor — deliberately not built; the fixed 4-role
  model has no concrete case requiring per-permission granularity yet. Role
  Management is a real role-*assignment* view (Better Auth's `set-role`), not a
  speculative ACL editor.

## Folder structure

Real, current tree captured in `project_docs/milestone_1/04-folder-structure.md` —
`docs/CONVENTIONS.md` §"Repository layout" is the forward-looking target and has drifted
on a few points (see that file's own notes on route-group vs. real-folder role prefixes).
`ml/` and `graphify-out/` still don't exist (M2+ / deferred, ADR-006).

## Backend status

`app/services/{user,skin_profile,scores,routines,recommendations,progress,
consultant_profile,dermatologist_profile,admin}/` are all real, working,
live-verified services. `app/services/ingredients/` has a real read-only API surface
(admin-only, see Partially Completed) but no standalone router or write endpoints yet
(M3 scope). Every User-role domain endpoint enforces `require_role("user")`; every new
admin endpoint enforces `require_role("admin")` and writes an `audit_logs` row;
`require_verified_professional(*roles)` exists in `core/security.py` for future M2+
operational endpoints. `app/core/storage.py` is a real `aioboto3` MinIO/S3 adapter
(Branch 1), reused by verification-document upload and ready for profile
images/progress photos later. `app/ai/` has the stub seeding helper + AI-contract
schemas the recommender uses; no service package is empty except `integrations`. Seven
hand-written Alembic migrations exist (`50e82a643bf9` baseline, `ccb49f9b0f47`
ingredients, `44cfa8e6d5d4` products/routines/scoring, `0f62a9b1cdf4` professional
verification, `a7e9f4e50c45` consulting/notifications/billing, `c21b3568fc1a` drop
`user_profiles` identity drift, `a1e009276345` appearance preferences) — all applied
against the live Docker Postgres.
159 backend tests pass (`ruff`/`mypy --strict`/`pytest`), the large majority added
during the foundation-expansion phase's real-DB-fixture pattern (`tests/conftest.py`'s
`db_session`/`test_user_id`, rollback-safe, verified to leave zero trace) rather than
`dependency_overrides` mocking — Postgres/Mongo/Redis/MinIO are all live in Docker and
were used directly for this phase's tests.

## Frontend status

All 7 Milestone 1 (User-role) screens remain real, wired, built screens: Login,
Signup, User Dashboard, Skin Profile & Lifestyle, Skin Assessment (5-step wizard +
results), Product Recommendations, Progress Tracking. Beyond that, the foundation
expansion made the other three roles real too: Consultant and Dermatologist each have
a genuine onboarding wizard + locked/pending dashboard + approved-dashboard state
machine (Branches 4–5); Admin has a full 6-nav-item management platform — Dashboard,
Users (+ Verification queue/detail), Content & Data, Monitoring, System Reports,
Settings — all `built: true` in `web/lib/nav-config.ts` (Branch 6). Light-theme color
tokens were rebalanced (zinc neutrals, split on-surface/primary, desaturated
secondary/semantic colors — Branch 7, dark theme untouched); `Field`/`FieldGroup`
adopted on every new onboarding/document-upload form, closing the M1 audit's one
deferred item for those forms specifically. `lib/api.ts`/`lib/api-types.ts` cover the
current backend surface including the new admin/consultant/dermatologist-profile
routes. Design assets remain in `web/designs/wireframes/` (83 files) as the build
reference for the original 7 screens; the onboarding wizards, verification queue, and
locked-dashboard states have no wireframe counterpart and were designed fresh against
`docs/DESIGN.md`, per the expansion plan's own note. Signup was later fully redesigned
(see Completed) using `web/designs/wireframes/signup-dark.html` as inspiration only, not
a copy; `Field`/`FieldGroup` now covers it too, not just the onboarding wizards.
`components/ui/radio-group.tsx` is a new shared primitive (shadcn's Base UI RadioGroup,
customized to accept card-style children) — reusable for any future "choose one of N"
picker, not signup-specific (reused as-is for the theme system's palette grid below).
Settings is now real for all four roles (Phase 3) — `/settings`, `/consultant/settings`,
`/dermatologist/settings` all newly built, `/admin/settings` extended — each rendering
`components/settings/appearance-settings.tsx`, the app's first genuinely cross-role
shared feature UI (identical component, different route per role's `AppShell`).

## Database status

**Postgres runs in Docker (`docker-compose.yml`'s `postgres` service) and is
genuinely the system of record** — live, populated, and at `alembic upgrade head`
(`a1e009276345`, seven migrations deep — see Backend status), 37 tables total including
the foundation-expansion's `consultant_profiles`/`dermatologist_profiles`/
`verification_documents`/`audit_logs` and Phase 3's `user_appearance_preferences`.
MinIO is also live in Docker
(`skinlytics-minio-1`) and genuinely holds verification documents via
`core/storage.py`'s presigned-URL flow, not a stub. **This wasn't always true**: for
part of an earlier session, a native Homebrew Postgres 14
(`brew services`) was silently shadowing `localhost:5432` and was the database the app
actually talked to; Docker's Postgres container was an unused decoy. Discovered when a
Docker VM corruption (disk-full event, see `run.py`'s Completed entry) left Docker's
container empty and made it *look* like real data had been lost — it hadn't. Resolved
by `pg_dump`/`pg_restore`-migrating the real data (2 real users + all session data,
verified row-for-row) into Docker's Postgres, then `brew services stop postgresql@14`
(confirmed it no longer auto-starts — `brew services list` shows `none`). If a future
session finds Postgres behaving unexpectedly again, check `lsof -i :5432` first — don't
assume Docker's container is what's actually being talked to. **Redis is live**
(confirmed via the recommendation-cache round-trip this session). **MongoDB is live**
(confirmed via real `lifestyle_logs` writes this session).

Known schema drift, not yet cleaned up: live `user_profiles` has 3 columns
(`email`/`role`/`is_active`) absent from the documented v3 schema — see "Completed" for
the full story; preserved through the `pg_dump`/`pg_restore` migration above.
`docker-compose.yml` can also bring up empty containers for a from-scratch setup, but
that's not what's running now.

## Known issues / open decisions

- Graphify (ADR-006) setup is deferred by explicit product-owner decision on 2026-07-08 —
  do not stand it up until asked, even though ADR-006 marks it "Accepted." No manual
  `docs/context/` context-graph files are being maintained in the interim either; treat
  this as an open gap, not a resolved alternative.
- `docker-compose.yml` still doesn't include `worker`/`web`/`api` (`minio` was added in
  the foundation expansion's Branch 1) — add when the scaffolds and outbox worker
  (ADR-010) land.
- **Dark-mode token gap: resolved**, this bullet was stale — `docs/DESIGN.md`'s
  `colors-dark:` frontmatter is now a full v3 "Deep Diagnostic Suite" palette with real
  designer values for every `*-container`/`on-*-container`/`surface-*`/`inverse-*`
  token (its own comment notes it "supersedes the v2 mechanically-derived extension
  tokens" this bullet used to flag), and `web/app/globals.css`'s `.dark` block consumes
  them directly, no derivation. The foundation expansion's Branch 7 color work only
  touched the *light* theme, so this v3 dark palette is what every new professional/
  admin screen already renders against.
- `docs/WIREFRAMES.md` and `docs/CONVENTIONS.md` reference `web/design/wireframes/`
  (singular); the real folder is `web/designs/wireframes/` (plural). Doc typo, not a code
  issue — used the real path.
- `npm audit` reports 2 moderate findings, both in Next.js's own transitive `postcss` dep;
  no fix available without downgrading Next itself. Monitor for a Next.js patch release,
  not actionable now.
- shadcn's current CLI generates the `base-nova` preset on `@base-ui/react` (not
  `@radix-ui/react-*`) — a newer shadcn architecture than older docs/training data
  describe. Relevant if adding more `components/ui/*` later: check the actual generated
  file, don't assume Radix primitives/props.
- This dev sandbox has a small/constrained temp partition separate from the main disk —
  `brew install <anything that builds from source>` can exhaust it (hit this installing
  `uv` via a source-built `rustc` dependency; fixed by using the official
  `curl -LsSf https://astral.sh/uv/install.sh | sh` installer instead, which ships a
  precompiled binary). Prefer precompiled installers over `brew install` for build-heavy
  formulas in this environment.
- Docker isn't installed in the Claude Code sandbox, but is available and working on the
  maintainer's actual Mac (see `run.py`'s Completed entry and "Database status" above) —
  `api`/`web` containerization can now be written and verified there.
- **Route collision, resolved:** `docs/CONVENTIONS.md`'s route tree shows
  `(user)/dashboard`, `(consultant)/…`, `(dermatologist)/…`, `(admin)/…` as route groups,
  but Next.js route groups add no URL segment — four roles each having their own
  `/dashboard` would collide. Decided with the user: User stays bare (`(user)/` is a true
  route group), the other three roles get a real URL prefix (`app/consultant/`,
  `app/dermatologist/`, `app/admin/` — not parenthesized). `CONVENTIONS.md`'s route tree
  is now stale on this point and should be corrected next time it's touched.
- Playwright + `curl` occasionally failed with `command not found` inside `for` loops in
  this sandbox's shell (worked fine as standalone commands). Root cause not identified;
  workaround is running commands individually rather than in a loop when this happens.
- **`web/lib/api-types.ts` goes stale silently** — it's a committed, generated file, but
  nothing fails loudly if a backend route changes shape and `make openapi` isn't re-run;
  it was found stale this session (missing every route added after the initial scaffold)
  only because a new screen's build needed a type that didn't exist. Re-run
  `make openapi` as a matter of habit after any backend router change, not just when a
  frontend build actually fails.
- No `gh` CLI in this Claude Code sandbox session (PR creation/GitHub API calls aren't
  available directly) — Docker **is** available and running here as of the foundation
  expansion (Postgres/Redis/MongoDB/Elasticsearch/MinIO all live), superseding the
  earlier "no Docker in this sandbox" state; the whole 9-branch expansion was
  live-verified against this real stack, not mocked.
- **Better Auth's rate limiter is IP-scoped, not path-scoped in isolation** —
  `createRateLimitKey` always produces `{ip}|{path}`, but every Playwright spec file
  hitting the same local IP shares that ceiling across files. A full e2e suite run
  needs every real-auth spec to call `clearRateLimits()` (`tests/e2e/helpers.ts`)
  before its own signups/signins, and `playwright.config.ts` needs `workers: 1` — the
  whole suite shares one real backend, not isolated per-worker state. Any new e2e spec
  file that signs a real account up/in must follow this pattern from the start.
- **shadcn `Button` with `render={<Link>}` exposes `role="button"` in the
  accessibility tree, not `role="link"`**, even though it navigates — hit repeatedly
  writing Playwright selectors during the foundation expansion. Use
  `getByRole("button", ...)` for these, not `getByRole("link", ...)`.

## Next task

All 11 original Milestone 1 tasks, the 9-branch foundation expansion (professional
verification workflow, admin management platform, auth hardening, color rebalance,
cross-role e2e coverage), the one standalone bug it deferred (`scores/service.py`'s
day-boundary fix), a real cross-role dashboard-redirect bug (`(user)/layout.tsx` had no
session/role gate at all — any admin/consultant/dermatologist account landing on
`/dashboard` got silently rendered as a plain User; fixed via a new `ROLE_HOME` map used
by login's redirect and every layout's mismatched-role fallback), and a complete signup
page redesign (wider card, a real full-width `role="radio"` selector replacing an
ungrouped `sr-only` native radio, Geist labels, real `required` attributes, a fixed
input-focus border, along with two genuine CSS bugs found and fixed at the shared
component level — `<fieldset>`'s UA-stylesheet `min-width: min-content` and CSS Grid's
default `min-width: auto` on grid items), a from-scratch Milestone 1 re-audit (Phase 1
— tsc/eslint/build, ruff/mypy --strict/pytest, zero TODO/FIXME/XXX, a real PROGRESS.md
self-contradiction fixed, a real test-coverage gap closed), a complete Theme system
(Phase 3 — 8 light+dark color palettes, Settings → Appearance for all four roles,
Postgres-backed, instant no-refresh switching), and the authenticated landing header
fix (an already-signed-in visitor no longer sees Login/Signup on "/" — a real
`DropdownMenu` account menu instead, reusing the same session hook the app shell's own
account menus already use) are done and merged to `dev`/`main` (`main` was also
fast-forwarded to `dev` and both pushed to `origin` this pass — it had been the repo's
very first commit, 63 commits stale, with no `web/` app on it at all). Nothing
outstanding is a code gap anymore — everything left is either an external-credential
blocker (Kaggle, OpenWeather/OpenUV) or an explicit scope decision (ADR-010's outbox
table, `/profile`'s sidebar nav entry point, `api`/`web` Dockerfiles, the theme
system's own `accent_color`/`font_size`/`density`/`motion_preference` placeholders —
columns and API round-trip exist, no UI consumes them yet) — plus one newly-found,
separately-tracked bug (`next/image` 400s on the landing page's own hero/testimonial
JPEGs, unrelated to auth). The natural next *feature* milestone is M2 — real skin
assessment (replacing the client-side ADR-007 stub), routine-generation refinement, the
first real scoring/recommendation
models behind the same API contracts, and the Consultant/Dermatologist clinical review
workflow now that the identity/verification layer it depends on is real — user's call
on sequencing.
