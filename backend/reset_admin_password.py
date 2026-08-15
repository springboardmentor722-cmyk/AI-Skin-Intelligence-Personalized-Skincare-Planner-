from passlib.context import CryptContext
from backend.database import SessionLocal
from backend.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def reset_admin_password():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == "admin").first()
        if not user:
            print("❌ Admin user not found!")
            return
        
        new_password = "admin123"
        user.hashed_password = pwd_context.hash(new_password)
        user.is_verified = True
        db.commit()
        
        print("=" * 50)
        print("✅ ADMIN PASSWORD RESET SUCCESSFULLY!")
        print(f"   Username: admin")
        print(f"   New Password: {new_password}")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Resetting admin password...")
    reset_admin_password()
    print("🎉 Done!")