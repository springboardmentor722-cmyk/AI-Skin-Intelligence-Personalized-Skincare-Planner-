from datetime import datetime
import json
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_complete_flow():
    print("\n--- RUNNING COMPREHENSIVE BACKEND API TEST SUITE ---\n")

    # 1. Test Public Products API (GET /products)
    res = client.get("/products")
    print(f"1. GET /products -> Status: {res.status_code}")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    products = res.json()
    print(f"   Fetched {len(products)} products without authentication.")

    # 2. Test User Registration
    test_email = f"test_user_{int(datetime.utcnow().timestamp())}@skincare.com"
    reg_payload = {
        "name": "Test User",
        "email": test_email,
        "password": "Password123!",
        "role": "user"
    }
    res = client.post("/register", json=reg_payload)
    print(f"2. POST /register -> Status: {res.status_code}")
    assert res.status_code == 200, f"Registration failed: {res.text}"
    user_data = res.json()
    print(f"   Registered user ID: {user_data['id']}, Email: {user_data['email']}")

    # 3. Test User Login with JSON body (POST /login)
    login_payload = {
        "email": test_email,
        "password": "Password123!"
    }
    res = client.post("/login", json=login_payload)
    print(f"3. POST /login (JSON) -> Status: {res.status_code}")
    assert res.status_code == 200, f"Login failed: {res.text}"
    login_resp = res.json()
    access_token = login_resp["access_token"]
    refresh_token = login_resp["refresh_token"]
    print(f"   Access Token Received: {access_token[:20]}...")
    print(f"   Refresh Token Received: {refresh_token[:20]}...")

    headers = {"Authorization": f"Bearer {access_token}"}

    # 4. Test Refresh Token (POST /refresh-token)
    res = client.post("/refresh-token", json={"refresh_token": refresh_token})
    print(f"4. POST /refresh-token -> Status: {res.status_code}")
    assert res.status_code == 200, f"Refresh token failed: {res.text}"
    new_token_data = res.json()
    assert "access_token" in new_token_data

    # 5. Test Create Skin Profile (POST /skin-profile)
    profile_payload = {
        "full_name": "Test User",
        "age": 28,
        "gender": "Female",
        "skin_type": "Combination",
        "skin_tone": "Medium",
        "concerns": "Acne, Pigmentation",
        "allergies": "None",
        "medical_conditions": "None",
        "current_products": "Gentle Cleanser"
    }
    res = client.post("/skin-profile", json=profile_payload, headers=headers)
    print(f"5. POST /skin-profile -> Status: {res.status_code}")
    assert res.status_code == 200, f"Skin profile creation failed: {res.text}"

    # 6. Test Get My Profile (GET /my-profile)
    res = client.get("/my-profile", headers=headers)
    print(f"6. GET /my-profile -> Status: {res.status_code}")
    assert res.status_code == 200

    # 7. Test Create Lifestyle (POST /lifestyle)
    lifestyle_payload = {
        "sleep_hours": 8.0,
        "water_intake": 3.0,
        "exercise": "3-4 Days/Week",
        "stress_level": "Low",
        "outdoor_exposure": "1-3 hours",
        "diet": "Balanced"
    }
    res = client.post("/lifestyle", json=lifestyle_payload, headers=headers)
    print(f"7. POST /lifestyle -> Status: {res.status_code}")
    assert res.status_code == 200

    # 8. Test Product Recommendations (GET /products/recommendations)
    res = client.get("/products/recommendations", headers=headers)
    print(f"8. GET /products/recommendations -> Status: {res.status_code}")
    assert res.status_code == 200
    recs = res.json()
    print(f"   Received {len(recs)} personalized product recommendations.")

    print("\nALL API TESTS PASSED SUCCESSFULLY!\n")



if __name__ == "__main__":
    test_complete_flow()

