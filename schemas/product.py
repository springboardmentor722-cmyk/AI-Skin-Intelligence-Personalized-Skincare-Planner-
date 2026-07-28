"""Pydantic schemas for the product catalog, recommendations, and orders."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ProductResponse(BaseModel):
    id: uuid.UUID
    name: str
    brand: str
    category: str
    description: Optional[str] = None
    price: float
    currency: str
    rating: float
    review_count: int
    is_recommended_for_you: bool = False  # set only on the user-facing catalog endpoint

    class Config:
        from_attributes = True


class ProductRecommendationCreate(BaseModel):
    client_id: uuid.UUID
    product_id: uuid.UUID
    note: Optional[str] = Field(None, max_length=300)


class ProductRecommendationResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    product_id: uuid.UUID
    note: Optional[str] = None
    product: ProductResponse
    created_at: datetime

    class Config:
        from_attributes = True


class OrderItemInput(BaseModel):
    product_id: uuid.UUID
    quantity: int = Field(1, ge=1, le=20)


class OrderCreateRequest(BaseModel):
    items: list[OrderItemInput] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    product_id: uuid.UUID
    product_name: str
    quantity: int
    unit_price: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: uuid.UUID
    total_amount: float
    currency: str
    status: str
    items: list[OrderItemResponse]
    created_at: datetime

    class Config:
        from_attributes = True
