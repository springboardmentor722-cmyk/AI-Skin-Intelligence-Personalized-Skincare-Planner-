from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pymongo import MongoClient

from app.config import settings

# --- PostgreSQL or SQLite (relational core) ---
if settings.postgres_url.startswith("sqlite"):
    engine = create_engine(settings.postgres_url, connect_args={"check_same_thread": False})
else:
    engine = create_engine(settings.postgres_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- MongoDB (flexible catalog: products, ingredients) ---
mongo_client = MongoClient(settings.mongo_url)
mongo_db = mongo_client[settings.mongo_db_name]


def get_mongo_db():
    return mongo_db
