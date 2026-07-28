from fastapi import APIRouter, Depends

from app.core.deps import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/dermatologist", tags=["Dermatologist"])


@router.get("/dashboard")
def dermatologist_dashboard(
    current_user: User = Depends(require_roles(UserRole.DERMATOLOGIST, UserRole.ADMIN)),
):
    """Accessible only to Dermatologists (and Admins)."""
    return {
        "message": f"Welcome, {current_user.full_name}",
        "role": current_user.role,
        "note": "Patient insights, skin condition reports, and treatment recommendations will appear here in later milestones.",
    }