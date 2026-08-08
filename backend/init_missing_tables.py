import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.database import engine
from app.db.base import Base

# Ensure all models are loaded
import app.models

print("Creating missing tables...")
Base.metadata.create_all(bind=engine)
print("Done!")
