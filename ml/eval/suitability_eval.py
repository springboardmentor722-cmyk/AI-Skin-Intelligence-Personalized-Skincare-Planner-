"""Pure scoring logic for the IngredientSuitability model card (docs/AI_ML.md's
"precision@flag; zero missed allergy conflicts (hard req)"). Takes a list of
already-built cases and runs the real `RealIngredientSuitability` rule against
them — no I/O here, so this half is unit-testable on a tiny fixture set with no
database (M3-H's own testing requirement) while `run.py` owns building the golden
set from the real, live seeded catalog.
"""

from dataclasses import dataclass

from app.ai.suitability import RealIngredientSuitability


@dataclass(frozen=True)
class SuitabilityCase:
    """One golden-set row. `expected_allergy_flag` is never a human label here —
    it's the rule's own documented contract (an ingredient named exactly in the
    profile's `allergies` free text must always flag, app/ai/suitability.py) made
    explicit per case, not invented per case."""

    ingredient_name: str
    inci_name: str | None
    skin_type_name: str | None
    allergies: str | None
    sensitivities: str | None
    avoid_reason: str | None
    expected_allergy_flag: bool


@dataclass(frozen=True)
class SuitabilityEvalReport:
    total_cases: int
    allergy_cases: int
    missed_allergies: int
    flagged_count: int
    true_positive_count: int
    precision_at_flag: float | None
    zero_missed_allergy: bool


def run_suitability_eval(cases: list[SuitabilityCase]) -> SuitabilityEvalReport:
    analyzer = RealIngredientSuitability()

    allergy_cases = [c for c in cases if c.expected_allergy_flag]
    missed_allergies = 0
    flagged_count = 0
    true_positive_count = 0

    for case in cases:
        result = analyzer.evaluate(
            ingredient_name=case.ingredient_name,
            inci_name=case.inci_name,
            skin_type_name=case.skin_type_name,
            allergies=case.allergies,
            sensitivities=case.sensitivities,
            avoid_reason=case.avoid_reason,
        )
        if result.allergy_flag:
            flagged_count += 1
            if case.expected_allergy_flag:
                true_positive_count += 1
        elif case.expected_allergy_flag:
            missed_allergies += 1

    return SuitabilityEvalReport(
        total_cases=len(cases),
        allergy_cases=len(allergy_cases),
        missed_allergies=missed_allergies,
        flagged_count=flagged_count,
        true_positive_count=true_positive_count,
        precision_at_flag=(true_positive_count / flagged_count) if flagged_count else None,
        zero_missed_allergy=missed_allergies == 0,
    )
