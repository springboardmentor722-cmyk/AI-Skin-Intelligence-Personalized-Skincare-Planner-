from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.ingredient import Ingredient
from app.models.lifestyle import Lifestyle
from app.models.product import Product
from app.models.progress import Progress
from app.models.skin_profile import SkinProfile
from app.models.user import User
from app.utils.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Authenticated dashboard counts, using the real catalog and user records."""
    active_products = db.query(Product).filter(Product.is_active.is_(True)).count()
    active_ingredients = db.query(Ingredient).filter(Ingredient.is_active.is_(True)).count()

    if current_user.role == "ADMIN":
        return {
            "name": current_user.name,
            "role": current_user.role,
            "total_users": db.query(User).count(),
            "total_products": active_products,
            "total_ingredients": active_ingredients,
            "total_progress": db.query(Progress).count(),
        }

    if current_user.role == "USER":
        return {
            "name": current_user.name,
            "role": current_user.role,
            "skin_profiles": db.query(SkinProfile).filter(SkinProfile.user_id == current_user.id).count(),
            "lifestyle": db.query(Lifestyle).filter(Lifestyle.user_id == current_user.id).count(),
            "progress": db.query(Progress).filter(Progress.user_id == current_user.id).count(),
            "products": active_products,
            "ingredients": active_ingredients,
        }

    return {
        "name": current_user.name,
        "role": current_user.role,
        "products": active_products,
        "ingredients": active_ingredients,
        "approved_users": db.query(User).filter(User.verification_status == "Approved").count(),
        "pending_users": db.query(User).filter(User.verification_status == "Pending").count(),
    }
