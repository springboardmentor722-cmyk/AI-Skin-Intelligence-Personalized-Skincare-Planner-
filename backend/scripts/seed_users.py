import sys
import os

# Add the backend directory to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.core.security import get_password_hash

def seed_users():
    db = SessionLocal()
    
    users_to_create = [
        {"email": "user@gmail.com", "password": "user@123", "name": "Standard User", "role": "User"},
        {"email": "skincon@gmail.com", "password": "skin@123", "name": "Jane Consultant", "role": "Skincare Consultant"},
        {"email": "dermo@gmail.com", "password": "dermo@123", "name": "Dr. Smith", "role": "Dermatologist"},
        {"email": "admin@gmail.com", "password": "admin@123", "name": "System Admin", "role": "Administrator"},
    ]
    
    for u in users_to_create:
        user = db.query(User).filter(User.email == u["email"]).first()
        if not user:
            print(f"Creating user: {u['email']}")
            
            role = db.query(Role).filter(Role.name == u["role"]).first()
            if not role:
                print(f"Warning: Role {u['role']} not found for {u['email']}.")
                continue
                
            new_user = User(
                email=u["email"],
                full_name=u["name"],
                hashed_password=get_password_hash(u["password"])
            )
            new_user.roles.append(role)
            db.add(new_user)
        else:
            print(f"User {u['email']} already exists.")
            
    db.commit()
    db.close()
    print("Test users seeded successfully!")

if __name__ == "__main__":
    seed_users()
