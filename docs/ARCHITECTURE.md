# Skinlytics — Architecture

AI Skin Intelligence & Personalized Skincare Planner. This is the **authoritative
architecture reference**, derived from the project PDF, the approved system-architecture
diagram, and the ADRs in `docs/DECISIONS.md`. Agents: read this before changing anything
structural; never reconstruct architecture from memory. If code contradicts this doc, the
code is the bug — or write a new ADR first.

**Doc map:** why → `DECISIONS.md` · how to code → `CONVENTIONS.md` · models →
`AI_ML.md` · data sources → `DATASETS_AND_APIS.md` · screens → `WIREFRAMES.md` +
`DESIGN.md` · agent workflow → `AGENT_WORKFLOW.md` · state → `PROGRESS.md`.

---

## 1. Objective, audience & non-functional targets

Analyze a user's skin profile, lifestyle habits, sleep, hydration, and environmental
exposure to deliver: AI skin assessments, a weighted skin-health score, personalized
routines (AM/PM/weekly, seasonal, adaptive), ingredient intelligence, product
recommendations, and progress tracking. Audiences: skincare consumers, dermatology
clinics, wellness platforms, beauty brands, skincare consultants.

**Proposed NFR budgets** (the PDF names the metrics; these numbers are our working
targets — tune with load tests before M4, see `SUGGESTIONS.md`):

| Metric (from PDF §8) | Target |
|---|---|
| API response time (non-AI, p95) | < 300 ms |
| Recommendation generation latency (cache miss, p95) | < 1.5 s |
| Dashboard loading speed (TTI, p75) | < 2.5 s |
| Concurrent user handling | 500 sustained (M4 baseline) |
| Skin-concern classification accuracy / scoring consistency / rec relevance | tracked from M3, targets set with first eval set (`AI_ML.md`) |

## 2. Roles

| Role | Does | Primary surfaces |
|---|---|---|
| `user` | Skin profile, lifestyle logs, assessments, routines, recs, progress | User dashboard, profile, assessment, recommendations, progress |
| `consultant` | Reviews assigned clients' profiles/assessments/progress, notes, manages recs | Consultant dashboard |
| `dermatologist` | Patient insights, condition reports, treatment recs, progress analytics | Dermatologist dashboard |
| `admin` | User management, content (products/ingredients/articles), platform analytics, monitoring | Admin dashboard |

Roles are defined in Better Auth's admin plugin (`createAccessControl`), travel as a JWT
claim, and are **re-checked on every FastAPI endpoint** via a dependency (§6). Consultants
and dermatologists see only *assigned* users (Postgres `consultant_assignments`); any
access to another person's skin data is written to the audit log (§9).

## 3. High-level architecture (matches the system diagram)

```
Clients (Responsive Web · Mobile · Dashboards · Visualizations · Reports)
        │  HTTPS/SSL · REST (JSON)
        ▼
API Gateway (FastAPI): routing · authN (JWT verify) · rate limiting ·
request validation · load balancing · CORS
        ▼
Microservices layer — 12 services (§4)
        ▼
AI / ML & Intelligence Engine — 7 model surfaces (§5; stubbed until M2, ADR-007)
        ▼
Data layer — 5 stores (§7) + file storage (S3/Azure Blob)
        ▲
External services & data sources (§8)
Cross-cutting: monitoring & logging · backup & security (§9)
```

**Request lifecycle (every authenticated call):**
1. Next.js client attaches the Better Auth JWT (`lib/api.ts`).
2. Gateway middleware: request-id assignment → CORS → rate limit (Redis) → JWT verify
   against cached JWKS → Pydantic request validation.
3. Route dependency enforces role/ownership; handler calls its service module.
4. Service reads/writes **only the stores it owns**; cross-service needs go through the
   other service's interface function, never its tables (ADR-005).
5. Response + `X-Request-ID`; structured JSON log line with latency; errors use the
   standard envelope (`CONVENTIONS.md`).

**Deployment shape:** a **modular monolith** for M1–M3 — one FastAPI deployable, the 12
services as internal routers/modules with strict data ownership — split into per-service
containers at M4 (ADR-005). All routes mount under **`/api/v1`** from day one (ADR-009).
M1 runtime = docker-compose: `web`, `api`, `postgres`, `mongo`, `redis`, `elasticsearch`,
`minio` (S3-compatible dev), `worker` (arq, ADR-010).

