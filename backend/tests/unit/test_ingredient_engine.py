import pytest
from app.services.ingredient_engine import IngredientIntelligenceEngine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.models.product import Ingredient, Product

# Setup in-memory sqlite for testing
engine = create_engine('sqlite:///:memory:', connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    
    # Seed some test ingredients
    retinol = Ingredient(name="Retinol", comedogenic_rating=0, irritant_rating=3, safety_score=4, aliases=["Vitamin A"])
    vit_c = Ingredient(name="Vitamin C", comedogenic_rating=0, irritant_rating=2, safety_score=2, aliases=["Ascorbic Acid"])
    salicylic_acid = Ingredient(name="Salicylic Acid", comedogenic_rating=0, irritant_rating=3, safety_score=3, aliases=["BHA"])
    niacinamide = Ingredient(name="Niacinamide", comedogenic_rating=0, irritant_rating=0, safety_score=1, aliases=["Vitamin B3"])
    
    session.add_all([retinol, vit_c, salicylic_acid, niacinamide])
    session.commit()
    
    yield session
    
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_detect_allergies(db):
    user_allergies = ["salicylates", "vitamin a"]
    ingredients = ["Water", "Glycerin", "Retinol", "Salicylic Acid"]
    
    engine = IngredientIntelligenceEngine(db)
    flags = engine.check_allergies(user_allergies, ingredients)
    
    assert len(flags) > 0
    # The logic in IngredientIntelligenceEngine uses NLP or simple string matching
    # We expect it to flag Retinol (Vitamin A) and Salicylic Acid (salicylates)

def test_chemical_conflicts(db):
    engine = IngredientIntelligenceEngine(db)
    
    # Retinol + Vitamin C = Conflict
    conflicts = engine.check_conflicts(["Retinol", "Vitamin C", "Water"])
    assert len(conflicts) > 0
    
    # Niacinamide + Vitamin C = Safe (modern formulations) or minor warning
    # Retinol + Salicylic Acid = Severe Conflict
    conflicts2 = engine.check_conflicts(["Retinol", "Salicylic Acid"])
    assert len(conflicts2) > 0
