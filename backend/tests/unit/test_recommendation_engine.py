import pytest
from app.services.recommendation_engine import ProductRecommendationEngine
from app.models.profile import SkinProfile
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.product import Product

engine = create_engine('sqlite:///:memory:', connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed mock products
    p1 = Product(name="Gentle Cleanser", brand="Cerave", category="Cleanser", price=15.00, key_ingredients="Glycerin, Ceramides", skin_type_suitability="Dry, Normal")
    p2 = Product(name="Salicylic Acid Wash", brand="COSRX", category="Cleanser", price=12.00, key_ingredients="Salicylic Acid", skin_type_suitability="Oily, Combination")
    p3 = Product(name="Luxury Gold Serum", brand="La Mer", category="Serum", price=350.00, key_ingredients="Miracle Broth", skin_type_suitability="Dry")
    
    session.add_all([p1, p2, p3])
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_filtering_by_skin_type(db):
    recommender = ProductRecommendationEngine(db)
    user_profile = {"skin_type": "Dry", "sensitivity": "Resilient", "concerns": ["Aging"]}
    
    recommendations = recommender.get_recommendations(user_profile, category="Cleanser")
    
    # Should recommend Cerave, not COSRX
    names = [r["name"] for r in recommendations]
    assert "Gentle Cleanser" in names
    assert "Salicylic Acid Wash" not in names

def test_filtering_by_budget(db):
    recommender = ProductRecommendationEngine(db)
    user_profile = {"skin_type": "Dry", "sensitivity": "Resilient", "budget": 100.00, "concerns": ["Aging"]}
    
    recommendations = recommender.get_recommendations(user_profile, category="Serum")
    
    # Should exclude La Mer due to budget constraint (350.00 > 100.00)
    names = [r["name"] for r in recommendations]
    assert "Luxury Gold Serum" not in names
