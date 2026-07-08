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

## Partially Completed

- ◐ `docker-compose.yml` — missing `web`, `api`, `minio`, `worker` services (added as
  those scaffolds land; `minio` needed once file-storage-dependent modules start)

## Pending

- ☐ Backend scaffold (`backend/` — FastAPI modular monolith, per `docs/CONVENTIONS.md`)
- ☐ App shell (glass sidebar/topbar, theme toggle, role-based nav) — `docs/WIREFRAMES.md`
- ☐ Individual M1 screens (login, registration, dashboard, profile/lifestyle, assessment,
  recommendations, progress) — each its own `feature/frontend-<screen>` branch
- ☐ Better Auth wiring (registration, login, sessions, JWT/JWKS)
- ☐ RBAC (`createAccessControl`, `require_role` dependency)
- ☐ User profile module
- ☐ Lifestyle tracking module
- ☐ Initial dataset seed (products/ingredients from Kaggle + curated INCIDecoder/COSDNA
  references, per `docs/DATASETS_AND_APIS.md`)
- ☐ Real Postgres/MongoDB instances provisioned + Alembic migrations applied
- ☐ Graphify setup (ADR-006) — explicitly deferred by product owner, revisit later
  (2026-07-08 decision, see Known Issues)

## Folder structure

Matches `docs/CONVENTIONS.md` §"Repository layout" — not reproduced here to avoid drift;
read that file for the target tree. Actual current state: only `docs/`,
`database_schemas/`, `web/designs/` (wireframes only, not the Next.js app), and root
config files exist. `backend/`, `web/app`, `ml/`, `graphify-out/` do not exist yet.

## Backend status

Not started. No `backend/` directory, no `pyproject.toml`/`requirements.txt`.

## Frontend status

Scaffold complete (`web/` — Next.js 16 / React 19 / Tailwind v4 / shadcn/ui). No real
screens yet — `app/page.tsx` is a scaffold smoke test only, not a designed screen. No app
shell, no Better Auth wiring, no `lib/api.ts` (waits on backend OpenAPI spec). Design
assets remain in `web/designs/wireframes/` (83 files) as the build reference.

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

## Next task

Backend scaffold (`backend/` — FastAPI modular monolith) is next up per the user's
milestone-1 checklist; app shell / individual M1 screens are the frontend follow-ons.
