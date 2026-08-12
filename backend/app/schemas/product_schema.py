from typing import Optional

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):

    product_name: str = Field(min_length=1, max_length=200)

    brand: Optional[str] = None

    category: Optional[str] = None

    skin_type: Optional[str] = None

    ingredients: Optional[str] = None

    price: Optional[float] = None

    currency: str = "INR"

    product_url: Optional[str] = None

    image_url: Optional[str] = None


class ProductUpdate(ProductCreate):
    pass
