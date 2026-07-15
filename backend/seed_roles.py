import sys
import os

# Add the app directory to the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.role import Role

def seed_roles():
    db = SessionLocal()
    roles_to_create = ["User", "Skincare Consultant", "Dermatologist", "Administrator"]
    
    for role_name in roles_to_create:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            print(f"Creating role: {role_name}")
            new_role = Role(name=role_name, description=f"{role_name} role")
            db.add(new_role)
    
    db.commit()
    db.close()
    print("Roles seeded successfully!")

if __name__ == "__main__":
    seed_roles()
