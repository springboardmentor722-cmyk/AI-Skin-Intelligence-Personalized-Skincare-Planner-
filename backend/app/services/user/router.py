from typing import Annotated, Any

from fastapi import APIRouter, Depends

from app.core.security import require_user
from app.services.user.schemas import UserMeResponse

router = APIRouter()


@router.get("/me")
async def get_me(
    user: Annotated[dict[str, Any], Depends(require_user)],
) -> UserMeResponse:
    """Round-trips the Better Auth JWT through FastAPI's JWKS validation — id/role
    come straight from the validated claims, no DB read yet (User Profile module owns
    the domain profile; this just proves the auth pipeline works end to end)."""
    return UserMeResponse(id=user["id"], role=user["role"])
