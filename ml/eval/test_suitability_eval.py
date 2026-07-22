"""M3-H's own testing requirement: "eval-runner unit test on a tiny fixture
set." Run via `make eval`'s sibling wiring in the root Makefile's `test` target
(backend venv + PYTHONPATH=../ml, same as `make eval` itself) — no real
database needed, since `run_suitability_eval` is pure scoring logic over
already-built cases (run.py owns building the golden set from the live DB)."""

from eval.suitability_eval import SuitabilityCase, run_suitability_eval


def test_a_clean_profile_never_flags_an_allergy() -> None:
    cases = [
        SuitabilityCase(
            ingredient_name="Niacinamide",
            inci_name=None,
            skin_type_name=None,
            allergies=None,
            sensitivities=None,
            avoid_reason=None,
            expected_allergy_flag=False,
        )
    ]
    report = run_suitability_eval(cases)
    assert report.missed_allergies == 0
    assert report.zero_missed_allergy is True
    assert report.flagged_count == 0


def test_an_exact_allergy_match_is_always_caught() -> None:
    cases = [
        SuitabilityCase(
            ingredient_name="Retinol",
            inci_name=None,
            skin_type_name=None,
            allergies="Retinol",
            sensitivities=None,
            avoid_reason=None,
            expected_allergy_flag=True,
        )
    ]
    report = run_suitability_eval(cases)
    assert report.missed_allergies == 0
    assert report.zero_missed_allergy is True
    assert report.flagged_count == 1
    assert report.true_positive_count == 1
    assert report.precision_at_flag == 1.0


def test_precision_at_flag_reflects_a_real_substring_false_positive() -> None:
    """"Retin" is a substring of "Retinol" — app/ai/suitability.py's own documented
    substring-match rule deliberately over-flags here (conservative by design,
    never under-flags) — a real, honest false positive for precision@flag to
    surface, not hidden."""
    cases = [
        SuitabilityCase(
            ingredient_name="Retinol",
            inci_name=None,
            skin_type_name=None,
            allergies="Retin",
            sensitivities=None,
            avoid_reason=None,
            expected_allergy_flag=False,
        ),
        SuitabilityCase(
            ingredient_name="Niacinamide",
            inci_name=None,
            skin_type_name=None,
            allergies="Niacinamide",
            sensitivities=None,
            avoid_reason=None,
            expected_allergy_flag=True,
        ),
    ]
    report = run_suitability_eval(cases)
    assert report.zero_missed_allergy is True  # the hard requirement still holds
    assert report.flagged_count == 2
    assert report.true_positive_count == 1
    assert report.precision_at_flag == 0.5


def test_report_handles_an_empty_case_list() -> None:
    report = run_suitability_eval([])
    assert report.total_cases == 0
    assert report.precision_at_flag is None
    assert report.zero_missed_allergy is True
