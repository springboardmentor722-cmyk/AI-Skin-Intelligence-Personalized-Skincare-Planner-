INGREDIENT_ALIASES = {

    # Ceramides
    "Ceramide NP": "Ceramide",
    "Ceramide AP": "Ceramide",
    "Ceramide EOP": "Ceramide",
    "Ceramide EOS": "Ceramide",

    # Hyaluronic Acid
    "Sodium Hyaluronate": "Hyaluronic Acid",

    # Squalane
    "Squalene": "Squalane",

    # Aloe
    "Aloe Barbadensis Leaf Juice": "Aloe Vera",

    # Centella
    "Cica": "Centella Asiatica",
    "Centella Asiatica Extract": "Centella Asiatica",

    # Vitamin E
    "Tocopherol": "Vitamin E",

    # Vitamin C
    "Ascorbic Acid": "Vitamin C",
    "Sodium Ascorbyl Phosphate": "Vitamin C",
    "Magnesium Ascorbyl Phosphate": "Vitamin C",

    # Niacinamide
    "Vitamin B3": "Niacinamide",

    # Panthenol
    "Pro Vitamin B5": "Panthenol",

}

INGREDIENT_PRIORITY = {

    # Acne
    "Salicylic Acid": 40,
    "Benzoyl Peroxide": 40,
    "Azelaic Acid": 35,
    "Niacinamide": 35,
    "Sulfur": 30,
    "Zinc PCA": 25,
    "Tea Tree Oil": 20,

    # Dry Skin
    "Ceramide": 35,
    "Hyaluronic Acid": 35,
    "Squalane": 30,
    "Panthenol": 25,
    "Glycerin": 25,
    "Urea": 20,

    # Pigmentation
    "Vitamin C": 35,
    "Alpha Arbutin": 35,
    "Tranexamic Acid": 35,
    "Kojic Acid": 30,
    "Licorice Root Extract": 25,

    # Redness
    "Centella Asiatica": 30,
    "Aloe Vera": 25,
    "Bisabolol": 20,
    "Green Tea Extract": 20,

    # Aging
    "Retinol": 40,
    "Retinal": 40,
    "Bakuchiol": 30,
    "Peptides": 30,
    "Coenzyme Q10": 20,
}


def calculate_ingredient_score(
    matched_ingredients,
    skin_profile,
    assessment,
):
    score = 0
    seen = set()

    for ingredient in matched_ingredients:

        # Normalize ingredient name
        name = INGREDIENT_ALIASES.get(
            ingredient.ingredient_name,
            ingredient.ingredient_name
        )

        # Skip duplicate aliases
        if name in seen:
            continue

        seen.add(name)

        # -------------------------
        # Skin Type
        # -------------------------
        if (
            ingredient.suitable_skin_types
            and skin_profile.skin_type.lower()
            in ingredient.suitable_skin_types.lower()
        ):

            score += INGREDIENT_PRIORITY.get(name, 10)

            if name == "Ceramide":
                reason = "Ceramides strengthen the skin barrier"

            elif name == "Hyaluronic Acid":
                reason = "Hyaluronic Acid deeply hydrates the skin"

            elif name == "Squalane":
                reason = "Squalane nourishes dry skin"

            elif name == "Aloe Vera":
                reason = "Aloe Vera soothes and hydrates the skin"

            else:
                reason = f"{name} suits {skin_profile.skin_type} skin"

            

        if assessment is None:
            continue

        # -------------------------
        # Acne
        # -------------------------
        if (
            assessment.acne_score >= 70
            and ingredient.skin_concerns
            and "acne" in ingredient.skin_concerns.lower()
        ):

            score += 20

            if name == "Niacinamide":
                reason = "Niacinamide helps reduce acne"

            elif name == "Salicylic Acid":
                reason = "Salicylic Acid unclogs pores"

            elif name == "Azelaic Acid":
                reason = "Azelaic Acid helps control acne"

            elif name == "Benzoyl Peroxide":
                reason = "Benzoyl Peroxide fights acne-causing bacteria"

            else:
                reason = f"{name} helps acne"

            

        # -------------------------
        # Pigmentation
        # -------------------------
        if (
            assessment.pigmentation_score >= 70
            and ingredient.skin_concerns
            and "pigmentation" in ingredient.skin_concerns.lower()
        ):

            score += 20

            reason = f"{name} helps reduce pigmentation"

            

        # -------------------------
        # Redness
        # -------------------------
        if (
            assessment.redness_score >= 70
            and ingredient.skin_concerns
            and "redness" in ingredient.skin_concerns.lower()
        ):

            score += 20

            reason = f"{name} calms redness"

            

        # -------------------------
        # Wrinkles
        # -------------------------
        if (
            assessment.wrinkles_score >= 70
            and ingredient.skin_concerns
            and "wrinkles" in ingredient.skin_concerns.lower()
        ):

            score += 20

            reason = f"{name} helps reduce wrinkles"

            

    return score, []