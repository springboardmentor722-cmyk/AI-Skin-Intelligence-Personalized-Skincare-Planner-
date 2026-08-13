from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, require
from ..models import LifestyleLog, SkinProfile, User
from ..schemas import (
    LifestyleIn, LifestyleOut, SkinProfileIn, SkinProfileOut, UserOut, UserUpdateIn,
)
from ..security import hash_password

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def get_me(user: User = Depends(require("profile.read_own"))):
    return user


@router.put("/me", response_model=UserOut)
def update_me(body: UserUpdateIn, request: Request,
              user: User = Depends(require("profile.update_own")),
              db: Session = Depends(get_db)):
    old = {"full_name": user.full_name}
    if body.full_name:
        user.full_name = body.full_name
    if body.password:
        user.password_hash = hash_password(body.password)
    audit(db, request, user, "profile.update", "user", user.id, old_value=old,
          new_value={"full_name": user.full_name, "password_changed": bool(body.password)})
    db.commit()
    db.refresh(user)
    return user


@router.get("/me/skin-profile", response_model=SkinProfileOut)
def get_skin_profile(user: User = Depends(require("skin_profile.read_own")),
                     db: Session = Depends(get_db)):
    profile = db.scalar(select(SkinProfile).where(SkinProfile.user_id == user.id))
    if not profile:
        profile = SkinProfile(user_id=user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("/me/skin-profile", response_model=SkinProfileOut)
def update_skin_profile(body: SkinProfileIn, request: Request,
                        user: User = Depends(require("skin_profile.update_own")),
                        db: Session = Depends(get_db)):
    profile = db.scalar(select(SkinProfile).where(SkinProfile.user_id == user.id))
    if not profile:
        profile = SkinProfile(user_id=user.id)
        db.add(profile)
        db.flush()
    old = {c: getattr(profile, c) for c in body.model_dump(exclude_unset=True)}
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    audit(db, request, user, "skin_profile.update", "skin_profile", profile.id,
          old_value=old, new_value=body.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/me/lifestyle", response_model=list[LifestyleOut])
def list_lifestyle(user: User = Depends(require("lifestyle.read_own")),
                   db: Session = Depends(get_db)):
    rows = db.scalars(
        select(LifestyleLog).where(LifestyleLog.user_id == user.id).order_by(LifestyleLog.log_date.desc()).limit(60)
    ).all()
    return rows


@router.post("/me/lifestyle", response_model=LifestyleOut, status_code=201)
def add_lifestyle(body: LifestyleIn, request: Request,
                  user: User = Depends(require("lifestyle.create_own")),
                  db: Session = Depends(get_db)):
    log_date = body.log_date or date.today()
    row = db.scalar(select(LifestyleLog).where(LifestyleLog.user_id == user.id,
                                               LifestyleLog.log_date == log_date))
    if row is None:
        row = LifestyleLog(user_id=user.id, log_date=log_date)
        db.add(row)
    for key, value in body.model_dump(exclude_unset=True, exclude={"log_date"}).items():
        setattr(row, key, value)
    audit(db, request, user, "lifestyle.log", "lifestyle_log", str(log_date),
          new_value=body.model_dump(exclude_unset=True))
    db.commit()
    db.refresh(row)
    return row
