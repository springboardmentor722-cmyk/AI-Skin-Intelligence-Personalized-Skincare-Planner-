from sqlalchemy import Boolean, Column, Integer, String, Text
from app.database.database import Base

class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredient_id = Column(Integer, primary_key=True, index=True)

    ingredient_name = Column(String(100))

    benefits = Column(Text)

    side_effects = Column(Text)

    suitable_skin = Column(String(100))

    short_description = Column(Text, nullable=True)

    description = Column(Text, nullable=True)

    suitable_for = Column(Text, nullable=True)

    source_url = Column(String(500), nullable=True)

    # Soft deletion keeps historic references to an ingredient valid.
    is_active = Column(Boolean, nullable=False, default=True, server_default="1")
