import datetime

from pydantic import BaseModel, ConfigDict


class IngredientRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    ingredient_id: int
    ingredient_name: str
    inci_name: str | None
    category: str | None
    is_active: bool | None
    created_at: datetime.datetime | None
