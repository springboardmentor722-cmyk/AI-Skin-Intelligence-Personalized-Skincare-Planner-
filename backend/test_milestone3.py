import uuid
from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from models import User

client = TestClient(app)

def run_tests():
    print("==================================================")
    print("STARTING MILESTONE 3 IN-MEMORY INTEGRATION SUITE")
    print("==================================================")

    # 1. Register test user & login
    email = f"m3_test_{uuid.uuid4().hex[:6]}@skincare.com"
    password = "Password123!"

    print(f"\n[1] Registering test user ({email})...")
    reg_res = client.post("/register", json={
        "name": "Milestone3 Tester",
        "email": email,
        "password": password,
        "role": "user"
    })
    print(f"Status: {reg_res.status_code}")
    assert reg_res.status_code in [200, 201], f"Register failed: {reg_res.text}"

    print("[2] Logging in to obtain JWT access token...")
    login_res = client.post("/login", json={"email": email, "password": password})
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    data = login_res.json()
    token = data["access_token"]
    user_id = data["user"]["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in successfully. User ID: {user_id}")

    # 3. Create Skin Profile
    print("\n[3] Creating Skin Profile...")
    profile_res = client.post("/skin-profile", json={
        "full_name": "Milestone3 Tester",
        "age": 27,
        "gender": "Female",
        "skin_type": "Combination",
        "skin_tone": "Medium",
        "concerns": "Acne, Pigmentation",
        "allergies": "Fragrance",
        "medical_conditions": "None",
        "current_products": "Gentle Cleanser"
    }, headers=headers)
    print(f"Profile creation status: {profile_res.status_code}")

    # 4. Test Ingredient Intelligence Engine
    print("\n[4] Testing Ingredient Intelligence Engine (POST /api/v1/ingredient/analyze)...")
    ing_res = client.post("/api/v1/ingredient/analyze", json={
        "ingredients_text": "Water, Niacinamide, Retinol, Salicylic Acid, Glycerin, Ceramide NP"
    }, headers=headers)
    assert ing_res.status_code == 200, f"Ingredient analysis failed: {ing_res.text}"
    ing_data = ing_res.json()
    print(f"Safety Score: {ing_data['safety_score']}/100 | Status: {ing_data['status']}")
    print(f"Conflicts Found: {len(ing_data['chemical_conflicts'])}")
    print(f"Safe Ingredients Count: {len(ing_data['safe_ingredients'])}")
    assert "safety_score" in ing_data

    # 5. Test Product Recommendation Engine
    print("\n[5] Testing Product Recommendation Engine (GET /api/v1/products/recommend)...")
    rec_res = client.get("/api/v1/products/recommend", headers=headers)
    assert rec_res.status_code == 200, f"Product recommendation failed: {rec_res.text}"
    rec_data = rec_res.json()
    print(f"Total Matches Found: {rec_data['total_matches']}")
    print(f"Top Product: {rec_data['recommended_products'][0]['product_name']} ({rec_data['recommended_products'][0]['match_percentage']}% Match)")
    assert len(rec_data["recommended_products"]) > 0

    # 6. Test Progress Upload, History, and Comparison
    print("\n[6] Testing Progress Upload (POST /api/v1/progress/upload)...")
    upload_res = client.post("/api/v1/progress/upload", data={
        "tag": "Month 1",
        "week_number": 4,
        "notes": "Skin barrier fully restored, inflammation resolved.",
        "image_url": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80"
    }, headers=headers)
    assert upload_res.status_code == 200, f"Progress upload failed: {upload_res.text}"
    print("Upload Response:", upload_res.json()["message"])

    print("Fetching Progress History (GET /api/v1/progress/history)...")
    hist_res = client.get("/api/v1/progress/history", headers=headers)
    assert hist_res.status_code == 200
    hist_data = hist_res.json()
    print(f"Total Progress Photos Logged: {len(hist_data['photos'])}")
    print(f"Improvement %: {hist_data['analytics']['improvement_pct']}")

    print("Testing Progress Comparison (GET /api/v1/progress/compare)...")
    comp_res = client.get("/api/v1/progress/compare", headers=headers)
    assert comp_res.status_code == 200
    comp_data = comp_res.json()
    print(f"Before Tag: {comp_data['before']['tag']} | After Tag: {comp_data['after']['tag']}")
    print(f"Score Diff: {comp_data['comparison_metrics']['score_diff']}")

    # 7. Test User Dashboard API
    print("\n[7] Testing Consolidated User Dashboard API (GET /api/v1/dashboard)...")
    dash_res = client.get("/api/v1/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    print(f"Dashboard Skin Health Score: {dash_data['skin_health_score']}/100")
    print(f"Hydration Target: {dash_data['hydration_tracker']['target_liters']} L")

    # 8. Test Analytics API
    print("\n[8] Testing Analytics API (GET /api/v1/analytics)...")
    analytics_res = client.get("/api/v1/analytics", headers=headers)
    assert analytics_res.status_code == 200
    analytics_data = analytics_res.json()
    print(f"7-Day Compliance Rate: {analytics_data['compliance']['compliance_7d']}%")

    # 9. Test Dermatologist Prescription & Patient Details
    print("\n[9] Registering & Activating Dermatologist User for Prescription API...")
    derm_email = f"derm_{uuid.uuid4().hex[:6]}@skincare.com"
    client.post("/register", json={
        "name": "Dr. Sarah Jenkins",
        "email": derm_email,
        "password": password,
        "role": "dermatologist"
    })
    
    # Activate specialist in DB
    db = SessionLocal()
    derm_user = db.query(User).filter(User.email == derm_email).first()
    if derm_user:
        derm_user.is_active = True
        db.commit()
    db.close()

    derm_login = client.post("/login", json={"email": derm_email, "password": password}).json()
    derm_headers = {"Authorization": f"Bearer {derm_login['access_token']}"}

    presc_res = client.post("/api/v1/dermatologist/prescription", json={
        "patient_id": user_id,
        "prescription_text": "Rx Tretinoin 0.05% Cream nightly",
        "doctor_notes": "Patient responding exceptionally well to treatment.",
        "routine_override": "Pause strong AHA exfoliants."
    }, headers=derm_headers)
    assert presc_res.status_code == 200, f"Prescription failed: {presc_res.text}"
    print("Prescription status:", presc_res.json()["message"])

    patient_res = client.get(f"/api/v1/dermatologist/patient/{user_id}", headers=derm_headers)
    assert patient_res.status_code == 200
    print("Dermatologist Patient Record fetched for ID:", patient_res.json()["patient_info"]["name"])

    print("\n==================================================")
    print("ALL MILESTONE 3 API & LOGIC TESTS PASSED SUCCESSFULLY!")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
