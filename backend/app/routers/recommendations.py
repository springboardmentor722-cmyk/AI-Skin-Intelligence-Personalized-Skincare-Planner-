from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from typing import Optional
from app.auth import get_current_user
from app.database import get_db, get_mongo_db
from app import models, schemas
from app.services.recommendations import get_recommendations, parse_concerns

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("/", response_model=schemas.RecommendationsOut)
def get_my_recommendations(
    max_price: Optional[float] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile or not profile.skin_type:
        raise HTTPException(
            status_code=400,
            detail="Complete your skin profile with a skin type before viewing recommendations.",
        )

    mongo = get_mongo_db()
    products = list(mongo.products.find())
    ingredients = list(mongo.ingredients.find())

    if not products:
        import json
        import os
        prod_path = os.path.join("seed", "products.json")
        ing_path = os.path.join("seed", "ingredients.json")
        if os.path.exists(prod_path) and os.path.exists(ing_path):
            with open(prod_path, "r", encoding="utf-8") as f:
                seeded_products = json.load(f)
            with open(ing_path, "r", encoding="utf-8") as f:
                seeded_ingredients = json.load(f)
            
            if seeded_products:
                mongo.products.insert_many(seeded_products)
            if seeded_ingredients:
                mongo.ingredients.insert_many(seeded_ingredients)
                
            products = list(mongo.products.find())
            ingredients = list(mongo.ingredients.find())
        else:
            raise HTTPException(
                status_code=503,
                detail="Product catalog is empty and seed files could not be found.",
            )

    skin_type = profile.skin_type.value
    user_concerns = parse_concerns(profile.skin_concerns)
    user_concerns_set = {c.strip().lower() for c in user_concerns}

    # 1. Fetch user allergies & sensitivities
    allergies = []
    sensitivities = []
    if profile.allergies:
        allergies = [a.strip().lower() for a in profile.allergies.replace("[", "").replace("]", "").replace('"', "").split(",") if a.strip()]
    if profile.skin_sensitivities:
        sensitivities = [s.strip().lower() for s in profile.skin_sensitivities.replace("[", "").replace("]", "").replace('"', "").split(",") if s.strip()]
    allergens_set = set(allergies + sensitivities)

    # 2. Fetch user's current routine active ingredients to check conflicts
    routine_actives = set()
    user_rec = mongo.recommendations.find_one({"user_id": current_user.id})
    if user_rec:
        for p_id in user_rec.get("product_ids", []):
            try:
                from bson import ObjectId
                p = mongo.products.find_one({"_id": ObjectId(p_id)})
            except Exception:
                p = mongo.products.find_one({"id": p_id})
            if p:
                p_ingredients = p.get("key_ingredients", []) or p.get("key_active_ingredients", [])
                for ing in p_ingredients:
                    routine_actives.add(ing.strip().lower())

    # Map database ingredients knowledge base for conflict checks
    db_ingredients = list(mongo.ingredients.find())
    db_ingredients_map = {i.get("name").lower(): i for i in db_ingredients if i.get("name")}

    # Get active ingredients in the current routine normalized to ingredient names
    routine_actives_db_names = set()
    for act in routine_actives:
        for db_name, db_ing in db_ingredients_map.items():
            if db_name in act or act in db_name:
                routine_actives_db_names.add(db_ing.get("name"))

    filtered_recs = []

    for prod in products:
        p_name = prod.get("name", "")
        p_brand = prod.get("brand", "")
        p_desc = prod.get("description", "")
        p_category = prod.get("category", "")
        p_suitable_types = [t.strip().lower() for t in prod.get("suitable_skin_types", [])]
        p_key_ingredients = prod.get("key_ingredients", []) or prod.get("key_active_ingredients", [])
        p_price = float(prod.get("price_inr") or prod.get("price") or 0.0)
        p_rating = float(prod.get("rating") or 4.5)

        # A. Safety Gate: Allergies & Sensitivities (Hard Filter)
        contains_allergen = False
        all_text = f"{p_name} {p_brand} {p_desc} {' '.join(p_key_ingredients)}".lower()
        for allergen in allergens_set:
            if allergen in all_text:
                contains_allergen = True
                break
        if contains_allergen:
            continue

        # B. Safety Gate: Chemical Conflict Matrix (Hard Filter)
        # Find active ingredient categories in this product
        prod_actives_db_names = set()
        for ing in p_key_ingredients:
            ing_lower = ing.strip().lower()
            for db_name, db_ing in db_ingredients_map.items():
                if db_name in ing_lower or ing_lower in db_name:
                    prod_actives_db_names.add(db_ing.get("name"))

        has_unsafe_clash = False
        for p_active in prod_actives_db_names:
            for r_active in routine_actives_db_names:
                conflict = mongo.conflict_matrix.find_one({
                    "$or": [
                        {"active_1": p_active, "active_2": r_active},
                        {"active_1": r_active, "active_2": p_active}
                    ],
                    "severity": "unsafe"
                })
                if conflict:
                    has_unsafe_clash = True
                    break
            if has_unsafe_clash:
                break
        if has_unsafe_clash:
            continue

        # C. Weighted Suitability Score
        # Skin Type Fit (35 points)
        skin_type_score = 35 if skin_type.lower() in p_suitable_types else 0

        # Target Concern Match (50 points)
        concern_score = 0
        matched_concerns = []
        if user_concerns_set:
            # Check what concerns the product's active ingredients address
            addressed_concerns = set()
            for p_active in prod_actives_db_names:
                db_ing = db_ingredients_map.get(p_active.lower())
                if db_ing:
                    for c in db_ing.get("target_concerns", []):
                        addressed_concerns.add(c.lower())
            
            matches = user_concerns_set.intersection(addressed_concerns)
            matched_concerns = sorted(list(matches))
            if addressed_concerns:
                concern_score = (len(matches) / len(user_concerns_set)) * 50
        else:
            concern_score = 50

        # Rating (15 points)
        rating_score = (p_rating / 5.0) * 15

        match_score = int(concern_score + skin_type_score + rating_score)

        filtered_recs.append({
            "id": str(prod["_id"]),
            "name": p_name,
            "brand": p_brand,
            "category": p_category,
            "suitable_skin_types": prod.get("suitable_skin_types", []),
            "key_ingredients": p_key_ingredients,
            "price_inr": p_price,
            "description": p_desc,
            "match_score": match_score,
            "matched_concerns": matched_concerns,
            "rating": p_rating,
            "is_above_budget": False,
            "budget_flag": "Within Budget"
        })

    # Sort primarily by match score descending
    filtered_recs.sort(key=lambda x: -x["match_score"])

    # D. Budget Filter & Alternatives
    final_recs = []
    if max_price is not None:
        above_budget_recs = []
        within_budget_recs = []
        for r in filtered_recs:
            if r["price_inr"] > max_price:
                r["is_above_budget"] = True
                r["budget_flag"] = "Exceeds Budget"
                above_budget_recs.append(r)
            else:
                within_budget_recs.append(r)

        # Identify lower-priced alternatives (with similar actives) for above-budget recommendations
        alternative_ids = set()
        for ab in above_budget_recs[:3]:  # Top 3 above budget matches
            ab_actives = set(ab["key_ingredients"])
            # Find a within-budget product that shares at least one active ingredient
            for wb in within_budget_recs:
                if set(wb["key_ingredients"]).intersection(ab_actives):
                    wb["budget_flag"] = f"Budget Alternative for {ab['name']}"
                    alternative_ids.add(wb["id"])

        final_recs = within_budget_recs + [ab for ab in above_budget_recs if ab["id"] in alternative_ids or ab["match_score"] > 80]
    else:
        final_recs = filtered_recs

    # Keep list sorted by match_score
    final_recs.sort(key=lambda x: (-x["match_score"], x["price_inr"]))

    return schemas.RecommendationsOut(
        skin_type=skin_type,
        skin_concerns=user_concerns,
        recommendations=final_recs,
    )



@router.post("/", status_code=201)
def create_product(
    payload: schemas.ProductCreateIn,
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant]:
        raise HTTPException(
            status_code=403,
            detail="Only skincare consultants or administrators can add products to the catalog."
        )

    mongo = get_mongo_db()
    product_dict = payload.model_dump()
    result = mongo.products.insert_one(product_dict)
    product_dict["id"] = str(result.inserted_id)
    del product_dict["_id"]
    return product_dict


from bson import ObjectId
from datetime import datetime

@router.post("/user/{user_id}", status_code=201)
def recommend_products_to_user(
    user_id: str,
    payload: dict,  # {"product_ids": ["..."], "notes": "..."}
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only consultants, dermatologists, or administrators can recommend products."
        )
    
    # Verify patient exists
    patient = db.query(models.User).filter(models.User.id == user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient/user not found")
        
    mongo = get_mongo_db()
    recommendation = {
        "user_id": user_id,
        "consultant_id": current_user.id,
        "consultant_name": current_user.full_name,
        "product_ids": payload.get("product_ids", []),
        "notes": payload.get("notes", ""),
        "created_at": datetime.utcnow().isoformat()
    }
    
    # Upsert recommendation
    mongo.consultant_recommendations.update_one(
        {"user_id": user_id},
        {"$set": recommendation},
        upsert=True
    )
    return {"status": "success", "message": "Recommendations saved successfully."}


@router.get("/user/{user_id}")
def get_user_recommendations(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == "me":
        user_id = current_user.id
    # Retrieve from MongoDB
    mongo = get_mongo_db()
    rec = mongo.consultant_recommendations.find_one({"user_id": user_id})
    if not rec:
        return {"product_ids": [], "notes": "", "products": []}
        
    product_ids = rec.get("product_ids", [])
    products_details = []
    
    # Retrieve each product detail from products collection
    for pid in product_ids:
        try:
            prod = mongo.products.find_one({"_id": ObjectId(pid)})
            if not prod:
                # Try finding by string ID just in case
                prod = mongo.products.find_one({"id": pid})
            if prod:
                prod["id"] = str(prod["_id"])
                del prod["_id"]
                products_details.append(prod)
        except Exception:
            # Fallback for non-ObjectId string matches
            prod = mongo.products.find_one({"id": pid})
            if prod:
                prod["id"] = str(prod["_id"])
                del prod["_id"]
                products_details.append(prod)
                
    return {
        "user_id": user_id,
        "consultant_name": rec.get("consultant_name", "Your Consultant"),
        "notes": rec.get("notes", ""),
        "products": products_details,
        "created_at": rec.get("created_at")
    }


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: str,
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant]:
        raise HTTPException(
            status_code=403,
            detail="Only administrators or consultants can delete products."
        )
    from bson import ObjectId
    mongo = get_mongo_db()
    try:
        result = mongo.products.delete_one({"_id": ObjectId(product_id)})
        if result.deleted_count == 0:
            result = mongo.products.delete_one({"id": product_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found.")
    except Exception:
        result = mongo.products.delete_one({"id": product_id})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Product not found.")
    return None


@router.get("/all")
def get_all_assigned_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only consultants, specialists, or administrators can view all recommendations."
        )
    from bson import ObjectId
    mongo = get_mongo_db()
    recs = list(mongo.recommendations.find())
    
    results = []
    for r in recs:
        u_id = r.get("user_id")
        user = db.query(models.User).filter(models.User.id == u_id).first()
        user_name = user.full_name if user else "Unknown User"
        user_email = user.email if user else "—"
        
        # Resolve product details
        product_ids = r.get("product_ids", [])
        products_details = []
        for pid in product_ids:
            try:
                prod = mongo.products.find_one({"_id": ObjectId(pid)})
                if not prod:
                    prod = mongo.products.find_one({"id": pid})
                if prod:
                    prod["id"] = str(prod["_id"])
                    del prod["_id"]
                    products_details.append(prod)
            except Exception:
                prod = mongo.products.find_one({"id": pid})
                if prod:
                    prod["id"] = str(prod["_id"])
                    del prod["_id"]
                    products_details.append(prod)
                    
        results.append({
            "id": str(r["_id"]),
            "user_id": u_id,
            "user_name": user_name,
            "user_email": user_email,
            "consultant_name": r.get("consultant_name", "Consultant"),
            "notes": r.get("notes", ""),
            "products": products_details,
            "created_at": r.get("created_at")
        })
        
    return results


