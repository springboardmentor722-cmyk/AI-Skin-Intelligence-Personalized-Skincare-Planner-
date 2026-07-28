from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import audit, notify, require
from ..models import (
    Appointment, AuditLog, ConsultantProfile, ConsultationRequest,
    DermatologistProfile, Ingredient, Product, ProductIngredient, Role, SkinProfile, User,
)
from ..schemas import (
    AdminUserIn, AdminUserUpdateIn, AppointmentOut, AuditLogOut, BroadcastIn,
    ProductIn, ProductOut, UserOut,
)
from ..security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/stats")
def stats(_: User = Depends(require("admin.stats")), db: Session = Depends(get_db)):
    def count(model, *where):
        return db.scalar(select(func.count()).select_from(model).where(*where)) or 0

    return {
        "users_total": count(User),
        "patients": count(User, User.role == Role.USER),
        "dermatologists": count(User, User.role == Role.DERMATOLOGIST),
        "consultants": count(User, User.role == Role.CONSULTANT),
        "admins": count(User, User.role == Role.ADMIN),
        "appointments_total": count(Appointment),
        "appointments_pending": count(Appointment, Appointment.status == "pending"),
        "appointments_confirmed": count(Appointment, Appointment.status == "confirmed"),
        "consultation_requests": count(ConsultationRequest),
        "products": count(Product),
        "ingredients": count(Ingredient),
        "pending_derm_approvals": count(DermatologistProfile, DermatologistProfile.is_approved.is_(False)),
        "pending_consultant_approvals": count(ConsultantProfile, ConsultantProfile.is_approved.is_(False)),
        "audit_events": count(AuditLog),
    }


# ----- User management ---------------------------------------------------------
@router.get("/users", response_model=list[UserOut])
def list_users(role: str | None = None, q: str | None = None,
               _: User = Depends(require("admin.users.read")), db: Session = Depends(get_db)):
    stmt = select(User).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    rows = db.scalars(stmt).all()
    if q:
        rows = [u for u in rows if q.lower() in f"{u.full_name} {u.email}".lower()]
    return rows


