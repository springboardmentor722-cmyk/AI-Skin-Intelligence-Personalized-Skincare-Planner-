"""Milestone 2 unit tests — spec Step 6.1.

Two mandates from the specification:
  Test 1  Ideal inputs must return EXACTLY 100.0
  Test 2  Sensitive-skin profiles must never receive harsh chemical steps

Run from the backend/ folder:   pytest -v
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.services import assessment_engine, routine_engine, scoring_engine  # noqa: E402
from app.services.routine_engine import HARSH_CATEGORIES  # noqa: E402


# ===========================================================================
# TEST 1 — Math & Score Precision
# ===========================================================================
class TestScorePrecision:

    def test_perfect_inputs_return_exactly_100(self):
        """The headline requirement: ideal metrics == 100.0, to the decimal."""
        score = scoring_engine.calculate_skin_health_score(
            condition_score=100.0,
            lifestyle_score=100.0,
            sleep_score=100.0,
            consistency_score=100.0,
            hydration_score=100.0,
        )
        assert score == 100.0

    def test_perfect_end_to_end_breakdown_is_100(self):
        """Same, but driven through the real engine from raw user data."""
        result = scoring_engine.score_breakdown(
            concerns=[],                 # zero skin concerns
            sleep_hours=8.0,             # exactly the 8h target
            water_intake_l=2.5,          # exactly the 2.5L target
            completed_steps=14,          # every step ticked...
            expected_steps=14,           # ...out of every step expected
            environment_exposure="low",
            uses_sunscreen=True,
            exercise_minutes=45,
            stress_level=2,
            smokes=False,
        )
        assert result["overall_score"] == 100.0
        assert result["band"] == "Excellent"

    def test_weights_sum_to_one(self):
        """A weighting bug here would silently distort every score in the system."""
        total = (scoring_engine.W_CONDITION + scoring_engine.W_LIFESTYLE
                 + scoring_engine.W_SLEEP + scoring_engine.W_CONSISTENCY
                 + scoring_engine.W_HYDRATION)
        assert abs(total - 1.0) < 1e-9

    def test_zero_inputs_return_zero(self):
        assert scoring_engine.calculate_skin_health_score(0, 0, 0, 0, 0) == 0.0

    def test_high_severity_concern_deducts_15(self):
        assert scoring_engine.calculate_condition_score(
            [{"name": "Acne", "severity": "high"}]) == 85.0

    def test_medium_severity_concern_deducts_7(self):
        assert scoring_engine.calculate_condition_score(
            [{"name": "Oiliness", "severity": "medium"}]) == 93.0

    def test_multiple_concerns_stack(self):
        # 100 - 15 (high) - 7 (medium) = 78
        assert scoring_engine.calculate_condition_score([
            {"name": "Acne", "severity": "high"},
            {"name": "Dry Skin", "severity": "medium"},
        ]) == 78.0

    def test_condition_score_never_goes_negative(self):
        concerns = [{"name": f"C{i}", "severity": "high"} for i in range(20)]
        assert scoring_engine.calculate_condition_score(concerns) == 0.0

    def test_sleep_score_formula(self):
        assert scoring_engine.calculate_sleep_score(8.0) == 100.0
        assert scoring_engine.calculate_sleep_score(4.0) == 50.0
        assert scoring_engine.calculate_sleep_score(10.0) == 100.0   # capped
        assert scoring_engine.calculate_sleep_score(None) == 0.0

    def test_hydration_score_formula(self):
        assert scoring_engine.calculate_hydration_score(2.5) == 100.0
        assert scoring_engine.calculate_hydration_score(1.25) == 50.0
        assert scoring_engine.calculate_hydration_score(5.0) == 100.0  # capped

    def test_consistency_score_formula(self):
        assert scoring_engine.calculate_consistency_score(7, 14) == 50.0
        assert scoring_engine.calculate_consistency_score(14, 14) == 100.0
        assert scoring_engine.calculate_consistency_score(0, 0) == 0.0   # no divide-by-zero

    def test_unprotected_uv_exposure_is_penalised(self):
        protected = scoring_engine.calculate_lifestyle_score(
            environment_exposure="high", uses_sunscreen=True)
        unprotected = scoring_engine.calculate_lifestyle_score(
            environment_exposure="high", uses_sunscreen=False)
        assert unprotected < protected, "Skipping SPF under high UV must cost more"

    def test_weighted_contribution_is_exact(self):
        """A 50 in every pillar must produce exactly 50."""
        assert scoring_engine.calculate_skin_health_score(50, 50, 50, 50, 50) == 50.0


# ===========================================================================
# TEST 2 — Routine Safety Boundaries
# ===========================================================================
class TestRoutineSafety:

    SENSITIVE_PROFILE = {
        "skin_type": "sensitive",
        "concerns": "severe redness, constant irritation, active flare-ups",
        "sensitivities": "reacts badly to acids and retinoids",
    }

    def _all_categories(self, plan: dict) -> list[str]:
        return [s["step_category"] for steps in plan.values() for s in steps]

    def test_sensitive_skin_excludes_every_harsh_category(self):
        """The core safety mandate: no acids, no retinoids, no scrubs. Ever."""
        concerns = assessment_engine.identify_skin_concerns(self.SENSITIVE_PROFILE)
        plan = routine_engine.generate_routine(
            skin_type="sensitive",
            concerns=concerns,
            sensitivities=self.SENSITIVE_PROFILE["sensitivities"],
            db=None,
        )
        categories = self._all_categories(plan)
        for harsh in HARSH_CATEGORIES:
            assert harsh not in categories, f"UNSAFE: '{harsh}' reached sensitive skin"

    def test_severe_acne_on_sensitive_skin_still_excludes_acids(self):
        """The hard case: acne normally *wants* a BHA — but sensitivity overrides it."""
        profile = {
            "skin_type": "sensitive",
            "concerns": "severe cystic acne flare-up",
            "sensitivities": "severe skin sensitivity, barrier damage",
        }
        concerns = assessment_engine.identify_skin_concerns(profile)
        plan = routine_engine.generate_routine(
            skin_type="sensitive", concerns=concerns,
            sensitivities=profile["sensitivities"], db=None)
        categories = self._all_categories(plan)

        assert "Chemical Exfoliation" not in categories
        assert "Physical Exfoliation" not in categories
        assert "Retinoid Treatment" not in categories
        assert "Strong Acid Treatment" not in categories

    def test_harsh_steps_are_replaced_not_merely_deleted(self):
        """A routine with a hole is worse than one with a gentle substitute."""
        harsh_plan = ["Cleansing", "Chemical Exfoliation", "Retinoid Treatment", "Moisturizing"]
        safe = routine_engine.apply_safety_rules(harsh_plan)

        assert "Chemical Exfoliation" not in safe
        assert "Retinoid Treatment" not in safe
        assert "Hydrating Treatment" in safe      # the substitute for the acid
        assert "Barrier Repair" in safe           # the substitute for the retinoid
        assert len(safe) >= len(harsh_plan) - 1, "Steps were dropped without replacement"

    def test_non_sensitive_skin_still_receives_actives(self):
        """The safety net must not fire for everyone — that would gut the product."""
        concerns = assessment_engine.identify_skin_concerns({
            "skin_type": "oily", "concerns": "active acne breakouts"})
        plan = routine_engine.generate_routine(
            skin_type="oily", concerns=concerns, sensitivities=None, db=None)
        categories = self._all_categories(plan)
        assert "Chemical Exfoliation" in categories, \
            "Oily, non-sensitive skin should still get exfoliation"

    def test_sensitivity_detected_from_declared_sensitivities_alone(self):
        """Even with skin_type='normal', a declared sensitivity must trigger safety."""
        assert routine_engine.is_sensitive(
            skin_type="normal", concerns=[],
            sensitivities="reacts to fragrance and alcohol") is True

    def test_high_severity_redness_triggers_safety(self):
        assert routine_engine.is_sensitive(
            skin_type="combination",
            concerns=[{"name": "Redness", "severity": "high"}],
            sensitivities=None) is True

    def test_every_phase_is_generated(self):
        plan = routine_engine.generate_routine("normal", [], None, db=None)
        for phase in ("AM", "PM", "Weekly", "Seasonal"):
            assert phase in plan and plan[phase], f"{phase} routine was not generated"

    def test_sun_protection_always_present_in_am(self):
        """Non-negotiable in a skincare product: SPF must survive every code path."""
        for skin_type in ("oily", "dry", "combination", "sensitive", "normal"):
            plan = routine_engine.generate_routine(skin_type, [], None, db=None)
            am = [s["step_category"] for s in plan["AM"]]
            assert "Sun Protection" in am, f"{skin_type}: AM routine is missing SPF"

    def test_steps_are_sequentially_numbered(self):
        plan = routine_engine.generate_routine("oily", [], None, db=None)
        for phase, steps in plan.items():
            numbers = [s["step_number"] for s in steps]
            assert numbers == list(range(1, len(steps) + 1)), f"{phase} numbering is broken"


# ===========================================================================
# Assessment engine
# ===========================================================================
class TestAssessmentEngine:

    def test_active_flare_up_outranks_wrinkles(self):
        """The exact scenario named in the specification."""
        concerns = assessment_engine.identify_skin_concerns({
            "concerns": "active acne flare-up, some wrinkles",
        })
        assert assessment_engine.primary_concern(concerns) == "Acne"

    def test_explicit_severities_win_over_free_text(self):
        concerns = assessment_engine.identify_skin_concerns({
            "concerns": "acne, wrinkles",
            "concern_severities": {"Wrinkles": "high", "Acne": "low"},
        })
        assert assessment_engine.primary_concern(concerns) == "Wrinkles"

    def test_severity_ordering_is_respected(self):
        concerns = assessment_engine.identify_skin_concerns({
            "concern_severities": {"Dry Skin": "low", "Acne": "high", "Oiliness": "medium"},
        })
        assert [c["severity"] for c in concerns] == ["high", "medium", "low"]

    def test_clean_profile_yields_no_concerns(self):
        assert assessment_engine.identify_skin_concerns(
            {"skin_type": "normal", "concerns": ""}) == []

    def test_skin_type_implies_baseline_concern(self):
        names = [c["name"] for c in
                 assessment_engine.identify_skin_concerns({"skin_type": "oily"})]
        assert "Oiliness" in names

    def test_recommendations_are_generated(self):
        concerns = assessment_engine.identify_skin_concerns({"concerns": "severe acne"})
        breakdown = scoring_engine.score_breakdown(
            concerns=concerns, sleep_hours=5.0, water_intake_l=1.0,
            completed_steps=1, expected_steps=14)
        recs = assessment_engine.generate_recommendations(
            concerns, "oily", breakdown, 5.0, 1.0, 7.0)
        assert recs, "No recommendations produced"
        joined = " ".join(recs).lower()
        assert "sleep" in joined and "hydration" in joined
