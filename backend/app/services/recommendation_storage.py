from app.models import UserRecommendation

def save_recommendations(db, user_id, recommendations):
    print("Saving recommendations...")
    print(f"User ID: {user_id}")
    print(f"Recommendations count: {len(recommendations)}")

    db.query(UserRecommendation).filter(
        UserRecommendation.user_id == user_id
    ).delete()



    for item in recommendations:
        recommendation = UserRecommendation(
            user_id=user_id,
            product_id=item["product"].id,
            product_type=item["product_type"],
            score=item["score"],
            confidence=item["confidence"],
            budget=item["budget"],
            reason="\n".join(item["reason"])
        )

        db.add(recommendation)

    db.commit()

    print("Recommendations saved successfully.")

from app.models import UserRecommendation


def delete_saved_recommendations(db, user_id):
    db.query(UserRecommendation).filter(
        UserRecommendation.user_id == user_id
    ).delete()

    db.commit()