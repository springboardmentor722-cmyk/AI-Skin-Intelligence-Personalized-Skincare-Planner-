# AI Skin Intelligence & Personalized Skincare Planner

A full-stack skincare intelligence platform: users build a skin profile, run an
AI-driven skin assessment, get a personalized routine, check ingredient
suitability, receive product recommendations, track a weighted skin health
score, and log progress over time. Consultants, dermatologists, and admins get
their own dashboards.

This is a **complete, runnable implementation** of every module in the
project spec — not a mockup. It's built to be simple enough for you to read,
explain, and extend for an internship submission, while still being a real
working system.

---

## 1. What's included (mapped to your spec)

| Spec Module | Where it lives |
|---|---|
| 1. Auth & Role-Based Access | `backend/app/routers/auth.py`, `security.py`, `deps.py` |
| 2. Skin Profile Management | `backend/app/routers/profile.py`, frontend `SkinProfile.jsx` |
| 3. Skin Assessment Engine | `backend/app/engine.py` (`run_skin_assessment`), `routers/assessment.py` |
| 4. Personalized Routine Generator | `backend/app/engine.py` (`generate_routine`), `routers/routines.py` |
| 5. Ingredient Intelligence | `backend/app/engine.py` (suitability/interactions), `routers/ingredients.py` |
| 6. Product Recommendation Engine | `backend/app/engine.py` (`score_product_for_profile`), `routers/products.py` |
| 7. Skin Health Scoring Engine | `backend/app/engine.py` (`compute_skin_health_score`), `routers/scoring.py` |
| 8. Progress Tracking & Analytics | `backend/app/routers/progress.py`, frontend `Progress.jsx` (charts) |
| 9. Dashboards (User/Consultant/Dermatologist/Admin) | `backend/app/routers/dashboard.py`, matching frontend pages |
| 10. Notification & Reminder System | `backend/app/routers/notifications.py` |
| 11. Reports & Export (PDF/Excel) | `backend/app/routers/reports.py` |
| 12. Final Integration/Testing/Deployment | `docker-compose.yml`, `backend/Dockerfile`, this README |
| **Photo-based skin analysis** (added) | `backend/app/cv_engine.py` (OpenCV), `routers/photos.py`, frontend `PhotoAnalysis.jsx` |
| **Dermatologist/consultant verification** (added) | `backend/app/routers/verification.py`, frontend `Verification.jsx` + `VerificationQueue.jsx` |
| **Marketing landing page** (added) | frontend `pages/Landing.jsx` at `/`, before login/register |

## 2. Honest note on scope (for your internship writeup)

The original architecture diagram describes separate microservices and a
few pieces (Elasticsearch full-text search, a dedicated vector DB, live
AWS/Azure cloud hosting, application monitoring/backup infrastructure) that
are genuinely a multi-month, multi-engineer build. This project **does**
implement the parts of the stack that were flagged as literally checked:

| Spec item | Status | Where |
|---|---|---|
| PostgreSQL (primary DB) | ✅ Real | `backend/app/database.py` — SQLite for local dev, Postgres via Docker |
| MongoDB (secondary DB) | ✅ Real | `backend/app/mongo.py` — lifestyle journal, preferences, consultant notes |
| Redis (cache) | ✅ Real | `backend/app/cache.py` — caches skin health scores + product recommendations |
| OAuth2 login | ✅ Real | `backend/app/routers/auth.py` `/api/auth/google` + Google Identity Services on the frontend |
| JWT authentication | ✅ Real | `backend/app/security.py` |
| Scikit-learn / XGBoost / LightGBM / Pandas / NumPy | ✅ Real, trained models | `backend/app/ml/` — see section 12 below |
| One FastAPI app instead of 12 separate microservices | ⚠️ Simplified | Same functional boundaries (one router file per module), one deployable unit instead of 12 |
| Elasticsearch, dedicated vector DB (FAISS/Pinecone), live cloud deploy, monitoring/backup infra | ❌ Not built | Explained below — genuinely out of scope for a solo 8-week build with no functional payoff over what's here |

**Why the "not built" row is a reasonable line to draw, if asked:** Elasticsearch
and a vector DB exist in the original diagram to power full-text/semantic
search over a large product catalog — with a 12-product seed catalog there's
nothing for them to do that Postgres `LIKE`/filtering doesn't already do
identically. Live AWS/Azure hosting is a config/billing choice on your own
cloud account, not a code change — `docker-compose.yml` already builds
exactly what you'd push there; say so and offer to walk through deploying it
if asked live. Monitoring/backup infrastructure (Datadog-style dashboards,
automated backups) is ops tooling with no user-facing feature behind it.

