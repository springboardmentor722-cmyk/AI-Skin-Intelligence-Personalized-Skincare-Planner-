from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, get_current_user
from ..models import ConsultantProfile, DermatologistProfile, Role, SkinProfile, User
from ..schemas import LoginIn, RegisterIn, TokenOut, UserOut
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=201)
def register(body: RegisterIn, request: Request, db: Session = Depends(get_db)):
    if body.role not in (Role.USER, Role.DERMATOLOGIST, Role.CONSULTANT):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Role must be user, dermatologist, or consultant")
    if db.scalar(select(User).where(User.email == body.email.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "An account with this email already exists")

    user = User(
        email=body.email.lower(),
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=body.role,
        is_verified=(body.role == Role.USER),
    )
    db.add(user)
    db.flush()

    # Provision the role-specific profile shell
    if body.role == Role.USER:
        db.add(SkinProfile(user_id=user.id))
    elif body.role == Role.DERMATOLOGIST:
        db.add(DermatologistProfile(user_id=user.id, is_approved=False))
    elif body.role == Role.CONSULTANT:
        db.add(ConsultantProfile(user_id=user.id, is_approved=False))

    audit(db, request, user, "auth.register", "user", user.id, new_value={"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, request: Request, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "This account is suspended")
    audit(db, request, user, "auth.login", "user", user.id)
    db.commit()
    return TokenOut(access_token=create_access_token(user.id, user.role), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
