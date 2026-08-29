from services.auth_service.app.db.database import Base, engine, SessionLocal
from services.recommendation_service.app.models.product import Product
from services.recommendation_service.app.business.seed_products import SEED_PRODUCTS


def init_db():
    # create_all only creates tables that don't exist yet — safe to call
    # even though other services already created their own tables.
    Base.metadata.create_all(bind=engine)
    _seed_if_empty()


def _seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(Product).count() > 0:
            return
        db.bulk_save_objects([Product(**p) for p in SEED_PRODUCTS])
        db.commit()
        print(f"Recommendation Service: seeded {len(SEED_PRODUCTS)} products")
    finally:
        db.close()
