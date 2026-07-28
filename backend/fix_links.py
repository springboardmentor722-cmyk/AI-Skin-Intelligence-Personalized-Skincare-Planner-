import sys
import os

from app.models.assessment import SkinAssessment
from app.models.skin_profile import SkinProfile
from app.models.engagement import Appointment, UserConsultantLink, UserDermatologistLink
from app.models.ingredient import Ingredient
from app.models.product import Product
from app.models.user import User
from app.db.postgres import SessionLocal

db = SessionLocal()

appts = db.query(Appointment).all()
for appt in appts:
    if appt.professional_type == 'consultant':
        link = db.query(UserConsultantLink).filter_by(user_id=appt.user_id, consultant_id=appt.professional_id).first()
        if not link:
            new_link = UserConsultantLink(user_id=appt.user_id, consultant_id=appt.professional_id, status="active")
            db.add(new_link)
    elif appt.professional_type == 'dermatologist':
        link = db.query(UserDermatologistLink).filter_by(user_id=appt.user_id, dermatologist_id=appt.professional_id).first()
        if not link:
            new_link = UserDermatologistLink(user_id=appt.user_id, dermatologist_id=appt.professional_id, status="active")
            db.add(new_link)

db.commit()
print("Fixed existing appointments!")
