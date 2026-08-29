from fastapi import FastAPI
from services.profile_service.app.db.init_db import init_db
from services.profile_service.app.api.profile import router as profile_router
from services.profile_service.app.api.care_team import router as care_team_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Profile Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile_router)
app.include_router(care_team_router)


@app.on_event("startup")
def startup():
    init_db()
    print("Profile Database Initialized")


@app.get("/health")
def health():
    return {"status": "Profile Service Running"}