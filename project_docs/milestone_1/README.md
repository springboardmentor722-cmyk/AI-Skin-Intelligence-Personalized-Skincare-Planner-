# Milestone 1 — Project Documentation

Foundation milestone for the AI Skin Intelligence & Personalized Skincare Planner:
project structure, secure authentication, and skin/lifestyle profile collection.
**No AI features in this phase** (ADR-007 — `docs/DECISIONS.md`).

This folder documents *what was built for Milestone 1*, in the terms the milestone brief
asked for. It summarizes and cross-links the canonical, living docs in `docs/` and
`database_schemas/` rather than duplicating them — those two folders remain the
source of truth for any future change; these files are the milestone-close snapshot.

| Doc | Covers |
|---|---|
| [`01-system-architecture.md`](./01-system-architecture.md) | Frontend/backend/database/AI-module architecture, request lifecycle, high-level diagram |
| [`02-database-schema.md`](./02-database-schema.md) | Tables, relationships, constraints across PostgreSQL/MongoDB/Redis, with an ER diagram of the M1-relevant tables |
| [`03-api-endpoints.md`](./03-api-endpoints.md) | Every real FastAPI endpoint shipped in M1 — method, path, role, request/response |
| [`04-folder-structure.md`](./04-folder-structure.md) | Actual repository layout as of Milestone 1 close |
| [`05-setup-instructions.md`](./05-setup-instructions.md) | How to stand up the project from a fresh clone |

## Milestone 1 task checklist

| # | Task | Status |
|---|---|---|
| 1 | Understand the project (objectives, roles, workflow) | ✔ Done — `docs/ARCHITECTURE.md` §1-2 |
| 2 | System architecture + diagram | ✔ Done — [`01-system-architecture.md`](./01-system-architecture.md) |
| 3 | Database design (schema, tables, relationships, constraints) | ✔ Done — `database_schemas/`, [`02-database-schema.md`](./02-database-schema.md) |
| 4 | UI wireframes (7 M1 screens) | ✔ Done — `web/designs/wireframes/` (83 files, light+dark) |
| 5 | Dev environment (frontend, backend, DBs, version control) | ✔ Done — see [`05-setup-instructions.md`](./05-setup-instructions.md); GitHub remote wired separately (see root `PROGRESS.md`) |
| 6 | Authentication (registration, login, password hashing, JWT) | ✔ Done — Better Auth + FastAPI JWKS validation |
| 7 | Role-based access control (User/Consultant/Dermatologist/Admin) | ✔ Done — role declared at signup + JWT claim + `require_role` on every user-domain endpoint |
| 8 | User profile module (age, gender, skin type, concerns, allergies, sensitivities) | ✔ Done — Skin Profile screen + backend |
| 9 | Lifestyle tracking (sleep, water, exercise, stress, environment) | ✔ Done — Lifestyle form + `lifestyle_logs` |
| 10 | Initial database (products, ingredients, product-ingredient links) | ✔ Done (curated seed, not the full Kaggle pipeline — see note below) | 
| 11 | Documentation (architecture, schema, API, folder structure, setup) | ✔ Done — this folder |

**Note on task 10:** the seed data is a **hand-curated placeholder catalog** (14+ products,
10 ingredients across the PDF's 8 named categories: Retinoids, Niacinamide, Vitamin C,
Hyaluronic Acid, Salicylic Acid, Ceramides, Peptides, AHAs/BHAs), not the full Kaggle
Sephora/cosmetics ingestion pipeline described in `docs/DATASETS_AND_APIS.md` §2 — that
pipeline needs a Kaggle API token (`KAGGLE_USERNAME`/`KAGGLE_KEY`, currently blank) and is
explicitly scoped as a separate, larger task. This seed exists so routines,
recommendations, and the product/ingredient tables have real rows to reference end to
end; it is designed to be swapped out, not mixed in, once the real pipeline lands.

## What Milestone 1 explicitly excludes

Per `docs/DECISIONS.md` ADR-007: no real AI models. Assessment, scoring, and
recommendation endpoints exist and return **deterministic, seeded placeholder results**
behind the same contracts the real models will use from Milestone 2 onward — this is
intentional groundwork, not a shortcut.
