import pytest
import uuid
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app import models
from app.auth import get_current_user

# Setup Testing SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_temp_ingredients.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        import os
        try:
            if os.path.exists("./test_temp_ingredients.db"):
                os.remove("./test_temp_ingredients.db")
        except Exception:
            pass

@pytest.fixture(scope="module")
def mock_mongo():
    mock_db = MagicMock()
    
    # Mock ingredients collection
    mock_ingredients = [
        {"name": "Retinoids", "target_concerns": ["Aging", "Wrinkles"]},
        {"name": "AHAs/BHAs", "target_concerns": ["Acne", "Oiliness"]},
        {"name": "Vitamin C", "target_concerns": ["Dullness"]},
        {"name": "Niacinamide", "target_concerns": ["Oiliness"]},
        {"name": "Hyaluronic Acid", "target_concerns": ["Dryness"]},
        {"name": "Ceramides", "target_concerns": ["Dryness"]}
    ]
    mock_db.ingredients.find.return_value = mock_ingredients
    
    # Mock products collection
    mock_products = [
        {
            "_id": "64b0f7e1b1a2c3d4e5f67890",
            "name": "Gentle Daily Moisturizer",
            "brand": "PureSkin",
            "category": "Moisturizer",
            "suitable_skin_types": ["combination"],
            "key_ingredients": ["Ceramides", "Hyaluronic Acid"],
            "price_inr": 500,
            "rating": 4.5,
            "description": "Gentle daily moisturizer."
        },
        {
            "_id": "64b0f7e1b1a2c3d4e5f67891",
            "name": "Scented Acid Peel",
            "brand": "GlowCo",
            "category": "Peel",
            "suitable_skin_types": ["combination"],
            "key_ingredients": ["AHAs/BHAs"],
            "price_inr": 400,
            "rating": 4.2,
            "description": "Fragrance blend exfoliant."
        }
    ]
    mock_db.products.find.return_value = mock_products
    
    # Mock conflict_matrix collection
    mock_conflicts = [
        {
            "active_1": "Retinoids",
            "active_2": "AHAs/BHAs",
            "type": "same_step_conflict",
            "severity": "unsafe",
            "reason": "Retinoids and strong AHAs/BHAs exfoliants combined in the same routine step cause severe dryness."
        },
        {
            "active_1": "Vitamin C",
            "active_2": "Niacinamide",
            "type": "same_step_conflict",
            "severity": "caution",
            "reason": "Vitamin C and Niacinamide can cause mild flushing when layered."
        }
    ]
    
    def find_one_side_effect(query):
        or_list = query.get("$or", [])
        for c in mock_conflicts:
            if or_list:
                for cond in or_list:
                    cond1 = (cond.get("active_1") == c["active_1"] and cond.get("active_2") == c["active_2"])
                    cond2 = (cond.get("active_1") == c["active_2"] and cond.get("active_2") == c["active_1"])
                    if cond1 or cond2:
                        sev_filter = query.get("severity")
                        if sev_filter is None or sev_filter == c.get("severity", "unsafe"):
                            return c
            else:
                cond1 = (query.get("active_1") == c["active_1"] and query.get("active_2") == c["active_2"])
                cond2 = (query.get("active_1") == c["active_2"] and query.get("active_2") == c["active_1"])
                if (cond1 or cond2):
                    sev_filter = query.get("severity")
                    if sev_filter is None or sev_filter == c.get("severity", "unsafe"):
                        return c
        return None
        
    mock_db.conflict_matrix.find_one.side_effect = find_one_side_effect
    
    with patch("app.routers.ingredients.get_mongo_db", return_value=mock_db), \
         patch("app.routers.recommendations.get_mongo_db", return_value=mock_db):
        yield mock_db

