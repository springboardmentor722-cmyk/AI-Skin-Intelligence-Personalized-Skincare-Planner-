from pydantic import BaseModel, ConfigDict


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    brand_name: str | None
    product_name: str | None
    category: str | None
    image_url: str | None
    price: float | None
    currency: str | None
    spf_rating: int | None


class RecommendationRead(BaseModel):
    product: ProductRead
    match_score: float
    reasons: list[str]
