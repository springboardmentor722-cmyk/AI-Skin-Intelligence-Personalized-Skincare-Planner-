# Setup Instructions for AI Skincare Platform

## Prerequisites
- Python 3.9+
- PostgreSQL
- Node.js (for frontend)
- Git

## Backend Setup

### 1. Clone Repository
```bash
git clone <repo-url>
cd AI_Skincare_Project/backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Database
Edit `app/database/config.py`:
```python
DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@localhost:5432/ai_skincare_db"
```

### 5. Create Database
```bash
createdb ai_skincare_db  # Using PostgreSQL CLI
```

### 6. Run Server
```bash
python main.py
```

Server runs at: http://127.0.0.1:8000

### 7. Access Swagger UI
Go to: http://127.0.0.1:8000/docs

---

## **Frontend Setup**

### 1. Navigate to Frontend
```bash
cd ../frontend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Create .env File
### 4. Start Development Server
```bash
npm start
```

App runs at: http://localhost:3000

---

## **Project Structure**
---

## **Key Features**

✅ User Registration & Login
✅ JWT Authentication
✅ User Profile Management
✅ Lifestyle Tracking
✅ Role-Based Access Control
✅ Real Data (1689 products, 247 ingredients)

---