from app.models import (
    Product,
    Ingredient,
)

import time

from app.services.ingredient_matcher import extract_matching_ingredients
from app.services.scoring_engine import calculate_ingredient_score
from app.services.product_classifier import get_product_type


# ----------------------------
# Skin Type Score
# ----------------------------
def score_skin_type(skin_profile, ingredients):
    score = 0

    if skin_profile.skin_type.lower() == "dry":

        if "hyaluronic" in ingredients:
            score += 30

        if "glycerin" in ingredients:
            score += 20

        if "ceramide" in ingredients:
            score += 30

        if "squalane" in ingredients:
            score += 20

    elif skin_profile.skin_type.lower() == "oily":

        if "niacinamide" in ingredients:
            score += 30

        if "salicylic" in ingredients:
            score += 30

        if "zinc" in ingredients:
            score += 20

    elif skin_profile.skin_type.lower() == "combination":

        if "niacinamide" in ingredients:
            score += 20

        if "hyaluronic" in ingredients:
            score += 20

    return score


# ----------------------------
# AI Assessment Score
# ----------------------------
def score_ai(latest_assessment, ingredients):
    score = 0

    if latest_assessment.acne_score >= 70:

        if "salicylic" in ingredients:
            score += 30

        if "niacinamide" in ingredients:
            score += 25

        if "tea tree" in ingredients:
            score += 20

    if latest_assessment.pigmentation_score >= 70:

        if "vitamin c" in ingredients:
            score += 30

        if "alpha arbutin" in ingredients:
            score += 30

    if latest_assessment.redness_score >= 70:

        if "centella" in ingredients:
            score += 30

        if "aloe" in ingredients:
            score += 20

    if latest_assessment.wrinkles_score >= 70:

        if "retinol" in ingredients:
            score += 30

        if "peptide" in ingredients:
            score += 20

    return score


# ----------------------------
# Allergy Score
# ----------------------------
def score_allergy(skin_profile, ingredients):
    score = 0

    if skin_profile.allergies:

        allergy = skin_profile.allergies.lower()

        if allergy in ingredients:
            score -= 50

    return score


# ----------------------------
# Lifestyle Score
# ----------------------------
def score_lifestyle(lifestyle, ingredients):
    score = 0

    if lifestyle.water_intake < 2:

        if "hyaluronic" in ingredients:
            score += 20

        if "glycerin" in ingredients:
            score += 15

    if lifestyle.stress_level.lower() == "high":

        if "centella" in ingredients:
            score += 20

        if "aloe" in ingredients:
            score += 15

        if "oat" in ingredients:
            score += 15

    if lifestyle.sleep_duration < 6:

        if "caffeine" in ingredients:
            score += 15

        if "vitamin c" in ingredients:
            score += 15

    return score

def generate_reason(
    skin_profile,
    latest_assessment,
    product,
):
    reasons = []

    # Skin type
    if product.skin_type:
        reasons.append(
            f"Recommended for {product.skin_type} skin."
        )

    # Skin concern
    if product.skin_concern:
        reasons.append(
            f"Targets {product.skin_concern}."
        )

    # Ingredients
    if product.ingredients:
        reasons.append(
            f"Key ingredients: {product.ingredients}"
        )

    # Rating
    if product.rating and product.rating >= 4.5:
        reasons.append(
            f"Highly rated product ({product.rating}★)."
        )

    return reasons

# ----------------------------
# Product Type Score
# ----------------------------
def score_product_type(product):

    score = 0

    name = product.product_name.lower()

    category = (
    product.category.lower()
    if product.category
    else ""
)

    # Preferred products
    if "serum" in name or "serum" in category:
        score += 25

    if "moisturizer" in name or "moisturizer" in category:
        score += 25

    if "cleanser" in name or "cleanser" in category:
        score += 20

    if "sunscreen" in name or "sunscreen" in category:
        score += 30

    if "cream" in name or "cream" in category:
        score += 15

    if "toner" in name or "toner" in category:
        score += 10

    # Lower priority
    if "kit" in name:
        score -= 60

    if "set" in name:
        score -= 60

    if "discovery" in name:
        score -= 50

    if "mini" in name:
        score -= 20

    if "travel" in name:
        score -= 20

    return score

