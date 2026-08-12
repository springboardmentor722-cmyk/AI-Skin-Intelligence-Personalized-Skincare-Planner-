from sqlalchemy import Column, Integer, String, Float, JSON

from services.auth_service.app.db.database import Base


class Product(Base):
    """
    Seed-data catalog for now (Milestone 3 replaces this with real scraped
    product data per the Milestone 2 doc). Kept intentionally simple:
    one row per product, JSON columns for the multi-value match fields
    so we don't need join tables yet.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    brand = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)  # matches step_category on routines
    price_usd = Column(Float, nullable=False)
    rating = Column(Float, nullable=False)  # 0-5

    # Matching fields
    skin_types = Column(JSON, nullable=False)       # e.g. ["Oily", "Combination"] or ["All"]
    target_concerns = Column(JSON, nullable=False)  # e.g. ["Acne", "Oiliness"]
    key_ingredients = Column(JSON, nullable=False)  # e.g. ["Salicylic Acid", "Niacinamide"]
    avoid_for_allergies = Column(JSON, nullable=False)  # e.g. ["Fragrance"]

    description = Column(String(300), nullable=True)
