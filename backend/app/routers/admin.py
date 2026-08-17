from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional

from app.database import get_db, get_mongo_db
from app.rbac import require_admin
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])

@router.get("/users", response_model=schemas.AdminUserListOut)
def get_users(
    page: int = 1,
    limit: int = 20,
    role: Optional[models.RoleEnum] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    
    total_count = query.count()
    offset = (page - 1) * limit
    users = query.order_by(models.User.created_at.desc()).offset(offset).limit(limit).all()
    
    pages = (total_count + limit - 1) // limit if total_count > 0 else 1
    return {
        "users": users,
        "total_count": total_count,
        "page": page,
        "pages": pages
    }

@router.patch("/users/{id}/role", response_model=schemas.AdminUserOut)
def update_user_role(
    id: str,
    payload: schemas.UpdateUserRoleIn,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role."
        )
    
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.role = payload.role
    db.commit()
    db.refresh(user)
    return user

@router.patch("/users/{id}/status", response_model=schemas.AdminUserOut)
def update_user_status(
    id: str,
    payload: schemas.UpdateUserStatusIn,
    current_user: models.User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own account."
        )
        
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user

@router.get("/dermatologists", response_model=list[schemas.AdminDermatologistOut])
def get_dermatologists(db: Session = Depends(get_db)):
    profiles = db.query(models.DermatologistProfile).all()
    results = []
    for profile in profiles:
        user = db.query(models.User).filter(models.User.id == profile.user_id).first()
        if user:
            results.append({
                "id": profile.id,
                "user_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "phone": profile.phone,
                "clinic_name": profile.clinic_name,
                "specialty": profile.specialty,
                "bio": profile.bio,
                "address": profile.address,
                "website": profile.website,
                "accepting_new_patients": profile.accepting_new_patients,
                "certificate_url": profile.certificate_url
            })
    return results

@router.patch("/dermatologists/{id}", response_model=schemas.AdminDermatologistOut)
def update_dermatologist(
    id: str,
    payload: schemas.UpdateDermatologistIn,
    db: Session = Depends(get_db)
):
    profile = db.query(models.DermatologistProfile).filter(models.DermatologistProfile.id == id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Dermatologist profile not found.")
        
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
        
    db.commit()
    db.refresh(profile)
    
    user = db.query(models.User).filter(models.User.id == profile.user_id).first()
    return {
        "id": profile.id,
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": profile.phone,
        "clinic_name": profile.clinic_name,
        "specialty": profile.specialty,
        "bio": profile.bio,
        "address": profile.address,
        "website": profile.website,
        "accepting_new_patients": profile.accepting_new_patients,
        "certificate_url": profile.certificate_url
    }

@router.get("/stats", response_model=schemas.AdminStatsOut)
def get_stats(db: Session = Depends(get_db)):
    # Total users by role count
    role_counts = db.query(models.User.role, func.count(models.User.id)).group_by(models.User.role).all()
    total_users_by_role = {role.value: count for role, count in role_counts}
    # Set default counts if missing
    for r in ["user", "skincare_consultant", "dermatologist", "administrator"]:
        if r not in total_users_by_role:
            total_users_by_role[r] = 0
            
    # Total dermatologists count
    total_dermatologists = db.query(models.DermatologistProfile).count()
    
    # MongoDB product catalog count
    total_products = 0
    try:
        mongo = get_mongo_db()
        total_products = mongo.products.count_documents({})
    except Exception:
        # Fall soft to 0 if Mongo is unreachable
        pass
        
    return {
        "total_users_by_role": total_users_by_role,
        "total_dermatologists": total_dermatologists,
        "total_products": total_products
    }


@router.get("/products")
def get_catalog_products():
    try:
        from app.database import get_mongo_db
        import os, json
        mongo = get_mongo_db()
        products = list(mongo.products.find())
        if not products:
            prod_path = os.path.join("seed", "products.json")
            if os.path.exists(prod_path):
                with open(prod_path, "r", encoding="utf-8") as f:
                    seeded = json.load(f)
                if seeded:
                    mongo.products.insert_many(seeded)
                    products = list(mongo.products.find())
        for p in products:
            p["id"] = str(p["_id"])
            del p["_id"]
            if "price" not in p or not p["price"]:
                p["price"] = p.get("price_inr", 499.0)
            if "price_inr" not in p or not p["price_inr"]:
                p["price_inr"] = p.get("price", 499.0)
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch catalog: {str(e)}")


@router.get("/ingredients")
def get_catalog_ingredients():
    try:
        from app.database import get_mongo_db
        mongo = get_mongo_db()
        ingredients = list(mongo.ingredients.find())
        for ing in ingredients:
            ing["id"] = str(ing["_id"])
            del ing["_id"]
        return ingredients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch ingredients catalog: {str(e)}")


@router.post("/ingredients", status_code=201)
def add_catalog_ingredient(
    payload: dict,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.administrator:
        raise HTTPException(status_code=403, detail="Only administrators can manage the ingredients catalog.")
    try:
        from app.database import get_mongo_db
        mongo = get_mongo_db()
        # insert record
        res = mongo.ingredients.insert_one(payload)
        return {"id": str(res.inserted_id)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create ingredient: {str(e)}")


@router.delete("/ingredients/{id}", status_code=204)
def delete_catalog_ingredient(
    id: str,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != models.RoleEnum.administrator:
        raise HTTPException(status_code=403, detail="Only administrators can manage the ingredients catalog.")
    from bson import ObjectId
    try:
        from app.database import get_mongo_db
        mongo = get_mongo_db()
        result = mongo.ingredients.delete_one({"_id": ObjectId(id)})
        if result.deleted_count == 0:
            result = mongo.ingredients.delete_one({"id": id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ingredient not found.")
    except Exception:
        result = mongo.ingredients.delete_one({"id": id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Ingredient not found.")
    return None


