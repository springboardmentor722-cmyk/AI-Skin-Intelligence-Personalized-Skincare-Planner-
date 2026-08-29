from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from services.profile_service.app.schemas.profile import ProfileCreate, ProfileUpdate
from services.profile_service.app.db.dependencies import get_db
from services.profile_service.app.business.profile_service import (
    create_profile, get_profile, update_profile,
)
from services.auth_service.app.utils.dependencies import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.post("/create")
def create(profile: ProfileCreate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return create_profile(profile, current_user, db)


@router.get("/me")
def me(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return get_profile(current_user, db)


@router.put("/update")
def update(updates: ProfileUpdate, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    return update_profile(updates, current_user, db)