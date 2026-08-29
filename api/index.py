import sys
import os

# Add root directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import routers from microservices
from services.auth_service.app.api.auth import router as auth_router
from services.profile_service.app.api.profile import router as profile_router
from services.profile_service.app.api.care_team import router as care_team_router
from services.assessment_service.app.api.assessment import router as assessment_router
from services.assessment_service.app.api.routine import router as routine_router
from services.recommendation_service.app.api.recommendation import router as recommendation_router

# Import database init helpers
from services.auth_service.app.db.init_db import init_db as init_auth_db
from services.profile_service.app.db.init_db import init_db as init_profile_db

app = FastAPI(
    title="AI Skin Intelligence Serverless Gateway",
    version="1.0.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json"
)

# Configure CORS for Vercel deployment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all service routers
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

@app.get("/health")
@app.get("/api/health")
def health():
    return {
        "status": "AI Skin Intelligence Backend Running",
        "services": ["auth", "profile", "care_team", "assessment", "routine", "recommendation"]
    }

@app.get("/")
@app.get("/api")
def root():
    return {"message": "Welcome to AI Skin Intelligence API"}
