# AI-Skin-Intelligence-Personalized-Skincare-Planner-

AI Skin Intelligence &amp; Personalized Skincare Planner Group 2

**Skinlytics** is an AI-powered skin intelligence and personalized skincare planning
platform. It analyzes a person's skin profile, lifestyle, sleep, hydration, and
environmental exposure to produce an AI skin assessment, a weighted **Skin Health
Score**, personalized routines, ingredient intelligence, product recommendations,
progress tracking, analytics, exportable reports, and reminders — across four roles:
**User**, **Skincare Consultant**, **Dermatologist**, and **Administrator**.

## Preview

  https://drive.google.com/file/d/1RKpk1LK1lt1q5w7SPbJ4YDiZs9g0-JZ_/view?usp=sharing


## Key features

Twelve modules, each with role-scoped dashboards and navigation:

1. Authentication & role-based access control (Better Auth + JWT)
2. Skin Profile Management
3. Skin Assessment Engine (guided wizard: basics → skin type → concerns → severity →
   lifestyle → results)
4. Personalized Routine Generator (AM/PM/weekly/seasonal/adaptive)
5. Ingredient Intelligence (safety scoring, interactions, suitability)
6. Product Recommendation Engine
7. Skin Health Scoring Engine — a weighted formula (`skin_condition 35% · lifestyle
   20% · routine_adherence 20% · sleep_quality 15% · hydration 10%`), config-driven
   and DB-stored, not hardcoded
8. Progress Tracking & Analytics (photo before/after comparison, score trends)
9. Role-specific dashboards (User, Consultant, Dermatologist, Admin)
10. Notifications & Reminders
11. Reports & Export
12. Integration, Testing & Deployment

Every AI-derived output carries a `confidence` field and a "not medical advice"
disclaimer — this app is advisory, never diagnostic.

## Tech stack

| Layer | Stack |
|---|---|
| Frontend | Next.js (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui |
| Auth | Better Auth (issues JWTs), verified by the API — never re-implemented server-side |
| Backend | Python 3.11+ / FastAPI, modular monolith (`backend/app/services/<name>/`) |
| Data | PostgreSQL (system of record), MongoDB (time-series/documents), Elasticsearch + a vector index (derived, rebuildable), Redis (sessions/cache/rate-limits), S3-compatible object storage (MinIO in dev) |
| AI/ML | Behind `backend/app/ai/` interfaces only — services never import model code directly |
| Local runtime | Docker Compose for data stores; `web`/`api` run natively in dev for hot-reload, containerized for deployment |

Full architecture: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Design system,
API conventions, and every structural decision: [`docs/DESIGN.md`](docs/DESIGN.md),
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md), [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Getting started

**Prerequisites:** Docker, Node.js 22+, Python 3.11+ with [`uv`](https://docs.astral.sh/uv/).

Three small, cross-platform runner scripts (stdlib only — nothing to install to run
the scripts themselves), one per concern, each in its own terminal:

```bash
python3 docker_run.py    # 1. data stores (Postgres/Mongo/Redis/Elasticsearch) — also
                          #    bootstraps the root .env (from .env.development) and the
                          #    web/.env symlink on first run
python3 backend_run.py   # 2. FastAPI backend — uvicorn --reload, :8000
python3 web_run.py       # 3. Next.js frontend — npm run dev, :3000
```

Run `docker_run.py` first; the other two each check their required data stores are
reachable and print a clear warning (instead of a confusing 500) if you skip it. Apply
database migrations once the data stores are up:

```bash
cd backend && uv run alembic upgrade head
```

The app is then available at `http://localhost:3000` (frontend) and
`http://localhost:8000` (API, mounted under `/api/v1`).

*(Equivalent `make up` / `make migrate` / `make dev` targets also exist in the
`Makefile`, if you prefer that path — same effect, POSIX shell instead of Python.)*

### Running everything in Docker instead

`web` and `api` also have their own Dockerfiles and compose entries for a fully
containerized run (useful for production-shape testing):

```bash
docker compose up -d --build
```

### Tests & quality gates

```bash
make lint       # ruff (backend) + eslint (frontend)
make typecheck  # mypy --strict (backend) + tsc --noEmit (frontend)
make test       # pytest (backend) + Playwright (frontend e2e)
```

## Project structure

```
Skinlytics
├── docker_run.py                 ← 1. start data stores + bootstrap .env
├── backend_run.py                ← 2. start FastAPI backend
├── web_run.py                    ← 3. start Next.js frontend
├── AGENTS.md                     ← canonical architecture/conventions rules
├── docs/                         ← architecture, design system, decisions, milestones
├── database_schemas/             ← canonical PostgreSQL/MongoDB/Elasticsearch/vector schemas
├── backend/                      ← FastAPI modular monolith
├── web/                          ← Next.js + shadcn/ui frontend
│   └── designs/wireframes/       ← extracted design source of truth (light & dark)
├── ml/                           ← eval harness + model registry
├── training_dataset/             ← dataset manifest + local working directory
└── docker-compose.yml
```
