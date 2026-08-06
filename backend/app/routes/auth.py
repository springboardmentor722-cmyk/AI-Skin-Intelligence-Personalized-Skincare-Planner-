from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from app.role_dependencies import require_role
from app.dependencies import get_current_user
from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    UserUpdate,
    Token
)
from app.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Hash password
    hashed_password = hash_password(user.password)

    # Create new user
    new_user = User(
        full_name=user.full_name,
        email=user.email,
        password=hashed_password,
        age=user.age,
        gender=user.gender,
        role="user"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    # Find user by email
    db_user = db.query(User).filter(User.email == form_data.username).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    # Create JWT token
    access_token = create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


   
@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/admin")
def admin_dashboard(
    current_user: User = Depends(require_role("admin"))
):
    return {
        "message": f"Welcome Admin {current_user.full_name}"
    }

@router.get("/consultant")
def consultant_dashboard(
    current_user: User = Depends(require_role("consultant"))
):
    return {
        "message": f"Welcome Consultant {current_user.full_name}"
    }

@router.get("/dermatologist")
def dermatologist_dashboard(
    current_user: User = Depends(require_role("dermatologist"))
):
    return {
        "message": f"Welcome Dermatologist {current_user.full_name}"
    }

@router.put("/profile", response_model=UserResponse)
def update_profile(
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    current_user.full_name = user.full_name
    current_user.age = user.age
    current_user.gender = user.gender
    
    db.commit()
    db.refresh(current_user)

    return current_user

@router.get("/dermatologists")
def get_dermatologists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    dermatologists = (
        db.query(User)
        .filter(User.role == "dermatologist")
        .all()
    )

    return [
        {
            "id": doctor.id,
            "full_name": doctor.full_name,
            "email": doctor.email,
            "age": doctor.age,
            "gender": doctor.gender,
        }
        for doctor in dermatologists
    ]