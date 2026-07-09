# Conventions

Read before writing code. This keeps every agent's output consistent so diffs stay
reviewable and the M4 service split stays mechanical.

## Golden rules (violating any of these is a review blocker)
1. Never undo an accepted ADR silently — supersede it in `docs/DECISIONS.md` first.
2. Single writer per fact; derived stores (ES, vector) are never authored directly —
   project via the outbox (ADR-010).
3. A service never imports another service's models or queries its tables (ADR-005).
4. `user_id`/`consultant_id` are `TEXT REFERENCES "user"(id)` — never integers (ADR-003).
5. All routes live under `/api/v1` (ADR-009).
6. Config/secrets via env only; nothing secret in code or git.
7. No hard-coded colors/fonts — CSS variables from `docs/DESIGN.md` only (ADR-008).
8. Allergy/avoid-ingredient exclusions are hard filters before any ranking (`AI_ML.md`).
9. Update `PROGRESS.md` (and `DECISIONS.md` if you decided something) in the same PR.
10. Don't hand-edit `graphify-out/` or disable the post-commit graph hook.

## Repository layout
```
skinlytics/
├── AGENTS.md  CLAUDE.md              # agent memory — start here
├── PROGRESS.md                       # task state; agents update every session
├── docker-compose.yml  Makefile  .env.example  setup.sh
├── graphify-out/                     # committed code graph (shared agent context)
│
├── docs/
│   ├── ARCHITECTURE.md  DATA_MODEL.md  DECISIONS.md  DESIGN.md
│   ├── CONVENTIONS.md   AI_ML.md      DATASETS_AND_APIS.md
│   └── WIREFRAMES.md    AGENT_WORKFLOW.md  GRAPHIFY_SETUP.md  SUGGESTIONS.md
│
├── database_schemas/                 # DB design (source of the migrations)
│   ├── skinlytics_postgresql_schema_v3.sql
│   ├── skinlytics_mongodb_schema_v3.txt
│   ├── skinlytics_vector_db_schema_v3.txt
│   ├── skinlytics_elasticsearch_schema_v2.txt   # unchanged except user_id → keyword
│   ├── skinlytics_infrastructure_layer_v2.txt   # Redis + S3
│   ├── skinlytics_identity_betterauth.md
│   └── README_v3_changes.md
│
├── web/                              # Next.js + shadcn + Better Auth
│   ├── app/                          # App Router, route groups per role
│   │   ├── (auth)/login  (auth)/register
│   │   ├── (user)/dashboard  (user)/profile  (user)/assessment
│   │   │        (user)/recommendations  (user)/progress
│   │   ├── (consultant)/…  (dermatologist)/…  (admin)/…
│   │   └── api/auth/[...all]/route.ts        # Better Auth handler
│   ├── components/ui/                # shadcn components (owned, themed via CSS vars)
│   ├── components/                   # app components (GlassBar, ScoreRing, …)
│   ├── lib/auth.ts  lib/auth-client.ts
│   ├── lib/api.ts                    # typed FastAPI client (attaches JWT)
│   └── design/                       # exported Stitch screens (reference only)
│
├── backend/                          # FastAPI modular monolith
│   ├── app/
│   │   ├── main.py                   # app factory; gateway concerns (CORS, rate limit)
│   │   ├── core/                     # config, security (JWKS verify), redis, logging
│   │   ├── db/                       # postgres (SQLAlchemy), mongo, es, vector, redis
│   │   ├── services/                 # the 12 services, one package each
│   │   │   └── <name>/router.py service.py schemas.py models.py deps.py
│   │   ├── ai/                       # model interfaces + stubs (ADR-007)
│   │   ├── integrations/             # external adapters (see DATASETS_AND_APIS.md)
│   │   ├── workers/                  # arq jobs + outbox projector (ADR-010)
│   │   └── migrations/               # Alembic
│   └── tests/
│
└── ml/                               # training / experiments / eval harness (M2+)
```

## Backend (FastAPI, Python)
- **Tooling:** Python 3.11+, `uv` for deps, `ruff` (lint **and** format), `mypy` on
  `app/` (strict on new modules), Pydantic v2, async endpoints throughout.
- **Service anatomy:** `router.py` (thin — parse/validate/delegate), `service.py`
  (business logic), `schemas.py` (I/O models), `models.py` (SQLAlchemy), `deps.py`
  (auth/ownership dependencies). Cross-service calls: import the other service's
  *service.py functions*, never its models.
- **Auth:** only `require_user` / `require_role("...")` from `core/security.py` — no
  endpoint re-implements verification.
- **API conventions:**
  - Paths: plural resources, kebab-case (`/api/v1/skin-profiles`, `/lifestyle-logs`);
    `me` scoping for own-data reads (`/scores/me`).
  - List endpoints: `?page=1&page_size=20` (max 100) →
    `{ "items": [...], "meta": { "page", "page_size", "total" } }`.
  - Errors — one envelope everywhere:
    `{ "error": { "code": "validation_error", "message": "…", "details": [...],
    "request_id": "…" } }`. Codes are stable snake_case strings.
  - Status usage: 200/201/204 success · 400 validation · 401 unauthenticated ·
    403 role/ownership · 404 not found · 409 conflict · 422 semantic · 429 rate limit.
  - Mutating payment/report endpoints accept an `Idempotency-Key` header.
