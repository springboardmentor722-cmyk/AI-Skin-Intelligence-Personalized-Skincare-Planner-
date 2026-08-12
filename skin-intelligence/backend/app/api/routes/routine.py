from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.models.user import User
from app.ml.inference import SkinAnalysisResult
from app.services.routine_engine import generate_routine
from app.services.product_recommender import recommend_products_for_step
from app.services.skin_score import (
    compute_skin_health_score, SkinConditionInput, LifestyleInput, SleepInput, RoutineInput,
)

router = APIRouter(prefix="/routine", tags=["Routine & Score"])


class RoutineRequest(BaseModel):
    analysis: dict          # SkinAnalysisResult fields
    sensitive_skin: bool = False
    season: str = "summer"
    budget_tier: str = "mid"


@router.post("/generate")
async def generate_personalized_routine(payload: RoutineRequest, current_user: User = Depends(get_current_user)):
    analysis = SkinAnalysisResult(**payload.analysis)
    routine = generate_routine(analysis, sensitive_skin=payload.sensitive_skin, season=payload.season)

    enriched = {}
    for phase_name, steps in [("morning", routine.morning), ("evening", routine.evening), ("weekly", routine.weekly)]:
        enriched[phase_name] = []
        for step in steps:
            products = await recommend_products_for_step(
                step, analysis.skin_type, payload.sensitive_skin, payload.budget_tier
            )
            enriched[phase_name].append({**step.__dict__, "recommended_products": products})

    return {**enriched, "seasonal_notes": routine.seasonal_notes}


class ScoreRequest(BaseModel):
    skin_condition: dict
    lifestyle: dict
    sleep: dict
    routine: dict
    skin_hydration_from_ml: float


@router.post("/score")
async def calculate_skin_health_score(payload: ScoreRequest, current_user: User = Depends(get_current_user)):
    result = compute_skin_health_score(
        skin_condition=SkinConditionInput(**payload.skin_condition),
        lifestyle=LifestyleInput(**payload.lifestyle),
        sleep=SleepInput(**payload.sleep),
        routine=RoutineInput(**payload.routine),
        skin_hydration_from_ml=payload.skin_hydration_from_ml,
    )
    return result.__dict__
