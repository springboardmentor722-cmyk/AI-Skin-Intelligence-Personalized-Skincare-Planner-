from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserRegister, UserLogin, TokenResponse, UserResponse
from app.utils.security import hash_password, verify_password, create_access_token
from sqlalchemy import func

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Register a new user with role selection
    """
    
    # Check if user already exists
    existing_user = db.query(User).filter(
        func.lower(User.email) == func.lower(user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user with role_id
    hashed_password = hash_password(user_data.password)
    
    # ✅ AUTO-APPROVE ADMINS (role_id = 4)
    # Other roles require manual approval
    is_approved_on_register = (user_data.role_id == 4)
    
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        password=hashed_password,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        age=user_data.age,
        gender=user_data.gender,
        phone=user_data.phone,
        role_id=user_data.role_id,
        is_active=True,
        is_approved=is_approved_on_register  # ✅ Admins auto-approved
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate JWT token
    access_token = create_access_token(
        data={"sub": str(new_user.user_id), "email": new_user.email, "role_id": new_user.role_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(new_user)
    }


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login user - works for all roles
    """
    
    # Find user by email
    user = db.query(User).filter(
        func.lower(User.email) == func.lower(login_data.email)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # ✅ NEW: Check if user is approved by admin
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval"
        )
    
    # Generate JWT token with role_id
    access_token = create_access_token(
        data={"sub": str(user.user_id), "email": user.email, "role_id": user.role_id}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.from_orm(user)
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: str = None,
    db: Session = Depends(get_db)
):
    """Get current logged-in user details"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    # Extract token from "Bearer <token>"
    try:
        token = authorization.split(" ")[1]
    except IndexError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    
    payload = verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    user = db.query(User).filter(User.user_id == int(user_id)).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse.from_orm(user)