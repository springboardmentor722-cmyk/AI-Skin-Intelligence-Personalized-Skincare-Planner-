import pytest
from app.services.progress_tracking import ProgressTrackingEngine
from app.models.routine import RoutineLog
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from uuid import uuid4
from datetime import datetime, timedelta, timezone

engine = create_engine('sqlite:///:memory:', connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module")
def db():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_adherence_calculation(db):
    user_id = uuid4()
    now = datetime.now(timezone.utc)
    
    # Create 5 completed logs in the last 7 days
    logs = []
    for i in range(5):
        logs.append(RoutineLog(
            user_id=user_id,
            step_id=uuid4(),
            is_completed=True,
            completed_at=now - timedelta(days=i)
        ))
    
    # 2 incomplete logs in the last 7 days
    for i in range(5, 7):
        logs.append(RoutineLog(
            user_id=user_id,
            step_id=uuid4(),
            is_completed=False,
            completed_at=now - timedelta(days=i)
        ))
        
    db.add_all(logs)
    db.commit()
    
    # 5 out of 7 completed = ~71.4%
    adherence_7d = ProgressTrackingEngine.calculate_adherence(db, user_id, 7)
    assert 70.0 <= adherence_7d <= 72.0
