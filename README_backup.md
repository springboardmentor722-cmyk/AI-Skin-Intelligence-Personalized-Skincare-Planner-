# Lumen — AI Skin Intelligence & Personalized Skincare Planner

Milestone 1 foundation: project structure, secure authentication, role-based access control, skin profiles, lifestyle tracking, dermatologist booking, consultant requests and routines, product/ingredient datasets, notifications, and a full administrator surface with audit logging. No AI features ship in this milestone — the architecture leaves clean seams for them.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router (no UI framework — custom design system) |
| Backend | Python 3.11+ · FastAPI · SQLAlchemy 2 |
| Relational DB | PostgreSQL in production, SQLite for zero-config local dev |
| Document DB | MongoDB (optional hook, reserved for AI scan images in later milestones) |
| Auth | PBKDF2-SHA256 password hashing + JWT bearer tokens |

## Quick start

### 1. Backend (http://localhost:8000)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env          # optional — defaults work out of the box (SQLite)
python -m app.seed            # creates tables + demo data
uvicorn app.main:app --reload --port 8000
```

Interactive API docs: http://localhost:8000/docs

To use PostgreSQL instead of SQLite, set in `.env`:
`DATABASE_URL=postgresql+psycopg2://lumen:lumen@localhost:5432/lumen` then re-run the seed.

