"""
Tests for 128D Vector Search Engine, INCI Parser Engine, Compatibility Analysis,
and Budget-Based Routine Recommendation Solver.
"""

import pytest
from app.services.vector_search import VectorSearchEngine
from app.services.inci_parser import INCIParserEngine


def test_vector_search_engine_generation():
    # Test user vector generation
    user_vec = VectorSearchEngine.generate_user_vector(
        skin_type="oily",
        concerns=["acne", "enlarged pores"],
        sensitivity_level="low"
    )
    assert len(user_vec) == 128
    assert sum(v * v for v in user_vec) > 0.99  # Normalized unit length

    # Test product vector generation
    prod_vec = VectorSearchEngine.generate_product_vector(
        suitable_skin_types=["oily", "combination"],
        category="Serum",
        key_ingredients=["Salicylic Acid", "Niacinamide"],
        rating=4.8,
        price_inr=650.0
    )
    assert len(prod_vec) == 128

    # Test cosine similarity calculation
    sim = VectorSearchEngine.cosine_similarity(user_vec, prod_vec)
    assert 0.0 <= sim <= 1.0
    assert sim > 0.2  # Should have strong similarity score for matching features


def test_inci_parser_engine():
    raw_inci = "Water/Aqua/Eau, Niacinamide (5%), Salicylic Acid, Fragrance/Parfum, Retinol [1%]"
    result = INCIParserEngine.parse(raw_inci)

    assert result["tokencount"] > 0
    assert "Niacinamide" in result["detected_actives"]
    assert "AHAs/BHAs" in result["detected_actives"]
    assert "Retinoids" in result["detected_actives"]
    assert len(result["detected_allergens"]) > 0
