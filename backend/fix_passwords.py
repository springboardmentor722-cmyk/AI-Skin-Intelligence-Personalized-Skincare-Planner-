from app.database import SessionLocal
from app.models.user import User
from app.utils.security import hash_password

db = SessionLocal()

try:
    users = db.query(User).all()
    updated = 0
    
    for user in users:
        if user.password:
            # Check if already bcrypt hashed (starts with $2)
            if not user.password.startswith('$2'):
                print(f"Rehashing password for user {user.email}")
                user.password = hash_password(user.password)
                updated += 1
            else:
                print(f"User {user.email}: Already hashed")
    
    db.commit()
    print(f"\n✅ Successfully rehashed {updated} users!")

except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()

finally:
    db.close()
    