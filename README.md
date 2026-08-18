# AI Skin Intelligence & Personalized Skincare Planner

**Milestone 1 — Foundation**

This milestone establishes the application's foundation: project structure, secure authentication, role-based access control, and skin/lifestyle data collection. No AI features are included in this phase (by design — see brief).

## What's included
- ✅ System architecture (see `docs/ARCHITECTURE.md`)
- ✅ Database schema — PostgreSQL (relational) + MongoDB (catalog) (see `docs/DATABASE_SCHEMA.md`)
- ✅ UI wireframes for all 7 required pages (see `docs/WIREFRAMES.md`)
- ✅ React frontend skeleton with routing for all 7 pages
- ✅ FastAPI backend with:
  - JWT authentication (register/login, bcrypt password hashing)
  - Role-based access control (user / skincare_consultant / dermatologist / administrator)
  - Skin profile module (age, gender, skin type, concerns, allergies, sensitivities)
  - Lifestyle tracking module (sleep, water intake, exercise, stress, environmental exposure)
- ✅ Initial product & ingredient datasets seeded into MongoDB (for later AI milestones)
- ✅ Full documentation (architecture, schema, API endpoints, folder structure, setup)

## Quick Start
See `docs/SETUP_INSTRUCTIONS.md` for full setup. TL;DR:
```bash
# Backend
cd backend && python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # edit with real DB credentials
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend && npm install && npm run dev
```

## Project Structure
See `docs/FOLDER_STRUCTURE.md`.

## Not in Scope for Milestone 1
- Any AI/ML recommendation logic
- Consultant/dermatologist cross-user data access UI
- Progress tracking visualizations (schema exists; UI is placeholder)
