from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.database.database import Base


class SkinProfile(Base):

    __tablename__ = "skin_profile"

    profile_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    age = Column(Integer)
    gender = Column(String(20))
    skin_type = Column(String(50))
    skin_concerns = Column(Text)
    allergies = Column(Text)
    sensitivities = Column(Text)
    skin_image = Column(String(255))

    skin_score = Column(Integer)

    ai_skin_type = Column(String(100))

    acne_level = Column(String(50))

    pigmentation = Column(String(50))

    hydration = Column(String(50))

    oiliness = Column(String(50))

    dark_circles = Column(String(50))

    recommendations = Column(Text)
    # Image uploaded by user
    skin_image = Column(String(255))

    # Temporary hardcoded AI results
    skin_score = Column(Integer)
    ai_skin_type = Column(String(100))
    ai_concerns = Column(Text)