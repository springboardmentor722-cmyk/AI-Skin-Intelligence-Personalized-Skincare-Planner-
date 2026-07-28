import time
from sqlalchemy import text
# Import ALL models first so SQLAlchemy mapper resolves all relationships
from app.models.assessment import SkinAssessment  # noqa: F401
from app.models.skin_profile import SkinProfile   # noqa: F401
from app.models.engagement import Appointment  # noqa: F401
from app.models.ingredient import Ingredient      # noqa: F401
from app.db.postgres import SessionLocal, engine
from app.routes.products import seed_catalog_if_empty
from app.models.product import Product

def run():
    retries = 5
    db = None
    while retries > 0:
        try:
            print("Connecting to Neon PostgreSQL database...")
            db = SessionLocal()
            # Test connection
            db.execute(text("SELECT 1"))
            print("Connection successful!")
            break
        except Exception as e:
            print(f"Connection failed: {e}. Retrying in 3 seconds...")
            retries -= 1
            time.sleep(3)
            
    if not db:
        print("Could not connect to database after several attempts.")
        return

    try:
        print("Truncating products table to clear old seeded data...")
        db.execute(text("TRUNCATE TABLE products CASCADE"))
        db.commit()
        print("Truncate successful and committed.")
        
        print("Running dynamic cosmetics.csv seed catalog loader...")
        seed_catalog_if_empty(db)
        
        count = db.query(Product).count()
        print(f"Verification complete! Total products in database: {count}")
    except Exception as e:
        print(f"Error during truncate/seed run: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
