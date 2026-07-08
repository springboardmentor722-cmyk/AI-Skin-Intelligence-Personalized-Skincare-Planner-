from pydantic import BaseModel

from app.services.recommendations.schemas import ProductRead


class RoutineProductRead(BaseModel):
    product: ProductRead
    usage_notes: str | None


class RoutineStepRead(BaseModel):
    step_id: int
    step_order: int | None
    step_name: str | None
    instruction: str | None
    duration_minutes: int | None
    products: list[RoutineProductRead]


class RoutineRead(BaseModel):
    routine_id: int
    routine_name: str | None
    routine_type: str | None
    description: str | None
    steps: list[RoutineStepRead]