### 2. Frontend (http://localhost:5173)

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api/*` to the backend automatically.

### 3. Demo accounts

| Role | Email | Password |
|---|---|---|
| Patient | user@lumen.app | User@1234 |
| Dermatologist | derm@lumen.app | Derm@1234 |
| Dermatologist | derm2@lumen.app | Derm@1234 |
| Dermatologist | derm3@lumen.app | Derm@1234 |
| Skincare Consultant | consultant@lumen.app | Consult@1234 |
| Skincare Consultant | consultant2@lumen.app | Consult@1234 |
| Administrator | admin@lumen.app | Admin@1234 |

## What each role sees

- **Patient** — a unique dashboard (skin score dial, hydration/acne/sleep/water stats, trends, AI daily tip), skin profile, lifestyle tracking, routines, a searchable **dermatologist directory with live slot booking**, appointment history with cancel, **consultant requests** (routine planning, 1:1, diet, anti-aging…), products, progress analytics, notifications.
- **Dermatologist** — same layout family as the consultant, dermatologist permissions: incoming appointment requests with **accept / decline**, upcoming schedule, complete-with-clinical-notes, weekly **availability management** with vacation mode, and a public practice profile.
- **Skincare Consultant** — same layout, consultant permissions: incoming consultation/routine requests (with the client's skin details), accept/decline/complete, and a **routine builder** that publishes morning/night/weekly plans to the client.
- **Administrator** — full platform control: real-time stats, user CRUD + role assignment + suspend, provider approval, all appointments, product catalogue management, notification broadcast, and a complete **audit log** (actor, action, old/new values, IP, time).

RBAC is enforced twice: in the UI (role-scoped navigation and protected routes) and, authoritatively, in the API (`app/permissions.py` — every endpoint declares a permission). See `docs/rbac-matrix.md`.

## Repository layout

```
backend/
  app/
    main.py            FastAPI app + router registration
    config.py          Env-driven settings (.env supported)
    database.py        SQLAlchemy engine + optional Mongo hook
    models.py          ORM models (schema of record)
    schemas.py         Pydantic request/response models
    security.py        PBKDF2 hashing + JWT
    permissions.py     RBAC matrix (single source of truth)
    deps.py            get_current_user / require(permission) / audit / notify
    seed.py            Demo data + product & ingredient datasets
    routers/           auth, users, dermatologists, appointments,
                       consultants, products, progress, admin
frontend/
  src/
    api/client.js      Fetch wrapper with JWT header
    context/           AuthContext (login/register/session)
    components/        Layout (role-aware sidebar), ui.jsx primitives
    pages/             user/ derm/ consultant/ admin/ + auth pages
docs/
  architecture.md      System architecture + diagram
  database-schema.md   Tables, relationships, constraints, ERD
  api-spec.md          Every endpoint with roles and payloads
  rbac-matrix.md       Full permission matrix
  wireframes.md        Wireframes for the required pages
  setup.md             Detailed environment setup (incl. PostgreSQL/Mongo)
```

## Version control

```bash
git init
git add .
git commit -m "Milestone 1: foundation, auth, RBAC, profiles, booking"
git branch -M main
git remote add origin https://github.com/<your-org>/lumen.git
git push -u origin main
```

Suggested collaboration flow: protected `main`, feature branches (`feat/…`), pull requests with one review, conventional commit messages.

## Milestone 1 checklist

- [x] System architecture + diagram (`docs/architecture.md`)
- [x] Database schema, relationships, constraints (`docs/database-schema.md`)
- [x] Wireframes for login, registration, dashboard, skin profile, assessment, products, progress (`docs/wireframes.md`)
- [x] React frontend structure · FastAPI backend structure · PostgreSQL/Mongo configuration
- [x] Registration, login, password encryption, JWT authentication
- [x] Role-based access control for User / Consultant / Dermatologist / Administrator
- [x] User profile module (age, gender, skin type, concerns, allergies, sensitivities)
- [x] Lifestyle tracking (sleep, water, exercise, stress, environmental exposure)
- [x] Initial datasets: skincare products, ingredients, product–ingredient benefits
- [x] Documentation: architecture, schema, API, folder structure, setup

## Google Sign-In (optional)

The "Continue with Google" button is fully implemented but **disabled until you supply a Client ID** — the button simply doesn't render when unconfigured, so nothing looks broken. To enable it:

1. Go to https://console.cloud.google.com/apis/credentials
2. Create an **OAuth 2.0 Client ID** → application type **Web application**
3. Under *Authorized JavaScript origins*, add `http://localhost:5173`
4. Copy the generated Client ID into `backend/.env`:
   ```
   GOOGLE_CLIENT_ID=1234567890-abcdefg.apps.googleusercontent.com
   ```
5. Restart the backend. The button appears automatically.

Google accounts sign in as **Patients**. If the Google email matches an existing Lumen account, it links to that account and keeps its existing role. Email/password login continues to work exactly as before, in parallel.

---

# Milestone 3 (in progress) — Product & Ingredient Catalogue

## Part 1 — Product database
The `products` table is extended (additively — existing columns untouched) with
skin-type & concern compatibility, full ingredient list, key ingredients,
ingredient benefits, AM/PM usage, warnings, contraindications, image URL, rating,
review count, and dedup/source tracking. All new filter columns are indexed.

**Reusable import script** — `app/import_dataset.py`. Drop a CSV/JSON dataset into
`backend/data/` and run `python -m app.import_dataset --file data/<file> --source <label>`.
It maps varied column names to our schema, de-duplicates, and upserts, so future
dataset updates are one command. See `backend/data/README.md`.

> No third-party dataset is bundled: public skincare datasets carry their own
> licences and are often scraped from retailers. The app ships a curated, citable
> starter catalogue instead, and the importer lets you add a dataset you're
> licensed to use.

## Part 2 — Ingredient knowledge base
The `ingredients` table gains description, scientific category, benefits, side
effects, skin-type & concern compatibility, comedogenic rating (0–5) and
references. Seeded from `app/ingredient_kb.py` — well-documented cosmetic-science
facts drawn from standard dermatology references.

## Part 3 — Product search
`GET /api/products` is upgraded to a fast, paginated search:
- **Search:** name, brand, ingredient, skin type, concern, category
- **Filters:** brand, category, skin type, concern, usage time, tier, price range, min rating
- **Sorting:** name / brand / price / rating / category, asc or desc
- **Pagination:** `page` + `page_size`, returns `{ items, total, total_pages, facets }`
- All search/filter/sort/paginate work is done in SQL over indexed columns;
  ingredients are eager-loaded to avoid N+1 queries.

`GET /api/ingredients` is likewise searchable (by name/category, comedogenic filter).
