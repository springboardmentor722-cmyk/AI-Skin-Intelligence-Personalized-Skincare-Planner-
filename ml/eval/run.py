"""`make eval` — docs/AI_ML.md's "Evaluation harness". Golden sets are built from
the real, live seeded catalog (never a fabricated fixture presented as real,
AGENTS.md §0.2): `Ingredient` rows for the suitability golden set, real
`recommendation_feedback` documents for the recommender section — honestly
reporting "no label data" when that collection is still empty rather than
inventing labels to fill it.

Run via `make eval` (backend/../Makefile), which executes this under the
backend venv (all the real deps — SQLAlchemy, Motor — already live there; `ml/`
deliberately has no second virtualenv to maintain) with `ml/` added to
PYTHONPATH so this stays a top-level `ml/eval/` module per the documented tree
(docs/ARCHITECTURE.md §12), not nested inside `backend/app/`.
"""

import asyncio
import datetime
import json
from pathlib import Path
from typing import Any

from sqlalchemy import select

from app.db.mongo import get_mongo_db
from app.db.postgres import async_session_factory
from app.services.ingredients.models import Ingredient
from eval.suitability_eval import SuitabilityCase, run_suitability_eval

_REPORT_DIR = Path(__file__).resolve().parent / "reports"
_GOLDEN_SET_SIZE = 25  # real ingredients sampled from the live catalog, not fabricated


async def _build_suitability_golden_set(db: Any) -> list[SuitabilityCase]:
    """Two cases per real ingredient: an exact self-allergy match (must always
    flag — the zero-missed-allergy hard requirement) and a clean profile with no
    recorded allergy (must never flag). Real ingredient names only; every
    "expected" value is the rule's own documented contract, not a guess."""
    ingredients = (
        await db.execute(
            select(Ingredient).order_by(Ingredient.ingredient_id).limit(_GOLDEN_SET_SIZE)
        )
    ).scalars().all()

    cases: list[SuitabilityCase] = []
    for ingredient in ingredients:
        cases.append(
            SuitabilityCase(
                ingredient_name=ingredient.ingredient_name,
                inci_name=ingredient.inci_name,
                skin_type_name=None,
                allergies=ingredient.ingredient_name,
                sensitivities=None,
                avoid_reason=None,
                expected_allergy_flag=True,
            )
        )
        cases.append(
            SuitabilityCase(
                ingredient_name=ingredient.ingredient_name,
                inci_name=ingredient.inci_name,
                skin_type_name=None,
                allergies=None,
                sensitivities=None,
                avoid_reason=None,
                expected_allergy_flag=False,
            )
        )
    return cases


async def _run_recommender_section(mongo: Any) -> dict[str, Any]:
    """docs/AI_ML.md model card: NDCG@10/precision@5 need real interaction labels
    (`recommendation_feedback`, M3-D's first writer). Reports the honest absence
    rather than a number computed from nothing (milestone_3.md §M3-H's own
    escape hatch; AGENTS.md §0.2)."""
    total_feedback = await mongo["recommendation_feedback"].count_documents({})
    if total_feedback == 0:
        return {
            "status": "no_label_data",
            "total_feedback_events": 0,
            "note": (
                "recommendation_feedback is empty — NDCG@10/precision@5 require "
                "real usage history and are never computed from fabricated labels."
            ),
        }
    return {
        "status": "labels_available",
        "total_feedback_events": total_feedback,
        "note": "Real feedback exists but NDCG@10/precision@5 scoring isn't wired yet.",
    }


async def main() -> None:
    async with async_session_factory() as db:
        cases = await _build_suitability_golden_set(db)
    suitability_report = run_suitability_eval(cases)

    recommender_report = await _run_recommender_section(get_mongo_db())

    _REPORT_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now(datetime.UTC).strftime("%Y%m%dT%H%M%SZ")
    report = {
        "generated_at": timestamp,
        "suitability": {
            "total_cases": suitability_report.total_cases,
            "allergy_cases": suitability_report.allergy_cases,
            "missed_allergies": suitability_report.missed_allergies,
            "flagged_count": suitability_report.flagged_count,
            "true_positive_count": suitability_report.true_positive_count,
            "precision_at_flag": suitability_report.precision_at_flag,
            "zero_missed_allergy": suitability_report.zero_missed_allergy,
        },
        "recommender": recommender_report,
    }
    report_path = _REPORT_DIR / f"eval_{timestamp}.json"
    report_path.write_text(json.dumps(report, indent=2))

    print(f"Eval report written to {report_path}")
    print(
        f"Suitability: {suitability_report.total_cases} cases, "
        f"zero_missed_allergy={suitability_report.zero_missed_allergy}, "
        f"precision@flag={suitability_report.precision_at_flag}"
    )
    print(f"Recommender: {recommender_report['status']}")

    if not suitability_report.zero_missed_allergy:
        raise SystemExit(
            "FAIL: a real ingredient was not flagged for an exact-name allergy match "
            "— this is a release-blocking regression (milestone_3.md §8), not a metric."
        )


if __name__ == "__main__":
    asyncio.run(main())
