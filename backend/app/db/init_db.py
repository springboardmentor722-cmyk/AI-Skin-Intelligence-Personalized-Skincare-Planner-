"""
Run this once to create all tables in PostgreSQL (Neon).
Usage: py -m app.db.init_db
"""

from app.db.postgres import Base, engine

# Import all models so they register with Base.metadata
from app.models.user import User
from app.models.skin_profile import SkinProfile
from app.models.lifestyle_log import LifestyleLog
from app.models.consultant_profile import ConsultantProfile
from app.models.dermatologist_profile import DermatologistProfile
from app.models.ingredient import Ingredient
from app.models.product import Product, ProductIngredient
from app.models.progress_log import ProgressLog


def init_db():
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done. Tables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")


if __name__ == "__main__":
    init_db()