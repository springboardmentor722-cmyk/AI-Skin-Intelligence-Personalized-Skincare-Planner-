# Skinlytics — Progress

Canonical task-state doc, per `docs/CONVENTIONS.md` and `docs/ARCHITECTURE.md`'s doc map.
Update this in the same PR as any completed task. Session context should read this file
first, then the rest of `docs/`.

**Current milestone:** M1 (weeks 1–2) — architecture, DB schema, wireframes, env setup,
Better Auth + RBAC, profile & lifestyle modules, seed data. No AI (ADR-007).

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

## Partially Completed

- ◐ `docker-compose.yml` — missing `web`, `api`, `minio`, `worker` services. `backend/`
  and `web/` now exist so this is unblocked, but adding Dockerfiles/compose entries needs
  verification against a real Docker daemon first (not available in this session).

## Pending

- ☐ Individual M1 screens (dashboard, assessment, recommendations, progress) — each its
  own `feature/frontend-<screen>` branch. Login/registration/forgot-password/skin
  profile & lifestyle are done.
- ☐ Nav entry point for `/profile` — not in `AGENTS.md`'s User nav list; currently only
  reachable via the post-registration redirect. Needs a product decision (account menu
  item? part of onboarding only? add to the nav list?), not a guess.
- ☐ Playwright e2e coverage for the skin profile & lifestyle screen — verified manually
  this session (including the 4 real bugs found and fixed), no automated test written
  yet, unlike the app-shell/auth screens' coverage.
- ☐ RBAC fine-grained ACL matrix (`web/lib/permissions.ts` currently only declares the
  four roles; per-resource/action permissions are this task's job, not Authentication's)
- ☐ Idempotent seed script (`make seed`) for `skin_types`/`skin_concerns` — currently
  only seeded because they were part of the user's direct SQL load, not from any script
  in this repo. Product/ingredient seeding from Kaggle is separate, larger scope
  (`docs/DATASETS_AND_APIS.md`).
- ☐ Verify `alembic upgrade head` against a genuinely fresh/empty database — only
  `alembic stamp` (zero DDL) has been run, against the live pre-populated database.
- ☐ MongoDB verification — start it (`docker compose up -d mongo` or `make up`) and
  confirm `lifestyle-logs` endpoints work for real; only typecheck/lint cover them now.
- ☐ `api`/`web` Dockerfiles + docker-compose entries — needs a Docker-available session
- ☐ Graphify setup (ADR-006) — explicitly deferred by product owner, revisit later
  (2026-07-08 decision, see Known Issues)

## Folder structure

Matches `docs/CONVENTIONS.md` §"Repository layout" — not reproduced here to avoid drift;
read that file for the target tree. `backend/` and `web/` are both real now (see status
sections below); `ml/` and `graphify-out/` still don't exist (M2+ / deferred, ADR-006).

## Backend status

`app/services/user/`, `app/services/skin_profile/`, `app/services/scores/`,
`app/services/routines/`, `app/services/recommendations/`, `app/services/progress/` are
real, working, live-verified services (see "Completed" above). `app/ai/` has the stub
seeding helper + AI-contract schemas the recommender uses; no service package is empty
except `integrations`. First Alembic migration exists and is stamped against the live
database — `env.py` now imports every service's models, so `alembic revision
--autogenerate` is a meaningful (not vacuous) drift check. Verified end-to-end against a
real Postgres + Mongo + Redis this session.

## Frontend status

Scaffold + app shell + Authentication + typed API client complete (`web/` — Next.js 16 /
React 19 / Tailwind v4 / shadcn/ui / Better Auth / TanStack Query / `openapi-fetch`).
`app/page.tsx` is now the real public landing page (see "Completed"), replacing the
scaffold smoke test. Login/register/forgot-password/skin profile & lifestyle are real,
wired, live-verified screens; every M1 *app* screen (dashboard, assessment,
recommendations, progress) is still just a stub `dashboard/page.tsx` per role proving
the shell — their backends now exist (scores/routines/recommendations/progress
services) but no frontend has been built against them yet. `lib/api.ts` +
`lib/api-types.ts` now exist and are proven against the live backend. No visible
role-switching (role is hardcoded per route-group layout until real sessions replace the
stub `userName` in each layout). Design assets remain in `web/designs/wireframes/`
(83 files) as the build reference.

## Database status

**Postgres runs in Docker (`docker-compose.yml`'s `postgres` service) and is now
genuinely the system of record** — live and populated (all 32 v3 tables +
Better Auth identity tables), `alembic_version` stamped at `50e82a643bf9`. **This
wasn't always true**: for most of this session, a native Homebrew Postgres 14
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
- `docker-compose.yml` doesn't yet include `minio`/`worker`/`web`/`api` — add when the
  scaffolds and outbox worker (ADR-010) land.
- **Dark-mode token gap:** `docs/DESIGN.md`'s `colors-dark:` frontmatter doesn't define
  `*-container`/`on-*-container`/`surface-dim`/`surface-bright`/`inverse-*`/`surface-tint`
  for dark mode. `web/app/globals.css` derives these mechanically (reusing only hex values
  already in DESIGN.md, via the same light/dark swap pattern the primary color already
  uses) and comments each derived line. **Needs design/product-owner confirmation before
  a real screen ships on dark mode** — verified visually OK for the current smoke test,
  but not verified against a real dense screen (tables, forms).
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

## Next task

Skin profile & lifestyle is done and live-verified end to end (Postgres path). Natural
next steps: starting MongoDB to verify `lifestyle-logs` for real (the one part of this
task not live-tested), a nav entry point decision for `/profile`, RBAC's fine-grained
ACL matrix, or the next M1 screen (dashboard is the obvious one — real data sources
exist for parts of it now) — user's call.
