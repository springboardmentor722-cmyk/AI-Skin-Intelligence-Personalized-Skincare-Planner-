from sqlalchemy.orm import Session
from app.models.consultation import Consultation
from app.models.skin_profile import SkinProfile
from app.models.lifestyle import Lifestyle
from app.models.progress import Progress
from app.database.database import get_db
from app.models.user import User
from app.schemas.user_schema import UserCreate, UserResponse, UserUpdateResponse
from app.utils.security import hash_password
from app.schemas.login_schema import LoginRequest
from app.utils.security import verify_password, create_access_token
from app.utils.auth import role_required, get_current_user
from app.schemas.user_update_schema import UserUpdate
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import APIRouter, Depends, HTTPException
from app.services.notification_service import create_notification


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
    if user.role == "CONSULTANT" and db.query(User).filter(User.role == "CONSULTANT").first():
        raise HTTPException(
            status_code=409,
            detail="A system consultant already exists. Only one consultant account is allowed."
        )
    # Hash password
    hashed_password = hash_password(user.password)
    # Set verification status based on role
    verification_status = "Approved"

    if user.role in ["CONSULTANT", "DERMATOLOGIST"]:
        verification_status = "Pending"
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
    db.flush()
    if verification_status == "Pending":
        for admin in db.query(User).filter(User.role == "ADMIN").all():
            create_notification(db, admin.id, "New Expert Registration", "A new consultant/dermatologist registration is waiting for approval.", "expert_registration")
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
        "user": UserResponse.model_validate(current_user)
    }
from typing import List


@router.get("/users", response_model=List[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):
    return db.query(User).all()
    
@router.put("/users/{user_id}", response_model=UserUpdateResponse)
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

    return {"message": "User Updated Successfully", "user": user}
@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(role_required(["ADMIN"]))
):

    # Find the user
    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Prevent admin from deleting their own account
    if user.id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own administrator account."
        )

    try:

        # -----------------------------------------
        # 1. Delete consultations involving user
        # -----------------------------------------

        db.query(Consultation).filter(
            Consultation.expert_id == user_id
        ).delete(
            synchronize_session=False
        )

        db.query(Consultation).filter(
            Consultation.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # -----------------------------------------
        # 2. Delete skin profile
        # -----------------------------------------

        db.query(SkinProfile).filter(
            SkinProfile.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # -----------------------------------------
        # 3. Delete lifestyle
        # -----------------------------------------

        db.query(Lifestyle).filter(
            Lifestyle.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # -----------------------------------------
        # 4. Delete progress
        # -----------------------------------------

        db.query(Progress).filter(
            Progress.user_id == user_id
        ).delete(
            synchronize_session=False
        )

        # -----------------------------------------
        # 5. Delete the user
        # -----------------------------------------

        db.delete(user)

        db.commit()

        return {
            "message": "User Deleted Successfully"
        }

    except Exception as e:

        db.rollback()

        print("DELETE USER ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=f"Unable to delete user: {str(e)}"
        )
@router.get("/pending-users", response_model=List[UserResponse])
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

    status_changed = user.verification_status != "Approved"
    user.verification_status = "Approved"
    if status_changed:
        create_notification(db, user.id, "Registration Approved", "Your registration has been approved. You can now sign in.", "registration_approved", f"registration-approved-{user.id}")

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

    status_changed = user.verification_status != "Rejected"
    user.verification_status = "Rejected"
    if status_changed:
        create_notification(db, user.id, "Registration Update", "Your registration has been rejected. Please contact support for more information.", "registration_rejected", f"registration-rejected-{user.id}")

    db.commit()
    db.refresh(user)
    return {

        "message": "User Rejected Successfully"

    }
@router.get("/my-profile", response_model=UserResponse)
def my_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user = db.query(User).filter(
        User.id == current_user.id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return user
@router.put("/my-profile", response_model=UserUpdateResponse)
def update_my_profile(
    updated_user: UserUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    user = db.query(User).filter(
        User.id == current_user.id
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

    return {"message": "Profile Updated Successfully", "user": user}
@router.get("/me", response_model=UserResponse)
def get_logged_user(

    current_user: User = Depends(get_current_user)

):

    return current_user 
@router.get("/experts", response_model=List[UserResponse])
def get_experts(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    experts = db.query(User).filter(

        User.role.in_(["CONSULTANT", "DERMATOLOGIST"]),

        User.verification_status == "Approved"

    ).all()

    return experts
