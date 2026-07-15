import asyncio
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import async_session_maker
from app.models.decision_matrix import DecisionMatrix

# A deterministic, rule-based decision matrix based on standard dermatological advice
DECISION_MATRIX_DATA = [
    {
        "skin_type": "Oily",
        "primary_concern": "Acne",
        "sensitivity": "Resilient",
        "routine_template": {
            "morning": [
                {"step": 1, "category": "Cleanser", "ingredient_suggestion": "Salicylic Acid (BHA)", "instructions": "Massage gently for 60 seconds"},
                {"step": 2, "category": "Treatment", "ingredient_suggestion": "Niacinamide", "instructions": "Apply 2-3 drops to dry skin"},
                {"step": 3, "category": "Sunscreen", "ingredient_suggestion": "Oil-Free SPF 30+", "instructions": "Apply generously as final step"}
            ],
            "evening": [
                {"step": 1, "category": "Cleanser", "ingredient_suggestion": "Salicylic Acid (BHA)", "instructions": "Double cleanse if wearing makeup"},
                {"step": 2, "category": "Treatment", "ingredient_suggestion": "Retinol (0.25% - 0.5%)", "instructions": "Apply pea-sized amount, avoid eye area"},
                {"step": 3, "category": "Moisturizer", "ingredient_suggestion": "Hyaluronic Acid / Gel based", "instructions": "Apply to lock in treatment"}
            ],
            "weekly": [
                {"step": 1, "category": "Exfoliant", "ingredient_suggestion": "AHA/BHA Peeling Solution", "instructions": "Use 1-2 times a week, maximum 10 minutes"}
            ]
        }
    },
    {
        "skin_type": "Dry",
        "primary_concern": "Aging",
        "sensitivity": "Sensitive",
        "routine_template": {
            "morning": [
                {"step": 1, "category": "Cleanser", "ingredient_suggestion": "Hydrating Milk Cleanser", "instructions": "Wash gently with lukewarm water"},
                {"step": 2, "category": "Serum", "ingredient_suggestion": "Vitamin C (Sodium Ascorbyl Phosphate)", "instructions": "Gentle Vitamin C derivative for sensitive skin"},
                {"step": 3, "category": "Sunscreen", "ingredient_suggestion": "Mineral SPF 30+", "instructions": "Apply generously as final step"}
            ],
            "evening": [
                {"step": 1, "category": "Cleanser", "ingredient_suggestion": "Oil Cleanser", "instructions": "Massage gently to remove impurities"},
                {"step": 2, "category": "Treatment", "ingredient_suggestion": "Bakuchiol", "instructions": "Gentle retinol alternative for sensitive skin"},
                {"step": 3, "category": "Moisturizer", "ingredient_suggestion": "Ceramides / Heavy Cream", "instructions": "Apply thick layer to repair barrier"}
            ]
        }
    }
]

async def seed_decision_matrix():
    print("Seeding Decision Matrix...")
    async with async_session_maker() as session:
        for data in DECISION_MATRIX_DATA:
            matrix_entry = DecisionMatrix(
                skin_type=data["skin_type"],
                primary_concern=data["primary_concern"],
                sensitivity=data["sensitivity"],
                routine_template=data["routine_template"]
            )
            session.add(matrix_entry)
        
        await session.commit()
    print("Decision Matrix seeded successfully.")

if __name__ == "__main__":
    asyncio.run(seed_decision_matrix())
