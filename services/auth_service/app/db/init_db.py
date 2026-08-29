from services.auth_service.app.db.database import Base, engine

# Import all models here
from services.auth_service.app.models.user import User


def init_db():
    Base.metadata.create_all(bind=engine)