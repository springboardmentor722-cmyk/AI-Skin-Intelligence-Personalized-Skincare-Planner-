from passlib.context import CryptContext
from backend.database import SessionLocal
from backend.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin():
    db = SessionLocal()
    try:
        # DELETE existing admin first
        deleted = db.query(User).filter(User.username == "admin").delete()
        db.commit()
        if deleted:
            print(f"✅ Deleted {deleted} existing admin user(s)")
        
        # CREATE new admin with fresh hash
        new_admin = User(
            name="System Admin",
            email="admin@skincareai.com",
            username="admin",
            hashed_password=pwd_context.hash("admin123"),
            role="admin",
            is_verified=True
        )
        db.add(new_admin)
        db.commit()
        
        print("=" * 50)
        print("✅ ADMIN CREATED SUCCESSFULLY!")
        print(f"   Username: admin")
        print(f"   Password: admin123")
        print("=" * 50)
        print("Now try login at http://localhost:3000/login")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()