## 3. Tech stack actually used

- **Backend:** Python, FastAPI, SQLAlchemy, JWT auth (python-jose) + OAuth2/Google login,
  bcrypt password hashing, ReportLab (PDF export), openpyxl (Excel export)
- **Databases:** PostgreSQL/SQLite (relational), MongoDB (documents), Redis (cache)
- **ML:** scikit-learn, XGBoost, LightGBM, pandas, NumPy, joblib
- **Computer Vision:** OpenCV (face detection + color-space/texture analysis for photo-based skin signals)
- **Frontend:** React 18, Vite, React Router, Tailwind CSS, Recharts (charts), Framer Motion (animation), Lucide (icons), Axios, Google Identity Services
- **Deployment:** Docker + Docker Compose (Postgres + MongoDB + Redis + backend)

## 4. Photo-based skin analysis — what it actually does

This was added on top of the original spec. It is **real, working computer
vision** (`backend/app/cv_engine.py`), not a mock:

- **Face detection** via a Haar cascade classifier bundled with OpenCV
  (no external model download required).
- **Redness**: mean of the LAB color space's a* channel (green-red axis)
  within a skin-tone mask.
- **Texture/roughness**: a compressed Laplacian-variance measure (a standard
  edge-detail/sharpness metric) as a rough proxy for visible surface texture.
- **Tone evenness**: inverse of the standard deviation of lightness across
  the skin-masked region.
- **Oiliness/shine**: percentage of skin pixels that are bright and
  low-saturation (specular-highlight-like).

These four numbers are blended into the next assessment's condition scores
(`engine.blend_photo_signals`, 60% questionnaire / 40% photo-signal weighting)
when a photo with a detected face exists.

**What it deliberately does NOT do:** diagnose any medical condition (acne
grade, rosacea, eczema, skin cancer, etc.). It is explicitly framed everywhere
in the UI and API responses as a visual estimate, not a diagnosis — that's
what the dermatologist verification/review flow below is for. If you extend
this module, keep that line: return measurements, not diagnoses.

## 5. Dermatologist / consultant verification

Consultants and dermatologists start in `pending` status on signup
(`backend/app/routers/verification.py`). They submit a license number and
credentials (`/verification` page), an admin reviews the queue
(`/admin/verification`) and approves or rejects, and a verified badge then
shows on their dashboard and in the navbar. Verified dermatologists can also
expand a patient's photo-analysis scores from their dashboard — this is the
"human checks the AI" loop: CV gives a measurement, a credential-checked
professional is the one who interprets it clinically.

## 6. Landing page

`frontend/src/pages/Landing.jsx`, served at `/` for logged-out visitors
(logged-in users are redirected straight to `/dashboard`). It's a real
marketing page, not a login form — hero with the "reticle" scan-instrument
motif (this product's one recurring visual signature, echoed in the score
gauges elsewhere), a feature grid, a real 4-step "how it works" sequence, and
an honest section explaining the verification system (no fabricated
testimonials — the stats and claims on this page are all things the app
actually does).

## 7. Project structure

```
skin-intelligence-app/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app, router registration
│   │   ├── database.py        # DB engine/session setup (Postgres/SQLite)
│   │   ├── mongo.py           # MongoDB connection (journal, preferences, notes)
│   │   ├── cache.py           # Redis connection (score + recommendation caching)
│   │   ├── models.py          # SQLAlchemy models (all entities)
│   │   ├── schemas.py         # Pydantic request/response schemas
│   │   ├── security.py        # JWT + password hashing
│   │   ├── deps.py            # auth dependency + role-based access control
│   │   ├── engine.py          # rule-based scoring/recommendation logic + ML blending
│   │   ├── cv_engine.py       # OpenCV photo analysis (face detection, redness/texture/etc.)
│   │   ├── ml/                # trained model training + inference (XGBoost, LightGBM)
│   │   │   ├── features.py
│   │   │   ├── train_models.py
│   │   │   ├── predict.py
│   │   │   └── models/        # saved .joblib model files (pre-trained, included)
│   │   ├── media/uploads/     # uploaded skin photos (created at runtime, gitignored)
│   │   ├── seed_data.py       # creates admin + sample ingredients/products
│   │   └── routers/           # one file per module (auth, profile, assessment, photos, verification, ...)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/               # axios client + endpoint functions
│   │   ├── context/           # auth context (login/register/logout)
│   │   ├── components/        # Navbar, ProtectedRoute, ScoreGauge, Reticle, GoogleSignInButton
│   │   ├── pages/
│   │   │   ├── Landing.jsx          # public marketing page at "/"
│   │   │   ├── PhotoAnalysis.jsx    # photo upload + CV results
│   │   │   ├── Verification.jsx     # dermatologist/consultant credential submission
│   │   │   ├── VerificationQueue.jsx # admin approval queue
│   │   │   └── ...                  # one file per remaining screen
│   │   ├── App.jsx             # routes
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js          # dev proxy to backend on :8000
│   └── tailwind.config.js      # design tokens (porcelain/teal/rose/gold palette, Fraunces/Plex fonts)
├── docker-compose.yml
└── README.md   (this file)
```

