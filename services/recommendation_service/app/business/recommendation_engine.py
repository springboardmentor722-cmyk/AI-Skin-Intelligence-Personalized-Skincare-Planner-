from sqlalchemy.orm import Session
from fastapi import HTTPException

from services.recommendation_service.app.models.product import Product
from services.assessment_service.app.models.assessment import SkinAssessment
from services.profile_service.app.models.profile import Profile


def _allergy_list(allergies_text):
    """Profile.allergies is free-text (e.g. 'Parabens, Fragrance'). Split it
    into a lowercase list for matching against Product.avoid_for_allergies."""
    if not allergies_text:
        return []
    return [a.strip().lower() for a in allergies_text.split(",") if a.strip()]


def _is_safe(product: Product, user_allergies: list) -> bool:
    if not user_allergies or not product.avoid_for_allergies:
        return True
    flagged = [a.lower() for a in product.avoid_for_allergies]
    return not any(a in flagged for a in user_allergies)


def _match_score(product: Product, skin_type: str, concern_names: set) -> tuple:
    matched_concerns = [c for c in product.target_concerns if c in concern_names]
    skin_type_match = skin_type in product.skin_types or "All" in product.skin_types
    # (concern matches first, then skin-type fit, then rating) — used for sorting
    return (len(matched_concerns), 1 if skin_type_match else 0, product.rating), matched_concerns


def _authorize_client_access(current_user, target_user_id: int, db: Session):
    """
    Same gate as assessment_service.authorize_client_access, duplicated here
    since these run as separate processes with no shared module — a user
    sees their own data, consultant/dermatologist see only clients assigned
    to them, admin sees everyone.
    """
    if current_user["id"] == target_user_id or current_user["role"] == "admin":
        return

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Client profile not found")

    is_assigned = (
        (current_user["role"] == "consultant" and profile.consultant_id == current_user["id"])
        or (current_user["role"] == "dermatologist" and profile.dermatologist_id == current_user["id"])
    )
    if not is_assigned:
        raise HTTPException(status_code=403, detail="This client is not assigned to you")


def get_recommendations(current_user, db: Session, per_category: int = 1, target_user_id: int = None):
    """
    One best-fit product per routine category, ranked by how many of the
    target user's detected concerns it targets, then skin-type fit, then
    rating. Defaults to the requester's own data; pass target_user_id for
    a consultant/dermatologist/admin viewing a specific client.
    Products flagged against allergies are excluded entirely rather than
    just deprioritized.
    """
    target_user_id = target_user_id if target_user_id is not None else current_user["id"]
    _authorize_client_access(current_user, target_user_id, db)

    assessment = (
        db.query(SkinAssessment)
        .filter(SkinAssessment.user_id == target_user_id)
        .order_by(SkinAssessment.created_at.desc())
        .first()
    )
    if not assessment:
        return None  # caller decides how to respond (e.g. 404 -> "take assessment first")

    profile = db.query(Profile).filter(Profile.user_id == target_user_id).first()
    user_allergies = _allergy_list(profile.allergies if profile else None)
    concern_names = {c["name"] for c in (assessment.detected_concerns or [])}

    all_products = db.query(Product).all()
    safe_products = [p for p in all_products if _is_safe(p, user_allergies)]

    by_category = {}
    for product in safe_products:
        score, matched_concerns = _match_score(product, assessment.skin_type, concern_names)
        by_category.setdefault(product.category, []).append((score, matched_concerns, product))

    results = []
    for category, candidates in by_category.items():
        candidates.sort(key=lambda x: x[0], reverse=True)
        for score, matched_concerns, product in candidates[:per_category]:
            results.append({
                "id": product.id,
                "name": product.name,
                "brand": product.brand,
                "category": product.category,
                "price_usd": product.price_usd,
                "rating": product.rating,
                "key_ingredients": product.key_ingredients,
                "matched_concerns": matched_concerns,
                "description": product.description,
            })

    return results


def get_admin_recommendation_overview(current_user, db: Session):
    """
    Real recommendation-engine activity for the Admin dashboard: catalog
    composition, plus which products actually get recommended most often
    across every user who has completed an assessment. Computed live at
    request time (the engine has no click/impression logging table yet),
    not stored or invented numbers.
    """
    all_products = db.query(Product).all()
    category_counts = {}
    for p in all_products:
        category_counts[p.category] = category_counts.get(p.category, 0) + 1

    user_ids = [row[0] for row in db.query(SkinAssessment.user_id).distinct().all()]

    recommendation_tally = {}  # product_id -> {name, brand, category, count}
    users_with_recommendations = 0
    for uid in user_ids:
        try:
            recs = get_recommendations(current_user, db, target_user_id=uid)
        except HTTPException:
            continue
        if not recs:
            continue
        users_with_recommendations += 1
        for r in recs:
            entry = recommendation_tally.setdefault(
                r["id"], {"name": r["name"], "brand": r["brand"], "category": r["category"], "count": 0}
            )
            entry["count"] += 1

    top_recommended = sorted(recommendation_tally.values(), key=lambda x: x["count"], reverse=True)

    return {
        "catalog_size": len(all_products),
        "category_breakdown": [{"category": k, "count": v} for k, v in category_counts.items()],
        "users_with_recommendations": users_with_recommendations,
        "top_recommended": top_recommended,
    }
