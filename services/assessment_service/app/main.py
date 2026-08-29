from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.assessment_service.app.db.init_db import init_db
from services.assessment_service.app.api.assessment import router as assessment_router
from services.assessment_service.app.api.routine import router as routine_router

app = FastAPI(title="Assessment Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assessment_router)
app.include_router(routine_router)


@app.on_event("startup")
def startup():
    init_db()
    print("Assessment Service: Postgres tables ready")


@app.get("/health")
def health():
    return {"status": "Assessment Service Running"}
