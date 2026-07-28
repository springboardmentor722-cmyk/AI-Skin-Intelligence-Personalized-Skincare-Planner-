import sys
import os

from app.models.assessment import SkinAssessment
from app.models.skin_profile import SkinProfile
from app.models.engagement import Appointment
from app.models.ingredient import Ingredient
from app.models.product import Product
from app.models.user import User

from app.db.postgres import SessionLocal
from app.core.security import hash_password

db = SessionLocal()

emails = [
    {"email": "kolathuruharichandana@gmail.com", "role": "dermatologist", "name": "Dr. Harichandana"},
    {"email": "consultant@gmail.com", "role": "consultant", "name": "Consultant Jane"}
]

for item in emails:
    user = db.query(User).filter(User.email == item['email']).first()
    if not user:
        user = User(
            email=item['email'],
            hashed_password=hash_password("password123"),
            full_name=item['name'],
            role=item['role'],
            status="approved",
            is_active=True
        )
        db.add(user)
        print(f"Created {item['email']}")
    else:
        user.hashed_password = hash_password("password123")
        user.role = item['role']
        user.status = "approved"
        print(f"Reset {item['email']}")

db.commit()
print("Done!")
