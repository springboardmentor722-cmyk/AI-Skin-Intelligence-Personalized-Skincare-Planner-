from services.auth_service.app.db.database import Base, engine

# Import every model in the whole project here so create_all() sees them
# all, regardless of which service happens to start first.
from services.auth_service.app.models.user import User
from services.profile_service.app.models.profile import Profile
from services.profile_service.app.models.treatment_note import TreatmentNote
from services.assessment_service.app.models.assessment import SkinAssessment
from services.assessment_service.app.models.routine import SkincareRoutine


def init_db():
    Base.metadata.create_all(bind=engine)
