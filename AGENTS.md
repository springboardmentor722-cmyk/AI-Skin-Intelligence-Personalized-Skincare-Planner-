# AGENTS.md — Skinlytics

> Single source of truth for every AI coding agent on this repo (Claude Code, Codex,
> OpenCode, Antigravity, Cursor, Gemini CLI, …). `CLAUDE.md`, `.cursor/rules/*`, and
> other tool configs all point here. Read this first, every session.

## What this project is
**Skinlytics** — the AI Skin Intelligence & Personalized Skincare Planner. It analyzes a
user's skin profile, lifestyle, sleep, hydration and environment to produce AI skin
assessments, a weighted skin-health score, personalized routines, ingredient
intelligence, product recommendations and progress tracking. Four roles: `user`,
`consultant` (skincare consultant), `dermatologist`, `admin`.

Full detail lives in `docs/ARCHITECTURE.md`. Do not restate it from memory — read it.

## Start-of-session ritual (do this before answering anything about the code)
1. **Query the graph, don't grep.** This repo is indexed with Graphify. Prefer
   `graphify query "<question>"`, `graphify path "A" "B"`, `graphify explain "X"` over
   reading files one by one or ripgrep. See `docs/AGENT_WORKFLOW.md`.
2. If the graph looks stale (you just pulled, or files changed), run `graphify . --update`.
3. Read `PROGRESS.md` to see what's done and what's next. Never redo completed work.
4. Read the relevant `docs/*.md` for the area you're touching (below).

## End-of-session ritual
1. Update `PROGRESS.md` (check off what you finished, note what's next, list new decisions).
2. If you made an architectural decision, append it to `docs/DECISIONS.md` (ADR format).
3. `graphify save-result --question "…" --answer "…" --nodes … --outcome useful|dead_end|corrected`
   so the next agent inherits what you learned. Then `graphify reflect --if-stale`.
4. Conventional-commit your work (`feat:`, `fix:`, `docs:`, `chore:`). The post-commit
   hook re-indexes the graph automatically.

## Where the detailed docs are (read the one that matches your task)
| Doc | Read it when you are… |
|---|---|
| `docs/ARCHITECTURE.md` | touching anything structural — services, layers, data flow, stack |
| `docs/DATA_MODEL.md` *(= database_schemas/ + this)* | changing the DB, adding a table/index/collection |
| `docs/AI_ML.md` | working on models, embeddings, the vector DB, or the recommendation pipeline |
| `docs/DATASETS_AND_APIS.md` | ingesting data or calling any external API — **look here before writing any adapter** |
| `docs/CONVENTIONS.md` | writing any code — folder layout, naming, testing, commits |
| `docs/DECISIONS.md` | wondering "why is it done this way?" before changing it |
| `docs/AGENT_WORKFLOW.md` | switching agents, or unsure how to use the graph / persist context |
| `docs/GRAPHIFY_SETUP.md` | setting up Graphify or the Google Stitch design source |
| `docs/DESIGN.md` | capturing product/UX design notes, requirements, and implementation context |
| `docs/SUGGESTIONS.md` | planning ahead / looking for the next improvement |

## The stack (authoritative — do not substitute without an ADR)
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS + shadcn/ui. Charts via
  shadcn charts (Recharts). Server state via TanStack Query. UI/UX from Google Stitch —
  via a Stitch MCP server if configured, else exported screens in `web/design/`
  (see `docs/GRAPHIFY_SETUP.md` → Stitch).
- **Auth:** **Better Auth** in the Next.js layer is the *only* auth authority — email/
  password (scrypt), OAuth2 social login, sessions, and JWT issuance via its JWT plugin
  (JWKS endpoint). FastAPI never handles passwords; it only *validates* JWTs against the
  cached JWKS. RBAC via Better Auth admin plugin. Details: `database_schemas/skinlytics_identity_betterauth.md`.
- **Backend:** Python + FastAPI (async), served as a **modular monolith** for
  Milestones 1–3 (one deployable, 12 service modules), split into containers at M4.
- **Data:** PostgreSQL (source of truth) · MongoDB (logs, AI payloads, preferences) ·
  Elasticsearch (search) · Vector DB — FAISS (dev) / Pinecone (prod) · Redis (cache,
  rate-limit, token blacklist). File storage: S3 / Azure Blob.
- **AI/ML:** scikit-learn, TensorFlow/PyTorch, XGBoost/LightGBM, SentenceTransformers /
  PubMedBERT / EfficientNet. Stubbed behind interfaces in M1; real models M2–M3.
- **DevOps:** Docker + docker-compose, GitHub + GitHub Actions, AWS or Azure.

## Golden rules (violating these breaks the build or the design)
1. **Better Auth owns identity. User IDs are `TEXT` (strings), not integers.** Every
   `user_id`/`consultant_id` foreign key is `TEXT REFERENCES "user"(id)`. Do not
   reintroduce a serial-integer `users` table.
2. **One writer per fact.** Each entity has exactly one authoritative store (see the
   ownership table in `docs/ARCHITECTURE.md`). Elasticsearch and the vector DB are
   *derived* — never author data there; sync it from Postgres/Mongo.
3. **No runtime graph database.** The app does not use Neo4j/"Graphify-the-DB".
   Relationship queries (ingredient→concern, product→skin-type) are indexed Postgres
   joins. (Graphify-the-*tool* here is only a dev-time code map — unrelated.)
4. **Invalidate `recommendation:cache:{user_id}` on any profile/preference change.**
   TTLs are a fallback, not the mechanism.
5. **Never commit secrets.** Use `.env` (see `.env.example`). Strip EXIF from uploaded
   skin photos; images go to S3 via signed URLs only.
6. **Milestone 1 has no AI.** Assessment/scoring/recommendation endpoints exist behind
   interfaces returning stubbed/deterministic results until M2. Don't wire real models yet.

## Common commands
```bash
make up            # docker-compose: postgres, mongo, redis, elasticsearch
make api           # run FastAPI (uvicorn --reload)
make web           # run Next.js dev server
make migrate       # apply DB migrations (Alembic + Better Auth CLI)
make seed          # load skin types, concerns, roles, scoring weights, product/ingredient datasets
make test          # backend + frontend tests
graphify query "…" # ask the codebase graph instead of grepping
```

## Guardrails for agents
- Small, reviewable diffs. One concern per commit/PR.
- Don't invent endpoints, table names, or env vars — check the graph / docs first.
- If a task needs a decision not covered here, write the ADR in `docs/DECISIONS.md`
  *before* coding, so the next agent doesn't undo you.
- Prefer editing the file the graph points to over creating a parallel new one.
