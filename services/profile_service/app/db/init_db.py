from services.auth_service.app.db.database import Base, engine

from services.auth_service.app.models.user import User
from services.profile_service.app.models.profile import Profile
from services.profile_service.app.models.treatment_note import TreatmentNote


def init_db():
    Base.metadata.create_all(bind=engine)