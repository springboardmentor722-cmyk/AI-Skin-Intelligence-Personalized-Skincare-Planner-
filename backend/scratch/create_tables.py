import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import Base, engine
import app.models  # ensure models are loaded

print("[DB] Creating all tables...")
Base.metadata.create_all(bind=engine)
print("[DB] Tables created successfully.")