## 4. Microservices (12)

FastAPI packages under `backend/app/services/<name>/` (`router.py · service.py ·
schemas.py · models.py · deps.py`). Single-writer rule: each fact has exactly one owning
service; everything else reads via interfaces or consumes derived projections.

| # | Service | Owns (writes) | Reads | API prefix |
|---|---|---|---|---|
| 1 | **User** | domain user profile, role glue to Better Auth | identity tables (RO) | `/users` |
| 2 | **Skin Profile** | PG `skin_profiles`, `skin_profile_concerns`; Mongo `lifestyle_logs`, `weather_uv_logs` | weather adapters | `/skin-profiles`, `/lifestyle-logs` |
| 3 | **Skin Assessment** | Mongo `skin_assessments`; S3 scan images | AI interfaces | `/assessments` |
| 4 | **Routine Planner** | PG `routines`, `routine_steps`, step↔product links | profile, scoring, AI | `/routines` |
| 5 | **Ingredient Intelligence** | PG `ingredients` + junctions (`ingredient_concern_treats`, `ingredient_skintype_avoid`) | ES prose, vector sims | `/ingredients` |
| 6 | **Product Recommendation** | PG `products`, `product_*` junctions; Redis rec cache | pipeline §10 | `/products`, `/recommendations` |
| 7 | **Skin Health Scoring** | PG `skin_scores`, `scoring_weights` | profile, lifestyle, adherence | `/scores` |
| 8 | **Progress Tracking** | Mongo `progress_logs`; S3 progress photos | assessments, scores | `/progress` |
| 9 | **Notification** | PG `notifications`, `reminders` | user prefs | `/notifications`, `/reminders` |
| 10 | **Analytics** | nothing (read-only aggregator, never a source of truth) | all stores | `/analytics` |
| 11 | **Report** | S3 `/exports/`, `/reports/`; PG report registry | all via interfaces | `/reports` |
| 12 | **Admin** | platform settings, content mgmt orchestration; PG `verification_documents`, `audit_logs` | everything (admin role); reads `consultant_profiles`/`dermatologist_profiles` for the verification queue | `/admin` |

Service responsibilities per the diagram: User (management, authentication glue, role &
profile management) · Skin Profile (profile creation, skin type, lifestyle/sleep/hydration/
environment tracking) · Skin Assessment (concern identification, skin analysis, condition
scoring, risk-factor analysis, prioritization) · Routine Planner (morning/evening/weekly
generation, seasonal adjustments) · Ingredient Intelligence (database, suitability,
interaction analysis, allergy detection, education) · Product Recommendation (matching,
suitability scoring, comparison, alternatives, budget optimization) · Skin Health Scoring
(condition/lifestyle-impact/adherence/overall scores, trend analysis) · Progress Tracking
(monitoring, before/after, trend analysis, improvement insights, milestones) ·
Notification (routine/product/hydration/sleep reminders, system notifications) · Analytics
(skin/usage/recommendation/engagement analytics, insights) · Report (generation, PDF/Excel
export, custom & scheduled) · Admin (users, content, system monitoring, data management,
platform settings).

**Async work** (report rendering, notification delivery, embedding jobs, ES/vector
projection, weather polling) runs on an **arq worker** over the existing Redis, fed by a
transactional **outbox** (ADR-010). Request handlers stay fast.

## 5. AI / ML & Intelligence Engine (7 model surfaces)

Stubbed behind `backend/app/ai/` interfaces in M1 (deterministic placeholders, ADR-007);
real models M2–M3. Full contracts, model cards, fairness requirements, and the embedding
pipeline live in **`docs/AI_ML.md`**.

1. Skin Type Classification (image → type + confidence) — EfficientNet-B0
2. Concern Detection & Severity (image → concerns + severity + confidence)
3. Recommendation Engine — XGBoost/LightGBM ranking over vector + relational + ES signals
4. Ingredient Suitability & Safety (profile × ingredient → suitability, interaction flags)
5. Skin Score Prediction (features → trajectory)
6. Progress Prediction & Trend Analysis (time series → trend + insight)
7. NLP Engine (product/ingredient text understanding, embeddings) — SentenceTransformers /
   PubMedBERT

Services never import model code — only the interfaces. Every AI-derived response carries
a `confidence` field the UI surfaces (Geist confidence labels, `DESIGN.md` §9).

