import ast


def extract_matching_ingredients(product, kb_ingredients):
    """
    Returns Ingredient objects that match the product ingredients.
    Optimized version.
    """

    if not product.ingredients:
        return []

    try:
        ingredient_list = ast.literal_eval(product.ingredients)
    except Exception:
        return []

    ingredient_text = " ".join(ingredient_list).lower()

    matched = []

    for ingredient in kb_ingredients:

        if ingredient.ingredient_name.lower() in ingredient_text:
            matched.append(ingredient)

    return matched