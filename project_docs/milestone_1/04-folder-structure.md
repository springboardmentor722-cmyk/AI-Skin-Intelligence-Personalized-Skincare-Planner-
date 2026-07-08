# Folder Structure — Milestone 1

The **actual** repository layout as of Milestone 1 close (captured by walking the real
tree, not copied from an aspirational plan). `docs/CONVENTIONS.md` has a target
structure for future milestones; where the two disagree, this file reflects what's
really there today.

```
Skinlytics/
├── AGENTS.md                          # canonical agent rules — read first
├── CLAUDE.md                          # Claude Code entry point (imports AGENTS.md)
├── PROGRESS.md                        # milestone/task state — updated every session
├── Makefile                           # shared task vocabulary (make dev/up/seed/lint/...)
├── docker-compose.yml                 # postgres, mongo, redis, elasticsearch
├── run.py                             # one-command local dev bootstrap
├── setup.sh                           # one-time local bootstrap (data stores + .env)
├── openapi.json                       # generated OpenAPI spec (gitignored intermediate)
├── .env / .env.example / .env.development / .env.production
│
├── project_docs/
│   └── milestone_1/                   # this folder
│
├── docs/                              # living architecture/process docs
│   ├── ARCHITECTURE.md  DECISIONS.md  CONVENTIONS.md  DESIGN.md
│   ├── AI_ML.md  DATASETS_AND_APIS.md  WIREFRAMES.md
│   └── AGENT_WORKFLOW.md  GRAPHIFY_SETUP.md  SUGGESTIONS.md
│
├── database_schemas/                  # DB design — source of the Alembic migrations
│   ├── skinlytics_postgresql_schema_v3.sql
│   ├── skinlytics_mongodb_schema_v3.txt
│   ├── skinlytics_vector_db_schema_v3.txt
│   ├── skinlytics_elasticsearch_schema_v2.txt
│   ├── skinlytics_infrastructure_layer_v2.txt
│   ├── skinlytics_identity_betterauth.md
│   └── README_v3_changes.md
│
├── backend/                           # FastAPI modular monolith
│   ├── app/
│   │   ├── main.py                    # app factory — CORS, request-id, error envelope
│   │   ├── core/                      # config.py, security.py (JWT/JWKS), errors.py
│   │   ├── db/                        # postgres.py, mongo.py, redis.py, seed.py
│   │   ├── ai/                        # ADR-007 stub interfaces + AI-contract schemas
│   │   ├── integrations/              # external adapters (empty — none built yet)
│   │   ├── migrations/                # Alembic (versions/, env.py)
│   │   └── services/                  # one package per service, router/service/schemas/models.py
│   │       ├── user/
│   │       ├── skin_profile/
│   │       ├── ingredients/           # models only — no API surface yet (M3)
│   │       ├── recommendations/
│   │       ├── routines/
│   │       ├── scores/
│   │       └── progress/              # schemas/service only — reads scores, owns no table
│   └── tests/                         # pytest — conftest.py, test_*.py
│
└── web/                                # Next.js 16 + TypeScript + Tailwind + shadcn/ui
    ├── app/
    │   ├── (auth)/forgot-password/
    │   ├── login/  signup/             # standalone split-layout auth screens
    │   ├── assessment/                 # intro, basics, skin-type, concerns, lifestyle, results
    │   ├── (user)/dashboard/  (user)/profile/  (user)/progress/  (user)/recommendations/
    │   ├── admin/dashboard/  consultant/dashboard/  dermatologist/dashboard/
    │   └── api/auth/[...all]/          # Better Auth route handler
    ├── components/
    │   ├── ui/                         # shadcn primitives (owned, themed via CSS vars)
    │   ├── app-shell/                  # glass sidebar + glass topbar
    │   ├── assessment/  auth/  dashboard/  products/  skin-profile/  landing/  providers/
    │   └── skin-score-ring.tsx         # shared "signature element"
    ├── lib/
    │   ├── auth.ts  auth-client.ts  permissions.ts   # Better Auth wiring + RBAC roles
    │   ├── api.ts  api-types.ts                       # typed FastAPI client (generated)
    │   ├── assessment/  schemas/
    │   └── nav-config.ts                              # per-role nav (AGENTS.md §3)
    ├── designs/wireframes/             # 83 extracted Stitch HTML files (light+dark) + reference screenshots
    └── public/images/                  # localized assets (landing, assessment)
```

## Notes on structure decisions

- **Route groups vs. real prefixes:** `app/(user)/...` is a true Next.js route group (no
  URL segment — `/dashboard`, `/profile`), but `app/consultant/`, `app/dermatologist/`,
  `app/admin/` are **real folders**, not groups — four roles each wanting `/dashboard`
  would otherwise collide, since route groups don't add a URL segment. Documented as a
  resolved decision in root `PROGRESS.md`.
- **Service anatomy:** each `backend/app/services/<name>/` package follows
  `router.py` (thin, parse/validate/delegate) · `service.py` (business logic) ·
  `schemas.py` (I/O models) · `models.py` (SQLAlchemy) — not every service has all four
  yet (e.g. `progress/` has no `models.py`; it composes `scores.service`'s interface
  instead of owning a table, per `docs/ARCHITECTURE.md` §4).
- **`backend/app/services/ingredients/`** currently has only `models.py` — the tables
  exist and are seeded, but no `router.py`/API surface is built yet (Ingredient
  Intelligence is Milestone 3 scope; Milestone 1 only needed the seed data itself).
