from sqlalchemy import Column, Integer, String, Text, DECIMAL

from app.database.database import Base


class Product(Base):

    __tablename__ = "products"

    product_id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    product_name = Column(
        String(200),
        nullable=False
    )

    brand = Column(
        String(100),
        nullable=True
    )

    category = Column(
        String(100),
        nullable=True
    )

    ingredients = Column(
        Text,
        nullable=True
    )

    skin_type = Column(
        String(100),
        nullable=True
    )

    price = Column(
        DECIMAL(10, 2),
        nullable=True
    )

    # Indian Rupees
    currency = Column(
        String(3),
        nullable=False,
        default="INR",
        server_default="INR"
    )

    product_url = Column(
        String(500),
        nullable=True
    )

    image_url = Column(
        String(500),
        nullable=True
    )