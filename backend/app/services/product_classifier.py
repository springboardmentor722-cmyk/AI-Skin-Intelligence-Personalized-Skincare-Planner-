def get_product_type(product):

    text = " ".join([
        product.product_name or "",
        product.category or "",
        product.description or "",
    ]).lower()

    if "cleanser" in text or "face wash" in text:
        return "cleanser"

    if "toner" in text:
        return "toner"

    if "serum" in text:
        return "serum"

    if "mask" in text:
        return "mask"

    if (
        "treatment" in text
        or "spot" in text
        or "retinol" in text
        or "bha" in text
        or "aha" in text
        or "acid" in text
    ):
        return "treatment"

    if "eye cream" in text:
        return "eye"

    if (
        "moisturizer" in text
        or "cream" in text
        or "lotion" in text
        or "gel" in text
    ):
        return "moisturizer"

    if (
        "sunscreen" in text
        or "spf" in text
        or "sun screen" in text
    ):
        return "sunscreen"

    return "other"