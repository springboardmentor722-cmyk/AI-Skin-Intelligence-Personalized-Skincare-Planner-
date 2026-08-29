from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.auth_service.app.api.auth import router as auth_router
from services.profile_service.app.api.profile import router as profile_router
from services.profile_service.app.api.care_team import router as care_team_router
from services.assessment_service.app.api.assessment import router as assessment_router
from services.assessment_service.app.api.routine import router as routine_router
from services.recommendation_service.app.api.recommendation import router as recommendation_router

from services.auth_service.app.db.init_db import init_db as init_auth_db
from services.profile_service.app.db.init_db import init_db as init_profile_db

app = FastAPI(
    title="AI Skin Intelligence API Gateway",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(care_team_router)
app.include_router(assessment_router)
app.include_router(routine_router)
app.include_router(recommendation_router)

@app.on_event("startup")
def startup():
    try:
        init_auth_db()
        init_profile_db()
    except Exception as e:
        print(f"Startup DB Init Notice: {e}")

@app.get("/")
def root():
    return {
        "message": "Welcome to AI Skin Intelligence API Gateway"
    }

@app.get("/health")
def health():
    return {
        "status": "Gateway Running Successfully"
    }