- **Logging:** structured JSON (structlog), `request_id` middleware, latency per request;
  never log tokens, photos URLs with signatures, or health data payloads.
- **Errors are actionable** and in the interface's voice; never leak internals.
- **Naming:** `snake_case` functions/vars/modules, `PascalCase` classes, plural tables.

## Frontend (Next.js, TypeScript)
- TS `strict`; ESLint + Prettier (with the Tailwind class-sorting plugin).
- App Router: Server Components by default; `"use client"` only at interactive leaves.
  Route groups per role as in the tree above.
- **Data:** TanStack Query → `lib/api.ts`. Query keys: `[resource, scope, params]`
  (e.g. `['recommendations','me',filters]`); invalidate by prefix on mutation. Types
  generated from the FastAPI OpenAPI spec (`openapi-typescript`) — no hand-written
  response types.
- **Forms:** react-hook-form + zod resolvers; inline validation; a control keeps its name
  through its flow ("Save changes" → toast "Saved").
- **Session:** `authClient.getSession()` in an effect (Better Auth has no `useSession`).
- **Design system:** shadcn components in `components/ui` are ours to edit; theme only
  through the DESIGN.md CSS variables (incl. `--glass-*`); glass usage per DESIGN §3 —
  chrome/overlays only, never under tables/forms. Sentence case, active voice.
- **A11y floor:** visible focus, `prefers-reduced-motion` **and**
  `prefers-reduced-transparency` respected, 44px targets, responsive to mobile.
- Skeleton loaders on dashboard reads; optimistic UI on profile/lifestyle saves; every
  screen implements its empty/loading/error states (`WIREFRAMES.md`).

## Database & migrations
- PG DDL source of truth: `database_schemas/*.sql` → Alembic in
  `backend/app/migrations`. **Better Auth identity tables come from the Better Auth CLI,
  not Alembic** — keep the two migration streams separate.
- Naming (reconciled against the real schema during the Milestone 1 audit — these are
  what `database_schemas/skinlytics_postgresql_schema_v3.sql` and every migration
  actually do, not an aspirational target nobody followed): plural snake_case tables;
  indexes `idx_<table>_<cols>` (not `ix_`); FK constraints use Postgres's own
  auto-generated `<table>_<col>_fkey` names (no migration has ever passed an explicit
  `name=`) — don't introduce `fk_<table>_<ref>` names into new migrations, it'd be the
  only table with that scheme; every table gets `created_at`/`updated_at TIMESTAMP`
  defaults (plain, not `TIMESTAMPTZ` — the SQL file declares plain `TIMESTAMP`
  everywhere, identity tables included, so a new migration should match that, not the
  wall-clock-safer type this section used to claim).
- Add an index for any new FK used by a dashboard query. Mongo collections carry the
  indexes/TTLs noted in the schema file.
- Seeds are idempotent (upserts): `make seed` is always safe to re-run.
- Auth/ownership dependencies live centrally in `backend/app/core/security.py`
  (`require_user`/`require_role`), not per-service `deps.py` files — despite the
  5-file service shape named above (`router.py service.py schemas.py models.py
  deps.py`), no service has ever had a `deps.py`; one shared `require_role` pattern
  serves all of them identically, which is why. Only add a per-service `deps.py` if a
  service ever needs an ownership check `require_role` can't express (e.g.
  consultant-can-only-read-*assigned*-clients) — don't add an empty one just to match
  the shape.

## Git & process
- Conventional commits (`feat:` `fix:` `docs:` `chore:` `refactor:` `test:`); branches
  `feat/<scope>-<slug>`.
- Small PRs, one concern. PR checklist: tests green · lint/typecheck clean ·
  `PROGRESS.md` updated · ADR added if structural · states (empty/loading/error) covered.
- The post-commit Graphify hook re-indexes the graph — never disable it.

## Testing
- **Backend (pytest):** per service — auth matrix (valid/expired/wrong-role JWT),
  ownership checks, profile CRUD, scoring math against `scoring_weights`, recommendation
  pipeline contract (stub mode), outbox projection. Factories over fixtures-by-hand.
- **Frontend:** component tests for forms; Playwright e2e for the 7 M1 screens
  (`WIREFRAMES.md`), including one dark-mode and one reduced-transparency pass.
  Any e2e spec that signs a real account up or in imports `tests/e2e/helpers.ts`
  (`pool`/`deleteTestUser`/`promoteRole`/`clearRateLimits`) rather than reinventing
  them — the suite runs `workers: 1` (ADR-018) since it hits a real, shared backend
  whose rate limiter is IP-scoped across every file, not just within one.
- **ml/:** `make eval` gates model-version bumps (`AI_ML.md`).
- Coverage floor: 80% on services touched by a PR.

## Makefile targets (the shared vocabulary)
`make dev` (compose up + web) · `up` / `down` · `migrate` · `seed` · `test` · `lint` ·
`typecheck` · `eval` · `graph` (graphify . --update) · `openapi` (regen typed client).

## Definition of done
Feature works in both themes and all relevant roles · states designed · tests + lint +
types pass · docs touched if behavior changed · `PROGRESS.md` updated · graph re-indexed
by the hook · no golden-rule violations.
