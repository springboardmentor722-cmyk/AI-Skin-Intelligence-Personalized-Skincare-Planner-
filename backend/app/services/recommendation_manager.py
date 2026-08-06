from app.services.recommendation_engine import recommend_products
from app.services.recommendation_storage import save_recommendations


def regenerate_recommendations(
    db,
    user_id,
    skin_profile,
    latest_assessment,
    lifestyle,
):
    recommendations = recommend_products(
        db,
        skin_profile,
        latest_assessment,
        lifestyle,
    )

    save_recommendations(
        db,
        user_id,
        recommendations,
    )

    return recommendations