## 8. Running it locally (fastest way — SQLite, no Docker needed)

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed_data         # creates tables + admin account + sample catalog
uvicorn app.main:app --reload   # runs on http://127.0.0.1:8000
```
Interactive API docs: **http://127.0.0.1:8000/docs**

Default admin login created by the seed script:
- Email: `admin@skinintel.com`
- Password: `Admin@123`

**First `uvicorn` startup can take 15-20 seconds** (up from a couple of
seconds in the original build) — it's now importing OpenCV, XGBoost, and
LightGBM at startup, not a hang. Subsequent restarts are the same; there's no
caching of the import itself, that's just the cost of the heavier stack.

### Frontend
In a second terminal:
```bash
cd frontend
npm install
npm run dev                     # runs on http://127.0.0.1:5173
```
The Vite dev server proxies all `/api/*` calls to the backend on port 8000
(see `vite.config.js`), so just open **http://127.0.0.1:5173** and use the app.

## 9. Running it with Docker (PostgreSQL, matches the spec's DB choice)

```bash
docker compose up --build
```
This starts PostgreSQL + MongoDB + Redis + the backend, all wired together
via environment variables in `docker-compose.yml`. Then run the frontend
separately with `npm run dev` (or `npm run build` and serve the `dist/`
folder with any static host / nginx). After the containers are up, seed the
database once:
```bash
docker compose exec backend python -m app.seed_data
```

## 10. Setting up MongoDB and Redis for local (non-Docker) dev

The app works fine without these -- it just runs with caching disabled and
the lifestyle-journal/notes features return empty until Mongo is up. To run
them for real locally:

**MongoDB:**
```bash
# macOS: brew install mongodb-community && brew services start mongodb-community
# Ubuntu: sudo apt install mongodb  (or run via Docker: docker run -d -p 27017:27017 mongo:7)
# Windows: install MongoDB Community Server from mongodb.com, it runs as a service
```
Then set `MONGO_URL=mongodb://localhost:27017` (this is already the default).

**Redis:**
```bash
# macOS: brew install redis && brew services start redis
# Ubuntu: sudo apt install redis-server && sudo systemctl start redis-server
# Windows: use Docker: docker run -d -p 6379:6379 redis:7-alpine
```
Then set `REDIS_URL=redis://localhost:6379/0` (already the default).

Check both are actually being used: log in as the admin account and open the
Admin Dashboard — it shows live connection status for Postgres/SQLite,
MongoDB, Redis, and both ML models, pulled straight from `/api/dashboard/admin`.

## 11. Setting up Google OAuth2 login

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a
   project (or use an existing one) → **APIs & Services → Credentials**.
2. Click **Create Credentials → OAuth client ID** → Application type: **Web application**.
3. Under **Authorized JavaScript origins**, add `http://localhost:5173`
   (and your real domain later, e.g. `https://yourapp.com`).
4. Copy the generated **Client ID**.
5. Backend: set the environment variable `GOOGLE_CLIENT_ID=<your client id>`
   before starting uvicorn (or add it to `docker-compose.yml`'s backend
   environment / a `.env` file).
6. Frontend: create `frontend/.env` with:
   ```
   VITE_GOOGLE_CLIENT_ID=<your client id>
   ```
   then restart `npm run dev`.

Once both are set, the "Continue with Google" button appears on the login
page automatically. Without them, the button shows a small note explaining
it isn't configured yet — the rest of the app is unaffected.

## 12. Training the ML models (XGBoost + LightGBM)

Two trained models are already included in `backend/app/ml/models/*.joblib`
so the app uses real ML predictions out of the box. To see the training
process yourself (useful for your demo/viva) or retrain after changing the
feature logic:

```bash
cd backend
python -m app.ml.train_models
```

This prints real evaluation metrics (MAE, R²) on a held-out test split, e.g.:
```
[Concern Severity Model] XGBoost -> MAE: 3.24, R2: 0.856
[Product Suitability Model] LightGBM -> MAE: 4.24, R2: 0.910
```

**How training data is generated (important to understand for your viva):**
there's no historical dataset of real user outcomes yet, so `train_models.py`
generates thousands of synthetic profiles, scores them with the existing
rule-based engine (`engine.py`) as a "ground truth" label generator, adds
realistic random noise, and trains gradient-boosted models to reproduce and
generalize those rules. This is a standard, defensible cold-start technique.
Once real user data accumulates (real assessments, real purchase/feedback
outcomes), swap the `generate_*_training_data` functions in
`train_models.py` to pull from your database instead of synthetic sampling —
nothing else needs to change.

**How it's wired into the API:** `backend/app/engine.py` has
`run_skin_assessment_hybrid()` and `score_product_for_profile_hybrid()`,
which try the trained model first and silently fall back to the pure rule
engine if a model file is missing or a prediction errors. Every assessment
and product recommendation response includes a `scoring_method` /
`method` field (`"ml"` or `"rules"`) so you can show your evaluator, live,
which one is running — the frontend already displays a small badge for this
on the Assessment and Products pages.

## 13. Adding your own data manually

Two ways:
1. **Through the API/UI** — the admin routes support creating ingredients
   (`POST /api/ingredients`) and products (`POST /api/products`). You can also
   just call these from `/docs` (Swagger UI) if you don't want to build an
   admin form for that yet.
2. **Directly in `backend/app/seed_data.py`** — add more entries to the
   `INGREDIENTS` and `PRODUCTS` lists and re-run `python -m app.seed_data`
   (it only seeds if the tables are empty, so clear the DB file first if you
   want to reseed from scratch).

## 14. How the "AI" scoring actually works (for your viva/demo)

All of this lives in `backend/app/engine.py`, fully commented:

- **Skin Assessment:** each declared concern gets a base severity score,
  adjusted upward for poor sleep, low water intake, high UV/pollution
  exposure, and smoking — then concerns are ranked by severity.
- **Routine Generator:** rule table mapping skin type + concerns →
  cleansing/treatment/moisturizing/SPF steps for morning, evening, weekly,
  and seasonal routines.
- **Ingredient Intelligence:** checks a chosen ingredient against the user's
  allergies/sensitivities/skin type, and flags known conflicting ingredient
  pairs (e.g. Retinol + Vitamin C on the same night).
- **Product Recommendation:** scores each product 0–100 based on skin-type
  match, concern match, allergy conflicts (heavily penalized), and budget fit.
- **Skin Health Score:** exactly the weighted formula from the spec —
  `35% condition + 20% lifestyle + 15% sleep + 20% routine consistency + 10% hydration`.

Two of these (Skin Assessment concern scoring, Product Recommendation) now
also have a trained ML model in front of them (`backend/app/ml/`) that tries
first and falls back to the rules above if it can't load — see section 12.

## 15. Suggested internship demo flow

1. Start at `/` — walk through the landing page (hero, features, how-it-works, verification section) before logging in
2. Register as a `user` → fill in Skin Profile → Run Assessment
3. Upload a photo on the Photo Analysis page → note the redness/texture/evenness/oiliness readout and the disclaimer → run the assessment again and point out it's now blended with the photo signal
4. Generate morning + evening routines
5. Check Product Recommendations (shows the scoring reasons + ML/rules badge)
6. Check Ingredient suitability (try Retinol + Vitamin C together to see
   the interaction warning)
7. Log a couple of days of Progress → Recompute Skin Health Score → view the
   trend chart
8. Log out, register as a `dermatologist` → submit credentials on the Verification page → note the "pending" badge
9. Log out, log in as `admin@skinintel.com` → open Verification Queue → approve the dermatologist → view Admin Dashboard + User Management + live system status (Postgres/Mongo/Redis/ML models)
10. Log back in as the dermatologist → note the badge is now "Verified" → open a patient's assessment on the dashboard and expand "Photo analysis" to show the human-review loop
11. If you set up Google OAuth2 (section 11), demo "Continue with Google" too

## 16. What to build next (good "future work" slide)

- Retrain the XGBoost/LightGBM models on **real** assessment ↔ improvement
  outcome data once enough users have logged progress (swap the synthetic
  data generator in `train_models.py` for a real database query — see section 12)
- Add a scheduled job (Celery beat / cron) to call
  `POST /api/notifications/generate-reminders` daily instead of on-demand
- Add real image upload for before/after progress photos (currently a URL
  string field, ready for S3/Azure Blob wiring)
- Add Elasticsearch/vector search once the product catalog is large enough
  that filtering in Postgres stops being fast enough
- Split the FastAPI monolith into the microservices shown in the original
  architecture diagram once you need to scale each piece independently
