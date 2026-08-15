"""
Milestone 3, Step 5.1 — Automated backend testing for the Product
Recommendation Engine: allergy hard-filtering and suitability scoring.
"""

from unittest.mock import patch

from services import recommendation_service


class _FakeIngredient:
    def __init__(self, category):
        self.category = category


class _FakeProduct:
    def __init__(self, id, category, price, rating, concern_tags, skin_type_tags, ingredients):
        self.id = id
        self.category = category
        self.price = price
        self.rating = rating
        self.concern_tags = concern_tags
        self.skin_type_tags = skin_type_tags
        self.ingredients = ingredients
        self.name = f"Product {id}"
        self.brand = "TestBrand"
        self.currency = "INR"


def test_hard_filter_excludes_allergen_products():
    """Goal: allergy filters remove unsafe products from the recommendation pool entirely."""
    safe_product = _FakeProduct(
        "p1", "Serum", 500, 4.5, ["Acne"], ["Oily"], ingredients=[_FakeIngredient("Niacinamide")]
    )
    allergen_product = _FakeProduct(
        "p2", "Serum", 400, 4.8, ["Acne"], ["Oily"], ingredients=[_FakeIngredient("AHA/BHA")]
    )

    with patch("services.recommendation_service.ingredient_service") as mock_ingredient_service:
        # Simulate: user is allergic to something matching AHA/BHA, nothing matches Niacinamide.
        def fake_match(db, allergy_text, categories):
            return [{"category": "AHA/BHA"}] if "AHA/BHA" in categories else []

        mock_ingredient_service.match_allergens.side_effect = fake_match

        class _FakeDBQuery:
            def filter(self, *a, **k):
                return self

            def all(self):
                return [safe_product, allergen_product]

        class _FakeDB:
            def query(self, model):
                return _FakeDBQuery()

        result = recommendation_service.get_recommendations(
            _FakeDB(), user_concerns=["Acne"], skin_type="Oily", allergy_text="salicylic acid"
        )

    all_ids = {item["id"] for items in result["categories"].values() for item in items}
    assert "p2" not in all_ids  # excluded — contains the user's allergen
    assert "p1" in all_ids
    assert result["excluded_count"] == 1


def test_suitability_score_weights_concern_and_skin_type():
    """A product matching both concern and skin type should outscore one matching only rating."""
    perfect_match = recommendation_service._score_product(
        _FakeProduct("p1", "Serum", 500, 4.0, ["Acne"], ["Oily"], []),
        user_concerns={"Acne"},
        skin_type="Oily",
    )
    rating_only = recommendation_service._score_product(
        _FakeProduct("p2", "Serum", 500, 5.0, ["Wrinkles"], ["Dry"], []),
        user_concerns={"Acne"},
        skin_type="Oily",
    )

    assert perfect_match["match_percentage"] > rating_only["match_percentage"]
