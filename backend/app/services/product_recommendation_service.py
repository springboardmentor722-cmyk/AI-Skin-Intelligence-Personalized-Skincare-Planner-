"""Deterministic product evaluation and ranking helpers.

The catalog has no rating column, so rating remains zero until a real catalog
rating is available; it is deliberately not inferred.
"""
from app.services.ingredient_intelligence_service import analyze_ingredient, detect_conflicts, normalize, product_ingredients, terms


def evaluate_product(product, ingredients_by_name, profile) -> dict:
    profile_skin_type = normalize(getattr(profile, "skin_type", None))
    concerns = terms(getattr(profile, "skin_concerns", None))
    product_text = normalize(" ".join(filter(None, [product.product_name, product.category, product.ingredients])))
    product_ingredient_names = product_ingredients(product.ingredients)
    matched_concerns = [concern for concern in concerns if concern in product_text]
    concern_score = (len(matched_concerns) / len(concerns) * 100) if concerns else 0
    skin_type_value = normalize(product.skin_type)
    skin_type_score = 100 if skin_type_value in {"", "all", "any"} or (profile_skin_type and profile_skin_type in skin_type_value) else 0
    rating_score = 0  # The existing Product model has no rating field; do not invent one.
    sensitivity_terms = terms(getattr(profile, "allergies", None)) + terms(getattr(profile, "sensitivities", None))
    warnings, ingredient_results, ingredient_safety = [], [], []
    unsafe = False
    unknown_evidence = False
    has_warning = False
    for raw_name in product_ingredient_names:
        known = ingredients_by_name.get(normalize(raw_name))
        match = next((term for term in sensitivity_terms if term and (term in raw_name or raw_name in term)), None)
        if match:
            unsafe = True
            warnings.append(f"Matches your saved allergy or sensitivity: {match}.")
        if not known:
            unknown_evidence = True
            ingredient_safety.append({"ingredient_name": raw_name, "safety_status": "UNKNOWN", "reason": "No active catalog evidence is available for this ingredient."})
            continue
        analysis = analyze_ingredient(known, getattr(profile, "skin_type", None), getattr(profile, "skin_concerns", None), getattr(profile, "allergies", None), getattr(profile, "sensitivities", None))
        ingredient_safety.append({"ingredient_name": known.ingredient_name, "safety_status": analysis["safety_status"], "reason": analysis["reason"]})
        if analysis["safety_status"] == "UNSAFE":
            unsafe = True
            warnings.extend(analysis["warnings"])
        elif analysis["safety_status"] == "WARNING":
            has_warning = True
            warnings.extend(analysis["warnings"])
            ingredient_results.append(known.ingredient_name)
    conflicts = detect_conflicts(product_ingredient_names)
    warnings.extend(conflicts)
    if unsafe:
        safety_status, safety_score = "UNSAFE", 0
    elif conflicts or has_warning:
        safety_status, safety_score = "WARNING", 70
    elif not product_ingredient_names or unknown_evidence:
        safety_status, safety_score = "UNKNOWN", 50
    else:
        safety_status, safety_score = "SAFE", 100
    recommendation_score = concern_score * 0.50 + skin_type_score * 0.35 + rating_score * 0.15
    reasons = []
    if matched_concerns: reasons.append(f"Matches concerns: {', '.join(matched_concerns)}.")
    if skin_type_score: reasons.append("Suitable for your saved skin type.")
    if rating_score == 0: reasons.append("No catalog rating is available, so rating contributes 0%.")
    if not reasons: reasons.append("Limited profile or catalog matching information is available.")
    return {"product_id": product.product_id, "product_name": product.product_name, "brand": product.brand, "category": product.category, "price": float(product.price) if product.price is not None else None, "currency": product.currency, "rating": None, "recommendation_score": round(recommendation_score, 2), "concern_match_score": round(concern_score, 2), "skin_type_score": skin_type_score, "rating_score": rating_score, "safety_status": safety_status, "safety_score": safety_score, "matched_concerns": matched_concerns, "warnings": list(dict.fromkeys(warnings)), "conflicts": conflicts, "matched_catalog_ingredients": ingredient_results, "ingredient_safety": ingredient_safety, "recommendation_reason": " ".join(reasons)}
