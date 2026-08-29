from pydantic import BaseModel


class RoutineStepOut(BaseModel):
    id: int
    time_of_day: str
    step_number: int
    step_category: str
    step_name: str
    is_active: bool
    completed_today: bool = False

    class Config:
        from_attributes = True


class RoutineLogToggle(BaseModel):
    routine_step_id: int
    completed: bool