@router.post("/users", response_model=UserOut, status_code=201)
def create_user(body: AdminUserIn, request: Request,
                admin: User = Depends(require("admin.users.create")), db: Session = Depends(get_db)):
    if body.role not in Role.ALL:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Role must be one of {Role.ALL}")
    if db.scalar(select(User).where(User.email == body.email.lower())):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already in use")
    user = User(email=body.email.lower(), password_hash=hash_password(body.password),
                full_name=body.full_name, role=body.role, is_verified=True)
    db.add(user)
    db.flush()
    if body.role == Role.USER:
        db.add(SkinProfile(user_id=user.id))
    elif body.role == Role.DERMATOLOGIST:
        db.add(DermatologistProfile(user_id=user.id, is_approved=True))
    elif body.role == Role.CONSULTANT:
        db.add(ConsultantProfile(user_id=user.id, is_approved=True))
    audit(db, request, admin, "admin.user.create", "user", user.id,
          new_value={"email": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: AdminUserUpdateIn, request: Request,
                admin: User = Depends(require("admin.users.update")), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.role == Role.ADMIN and body.is_active is False and user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot suspend your own admin account")
    old = {"full_name": user.full_name, "role": user.role,
           "is_active": user.is_active, "is_verified": user.is_verified}
    data = body.model_dump(exclude_unset=True)
    if "role" in data and data["role"] not in Role.ALL:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Role must be one of {Role.ALL}")
    for key, value in data.items():
        setattr(user, key, value)
    audit(db, request, admin, "admin.user.update", "user", user.id, old_value=old, new_value=data)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=204)
def delete_user(user_id: int, request: Request,
                admin: User = Depends(require("admin.users.delete")), db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.id == admin.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "You cannot delete your own account")
    audit(db, request, admin, "admin.user.delete", "user", user.id, old_value={"email": user.email})
    db.delete(user)
    db.commit()


# ----- Provider approvals -------------------------------------------------------
@router.post("/dermatologists/{user_id}/approve")
def approve_derm(user_id: int, approve: bool, request: Request,
                 admin: User = Depends(require("admin.dermatologists.approve")),
                 db: Session = Depends(get_db)):
    p = db.scalar(select(DermatologistProfile).where(DermatologistProfile.user_id == user_id))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Dermatologist profile not found")
    p.is_approved = approve
    p.user.is_verified = approve
    notify(db, user_id, "Profile approved" if approve else "Profile suspended",
           "Patients can now find and book you." if approve else "Contact support for details.", "system")
    audit(db, request, admin, "admin.dermatologist.approve", "dermatologist_profile", p.id,
          new_value={"is_approved": approve})
    db.commit()
    return {"user_id": user_id, "is_approved": approve}


@router.post("/consultants/{user_id}/approve")
def approve_consultant(user_id: int, approve: bool, request: Request,
                       admin: User = Depends(require("admin.consultants.approve")),
                       db: Session = Depends(get_db)):
    p = db.scalar(select(ConsultantProfile).where(ConsultantProfile.user_id == user_id))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Consultant profile not found")
    p.is_approved = approve
    p.user.is_verified = approve
    notify(db, user_id, "Profile approved" if approve else "Profile suspended",
           "Clients can now request you." if approve else "Contact support for details.", "system")
    audit(db, request, admin, "admin.consultant.approve", "consultant_profile", p.id,
          new_value={"is_approved": approve})
    db.commit()
    return {"user_id": user_id, "is_approved": approve}


# ----- Platform-wide appointments ------------------------------------------------
@router.get("/appointments", response_model=list[AppointmentOut])
def all_appointments(_: User = Depends(require("admin.appointments.read_all")),
                     db: Session = Depends(get_db)):
    rows = db.scalars(select(Appointment).order_by(Appointment.appt_date.desc())).all()
    out = []
    for a in rows:
        o = AppointmentOut.model_validate(a)
        o.patient_name = a.patient.full_name if a.patient else ""
        o.dermatologist_name = a.dermatologist.full_name if a.dermatologist else ""
        out.append(o)
    return out


# ----- Product management ---------------------------------------------------------
@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(body: ProductIn, request: Request,
                   admin: User = Depends(require("admin.products.create")),
                   db: Session = Depends(get_db)):
    product = Product(**body.model_dump(exclude={"ingredient_names"}))
    db.add(product)
    db.flush()
    for name in body.ingredient_names:
        ing = db.scalar(select(Ingredient).where(Ingredient.name == name)) or Ingredient(name=name)
        db.add(ing)
        db.flush()
        db.add(ProductIngredient(product_id=product.id, ingredient_id=ing.id))
    audit(db, request, admin, "admin.product.create", "product", product.id, new_value={"name": product.name})
    db.commit()
    db.refresh(product)
    return ProductOut(
        id=product.id, name=product.name, brand=product.brand, category=product.category,
        price=product.price, tier=product.tier, suitable_for=product.suitable_for,
        description=product.description,
        ingredients=[link.ingredient for link in product.ingredients],
    )


@router.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, request: Request,
                   admin: User = Depends(require("admin.products.delete")),
                   db: Session = Depends(get_db)):
    p = db.get(Product, product_id)
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    audit(db, request, admin, "admin.product.delete", "product", product_id, old_value={"name": p.name})
    db.delete(p)
    db.commit()


# ----- Audit logs & broadcast -------------------------------------------------------
@router.get("/audit-logs", response_model=list[AuditLogOut])
def audit_logs(limit: int = 200, _: User = Depends(require("admin.audit_logs.read")),
               db: Session = Depends(get_db)):
    rows = db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(min(limit, 1000))).all()
    return rows


@router.post("/notifications/broadcast")
def broadcast(body: BroadcastIn, request: Request,
              admin: User = Depends(require("admin.notifications.broadcast")),
              db: Session = Depends(get_db)):
    stmt = select(User).where(User.is_active.is_(True))
    if body.role:
        stmt = stmt.where(User.role == body.role)
    users = db.scalars(stmt).all()
    for u in users:
        notify(db, u.id, body.title, body.body, "system")
    audit(db, request, admin, "admin.broadcast", "notification", None,
          new_value={"title": body.title, "role": body.role, "recipients": len(users)})
    db.commit()
    return {"recipients": len(users)}
