from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from bson import ObjectId
from datetime import datetime

from app.auth import get_current_user
from app.database import get_db, get_mongo_db
from app import models, schemas
from app.services.recommendations import get_recommendations, parse_concerns
from app.services.vector_search import VectorSearchEngine

router = APIRouter(tags=["Recommendations"])

@router.get("/api/v1/products/all")
@router.get("/api/recommendations/products/all")
def get_all_products_catalog():
    mongo = get_mongo_db()
    products = list(mongo.products.find())
    if not products:
        import json, os
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


@router.get("/api/recommendations", response_model=schemas.RecommendationsOut)
@router.get("/api/recommendations/", response_model=schemas.RecommendationsOut)
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

    sens_level = "high" if getattr(profile, "skin_sensitivities", None) else "low"
    user_vector = VectorSearchEngine.generate_user_vector(
        skin_type=skin_type,
        concerns=user_concerns,
        sensitivity_level=sens_level
    )

    allergies = []
    sensitivities = []
    if profile.allergies:
        allergies = [a.strip().lower() for a in profile.allergies.replace("[", "").replace("]", "").replace('"', "").split(",") if a.strip()]
    if profile.skin_sensitivities:
        sensitivities = [s.strip().lower() for s in profile.skin_sensitivities.replace("[", "").replace("]", "").replace('"', "").split(",") if s.strip()]
    allergens_set = set(allergies + sensitivities)

    routine_actives = set()
    user_rec = mongo.recommendations.find_one({"user_id": current_user.id})
    if user_rec:
        for p_id in user_rec.get("product_ids", []):
            try:
                p = mongo.products.find_one({"_id": ObjectId(p_id)})
            except Exception:
                p = mongo.products.find_one({"id": p_id})
            if p:
                p_ingredients = p.get("key_ingredients", []) or p.get("key_active_ingredients", [])
                for ing in p_ingredients:
                    routine_actives.add(ing.strip().lower())

    db_ingredients = list(mongo.ingredients.find())
    db_ingredients_map = {i.get("name").lower(): i for i in db_ingredients if i.get("name")}

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

        contains_allergen = False
        all_text = f"{p_name} {p_brand} {p_desc} {' '.join(p_key_ingredients)}".lower()
        for allergen in allergens_set:
            if allergen in all_text:
                contains_allergen = True
                break
        if contains_allergen:
            continue

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

        prod_vector = VectorSearchEngine.generate_product_vector(
            suitable_skin_types=prod.get("suitable_skin_types", []),
            category=p_category,
            key_ingredients=p_key_ingredients,
            rating=p_rating,
            price_inr=p_price
        )
        cos_sim = VectorSearchEngine.cosine_similarity(user_vector, prod_vector)

        skin_type_score = 35 if skin_type.lower() in p_suitable_types else 0
        concern_score = 0
        matched_concerns = []
        if user_concerns_set:
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
            "vector_similarity": round(cos_sim, 4),
            "match_score": match_score,
            "matched_concerns": matched_concerns,
            "rating": p_rating,
            "is_above_budget": False,
            "budget_flag": "Within Budget"
        })

    filtered_recs.sort(key=lambda x: (-x["match_score"], -x["vector_similarity"]))

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

        alternative_ids = set()
        for ab in above_budget_recs[:3]:
            ab_actives = set(ab["key_ingredients"])
            for wb in within_budget_recs:
                if set(wb["key_ingredients"]).intersection(ab_actives):
                    wb["budget_flag"] = f"Budget Alternative for {ab['name']}"
                    alternative_ids.add(wb["id"])

        final_recs = within_budget_recs + [ab for ab in above_budget_recs if ab["id"] in alternative_ids or ab["match_score"] > 80]
    else:
        final_recs = filtered_recs

    final_recs.sort(key=lambda x: (-x["match_score"], x["price_inr"]))

    return schemas.RecommendationsOut(
        skin_type=skin_type,
        skin_concerns=user_concerns,
        recommendations=final_recs,
    )


@router.post("/api/recommendations/", status_code=201)
@router.post("/api/recommendations", status_code=201)
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


@router.post("/api/recommendations/user/{user_id}", status_code=201)
def recommend_products_to_user(
    user_id: str,
    payload: dict,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only consultants, dermatologists, or administrators can recommend products."
        )
    
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
    
    mongo.consultant_recommendations.update_one(
        {"user_id": user_id},
        {"$set": recommendation},
        upsert=True
    )
    return {"status": "success", "message": "Recommendations saved successfully."}


