from typing import Optional

from pydantic import BaseModel

class IngredientCreate(BaseModel):
    ingredient_name: str
    benefits: Optional[str] = None
    side_effects: Optional[str] = None
    suitable_skin: Optional[str] = None
    short_description: Optional[str] = None
    description: Optional[str] = None
    suitable_for: Optional[str] = None
    source_url: Optional[str] = None
