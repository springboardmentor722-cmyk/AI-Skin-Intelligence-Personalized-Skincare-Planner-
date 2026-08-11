from sqlalchemy import Column, Integer, Float, Date, Text
from app.database.database import Base

class Progress(Base):
    __tablename__ = "progress"

    progress_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    skin_score = Column(Float)
    hydration_score = Column(Float)
    acne_level = Column(Integer)
    assessment_date = Column(Date)
    notes = Column(Text)