@router.get("/api/recommendations/user/{user_id}")
def get_user_recommendations(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if user_id == "me":
        user_id = current_user.id
    mongo = get_mongo_db()
    rec = mongo.consultant_recommendations.find_one({"user_id": user_id})
    if not rec:
        return {"product_ids": [], "notes": "", "products": []}
        
    product_ids = rec.get("product_ids", [])
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
                
    return {
        "user_id": user_id,
        "consultant_name": rec.get("consultant_name", "Your Consultant"),
        "notes": rec.get("notes", ""),
        "products": products_details,
        "created_at": rec.get("created_at")
    }


@router.get("/api/recommendations/all")
def get_all_assigned_recommendations(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in [models.RoleEnum.administrator, models.RoleEnum.skincare_consultant, models.RoleEnum.dermatologist]:
        raise HTTPException(
            status_code=403,
            detail="Only consultants, specialists, or administrators can view all recommendations."
        )
    mongo = get_mongo_db()
    recs = list(mongo.recommendations.find())
    
    results = []
    for r in recs:
        u_id = r.get("user_id")
        user = db.query(models.User).filter(models.User.id == u_id).first()
        user_name = user.full_name if user else "Unknown User"
        user_email = user.email if user else "—"
        
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


class RoutineSetRequest(BaseModel):
    max_budget: float
    categories: List[str]  # e.g., ["Face Wash", "Serum", "Moisturizer", "Sunscreen"]

@router.post("/api/v1/products/recommend-routine-set")
@router.post("/api/recommendations/recommend-routine-set")
def recommend_routine_set(
    payload: RoutineSetRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(models.SkinProfile).filter(models.SkinProfile.user_id == current_user.id).first()
    if not profile or not profile.skin_type:
        raise HTTPException(
            status_code=400,
            detail="Complete your skin profile with a skin type before getting recommendations."
        )

    mongo = get_mongo_db()
    products = list(mongo.products.find())
    
    skin_type = profile.skin_type.value
    user_concerns = parse_concerns(profile.skin_concerns)
    user_concerns_set = {c.strip().lower() for c in user_concerns}
    
    allergies = []
    sensitivities = []
    if profile.allergies:
        allergies = [a.strip().lower() for a in profile.allergies.replace("[", "").replace("]", "").replace('"', "").split(",") if a.strip()]
    if profile.skin_sensitivities:
        sensitivities = [s.strip().lower() for s in profile.skin_sensitivities.replace("[", "").replace("]", "").replace('"', "").split(",") if s.strip()]
    allergens_set = set(allergies + sensitivities)
    
    db_ingredients = list(mongo.ingredients.find())
    db_ingredients_map = {i.get("name").lower(): i for i in db_ingredients if i.get("name")}
    
    scored_by_category = {}
    for cat in payload.categories:
        scored_by_category[cat] = []
        
    for prod in products:
        p_cat = prod.get("category", "")
        if p_cat not in scored_by_category:
            continue
            
        p_name = prod.get("name", "")
        p_brand = prod.get("brand", "")
        p_desc = prod.get("description", "")
        p_suitable_types = [t.strip().lower() for t in prod.get("suitable_skin_types", [])]
        p_key_ingredients = prod.get("key_ingredients", []) or prod.get("key_active_ingredients", [])
        p_price = float(prod.get("price_inr") or prod.get("price") or 0.0)
        p_rating = float(prod.get("rating") or 4.5)
        
        contains_allergen = False
        all_text = f"{p_name} {p_brand} {p_desc} {' '.join(p_key_ingredients)}".lower()
        for allergen in allergens_set:
            if allergen in all_text:
                contains_allergen = True
                break
        if contains_allergen:
            continue
            
        skin_type_score = 35 if skin_type.lower() in p_suitable_types else 0
        concern_score = 0
        if user_concerns_set:
            addressed_concerns = set()
            for p_active in p_key_ingredients:
                db_ing = db_ingredients_map.get(p_active.lower())
                if db_ing:
                    for c in db_ing.get("target_concerns", []):
                        addressed_concerns.add(c.lower())
            matches = user_concerns_set.intersection(addressed_concerns)
            if addressed_concerns:
                concern_score = (len(matches) / len(user_concerns_set)) * 50
        else:
            concern_score = 50
            
        rating_score = (p_rating / 5.0) * 15
        match_score = int(concern_score + skin_type_score + rating_score)
        
        scored_by_category[p_cat].append({
            "id": str(prod["_id"]),
            "name": p_name,
            "brand": p_brand,
            "category": p_cat,
            "price_inr": p_price,
            "match_score": match_score,
            "key_ingredients": p_key_ingredients
        })
        
    best_selection = []
    best_score = -1
    category_list = list(scored_by_category.keys())
    
    def backtrack(cat_idx, current_selection, current_price, current_score):
        nonlocal best_selection, best_score
        if current_price > payload.max_budget:
            return
        if cat_idx == len(category_list):
            if current_score > best_score:
                best_score = current_score
                best_selection = list(current_selection)
            return
            
        cat = category_list[cat_idx]
        candidates = scored_by_category[cat]
        
        for cand in candidates:
            has_conflict = False
            for selected in current_selection:
                for act_1 in cand["key_ingredients"]:
                    for act_2 in selected["key_ingredients"]:
                        rule = mongo.conflict_matrix.find_one({
                            "$or": [
                                {"active_1": act_1.lower(), "active_2": act_2.lower()},
                                {"active_1": act_2.lower(), "active_2": act_1.lower()}
                            ]
                        })
                        if rule and rule.get("severity") == "unsafe":
                            has_conflict = True
                            break
                    if has_conflict:
                        break
                if has_conflict:
                    break
                    
            if not has_conflict:
                backtrack(
                    cat_idx + 1,
                    current_selection + [cand],
                    current_price + cand["price_inr"],
                    current_score + cand["match_score"]
                )
                
        if not candidates:
            backtrack(cat_idx + 1, current_selection, current_price, current_score)

    backtrack(0, [], 0, 0)
    total_price = sum(p["price_inr"] for p in best_selection)
    
    return {
        "max_budget": payload.max_budget,
        "total_selected_price": total_price,
        "total_selected_suitability_score": best_score,
        "products": best_selection
    }


class CompareRequest(BaseModel):
    product_id_1: str
    product_id_2: str

@router.post("/api/v1/products/compare")
@router.post("/api/recommendations/compare")
def compare_products_side_by_side(
    payload: CompareRequest,
    current_user: models.User = Depends(get_current_user)
):
    mongo = get_mongo_db()
    
    p1 = None
    try:
        p1 = mongo.products.find_one({"_id": ObjectId(payload.product_id_1)})
    except Exception:
        p1 = mongo.products.find_one({"id": payload.product_id_1})
        
    p2 = None
    try:
        p2 = mongo.products.find_one({"_id": ObjectId(payload.product_id_2)})
    except Exception:
        p2 = mongo.products.find_one({"id": payload.product_id_2})
        
    if not p1 or not p2:
        raise HTTPException(status_code=404, detail="One or both products not found in catalog")
        
    p1_actives = [i.strip().lower() for i in (p1.get("key_ingredients") or p1.get("key_active_ingredients") or [])]
    p2_actives = [i.strip().lower() for i in (p2.get("key_ingredients") or p2.get("key_active_ingredients") or [])]
    common_actives = list(set(p1_actives).intersection(set(p2_actives)))
    
    p1_price = float(p1.get("price_inr") or p1.get("price") or 0.0)
    p2_price = float(p2.get("price_inr") or p2.get("price") or 0.0)
    
    return {
        "product_1": {
            "id": str(p1["_id"]) if "_id" in p1 else p1.get("id"),
            "name": p1.get("name"),
            "brand": p1.get("brand"),
            "category": p1.get("category"),
            "price_inr": p1_price,
            "key_ingredients": p1.get("key_ingredients") or p1.get("key_active_ingredients") or [],
            "suitable_skin_types": p1.get("suitable_skin_types", [])
        },
        "product_2": {
            "id": str(p2["_id"]) if "_id" in p2 else p2.get("id"),
            "name": p2.get("name"),
            "brand": p2.get("brand"),
            "category": p2.get("category"),
            "price_inr": p2_price,
            "key_ingredients": p2.get("key_ingredients") or p2.get("key_active_ingredients") or [],
            "suitable_skin_types": p2.get("suitable_skin_types", [])
        },
        "price_difference": abs(p1_price - p2_price),
        "cheaper_product_id": str(p1["_id"]) if p1_price < p2_price else str(p2["_id"]),
        "shared_actives": common_actives
    }


@router.get("/api/v1/products/{product_id}/dupes")
@router.get("/api/recommendations/{product_id}/dupes")
def get_product_dupes(
    product_id: str,
    current_user: models.User = Depends(get_current_user)
):
    mongo = get_mongo_db()
    
    target_product = None
    try:
        target_product = mongo.products.find_one({"_id": ObjectId(product_id)})
    except Exception:
        target_product = mongo.products.find_one({"id": product_id})
        
    if not target_product:
        raise HTTPException(status_code=404, detail="Target product not found")
        
    target_category = target_product.get("category")
    target_price = float(target_product.get("price_inr") or target_product.get("price") or 0.0)
    target_actives = [i.strip().lower() for i in (target_product.get("key_ingredients") or target_product.get("key_active_ingredients") or [])]
    
    all_products = list(mongo.products.find({"category": target_category}))
    dupes = []
    
    for prod in all_products:
        p_id = str(prod["_id"])
        if p_id == product_id or prod.get("id") == product_id:
            continue
            
        p_price = float(prod.get("price_inr") or prod.get("price") or 0.0)
        if p_price >= target_price:
            continue
            
        p_actives = [i.strip().lower() for i in (prod.get("key_ingredients") or prod.get("key_active_ingredients") or [])]
        overlap = set(target_actives).intersection(set(p_actives))
        if overlap:
            prod["id"] = str(prod["_id"])
            del prod["_id"]
            prod["shared_actives_count"] = len(overlap)
            dupes.append(prod)
            
    dupes.sort(key=lambda x: x["price_inr"])
    return dupes[:3]
