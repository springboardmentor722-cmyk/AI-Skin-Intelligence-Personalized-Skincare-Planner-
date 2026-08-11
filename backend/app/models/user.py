from sqlalchemy import Column, Integer, String
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(100))

    email = Column(String(100), unique=True)

    password = Column(String(255))

    role = Column(String(50))

    # New Fields

    qualification = Column(String(150), nullable=True)

    experience = Column(Integer, nullable=True)

    specialization = Column(String(150), nullable=True)

    license_number = Column(String(100), nullable=True)

    organization = Column(String(150), nullable=True)

    verification_status = Column(String(20), default="Approved")