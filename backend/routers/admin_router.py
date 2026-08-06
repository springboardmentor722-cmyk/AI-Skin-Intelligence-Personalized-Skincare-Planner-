from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import SessionLocal
from models import User, SkinProfile, SkinAssessment, ConsultationBooking, ConsultantProfile, DermatologistProfile, Product, Ingredient
from role_auth import role_required
from schemas import UserResponse, UserRoleUpdate, UserStatusUpdate

router = APIRouter(tags=["Admin Management"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/admin/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    return db.query(User).all()


@router.get("/admin/pending-applications")
def get_pending_applications(
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    pending_users = db.query(User).filter(User.is_active == False).all()
    results = []
    for u in pending_users:
        details = None
        if u.role == "consultant":
            details = db.query(ConsultantProfile).filter(ConsultantProfile.user_id == u.id).first()
        elif u.role == "dermatologist":
            details = db.query(DermatologistProfile).filter(DermatologistProfile.user_id == u.id).first()

        results.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "created_at": u.created_at,
            "qualification": getattr(details, "qualification", "Certified Specialist") if details else "Certified Specialist",
            "specialization": getattr(details, "specialization", "Skin Intelligence Care") if details else "Skin Intelligence Care",
            "city": getattr(details, "city", "Metro City") if details else "Metro City"
        })

    return results


@router.put("/admin/users/{user_id}/approve")
def approve_user_application(
    user_id: int,
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = True
    db.commit()
    db.refresh(target)
    return {"message": f"User {target.name} ({target.role}) approved successfully!", "user": target}


@router.put("/admin/users/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_update: UserRoleUpdate,
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.role = role_update.role
    db.commit()
    db.refresh(target)
    return target


@router.put("/admin/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: int,
    status_update: UserStatusUpdate,
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    target.is_active = status_update.is_active
    db.commit()
    db.refresh(target)
    return target


@router.get("/admin/stats")
def get_admin_system_stats(
    db: Session = Depends(get_db),
    admin=Depends(role_required(["admin"]))
):
    total_users = db.query(User).count()
    users_count = db.query(User).filter(User.role == "user").count()
    consultants_count = db.query(User).filter(User.role == "consultant").count()
    dermatologists_count = db.query(User).filter(User.role == "dermatologist").count()
    pending_approvals = db.query(User).filter(User.is_active == False).count()
    total_assessments = db.query(SkinAssessment).count()
    total_products = db.query(Product).count()
    total_ingredients = db.query(Ingredient).count()

    return {
        "total_users": total_users,
        "users_count": users_count,
        "consultants_count": consultants_count,
        "dermatologists_count": dermatologists_count,
        "pending_approvals": pending_approvals,
        "total_assessments": total_assessments,
        "total_products": total_products,
        "total_ingredients": total_ingredients
    }
