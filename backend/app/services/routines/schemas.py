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
    # Real persisted state from Mongo routine_logs (M2) — today's completion, not
    # client-side-only state that resets on reload.
    completed_today: bool


class StepCompletionUpdate(BaseModel):
    completed: bool


class StepReorderUpdate(BaseModel):
    # The full ordered set of step_ids for one routine — service.py verifies this is
    # exactly the routine's existing step-id set (no silent drop/add) before applying.
    step_ids: list[int]


class StepCreate(BaseModel):
    step_name: str
    product_id: int


class StepUpdate(BaseModel):
    # All optional — a partial update (PATCH), not a full replace.
    step_name: str | None = None
    product_id: int | None = None
    usage_notes: str | None = None


class RoutineRead(BaseModel):
    routine_id: int
    routine_name: str | None
    routine_type: str | None
    description: str | None
    steps: list[RoutineStepRead]
