def normalize(value, min_value, max_value):
    """
    Normalize any value into a score between 0 and 100.
    """
    if value < min_value:
        value = min_value

    if value > max_value:
        value = max_value

    return int(
        ((value - min_value) / (max_value - min_value)) * 100
    )


def generate_scores(features):
    """
    Convert raw image measurements into skin scores.
    """

    brightness = features["brightness"]
    redness = features["redness"]
    texture = features["texture"]

    pigmentation_score = 100 - normalize(
        brightness,
        60,
        220,
    )

    redness_score = normalize(
        redness,
        0,
        60,
    )

    wrinkles_score = normalize(
        texture,
        50,
        800,
    )

    overall_score = int(
        (
            pigmentation_score +
            redness_score +
            wrinkles_score
        ) / 3
    )

    return {
        "pigmentation_score": pigmentation_score,
        "redness_score": redness_score,
        "wrinkles_score": wrinkles_score,
        "overall_score": overall_score,
    }