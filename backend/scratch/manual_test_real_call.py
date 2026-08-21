import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from app.main import app
from app.auth import get_current_user
from app import models
from app.database import SessionLocal

db = SessionLocal()
user = db.query(models.User).first()
if not user:
    from app.auth import hash_password
    user = models.User(
        id="test-user-id-1234",
        full_name="Test User",
        email="testuser@example.com",
        hashed_password=hash_password("testpass123"),
        role=models.RoleEnum.user,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

app.dependency_overrides[get_current_user] = lambda: user

client = TestClient(app)
response = client.post("/api/ingredients/safety-score", json={
    "ingredients_list": ["Retinol", "Salicylic Acid"],
    "time_of_day": "PM"
})

print("STATUS CODE:", response.status_code)
print("RESPONSE JSON:")
import json
print(json.dumps(response.json(), indent=2))
