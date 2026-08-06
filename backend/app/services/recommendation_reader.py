from app.models import UserRecommendation


def get_saved_recommendations(db, user_id):

    recommendations = (
        db.query(UserRecommendation)
        .filter(UserRecommendation.user_id == user_id)
        .all()
    )

    print("Recommendations found:", len(recommendations))

    if recommendations:
        print(recommendations[0].product)

    return recommendations