from fastapi import APIRouter, Depends

from app.core.deps import require_roles
from app.models.user import User, UserRole

router = APIRouter(prefix="/consultant", tags=["Consultant"])


@router.get("/dashboard")
def consultant_dashboard(
    current_user: User = Depends(require_roles(UserRole.CONSULTANT, UserRole.ADMIN)),
):
    """Accessible only to Skincare Consultants (and Admins)."""
    return {
        "message": f"Welcome, {current_user.full_name}",
        "role": current_user.role,
        "note": "Client profiles, assessment reports, and progress monitoring will appear here in later milestones.",
    }