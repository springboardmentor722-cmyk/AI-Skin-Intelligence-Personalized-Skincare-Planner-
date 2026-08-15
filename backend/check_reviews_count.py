# backend/check_reviews_count.py

from database import SessionLocal
from models import Review
from database import Base
db = SessionLocal()
count = db.query(Review).count()
print(f"✅ Total reviews in database: {count}")
db.close()