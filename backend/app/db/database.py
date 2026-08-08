import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

logger = logging.getLogger(__name__)

db_url = settings.SQLALCHEMY_DATABASE_URI

try:
    engine = create_engine(
        db_url, 
        pool_pre_ping=True,
        connect_args={"connect_timeout": 5} if "postgresql" in db_url else {}
    )
    # Test connection
    with engine.connect() as conn:
        pass
    logger.info("Successfully connected to primary database.")
except Exception as e:
    logger.warning(f"Primary database connection failed ({e}). Falling back to local SQLite database.")
    sqlite_url = "sqlite:///./skincare_fallback.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
