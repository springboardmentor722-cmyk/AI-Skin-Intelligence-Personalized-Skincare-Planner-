from fastapi import APIRouter, Depends, HTTPException

from app.models.user import User
from app.services.gemini_service import GEMINI_MODEL, GeminiServiceError, get_gemini_service
from app.utils.auth import get_current_user

router = APIRouter(prefix="/ai", tags=["AI"])


@router.get("/status")
def ai_status(current_user: User = Depends(get_current_user)):
    """Authenticated configuration check. It never returns configuration secrets."""
    try:
        get_gemini_service()
    except (RuntimeError, GeminiServiceError) as error:
        raise HTTPException(status_code=503, detail="Gemini configuration is unavailable.") from error
    return {"configured": True, "provider": "Google Gemini", "model": GEMINI_MODEL}
