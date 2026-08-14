import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# By default this uses a local SQLite file so the project runs with zero setup.
# For production (matching the architecture doc), set DATABASE_URL to a
# PostgreSQL connection string, e.g.:
#   postgresql://skinuser:skinpass@localhost:5432/skin_intelligence
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./skin_intelligence.db")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
