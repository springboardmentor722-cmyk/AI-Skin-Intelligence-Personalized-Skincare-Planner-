# AI Skin Intelligence & Personalized Skincare Planner

A foundation build — real, running code for the core architecture, with clear extension
points for the remaining ML/product work on your 8-week roadmap.

## What's implemented (working end-to-end)
- **Auth**: JWT access+refresh tokens, bcrypt hashing, 4-role RBAC (User, Consultant,
  Dermatologist, Admin) via a FastAPI dependency (`require_roles(...)`).
- **Databases**: PostgreSQL (users, structured data) via async SQLAlchemy; MongoDB
  (scan results, ingredient DB, product catalog) via Motor.
- **Face capture**: React Webcam + MediaPipe Face Mesh in the browser for live alignment
  guidance (distance/position feedback) before capture.
- **Face analysis pipeline**: MediaPipe landmark extraction (`app/ml/face_mesh.py`) crops
  skin ROIs (forehead, cheeks, under-eye, etc.) → OpenCV heuristic scoring today
  (`app/ml/inference.py`), with the exact same interface your trained TensorFlow/sklearn
  models will plug into once exported — **no API changes needed** when you swap them in.
- **Skin Health Score**: exact weighting from your spec (Skin Condition 35%, Lifestyle 20%,
  Sleep 15%, Routine Consistency 20%, Hydration 10%) — unit-tested in `tests/test_skin_score.py`.
- **Routine engine**: rule-based morning/evening/weekly/seasonal generator that reacts to
  detected concerns and sensitivity.
- **Product recommender**: matches routine steps to a seeded product catalog (Minimalist,
  Dot & Key, CeraVe, Cetaphil, The Ordinary, Neutrogena) by ingredient, skin type, and budget.
- **Dashboard**: KPI cards, animated Skin Health Score gauge, scan trigger — Framer Motion,
  Tailwind, warm/premium design tokens (not generic blue SaaS).
- **Docker Compose**: postgres + mongo + backend + frontend, one command.

## What's intentionally stubbed (needs your model training / data work)
1. **Trained ML models** — `SkinAnalyzer._infer_with_trained_models()` is a clear stub.
   Export your ResNet18 skin-type classifier + multi-label concern classifier to
   `backend/app/ml/weights/`, load them in `__init__`, replace the heuristic branch.
2. **Product/ingredient catalog** — only 6 seed products in `product_recommender.py`.
   Real INCI Decoder ingestion needs a licensed data source or manual curation (ToS-permitting).
3. **PDF reports, before/after image diffing, streak persistence** — dashboard UI is ready;
   these need a `/reports` route (reportlab, already in requirements.txt) and a
   `routine_logs` write path.
4. **Alembic migrations** — currently using `create_all` for dev convenience; add real
   migrations before production.
5. **Consultant/Dermatologist/Admin dashboards** — RBAC is enforced at the API layer;
   role-specific frontend views aren't built yet.

## Run locally
```bash
cp backend/.env.example backend/.env   # then set a real JWT_SECRET_KEY
docker compose up --build
```
- Frontend: http://localhost:3000
- API docs (Swagger): http://localhost:8000/docs

## Run backend tests
```bash
cd backend && pip install -r requirements.txt && pytest tests/ -v
```

## Suggested next session
Pick ONE: (a) wire your trained TF models into `inference.py`, (b) build the PDF report
endpoint, or (c) build the Consultant/Dermatologist review dashboard. Trying to do all of
Phase 2 at once is how projects stall — one vertical slice at a time keeps it shippable.