## 6. Authentication, authorization & sessions (decided — ADR-002/003)

**Better Auth (Next.js) is the single auth authority:** registration, login, scrypt
password hashing, OAuth2 social login (Google/Facebook/Apple), sessions. Its JWT plugin
issues **short-lived (≈15 min) asymmetric EdDSA/RS256 JWTs** and serves JWKS at
`/api/auth/jwks`; session cookies handle browser continuity and silent re-issue.

**FastAPI validates, never authenticates:** it caches JWKS (respecting `kid` rotation)
and verifies signature, `iss`, `aud`, `exp`/`nbf` on every request. No shared secret, no
DB round-trip, no duplicated auth logic. One dependency pair —
`require_user` / `require_role("admin")` in `core/security.py` — is the only auth code.

**RBAC:** roles/permissions defined once with `createAccessControl`; the role claim is
enforced per route; ownership checks (user can only read `me`; consultant only assigned
clients) live in `deps.py` per service. `require_verified_professional(*roles)`
(`core/security.py`, ADR-014) additionally gates *operational* consultant/dermatologist
endpoints on the matching profile's `verification_status == "approved"` — it wraps
`require_role`, so wrong-role and unapproved-status both fail 403 the same way; it never
gates the profile's own view/edit/upload-documents endpoints, which stay reachable at
every status.

**Revocation & abuse:** Redis backs rate limiting (per-IP unauthenticated, per-user
authenticated, stricter per-endpoint on AI paths) and an optional `auth:blacklist:{jti}`
for instant logout. **Identity tables are Better-Auth-owned with string IDs** (`user`,
`session`, `account`, `verification`, `jwks` via `npx @better-auth/cli generate`); every
domain `user_id`/`consultant_id` is `TEXT REFERENCES "user"(id)` — never serial integers
(ADR-003). Exact TS config + FastAPI dependency:
`database_schemas/skinlytics_identity_betterauth.md`.

**Session/token refresh — reviewed, not changed (Milestone 1 foundation expansion).**
The mechanism above (short-lived JWT reissued via Better Auth's own session cookie,
not a hand-rolled refresh-token table) was reviewed for gaps and found sound: the
session cookie already handles silent reissue, JWKS `kid` rotation is already
respected, and the blacklist already provides instant revocation. No refresh-token
redesign was needed or made.

**Account lockout** (ADR-013): `/sign-in/email` carries a much stricter Redis-backed
rate-limit window (5 attempts/15 min) than the general API ceiling — a real,
live-verified brute-force throttle, not a per-account `locked_until` flag.

**Email verification** (ADR-012): real send path exists (dev-mode: logs the link,
no email provider chosen yet), `emailVerified` genuinely flips true when followed —
but not yet *required* to sign in, a deliberate intermediate step.

**MFA — compatibility note, not implemented.** Better Auth's `twoFactor` plugin
(`better-auth/plugins`) slots into `web/lib/auth.ts`'s existing `plugins` array
without restructuring anything above — no code changes now since there's no concrete
near-term requirement driving it, but nothing in this architecture blocks adding it
when one exists.

**Professional verification workflow** (ADR-014): Consultant/Dermatologist accounts go
through onboarding → `pending` → admin `approve`/`reject`/`request_info`/`suspend`/
`deactivate`, tracked on `consultant_profiles`/`dermatologist_profiles`.
`verification_status`. `audit_logs` (Admin service, §4) has exactly one write path —
`write_audit_log` in `services/admin/service.py` — reached either directly by the five
review actions or via `POST /admin/audit-logs`, which is what
`web/app/api/admin/set-role/route.ts` calls after Better Auth's own `set-role` action
(which has no audit trail of its own) so every role change is still logged.

## 7. Data layer — five stores + one file store

Single writer per fact; **derived stores are never authored** and must be rebuildable
from their sources at any time.

