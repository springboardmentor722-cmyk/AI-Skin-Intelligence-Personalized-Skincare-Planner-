def calculate_progress(previous, current):
    """
    Calculate improvement between two skin assessments.
    A positive value means improvement because lower scores are better.
    """

    return {
        "overall": previous.overall_score - current.overall_score,
        "acne": previous.acne_score - current.acne_score,
        "pigmentation": previous.pigmentation_score - current.pigmentation_score,
        "redness": previous.redness_score - current.redness_score,
        "wrinkles": previous.wrinkles_score - current.wrinkles_score,
        "dark_circles": previous.dark_circle_score - current.dark_circle_score,
    }