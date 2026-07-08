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

## Partially Completed

- ◐ `docker-compose.yml` — missing `web`, `api`, `minio`, `worker` services. `backend/`
  and `web/` now exist so this is unblocked, but adding Dockerfiles/compose entries needs
  verification against a real Docker daemon first (not available in this session).

## Pending

- ☐ Individual M1 screens (login, registration, dashboard, profile/lifestyle, assessment,
  recommendations, progress) — each its own `feature/frontend-<screen>` branch. Login/
  registration have no shell (standalone glass cards) — the app shell doesn't apply.
- ☐ Better Auth wiring (registration, login, sessions, JWT/JWKS)
- ☐ RBAC (`createAccessControl`, `require_role` dependency)
- ☐ User profile module
- ☐ Lifestyle tracking module
- ☐ Initial dataset seed (products/ingredients from Kaggle + curated INCIDecoder/COSDNA
  references, per `docs/DATASETS_AND_APIS.md`)
- ☐ Real Postgres/MongoDB instances provisioned + first Alembic migration (waits on the
  first service owning tables — e.g. User/Auth glue or Skin Profile)
- ☐ `api`/`web` Dockerfiles + docker-compose entries — needs a Docker-available session
- ☐ Graphify setup (ADR-006) — explicitly deferred by product owner, revisit later
  (2026-07-08 decision, see Known Issues)

## Folder structure

Matches `docs/CONVENTIONS.md` §"Repository layout" — not reproduced here to avoid drift;
read that file for the target tree. Actual current state: only `docs/`,
`database_schemas/`, `web/designs/` (wireframes only, not the Next.js app), and root
config files exist. `backend/`, `web/app`, `ml/`, `graphify-out/` do not exist yet.

## Backend status

Scaffold complete (`backend/` — FastAPI, `uv`, SQLAlchemy async/Mongo/Redis wired,
Alembic ready). No services implemented yet — `app/services/` is an empty package. No
routes exist under `/api/v1` beyond the empty router; `/health` is the only live
endpoint. Waits on the Authentication/RBAC/User-Profile/Lifestyle-Tracking tasks to add
real services.

## Frontend status

Scaffold + app shell complete (`web/` — Next.js 16 / React 19 / Tailwind v4 / shadcn/ui).
`app/page.tsx` is still a scaffold smoke test, not a designed screen — no real M1 screens
built yet, just one stub `dashboard/page.tsx` per role proving the shell. No Better Auth
wiring, no `lib/api.ts` (waits on backend OpenAPI spec), no visible role-switching (role
is hardcoded per route-group layout until real sessions exist). Design assets remain in
`web/designs/wireframes/` (83 files) as the build reference.

## Database status

Schemas fully designed (`database_schemas/`) but not applied — no live Postgres/MongoDB
instances have the schema loaded, no Alembic migration history, no Better Auth CLI output.
`docker-compose.yml` can bring up empty Postgres/Mongo/Redis/Elasticsearch containers.

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
- Docker isn't installed in this dev sandbox — `api`/`web` containerization needs a
  session where it's available (or the user's own machine) to write and verify.
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

A service module — User/Auth glue is the natural first one, since Authentication is next
on the milestone-1 checklist and needs `app/services/user/`. Individual M1 screens
(dashboard, profile/lifestyle, etc.) are the other frontend follow-on, now that the shell
exists to build them inside.
