import pytest
import uuid
from datetime import date, datetime, timedelta
from unittest.mock import MagicMock, patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app import models
from app.services.adherence_service import calculate_compliance_rate

# Setup Testing SQLite
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_zero_assigned_steps(db_session):
    # User with no routine steps assigned
    user_id = str(uuid.uuid4())
    user = models.User(
        id=user_id,
        full_name="No Steps User",
        email="zero@example.com",
        created_at=datetime.utcnow() - timedelta(days=5),
        hashed_password="bcrypt_hash_placeholder",
        role=models.RoleEnum.user,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    rate = calculate_compliance_rate(db_session, user.id, 7)
    assert rate is None  # Must return None, not divide by zero

def test_partial_week_proration(db_session):
    # User registered 3 days ago
    user_id = str(uuid.uuid4())
    user = models.User(
        id=user_id,
        full_name="Partial User",
        email="partial@example.com",
        created_at=datetime.utcnow() - timedelta(days=2),  # Registered 2 days ago (days_elapsed = 3)
        hashed_password="bcrypt_hash_placeholder",
        role=models.RoleEnum.user,
        is_active=True
    )
    db_session.add(user)
    
    # User has 2 active routine steps (e.g. 1 AM, 1 PM step)
    step1 = models.SkincareRoutine(
        user_id=user.id,
        time_of_day="AM",
        step_number=1,
        step_category="Cleansing",
        is_active=True
    )
    step2 = models.SkincareRoutine(
        user_id=user.id,
        time_of_day="PM",
        step_number=1,
        step_category="Moisturizing",
        is_active=True
    )
    db_session.add(step1)
    db_session.add(step2)
    db_session.commit()
    
    # Mock MongoDB count_documents returning 3 completed checkins in this window
    mock_mongo = MagicMock()
    mock_mongo.routine_checkins.count_documents.return_value = 3
    
    with patch("app.services.adherence_service.get_mongo_db", return_value=mock_mongo):
        # 3 checkins / (2 active steps * 3 elapsed days) = 3 / 6 = 50%
        rate = calculate_compliance_rate(db_session, user.id, 7)
        assert rate == 50.0
