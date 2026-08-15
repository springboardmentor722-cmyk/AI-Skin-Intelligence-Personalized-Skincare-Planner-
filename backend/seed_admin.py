from passlib.context import CryptContext
from backend.database import SessionLocal
from backend.models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_admin_user():
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.role == "admin").first()
        if existing:
            print(f"✅ Admin user already exists: {existing.email}")
            return
        
        admin_email = "admin@skincareai.com"
        admin_username = "admin"
        admin_password = "admin123"
        hashed_password = pwd_context.hash(admin_password)
        
        new_admin = User(
            name="System Admin",
            email=admin_email,
            username=admin_username,
            hashed_password=hashed_password,
            role="admin",
            is_verified=True
        )
        db.add(new_admin)
        db.commit()
        
        print("=" * 50)
        print("✅ ADMIN USER CREATED SUCCESSFULLY!")
        print(f"   Email: {admin_email}")
        print(f"   Username: {admin_username}")
        print(f"   Password: {admin_password}")
        print("=" * 50)
        print("⚠️  PLEASE CHANGE THE PASSWORD AFTER FIRST LOGIN!")
        print("=" * 50)
        
    except Exception as e:
        print(f"❌ Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Creating admin user...")
    create_admin_user()
    print("🎉 Done!")