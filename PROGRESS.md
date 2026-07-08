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
  `.env.production`, `Makefile`, `setup.sh` (this task)

## Partially Completed

- ◐ `docker-compose.yml` — missing `web`, `api`, `minio`, `worker` services (added as
  those scaffolds land; `minio` needed once file-storage-dependent modules start)

## Pending

- ☐ Backend scaffold (`backend/` — FastAPI modular monolith, per `docs/CONVENTIONS.md`)
- ☐ Frontend scaffold (`web/app`, `web/components`, `web/lib` — Next.js + shadcn/ui)
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

Not started as an application. Design assets only (`web/designs/wireframes/`, 83 files).
No `package.json`, no `web/app`.

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

## Next task

Backend scaffold or frontend scaffold (whichever the user picks next) — see
`AskUserQuestion` decision log in session history; not yet chosen as of this entry.
