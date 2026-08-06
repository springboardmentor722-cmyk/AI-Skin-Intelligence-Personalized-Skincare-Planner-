# AI Skincare Intelligence Platform - API Documentation

## Base URL
## Authentication
All endpoints (except /register and /login) require JWT token in header:
---

## **AUTHENTICATION ENDPOINTS**

### 1. Register User
**POST** `/api/auth/register`

**Request:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "SecurePass123",
  "confirm_password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "age": 25,
  "gender": "Male",
  "phone": "9876543210"
}
```

**Response (201):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "user": {
    "user_id": 1,
    "email": "user@example.com",
    "username": "username",
    "first_name": "John",
    "last_name": "Doe",
    "age": 25,
    "gender": "Male",
    "is_active": true,
    "created_at": "2026-07-08T..."
  }
}
```

---

### 2. Login User
**POST** `/api/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200):** Same as Register

---

### 3. Get Current User
**GET** `/api/auth/me`

**Headers:**
**Response (200):**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "username": "username",
  "first_name": "John",
  "last_name": "Doe",
  "age": 25,
  "gender": "Male",
  "is_active": true,
  "created_at": "2026-07-08T..."
}
```

---

## **USER PROFILE ENDPOINTS**

### 1. Create Profile
**POST** `/api/profile/create`

**Headers:**
**Request:**
```json
{
  "skin_type": "Dry",
  "skin_tone": "Fair",
  "allergies": "Latex, Perfume",
  "sensitivities": "To fragrance"
}
```

**Response (201):**
```json
{
  "profile_id": 1,
  "user_id": 1,
  "skin_type": "Dry",
  "skin_tone": "Fair",
  "allergies": "Latex, Perfume",
  "sensitivities": "To fragrance",
  "created_at": "2026-07-08T...",
  "updated_at": "2026-07-08T..."
}
```

---

### 2. Get Profile
**GET** `/api/profile/`

**Headers:**
**Response (200):** Same as Create

---

### 3. Update Profile
**PUT** `/api/profile/update`

**Headers:**
**Request:** (Same as Create, all fields optional)

**Response (200):** Updated profile

---

### 4. Delete Profile
**DELETE** `/api/profile/`

**Headers:**
**Response (204):** No content

---

## **LIFESTYLE TRACKING ENDPOINTS**

### 1. Log Lifestyle
**POST** `/api/lifestyle/log`

**Headers:**
**Request:**
```json
{
  "tracking_date": "2026-07-08",
  "sleep_duration": 7.5,
  "sleep_quality": "Good",
  "water_intake": 8,
  "exercise_duration": 30,
  "exercise_type": "Running",
  "stress_level": 5,
  "environmental_exposure": "Sun, AC",
  "notes": "Felt good today"
}
```

**Response (201):** Logged lifestyle data

---

### 2. Get Log for Date
**GET** `/api/lifestyle/log/{tracking_date}`

**Headers:**
**URL:** `/api/lifestyle/log/2026-07-08`

**Response (200):** Lifestyle log for that date

---

### 3. Get History (Last 7 Days)
**GET** `/api/lifestyle/history?days=7`

**Headers:**
**Response (200):**
```json
[
  {
    "tracking_id": 1,
    "user_id": 1,
    "tracking_date": "2026-07-08",
    "sleep_duration": 7.5,
    ...
  },
  ...
]
```

---

### 4. Update Log
**PUT** `/api/lifestyle/log/{tracking_date}`

**Headers:**
**Request:** (Same as Log, all fields optional)

**Response (200):** Updated log

---

### 5. Delete Log
**DELETE** `/api/lifestyle/log/{tracking_date}`

**Headers:**
**Response (204):** No content

---

## **ERROR RESPONSES**

### 401 Unauthorized
```json
{
  "detail": "Not authenticated"
}
```

### 403 Forbidden
```json
{
  "detail": "User does not have permission"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "invalid email format",
      "type": "value_error.email"
    }
  ]
}
```

---

## **TESTING**

Open Swagger UI: http://127.0.0.1:8000/docs

All endpoints are documented and testable there!

---

## **DATABASE**

Database: PostgreSQL (ai_skincare_db)

Tables:
- users
- user_profiles
- lifestyle_tracking
- skin_concerns
- ingredients
- products
- product_ingredients
- roles

---