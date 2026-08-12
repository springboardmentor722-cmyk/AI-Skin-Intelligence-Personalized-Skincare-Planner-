from typing import Optional

from pydantic import BaseModel


class ProductCreate(BaseModel):

    product_name: str

    brand: Optional[str] = None

    category: Optional[str] = None

    skin_type: Optional[str] = None

    ingredients: Optional[str] = None

    price: Optional[float] = None

    currency: str = "INR"

    product_url: Optional[str] = None

    image_url: Optional[str] = None