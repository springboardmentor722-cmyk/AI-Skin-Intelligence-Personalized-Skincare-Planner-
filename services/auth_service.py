"""Auth service — reusable database/business logic for authentication."""

from sqlalchemy.orm import Session

from core.security import hash_password, verify_password
from models.role import Role
from models.user import User
from schemas.auth import RegisterRequest


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email, User.is_deleted.is_(False)).first()


def get_role_by_name(db: Session, name: str) -> Role | None:
    return db.query(Role).filter(Role.name == name).first()


def create_user(db: Session, payload: RegisterRequest) -> User:
    """Create a new user account with a hashed password and assigned role."""
    role = get_role_by_name(db, payload.role)
    if role is None:
        raise ValueError(f"Unknown role: {payload.role}")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        hashed_password=hash_password(payload.password),
        gender=payload.gender,
        age=payload.age,
        address=payload.address,
        city=payload.city,
        state=payload.state,
        country=payload.country,
        role_id=role.id,
        terms_accepted=payload.terms_accepted,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Return the user if the email/password combination is valid, else None."""
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
