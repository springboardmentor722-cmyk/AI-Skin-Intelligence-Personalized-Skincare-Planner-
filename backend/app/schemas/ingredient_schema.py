from typing import Optional

from pydantic import BaseModel, Field

class IngredientCreate(BaseModel):
    ingredient_name: str = Field(min_length=1, max_length=100)
    benefits: Optional[str] = None
    side_effects: Optional[str] = None
    suitable_skin: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    suitable_for: Optional[str] = None
    source_url: Optional[str] = None


class IngredientUpdate(IngredientCreate):
    pass
