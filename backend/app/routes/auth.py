from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.user import User
from app.utils.rbac import get_current_user_with_role
from app.utils.security import (
    hash_password,
    verify_password,
    create_access_token
)
from datetime import datetime

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ============================================
# PYDANTIC SCHEMAS
# ============================================
class UserRegister(BaseModel):
    email: str
    password: str
    username: str
    first_name: str
    last_name: str
    role_id: int = 1

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    user_id: int
    email: str
    username: str
    first_name: str
    last_name: str
    role_id: int
    is_active: bool
    is_approved: bool
    
    class Config:
        from_attributes = True

# ============================================
# REGISTER ENDPOINT
# ============================================
@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        print(f"Register attempt: {user_data.email}")
        
        # Validate email format
        if not user_data.email or '@' not in user_data.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email already exists
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Check if username already exists
        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")
        
        # Validate password length
        if len(user_data.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
        # ✅ USE hash_password FROM security.py
        hashed_password = hash_password(user_data.password)
        
        # Determine auto-approval: Only Admin (role_id=4) auto-approved
        is_approved = (user_data.role_id == 4)
        
        # Create new user
        new_user = User(
            email=user_data.email,
            password=hashed_password,
            username=user_data.username,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            role_id=user_data.role_id,
            is_approved=is_approved,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        
        print(f"User registered: {new_user.user_id}, approved: {is_approved}")
        
        # If auto-approved (admin), return token
        if is_approved:
            access_token = create_access_token({
                "sub": str(new_user.user_id),
                "email": new_user.email,
                "role_id": new_user.role_id
            })
            
            return {
                "message": "Registration successful",
                "access_token": access_token,
                "token_type": "bearer",
                "user": {
                    "user_id": new_user.user_id,
                    "email": new_user.email,
                    "username": new_user.username,
                    "first_name": new_user.first_name,
                    "last_name": new_user.last_name,
                    "role_id": new_user.role_id,
                    "is_active": True,
                    "is_approved": True
                }
            }
        else:
            # Non-admin users need approval
            return {
                "message": "Registration successful. Please wait for admin approval.",
                "is_approved": False,
                "user": {
                    "user_id": new_user.user_id,
                    "email": new_user.email,
                    "username": new_user.username,
                    "first_name": new_user.first_name,
                    "last_name": new_user.last_name,
                    "role_id": new_user.role_id,
                    "is_active": True,
                    "is_approved": False
                }
            }
    except HTTPException as e:
        db.rollback()
        raise e
    except Exception as e:
        db.rollback()
        print(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

# ============================================
# LOGIN ENDPOINT
# ============================================
@router.post("/login")
async def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return token"""
    try:
        print(f"Login attempt: {login_data.email}")
        
        # Find user by email
        user = db.query(User).filter(User.email == login_data.email).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # ✅ USE verify_password FROM security.py
        if not verify_password(login_data.password, user.password):
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        # Check if approved
        if not user.is_approved:
            raise HTTPException(
                status_code=403, 
                detail="Your account is pending admin approval. Please wait."
            )
        
        # Check if active
        if not user.is_active:
            raise HTTPException(status_code=403, detail="Your account has been disabled")
        
        # ✅ USE create_access_token FROM security.py
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "role_id": user.role_id
        })
        
        print(f"Login successful: {user.user_id}")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role_id": user.role_id,
                "is_active": user.is_active,
                "is_approved": user.is_approved
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

# ============================================
# GET CURRENT USER
# ============================================
@router.get("/me")
async def get_current_user(
    current_user: User = Depends(get_current_user_with_role),
    db: Session = Depends(get_db)
):
    """Get current logged-in user"""
    try:
        user = db.query(User).filter(User.user_id == current_user.user_id).first()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "user_id": user.user_id,
            "email": user.email,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "role_id": user.role_id,
            "is_active": user.is_active,
            "is_approved": user.is_approved
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# LOGOUT
# ============================================
@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user_with_role)):
    """Logout user (token is invalidated by client)"""
    return {"message": "Logged out successfully"}