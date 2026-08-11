from sqlalchemy import Column, Integer, String, Text, DECIMAL
from app.database.database import Base

class Product(Base):
    __tablename__ = "products"

    product_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_name = Column(String(200), nullable=False)
    brand = Column(String(100), nullable=True)
    category = Column(String(100))
    ingredients = Column(Text)
    skin_type = Column(String(100))
    price = Column(DECIMAL(10,2))
    currency = Column(String(3), nullable=False, default="GBP", server_default="GBP")
    product_url = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)
