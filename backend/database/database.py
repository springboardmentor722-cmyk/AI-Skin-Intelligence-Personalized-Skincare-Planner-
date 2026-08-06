import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

POSTGRES_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres123@localhost:5432/ai_skin_db")
SQLITE_URL = "sqlite:///./ai_skin.db"

try:
    engine = create_engine(POSTGRES_URL)
    with engine.connect() as conn:
        pass
    print("[DB] Connected to PostgreSQL Database")
except Exception as e:
    print(f"[DB] PostgreSQL connection failed. Falling back to SQLite database.")
    engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()
