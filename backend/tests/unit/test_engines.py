import pytest
from app.services.prioritization_engine import ConcernPrioritizationEngine
from app.services.scoring_engine import WeightedSkinScoreEngine
from app.services.screening_engine import SkinScreeningEngine

def test_concern_prioritization():
    """Test deterministic rule-based severity assignment."""
    # Test Rule: Acne + Sensitive Skin = High Priority
    result_sensitive_acne = ConcernPrioritizationEngine.identify_skin_concerns(
        skin_type="Oily",
        primary_concern="Acne",
        secondary_concern="Dryness",
        lifestyle_factors={"stress_level": "Medium"},
        sensitivity="Sensitive"
    )
    assert result_sensitive_acne["severity"] == "High"
    
    # Test Rule: High Stress elevates Acne to High
    result_stressed_acne = ConcernPrioritizationEngine.identify_skin_concerns(
        skin_type="Combination",
        primary_concern="Acne",
        secondary_concern="Redness",
        lifestyle_factors={"stress_level": "High"},
        sensitivity="Resilient"
    )
    assert result_stressed_acne["severity"] == "High"
    
    # Test Normal mapping
    result_normal = ConcernPrioritizationEngine.identify_skin_concerns(
        skin_type="Dry",
        primary_concern="Pigmentation",
        secondary_concern="Wrinkles",
        lifestyle_factors={"stress_level": "Low"},
        sensitivity="Resilient"
    )
    assert result_normal["severity"] == "Medium"
    
def test_skin_scoring_engine():
    """Test exact weights calculation in the scoring engine."""
    
    normalized_data = {
        "base_profile": {"skin_type": "Normal", "sensitivity": "Resilient"},
        "concerns_profile": {"primary": "Acne", "secondary": "None"}, # 100 - 25 = 75
        "lifestyle_factors": {
            "stress_level": "Low", # 100
            "sleep_quality": "Fair", # 60
            "hydration_status": "Hydrated" # 100
        }
    }
    
    # Weights: Skin 35%, Lifestyle 20%, Sleep 15%, Consistency 20%, Hydration 10%
    # Expected: (75 * 0.35) + (100 * 0.20) + (60 * 0.15) + (50 * 0.20) + (100 * 0.10)
    # Expected: 26.25 + 20 + 9 + 10 + 10 = 75.25
    
    result = WeightedSkinScoreEngine.calculate_score(normalized_data, routine_consistency_percentage=50.0)
    
    assert result["individual_scores"]["skin_condition"] == 75
    assert result["overall_score"] == 75.25
    assert result["risk_level"] == "Medium"

def test_screening_normalization():
    """Test standardizing messy inputs into clean dicts."""
    user_profile = {"user_id": "test", "skin_type": "Dry"}
    lifestyle = {"sleep_hours": 3, "water_intake_liters": 1.0}
    concerns = {"primary_concern": "Aging"}
    goals = {}
    
    normalized = SkinScreeningEngine.process_screening(user_profile, lifestyle, concerns, goals)
    
    assert normalized["lifestyle_factors"]["sleep_quality"] == "Poor"
    assert normalized["lifestyle_factors"]["hydration_status"] == "Dehydrated"
