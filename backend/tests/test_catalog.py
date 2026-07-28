"""Milestone 3, Parts 1-3 — product catalogue, ingredient KB & search tests."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.product_catalog import PRODUCT_CATALOG
from app.ingredient_kb import INGREDIENT_KB


def test_catalogue_has_broad_brand_coverage():
    brands = {row[1] for row in PRODUCT_CATALOG}
    # Spec-named reputable brands that must be represented
    for brand in ["CeraVe", "The Ordinary", "La Roche-Posay", "COSRX",
                  "The Inkey List", "Simple", "Vanicream", "Anua",
                  "Isntree", "Round Lab", "Axis-Y", "Skin1004"]:
        assert brand in brands, f"missing reputable brand: {brand}"
    assert len(brands) >= 30, f"expected 30+ brands, got {len(brands)}"


def test_every_product_key_ingredient_exists_in_kb():
    kb = {row[0] for row in INGREDIENT_KB}
    for name, brand, *rest in PRODUCT_CATALOG:
        key_ings = rest[4]  # index of key_ingredients in the tuple
        for ing in key_ings:
            assert ing in kb, f"{brand} {name}: '{ing}' not in ingredient KB"


def test_product_tuples_are_well_formed():
    for row in PRODUCT_CATALOG:
        assert len(row) == 13, f"malformed product tuple: {row[0]}"
        name, brand, category, price, tier = row[:5]
        assert name and brand and category
        assert isinstance(price, (int, float)) and price > 0
        assert tier in ("budget", "premium")
        assert row[7] in ("AM", "PM", "both"), f"{name}: bad usage_time {row[7]}"
        rating = row[11]
        assert rating is None or (0 <= rating <= 5), f"{name}: bad rating"


def test_ingredient_kb_is_complete():
    for row in INGREDIENT_KB:
        assert len(row) == 9, f"malformed ingredient tuple: {row[0]}"
        name, category, description, benefits, side_effects, \
            skin_types, concerns, comedogenic, refs = row
        assert name and category and description
        assert 0 <= comedogenic <= 5, f"{name}: comedogenic out of range"


def test_no_duplicate_products():
    seen = {(r[0].lower(), r[1].lower()) for r in PRODUCT_CATALOG}
    assert len(seen) == len(PRODUCT_CATALOG), "duplicate (name, brand) in catalogue"


def test_no_duplicate_ingredients():
    names = [r[0].lower() for r in INGREDIENT_KB]
    assert len(set(names)) == len(names), "duplicate ingredient in KB"
