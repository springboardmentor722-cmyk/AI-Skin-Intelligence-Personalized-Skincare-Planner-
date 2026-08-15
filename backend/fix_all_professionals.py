# backend/fix_all_professionals.py

import sys
import os

# Add the parent directory to Python path so 'backend' can be found
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import User, ConsultantProfile, DermatologistProfile

def fix_all_professionals():
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("🔧 FIXING ALL PROFESSIONALS")
        print("=" * 60)
        
        fixed_count = 0
        
        # Fix Consultants
        consultants = db.query(ConsultantProfile).all()
        print(f"\n📋 Found {len(consultants)} consultants")
        for profile in consultants:
            user = db.query(User).filter(User.id == profile.user_id).first()
            if user:
                print(f"   Consultant: {user.name} - Status: {profile.verification_status} - is_verified: {user.is_verified}")
                if profile.verification_status == "approved" and not user.is_verified:
                    user.is_verified = True
                    fixed_count += 1
                    print(f"   ✅ FIXED: {user.name}")
        
        # Fix Dermatologists
        dermatologists = db.query(DermatologistProfile).all()
        print(f"\n📋 Found {len(dermatologists)} dermatologists")
        for profile in dermatologists:
            user = db.query(User).filter(User.id == profile.user_id).first()
            if user:
                print(f"   Dermatologist: {user.name} - Status: {profile.verification_status} - is_verified: {user.is_verified}")
                if profile.verification_status == "approved" and not user.is_verified:
                    user.is_verified = True
                    fixed_count += 1
                    print(f"   ✅ FIXED: {user.name}")
        
        db.commit()
        
        print("\n" + "=" * 60)
        print(f"✅ FIXED {fixed_count} PROFESSIONALS")
        print("=" * 60)
        print("\n✅ DONE! Try logging in now.")
        
        db.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        db.close()

if __name__ == "__main__":
    fix_all_professionals()