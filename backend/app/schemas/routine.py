from pydantic import BaseModel
from typing import List

class ProductRecommendation(BaseModel):
    name: str
    description: str
    product_type: str

class RoutineStep(BaseModel):
    step_number: int
    product: ProductRecommendation
    instructions: str

class Routine(BaseModel):
    morning_routine: List[RoutineStep]
    evening_routine: List[RoutineStep]
