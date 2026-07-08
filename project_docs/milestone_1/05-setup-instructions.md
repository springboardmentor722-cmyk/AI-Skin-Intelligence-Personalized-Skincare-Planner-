# Project Setup Instructions — Milestone 1

Two ways to stand up the project locally. Both are safe to re-run.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2) — runs Postgres, MongoDB, Redis,
  Elasticsearch locally.
- **Node.js** (for `web/`, Next.js 16 / React 19) and **npm**.
- **Python 3.11+** and **[`uv`](https://docs.astral.sh/uv/)** (for `backend/`). Prefer
  the official installer (`curl -LsSf https://astral.sh/uv/install.sh | sh`) over
  `brew install uv` — building it from source can exhaust a constrained temp partition
  on some machines (see root `PROGRESS.md`'s Known Issues).

## Option A — three small scripts, one per concern

Run each in its own terminal, in order:

```bash
python3 docker_run.py     # data stores + .env bootstrap — run this first
python3 backend_run.py    # FastAPI (uvicorn --reload, :8000)
python3 web_run.py        # Next.js (next dev, :3000)
```

`docker_run.py` starts the Docker data stores, waits for Postgres to report healthy,
and creates the root `.env` from `.env.development` (plus the `web/.env` symlink) if
either is missing — run it first every time, it's safe to re-run. `backend_run.py` and
`web_run.py` each assume that's already done; `Ctrl+C` stops just that one process, and
Docker containers are left running (matching `make dev`'s behavior — you don't lose
seeded data between sessions). These replace the single combined `run.py` bootstrap
script that this project used earlier — split by concern so each piece can be started,
stopped, and restarted independently (e.g. restarting only the backend without taking
the frontend down too).

## Option B — manual, step by step

```bash
# 1. Environment
cp .env.development .env        # or run ./setup.sh, which does this + starts data stores
ln -s ../.env web/.env          # Next.js only auto-loads .env from its own directory

# 2. Data stores
docker compose up -d            # postgres, mongo, redis, elasticsearch
# or: make up

# 3. Database — apply migrations, then seed
cd backend
uv sync                         # installs backend deps into backend/.venv
uv run alembic upgrade head     # applies Alembic migrations
uv run python -m app.db.seed    # idempotent — seeds products + curated ingredients
cd ..

# 4. Backend
cd backend && uv run uvicorn app.main:app --reload   # http://localhost:8000
# (separate terminal)

# 5. Frontend
cd web && npm install && npm run dev                  # http://localhost:3000
```

Or, once both `backend/` and `web/` exist (they do), the Makefile wraps most of this:

```bash
make up        # docker compose up -d
make migrate   # alembic upgrade head
make seed      # python -m app.db.seed
make dev       # data stores + backend + frontend together
```

## Environment variables

Copy `.env.example` → `.env` and fill in what you need. Everything the app reads is
documented at the point of use in that file; the load-bearing ones for Milestone 1:

| Variable | Used by | Required for M1? |
|---|---|---|
| `DATABASE_URL` | Both `web` (Better Auth) and `backend` (SQLAlchemy) — **same database** | Yes |
| `BETTER_AUTH_SECRET` | `web/lib/auth.ts` — session/cookie signing | Yes (`openssl rand -base64 32`) |
| `BETTER_AUTH_URL` / `JWT_ISSUER` / `JWT_AUDIENCE` | Both sides of the JWT contract | Yes (default `http://localhost:3000` works locally) |
| `MONGO_URI` | `backend` — lifestyle logs | Yes |
| `REDIS_URL` | `backend` — cache, rate limits | Yes |
| `GOOGLE_CLIENT_ID` / `SECRET` | Google OAuth button | No — blank disables the provider gracefully |
| `KAGGLE_USERNAME` / `KEY`, `OPENWEATHER_API_KEY`, `OPENUV_API_KEY` | Future ingestion/weather adapters | No — not wired in M1 |

## Generating the typed frontend client

Whenever a backend endpoint changes shape:

```bash
make openapi   # regenerates openapi.json + web/lib/api-types.ts
```

`web/lib/api-types.ts` is committed (frontend code imports types from it); the
intermediate `openapi.json` at the repo root is gitignored.

## Verifying the setup

```bash
make lint        # ruff (backend) + eslint (frontend)
make typecheck    # mypy --strict (backend) + tsc --noEmit (frontend)
make test         # pytest (backend) + npm test (frontend)
```

Then open `http://localhost:3000` — the public landing page should load; `/login` and
`/signup` are real, wired screens; after signing up, you land on `/profile` to complete
your skin profile, which unlocks `/dashboard`, `/recommendations`, and `/progress`.

## Version control

This repository uses Git with a `main` (stable) / `dev` (integration) branch model —
feature work happens on `feature/<scope>-<slug>` branches, merged into `dev` via
fast-forward or PR, per `docs/CONVENTIONS.md`'s Git & process section (conventional
commits: `feat:` `fix:` `docs:` `chore:` `refactor:` `test:`). Connect a GitHub remote
with:

```bash
git remote add origin <your-repo-url>
git push -u origin main
git push -u origin dev
```
