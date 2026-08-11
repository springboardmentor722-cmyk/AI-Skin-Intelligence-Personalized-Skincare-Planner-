from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.utils.auth import role_required
from app.database.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate
from app.utils.security import hash_password
from app.schemas.login_schema import LoginRequest
from app.utils.security import verify_password, create_access_token
from app.utils.auth import role_required, get_current_user
from app.schemas.user_update_schema import UserUpdate
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/register")
def register(user: UserCreate, db: Session =Depends(get_db)):

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user.email).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    if user.role == "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Administrator accounts cannot be created through registration."
        )
    # Hash password
    hashed_password = hash_password(user.password)
    # Set verification status based on role
    verification_status = "Approved"

    if user.role in ["CONSULTANT", "DERMATOLOGIST"]:
        verification_status = "Pending"
    print("Verification Status:", verification_status)
    # Create user
    new_user = User(

    name=user.name,

    email=user.email,

    password=hashed_password,

    role=user.role,

    qualification=user.qualification,

    experience=user.experience,

    specialization=user.specialization,

    license_number=user.license_number,

    organization=user.organization,

    verification_status=verification_status

)

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if verification_status == "Pending":

        message = (
            "Registration submitted successfully. "
            "Your account will be activated after administrator approval."
        )

    else:

        message = "User Registered Successfully."

    return {

        "message": message,

        "user_id": new_user.id

    }
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(User).filter(
        User.email == form_data.username
    ).first()

    if db_user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )
    if db_user.verification_status == "Pending":
        raise HTTPException(
            status_code=403,
            detail="Your account is awaiting administrator approval."
        )

    if db_user.verification_status == "Rejected":
        raise HTTPException(
            status_code=403,
            detail="Your registration has been rejected."
        )
    token = create_access_token(
    {
        "id": db_user.id,
        "sub": db_user.email,
        "role": db_user.role
    }
)

    return {
    "access_token": token,
    "token_type": "bearer",
    "name": db_user.name,
    "email": db_user.email,
    "role": db_user.role
}
@router.get("/admin-dashboard")
def admin_dashboard(
    current_user=Depends(role_required(["ADMIN"]))
):
    return {
        "message": "Welcome Administrator",
        "user": current_user
    }
from typing import List
from app.schemas.user_schema import UserResponse


@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):
    return db.query(User).all()
    
@router.put("/users/{user_id}")
def update_user(
    user_id: int,
    updated_user: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        return {"message": "User not found"}

    user.name = updated_user.name
    user.email = updated_user.email
    user.role = updated_user.role

    db.commit()
    db.refresh(user)

    return {
        "message": "User Updated Successfully",
        "user": user
    }
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        return {"message": "User not found"}

    db.delete(user)
    db.commit()

    return {
        "message": "User Deleted Successfully"
    }
@router.get("/pending-users")
def get_pending_users(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):

    users = db.query(User).filter(

        User.verification_status == "Pending"

    ).all()

    return users
@router.put("/approve/{user_id}")
def approve_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(role_required(["ADMIN"]))

):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.verification_status = "Approved"

    db.commit()
    db.refresh(user)
    return {

        "message": "User Approved Successfully"

    }
@router.put("/reject/{user_id}")
def reject_user(

    user_id: int,

    db: Session = Depends(get_db),

    current_user=Depends(role_required(["ADMIN"]))

):

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.verification_status = "Rejected"

    db.commit()
    db.refresh(user)
    return {

        "message": "User Rejected Successfully"

    }
@router.get("/my-profile")
def my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user = db.query(User).filter(
        User.id == current_user["id"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user
@router.put("/my-profile")
def update_my_profile(
    updated_user: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user = db.query(User).filter(
        User.id == current_user["id"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.name = updated_user.name
    user.email = updated_user.email

    user.qualification = updated_user.qualification
    user.experience = updated_user.experience
    user.specialization = updated_user.specialization
    user.license_number = updated_user.license_number
    user.organization = updated_user.organization

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile Updated Successfully",
        "user": user
    }
@router.get("/me")
def get_logged_user(

    current_user: User = Depends(get_current_user)

):

    return current_user 
@router.get("/experts")
def get_experts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    experts = db.query(User).filter(

        User.role.in_(["CONSULTANT", "DERMATOLOGIST"]),

        User.verification_status == "Approved"

    ).all()

    return experts