def test_chemical_clash_detection(db_session, mock_mongo):
    client = TestClient(app)
    
    # Mock current user
    user_id = str(uuid.uuid4())
    user = models.User(
        id=user_id,
        full_name="Conflict Tester",
        email="conflict@example.com",
        hashed_password="bcrypt_hash_placeholder",
        role=models.RoleEnum.user,
        is_active=True
    )
    db_session.add(user)
    
    # Mock skin profile with sensitivity
    profile = models.SkinProfile(
        user_id=user_id,
        skin_type=models.SkinTypeEnum.combination,
        allergies="Peanuts",
        skin_sensitivities="Fragrance"
    )
    db_session.add(profile)
    db_session.commit()
    
    # Override current user dependency
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db_session
    
    # 1. Unsafe Conflict: Retinoids + AHAs/BHAs
    response = client.post("/api/ingredients/safety-score", json={
        "ingredients_list": ["Retinol", "Salicylic Acid"],
        "time_of_day": "PM"
    }, headers={"Authorization": "Bearer testtoken"})
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "Unsafe"
    assert data["score"] < 70
    assert len(data["conflicts"]) == 1
    assert data["conflicts"][0]["severity"] == "unsafe"
    
    # 2. Allergy Match: Product containing Fragrance
    response_allergy = client.post("/api/ingredients/safety-score", json={
        "ingredients_list": ["Fragrance Blend", "Hyaluronic Acid"],
        "time_of_day": "AM"
    })
    assert response_allergy.status_code == 200
    data_allergy = response_allergy.json()
    assert data_allergy["status"] == "Unsafe"
    assert data_allergy["score"] == 0
    assert len(data_allergy["allergy_alerts"]) == 1
    assert data_allergy["allergy_alerts"][0]["matched_allergen"] == "fragrance"

    # Cleanup dependency overrides
    app.dependency_overrides.clear()


def test_safety_score_boundaries_and_recommendation_allergen_hard_gate(db_session, mock_mongo):
    client = TestClient(app)
    
    # 1. Setup a user with combination skin and "Fragrance" sensitivity
    user_id = str(uuid.uuid4())
    user = models.User(
        id=user_id,
        full_name="Boundary Tester",
        email="boundary@example.com",
        hashed_password="bcrypt_hash_placeholder",
        role=models.RoleEnum.user,
        is_active=True
    )
    db_session.add(user)
    
    profile = models.SkinProfile(
        user_id=user_id,
        skin_type=models.SkinTypeEnum.combination,
        allergies="",
        skin_sensitivities="Fragrance"
    )
    db_session.add(profile)
    db_session.commit()
    
    # Override current user dependency
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_db] = lambda: db_session
    
    try:
        # A. Safety score boundary: Caution-level conflict only (Vitamin C + Niacinamide) -> "Warning"
        response_caution = client.post("/api/ingredients/safety-score", json={
            "ingredients_list": ["Vitamin C", "Niacinamide"],
            "time_of_day": "PM"
        })
        assert response_caution.status_code == 200
        data_caution = response_caution.json()
        assert data_caution["status"] == "Warning"
        assert data_caution["score"] == 85
        assert len(data_caution["conflicts"]) == 1
        assert data_caution["conflicts"][0]["severity"] == "caution"

        # B. Safety score boundary: Zero flags (Hyaluronic Acid + Ceramides) -> "Safe", score 100
        response_safe = client.post("/api/ingredients/safety-score", json={
            "ingredients_list": ["Hyaluronic Acid", "Ceramides"],
            "time_of_day": "AM"
        })
        assert response_safe.status_code == 200
        data_safe = response_safe.json()
        assert data_safe["status"] == "Safe"
        assert data_safe["score"] == 100
        assert len(data_safe["conflicts"]) == 0
        assert len(data_safe["allergy_alerts"]) == 0

        # C. Recommendation Allergen Hard Gate check:
        # User has "Fragrance" sensitivity. "Scented Acid Peel" has "Fragrance blend" in its description/ingredients.
        # "Fragrance Free Moisturizer" has no allergens.
        # Calling get recommendations must exclude "Scented Acid Peel" entirely.
        response_recs = client.get("/api/recommendations/")
        assert response_recs.status_code == 200
        recs_data = response_recs.json()
        
        # Verify Product B ("Scented Acid Peel") is completely excluded, only Product A ("Gentle Daily Moisturizer") remains
        product_names = [r["name"] for r in recs_data["recommendations"]]
        assert "Gentle Daily Moisturizer" in product_names
        assert "Scented Acid Peel" not in product_names

    finally:
        # Cleanup dependency overrides
        app.dependency_overrides.clear()

