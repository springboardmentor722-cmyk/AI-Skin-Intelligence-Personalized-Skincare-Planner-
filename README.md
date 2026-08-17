# AI-Skin-Intelligence-Personalized-Skincare-Planner-
AI Skin Intelligence &amp; Personalized Skincare Planner Group 2
Aurelia - AI-Powered Personal Skincare Companion

Personalized Skincare Intelligence Platform with AI Analysis, Expert Dermatologist Network & Progress Tracking

---

Project Description

Aurelia is an AI-powered skincare intelligence platform that provides personalized skincare recommendations based on a user's skin profile, lifestyle, sleep, hydration, and routine consistency.

The platform uses "Artificial Intelligence & Machine Learning" to analyze skin-specific information and generate customized skincare routines, product recommendations, and ingredient analysis. It connects users with certified **dermatologists and skincare consultants** for professional guidance.

---

Project Demo Link-
https://drive.google.com/file/d/1ORTlZhEAXCfvHMCoqNZGp1gy-xjBzJE4/view?usp=sharing

---

Key Capabilities:
-  AI skin analysis & personalized recommendations
-  Professional dermatologist consultations
-  Progress tracking with before/after photos
-  Smart product & ingredient recommendations
-  Skin health scoring & analytics
-  Lifestyle monitoring (sleep, water, stress, exercise)

---

Tech Stack

Frontend
- React 18, React Router v6
- CSS3 + Responsive Design
- Fetch API for HTTP requests
- Node.js 20 LTS

Backend
- FastAPI (Python async framework)
- SQLAlchemy ORM
- JWT Authentication, bcrypt security
- Python 3.14.6

Database
- PostgreSQL 18.4 (relational data)
- 15+ tables (users, profiles, routines, products, consultations, progress)

Deployment & DevOps
- Docker 29.2.1 & Docker Compose v5.0.2
- Render.com cloud hosting
- GitHub CI/CD integration

Tools
- Git & GitHub
- Swagger API Documentation
- Multipart file uploads
- CORS handling

---

Project Structure

AI_Skincare_Project/
│
├── backend/
│ ├── app/
│ │ ├── models/ # User, profile, consultation models
│ │ ├── routes/ # API endpoints (auth, profile, products, etc.)
│ │ ├── database.py # Database configuration
│ │ └── security.py # JWT & authentication
│ ├── main.py # FastAPI entry point
│ ├── requirements.txt
│ ├── Dockerfile
│ └── uploads/ # Progress photos & screening images
│
├── frontend/
│ ├── src/
│ │ ├── pages/ # Landing, Auth, Dashboards
│ │ ├── context/ # AuthContext
│ │ └── styles/ # CSS styling
│ ├── public/index.html
│ ├── package.json
│ ├── Dockerfile
│ └── .dockerignore
│
├── docker-compose.yml # Multi-container orchestration
├── .env # Environment configuration
└── README.md # Documentation


---

Project Workflow

User Registration/Login
↓
Skin Profile Creation
↓
AI Skin Analysis
↓
Personalized Routines Generated
↓
Product Recommendations
↓
Ingredient Analysis
↓
Progress Tracking Dashboard
↓
Professional Consultations (Optional)
↓
Continuous Monitoring & Optimization


---