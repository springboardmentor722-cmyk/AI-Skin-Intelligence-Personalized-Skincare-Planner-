"""
Milestone 3, Step 5.1 — Automated backend testing for the Ingredient
Intelligence Engine: chemical clash detection and allergy filtering.

These tests hit a real (test) database session via conftest-less direct
construction, matching the lightweight style of the Milestone 2 tests —
no Postgres server required for the pure-logic pieces; the DB-backed
pieces are covered by the end-to-end scripts run during development.
"""

from services.ingredient_service import compute_safety_score


class _FakeIngredient:
    def __init__(self, name, category, aliases):
        self.name = name
        self.category = category
        self.aliases = aliases


class _FakeConflict:
    def __init__(self, category_a, category_b, severity, reason):
        self.category_a = category_a
        self.category_b = category_b
        self.severity = severity
        self.reason = reason


class _FakeQuery:
    """Minimal stand-in for a SQLAlchemy Query supporting .filter().all()/.first()."""

    def __init__(self, rows):
        self._rows = rows

    def filter(self, *args, **kwargs):
        return self

    def all(self):
        return self._rows

    def first(self):
        return self._rows[0] if self._rows else None


class _FakeDB:
    """Stands in for the pieces of Session that compute_safety_score touches."""

    def __init__(self, ingredients, conflicts):
        self._ingredients = ingredients
        self._conflicts = conflicts

    def query(self, model):
        name = getattr(model, "__name__", "")
        if name == "Ingredient":
            return _FakeQuery(self._ingredients)
        if name == "IngredientConflict":
            return _FakeQuery(self._conflicts)
        return _FakeQuery([])


INGREDIENTS = [
    _FakeIngredient("Retinoid", "Retinoid", ["Retinol", "Tretinoin"]),
    _FakeIngredient("AHA/BHA", "AHA/BHA", ["Salicylic Acid", "Glycolic Acid"]),
    _FakeIngredient("Ceramide", "Ceramide", ["Ceramides"]),
    _FakeIngredient("Hyaluronic Acid", "Hyaluronic Acid", ["Sodium Hyaluronate"]),
]

CONFLICTS = [
    _FakeConflict("Retinoid", "AHA/BHA", "Unsafe", "Increases irritation and barrier damage risk."),
]


def test_unsafe_pairing_triggers_unsafe_status():
    """Goal: chemical clash detection triggers on an unsafe pairing (Retinoid + AHA/BHA)."""
    db = _FakeDB(INGREDIENTS, CONFLICTS)
    result = compute_safety_score(db, ["Retinoid", "AHA/BHA"], allergy_text=None)

    assert result["status"] == "Unsafe"
    assert len(result["conflict_warnings"]) == 1
    assert result["conflict_warnings"][0]["severity"] == "Unsafe"


def test_safe_pairing_scores_100():
    """A pairing with no known conflicts and no allergy match should score a clean 100/Safe."""
    db = _FakeDB(INGREDIENTS, CONFLICTS)
    result = compute_safety_score(db, ["Ceramide", "Hyaluronic Acid"], allergy_text=None)

    assert result["status"] == "Safe"
    assert result["safety_score"] == 100
    assert result["conflict_warnings"] == []


def test_allergy_match_forces_unsafe_even_without_conflict():
    """Goal: allergy filters flag unsafe products even when there's no chemical clash."""
    db = _FakeDB(INGREDIENTS, [])  # no conflict rules at all
    result = compute_safety_score(db, ["AHA/BHA"], allergy_text="I'm allergic to salicylic acid")

    assert result["status"] == "Unsafe"
    assert len(result["allergy_alerts"]) == 1
    assert result["allergy_alerts"][0]["category"] == "AHA/BHA"


def test_no_allergy_no_conflict_is_safe():
    db = _FakeDB(INGREDIENTS, [])
    result = compute_safety_score(db, ["Ceramide"], allergy_text="peanuts, shellfish")

    assert result["status"] == "Safe"
    assert result["allergy_alerts"] == []