| Store | Source of truth for | Notes |
|---|---|---|
| **PostgreSQL** | identity (Better Auth), skin profiles, skin taxonomy, ingredients + junctions, products, routines, scores + `scoring_weights`, consultant assignments/notes, notifications, reminders, subscriptions, payments, outbox | `database_schemas/skinlytics_postgresql_schema_v3.sql` |
| **MongoDB** | lifestyle logs (time-series), AI assessment payloads, progress logs, user preferences, weather/UV logs, knowledge-article content, vector-sync metadata | `..._mongodb_schema_v3.txt` |
| **Elasticsearch** | *derived* search: products, ingredients, knowledge articles, search logs | projected from PG/Mongo via outbox |
| **Vector DB** (FAISS dev / Pinecone prod) | *derived* embeddings: products, ingredients, articles, user profiles, assessments | `..._vector_db_schema_v3.txt`, `AI_ML.md` |
| **Redis** | sessions/blacklist, OTP, rate limits, rec/weather/AI caches, arq queues | everything carries a TTL; `volatile-lru` |
| **S3 / Azure Blob** | profile images, skin-scan images, progress photos, report/export files | private bucket, signed URLs only, EXIF/GPS stripped on upload |

**Derived-store sync (ADR-010):** writes to products/ingredients/articles/profiles append
an outbox row in the same transaction; the worker projects to ES and the vector DB.
Consistency is **eventual (seconds)** for search/similarity; relational reads are strongly
consistent. Rebuild command re-projects everything from PG/Mongo.

**Weighted skin-health score** is config-driven, not hard-coded:
`skin_condition 0.35 · lifestyle 0.20 · sleep_quality 0.15 · routine_adherence 0.20 ·
hydration 0.10`, sum = 1.00 enforced by a CHECK constraint on `scoring_weights`; the
scoring service reads the active row, so retuning is a DB update, not a deploy.

**Retention:** raw weather logs TTL 90 days (schema); progress/scan photos per the consent
& retention policy (`SUGGESTIONS.md` P0); "delete my data" purges PG + Mongo + S3 + vector
namespaces. **Backup targets:** nightly automated backups, RPO ≤ 24 h, RTO ≤ 4 h; restore
drills quarterly (§9).

**No runtime graph database** (ADR-001): relationship queries are 1–2 hop indexed Postgres
joins over the junction tables. Not to be confused with Graphify-the-dev-tool (ADR-006).

## 8. External services & data sources

Skincare product databases & APIs · ingredient databases · dermatology knowledge bases ·
research publications & clinical studies · weather & UV index APIs · payment gateway
(Stripe/Razorpay) · cloud storage (AWS S3/Azure Blob).

Every external call goes through an **adapter module** (`backend/app/integrations/`) with:
env-var keys only, timeout + retry with exponential backoff + jitter, a circuit-breaker
around flaky providers, Redis caching (weather 30 min; provider-specific TTLs), and a
fallback chain where two providers overlap (OpenWeather ⇄ OpenUV). Payments: verify
webhook signatures, idempotency keys on charge creation, daily reconciliation job. **Every
concrete source, key, and licensing caveat is catalogued in `docs/DATASETS_AND_APIS.md`**
— consult it before writing any ingestion or adapter code.

## 9. Cross-cutting

**Observability.** Structured JSON logs with a `request_id` propagated frontend → gateway
→ services → worker; error tracking (Sentry-class) from M1; OpenTelemetry traces across
service modules; the PDF's system metrics (API response time, rec latency, dashboard load,
concurrency) exposed as real dashboards by M3–M4, surfaced in the Admin monitoring screen.

**Security.** TLS everywhere; encryption at rest; signed URLs for all media; secrets via
env only; RBAC + ownership checks per route; per-tier rate limits; security headers/CSP on
the web app; dependency + secret scanning in CI. **Clinical-access audit log:** every
consultant/dermatologist/admin read of a user's skin data writes an immutable audit row
(who, whose, what, when) — health data demands an access trail. Skin photos are sensitive
data: explicit consent at capture, EXIF stripped, documented retention, full purge on
delete (see `SUGGESTIONS.md` P0). Visible **"not medical advice"** disclaimer on
assessment surfaces; dermatologist clinical outputs visually distinct from AI suggestions.

**Backup & disaster recovery.** Automated backups (PG PITR + Mongo dumps + S3 versioning),
data encryption, security monitoring, access control, restore-tested DR per §7 targets.

## 10. Core data flow — recommendation pipeline (M2+)

