import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.database import engine
from app.db.base import Base
from app.models import * # Ensure all models are loaded

def create_tables():
    print("Creating new tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    create_tables()
