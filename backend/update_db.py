import sys
import os
from sqlalchemy import text

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.db.database import engine
from app.db.base import Base
# Import all models to ensure Base.metadata.create_all sees them
from app.models.user import User
from app.models.profile import SkinProfile, LifestyleProfile, EnvironmentProfile
from app.models.lifestyle import LifestyleLog
from app.models.skin_screening import SkinScreening
from app.models.routine import SkincareRoutine
from app.models.user_profile import UserProfile

def reset_tables():
    print("Dropping tables...")
    with engine.begin() as conn:
        conn.execute(text("DROP TABLE IF EXISTS skin_profiles CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS lifestyle_profiles CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS lifestyle_logs CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS environment_profiles CASCADE"))
        
    print("Recreating tables...")
    Base.metadata.create_all(bind=engine)
    print("Done!")

if __name__ == "__main__":
    reset_tables()