```
User profile (PG) + preferences (Mongo)
 1. Relational pre-filter (PG junctions: ingredient_concern_treats,
    ingredient_skintype_avoid, product_skin_types, product_concerns)
    — allergy & avoid-ingredient exclusions are HARD filters, applied first
 2. Vector similarity (Vector DB: products/ingredients/articles namespaces,
    metadata-filtered to the step-1 candidate set)
 3. Keyword/hybrid search (Elasticsearch: budget range, brand, category, is_active)
 4. Rank (XGBoost: similarity, suitability, rating, popularity, price-fit,
    concern overlap) + light diversity re-rank
 5. Serve → routine + product recommendations; cache Redis
    recommendation:cache:{user_id} (TTL 24 h)
```
**Invalidation triggers:** any skin-profile edit, lifestyle-log write that shifts derived
features, preference change, or product-catalog change touching a cached candidate.
**Stage budgets (p95):** pre-filter 50 ms · vector 150 ms · ES 100 ms · rank 200 ms ·
total < 1.5 s cache-miss, < 100 ms cache-hit. Cold start (no history): content-based only
— profile ↔ product suitability, popularity prior.

## 11. Frontend architecture

- **Next.js (App Router) + TypeScript.** Server Components for data-heavy dashboard
  reads; Client Components for interactive forms/charts. Route groups per role:
  `(auth)`, `(user)`, `(consultant)`, `(dermatologist)`, `(admin)`.
- **Tailwind + shadcn/ui** — components owned in `web/components/ui`, themed exclusively
  through the CSS variables generated from `docs/DESIGN.md` (including the `--glass-*`
  family; glass usage rules in DESIGN §3). Sentence-case active-voice copy; a11y floor
  (focus, reduced motion **and reduced transparency**, mobile).
- **Charts:** shadcn charts (Recharts) primary; Plotly only for heavy scientific viz.
- **Data:** TanStack Query → typed client `web/lib/api.ts` (attaches the Better Auth JWT);
  session via `authClient.getSession()`.
- **Design workflow (Google Stitch):** designs authored in Stitch from the v2 prompt pack
  (Frosted Lab Glass). Two supported handoff paths (`GRAPHIFY_SETUP.md` → Stitch): a
  Stitch MCP server, or exported screens in `web/design/<screen>/`. Agents rebuild each
  screen as shadcn components mapped to our tokens — raw exports never ship. Seven M1
  screens: Login, Registration, User Dashboard, Skin Profile, Skin Assessment, Product
  Recommendation, Progress Tracking (`WIREFRAMES.md`).

## 12. Repository layout

Full tree in `docs/CONVENTIONS.md`. Top level:

```
skinlytics/
├── AGENTS.md  CLAUDE.md            # agent memory (start here)
├── PROGRESS.md                     # milestone/task state — agents update this
├── docker-compose.yml  Makefile  .env.example
├── docs/                           # this file + DESIGN, DECISIONS, CONVENTIONS, AI_ML,
│                                   # DATASETS_AND_APIS, WIREFRAMES, AGENT_WORKFLOW, SUGGESTIONS
├── database_schemas/               # PG v3, Mongo v3, Vector v3, ES, infra, Better Auth identity
├── web/                            # Next.js + shadcn + Better Auth
├── backend/                        # FastAPI modular monolith (app/services/*, app/ai/*)
├── ml/                             # training/experiments/eval (M2+)
└── graphify-out/                   # committed code-graph — shared agent context
```

## 13. Milestone roadmap (8 weeks) with exit criteria

- **M1 (wk 1–2)** — architecture, DB schema, wireframes, env setup, Better Auth + RBAC,
  profile & lifestyle modules, seed product/ingredient data. **No AI.**
  *Exit:* project initialized · auth works (all 4 roles, JWT verified by FastAPI) · skin
  profile management functional · lifestyle tracking integrated · 7 screens navigable.
- **M2 (wk 3–4)** — skin assessment engine, routine generation, skin scoring, first recs.
  *Exit:* assessment operational · routine generation functional · scoring workflows
  implemented against `scoring_weights`.
- **M3 (wk 5–6)** — ingredient intelligence, product recommendation engine, progress
  tracking, analytics, user dashboards.
  *Exit:* rec engine operational · progress tracking functional · analytics workflows
  complete.
- **M4 (wk 7–8)** — executive dashboards, reports/exports, testing, containerization
  (service split per ADR-005), cloud deploy, docs.
  *Exit:* fully deployed frontend + backend · dashboards & reporting operational ·
  end-to-end workflow demonstrated · NFR budgets (§1) load-tested.

Current status lives in `PROGRESS.md`, not here.
