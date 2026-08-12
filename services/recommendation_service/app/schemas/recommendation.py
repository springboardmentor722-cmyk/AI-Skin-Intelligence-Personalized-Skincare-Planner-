from pydantic import BaseModel
from typing import List


class RecommendedProduct(BaseModel):
    id: int
    name: str
    brand: str
    category: str
    price_usd: float
    rating: float
    key_ingredients: List[str]
    matched_concerns: List[str]  # subset of target_concerns that matched the user
    description: str | None = None

    class Config:
        from_attributes = True
