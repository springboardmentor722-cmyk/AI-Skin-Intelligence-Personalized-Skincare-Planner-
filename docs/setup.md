# Project Setup Guide

## Prerequisites
- Python 3.11+ · Node.js 18+ · Git
- Optional: PostgreSQL 15+ and MongoDB 6+ (SQLite works out of the box for development)

## Backend
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # edit if needed
python -m app.seed                 # tables + demo data (idempotent)
uvicorn app.main:app --reload --port 8000
```
- API docs: http://localhost:8000/docs
- Reset the local database: delete `backend/lumen.db` and re-run the seed.

### PostgreSQL
```bash
createdb lumen
# .env:
# DATABASE_URL=postgresql+psycopg2://<user>:<pass>@localhost:5432/lumen
python -m app.seed
```

### MongoDB (optional, reserved for AI milestones)
Set `MONGO_URL=mongodb://localhost:27017` and `MONGO_DB=lumen` in `.env`.
Nothing in Milestone 1 requires it; `app.database.get_mongo()` returns the handle.

### Environment variables
| Variable | Default | Purpose |
|---|---|---|
| DATABASE_URL | sqlite:///./lumen.db | SQLAlchemy connection string |
| JWT_SECRET | dev value | **Change in production** |
| ACCESS_TOKEN_EXPIRE_MINUTES | 1440 | Token lifetime |
| FRONTEND_ORIGIN | http://localhost:5173 | CORS allow-list |
| MONGO_URL / MONGO_DB | empty / lumen | Optional Mongo hook |

## Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxies /api to :8000)
npm run build      # production bundle in dist/
```

## Git / GitHub
```bash
git init && git add . && git commit -m "Milestone 1 foundation"
git branch -M main
git remote add origin https://github.com/<org>/lumen.git
git push -u origin main
```
Team flow: protected main · feature branches `feat/<name>` · PR + 1 review · conventional commits.

## Smoke test
1. Log in as `user@lumen.app / User@1234` → dashboard shows the score dial and trends.
2. Dermatologists → book Dr. Ananya Bose for tomorrow → pick a slot.
3. Log in as `derm@lumen.app / Derm@1234` → Appointments → Accept.
4. Back as the patient → notification "Appointment confirmed".
5. Consultants → "Request any consultant" → routine planning.
6. Log in as `consultant@lumen.app / Consult@1234` → Requests → Accept → Routine Builder → publish.
7. Log in as `admin@lumen.app / Admin@1234` → Audit Logs shows every step above.
