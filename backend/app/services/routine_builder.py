def format_product(item):

    product = item["product"]

    return {
        "product_name": product.product_name,
        "brand": product.brand_name,
        "price": product.price,
        "rating": product.rating,
        "budget": item["budget"],
        "confidence": item["confidence"],
        "score": item["score"],
    }

def build_skincare_routine(recommendations):

    morning = {}
    night = {}

    for item in recommendations:

        product = item["product"]
        product_type = item["product_type"]

        # ---------- Morning ----------

        if product_type == "cleanser" and "cleanser" not in morning:
            morning["cleanser"] = format_product(item)

        elif product_type == "serum" and "serum" not in morning:
            morning["serum"] = format_product(item)

        elif product_type == "moisturizer" and "moisturizer" not in morning:
            morning["moisturizer"] = format_product(item)

        elif product_type == "sunscreen" and "sunscreen" not in morning:
           morning["sunscreen"] = format_product(item)

        # ---------- Night ----------

        if product_type == "cleanser" and "cleanser" not in night:
            night["cleanser"] = format_product(item)

        elif product_type == "treatment" and "treatment" not in night:
            night["treatment"] = format_product(item)


        elif product_type == "mask" and "mask" not in night:
           night["mask"] = format_product(item)

        elif product_type == "eye" and "eye_cream" not in night:
           night["eye_cream"] = format_product(item)

        elif product_type == "moisturizer" and "moisturizer" not in night:
            night["moisturizer"] = format_product(item)

    return {
        "morning": morning,
        "night": night,
    }