# ----------------------------
# Main Recommendation Engine
# ----------------------------
def recommend_products(
    db,
    skin_profile,
    latest_assessment,
    lifestyle,
):
    
    total_start = time.time()

    start = time.time()
    products = db.query(Product).all()
    kb_ingredients = db.query(Ingredient).all()

    print(f"Loaded {len(products)} products in {time.time() - start:.2f}s")

    recommendations = []

    products = db.query(Product).all()

    kb_ingredients = db.query(Ingredient).all()

    recommendations = []

    for product in products:

        if not product.ingredients:
            continue

        name = product.product_name.lower()

# ---------------------------------
# Skip Gift Sets & Kits
# ---------------------------------

        SKIP_WORDS = [
    "kit",
    "set",
    "bundle",
    "duo",
    "trio",
    "collection",
    "vault",
    "discovery",
    "gift",
    
    "travel"
]

        if any(word in name for word in SKIP_WORDS):
         continue


# ---------------------------------
# Skip Body Products
# ---------------------------------

        BODY_WORDS = [
    "body",
    "hand",
    "foot",
    "hair"
]

        if any(word in name for word in BODY_WORDS):
         continue

        score = 0

        if product.skin_type:

         if skin_profile.skin_type.lower() in product.skin_type.lower():
          score += 60

        if product.skin_concern:

         ai_concerns = []

         if latest_assessment.acne_score >= 70:
          ai_concerns.append("acne")

         if latest_assessment.pigmentation_score >= 70:
          ai_concerns.append("pigmentation")

         if latest_assessment.redness_score >= 70:
          ai_concerns.append("redness")

         if latest_assessment.wrinkles_score >= 70:
          ai_concerns.append("wrinkles")

         for concern in ai_concerns:

           if concern in product.skin_concern.lower():
              score += 40

        # ----------------------------
        # Old Rule-Based Scoring
        # ----------------------------
        ingredients = product.ingredients.lower()

        score += score_skin_type(
            skin_profile,
            ingredients
        )

        score += score_ai(
            latest_assessment,
            ingredients
        )

        score += score_allergy(
            skin_profile,
            ingredients
        )

        score += score_lifestyle(
            lifestyle,
            ingredients
        )

        # ----------------------------
        # Ingredient Knowledge Base Score
        # ----------------------------
        matched_ingredients = extract_matching_ingredients(
    product,
    kb_ingredients
)

        ingredient_score, ingredient_reasons = calculate_ingredient_score(
            matched_ingredients,
            skin_profile,
            latest_assessment,
        )

        score += ingredient_score

        # ----------------------------
        # Product Rating Bonus
        # ----------------------------
        if product.rating:

            if product.rating >= 4.8:
                score += 20

            elif product.rating >= 4.5:
                score += 15

            elif product.rating >= 4.0:
                score += 10

        # Product type score
        score += score_product_type(product)

        # ----------------------------
        # Remove Negative Scores
        # ----------------------------
        if score < 0:
            score = 0

        MIN_SCORE = 120

        if score < MIN_SCORE:
         continue

        # ----------------------------
        # Merge Reasons
        # ----------------------------
        reasons = generate_reason(
    skin_profile,
    latest_assessment,
    product
)

        # Remove duplicate reasons
        reasons = list(dict.fromkeys(reasons))

        # ---------------------------------
# Budget Category
# ---------------------------------

        if product.price:

           if product.price <= 500:
             budget = "Budget"

           elif product.price <= 1000:
             budget = "Mid-range"

           else:
            budget = "Premium"

        else:
          budget = "Unknown"

        recommendations.append(
    {
        "product": product,
        "product_type": get_product_type(product),
        "score": score,

        "confidence": min(100, int(score / 4)),

        "budget": budget,

        "reason": reasons
    }
)
    recommendations.sort(
    key=lambda x: x["score"],
    reverse=True
)

# ---------------------------------
# Brand Diversity
# ---------------------------------
    final_recommendations = []
    used_brands = set()

    for item in recommendations:

     brand = item["product"].brand_name

     if brand not in used_brands:
        final_recommendations.append(item)
        used_brands.add(brand)

    print(f"Recommendation engine took {time.time() - total_start:.2f}s")

    return final_recommendations