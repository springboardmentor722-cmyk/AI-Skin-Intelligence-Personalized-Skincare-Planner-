from fastapi import APIRouter
from app.api.v1 import auth, user_profile, skin_screening, lifestyle, routine, onboarding, scoring

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(user_profile.router, prefix="/profile", tags=["user_profile"])
api_router.include_router(skin_screening.router, prefix="/screening", tags=["skin_screening"])
api_router.include_router(lifestyle.router, prefix="/lifestyle", tags=["lifestyle"])
api_router.include_router(routine.router, prefix="/routines", tags=["routines"])
api_router.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
api_router.include_router(scoring.router, prefix="/scoring", tags=["scoring"])

from app.api.v1 import professionals, admin
api_router.include_router(professionals.router, prefix="/professionals", tags=["professionals"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
@api_router.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Service is healthy"}
