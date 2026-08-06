AI Skin Intelligence & Personalized Skincare Planner

Project Overview

AI Skin Intelligence & Personalized Skincare Planner is a full-stack web application that helps users maintain healthy skin by collecting skin profile information, lifestyle habits, and (in future milestones) providing AI-powered skincare recommendations.

The project is built using React for the frontend, FastAPI for the backend, and SQLite as the database.



Features

Current Features (Milestone 1)

- User Registration
- User Login (JWT Authentication)
- Role-Based Access Control (Basic)
- Skin Profile Management
- Lifestyle Tracking
- Product Management
- Ingredient Management
- Product–Ingredient Mapping
- REST API using FastAPI
- React Dashboard

Upcoming Features (Milestone 2)

- Skin Image Upload
- AI Skin Analysis
- Personalized Skincare Routine
- Product Recommendation Engine
- Progress Tracking
- Analytics Dashboard



Technology Stack

Frontend

- React
- Vite
- React Router
- Tailwind CSS

Backend

- FastAPI
- SQLAlchemy
- SQLite
- Pydantic
- JWT Authentication

Development Tools

- VS Code
- Git & GitHub
- Swagger UI



Project Structure

```text
AI Skin Intelligence/

├── backend/
├── frontend/
├── docs/
├── README.md
└── .gitignore
```



Installation

 Clone the repository

```bash
git clone https://github.com/your-username/AI-Skin-Intelligence.git
```

---

Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs at

```
http://127.0.0.1:8000
```

Swagger Documentation

```
http://127.0.0.1:8000/docs
```

---
 Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at

```
http://localhost:5173
```



API Endpoints

Authentication

- POST /register
- POST /login
 Skin Profile

- POST /skin-profile
- GET /skin-profile/{id}
- PUT /skin-profile/{id}
- DELETE /skin-profile/{id}

 Lifestyle

- POST /lifestyle

 Products

- POST /products
- GET /products

Ingredients

- POST /ingredients
- GET /ingredients

Product Ingredients

- POST /product-ingredients
- GET /product-ingredients


 Current Progress

✅ Milestone 1

- Authentication
- User Profile
- Lifestyle Tracking
- Product Database
- Documentation

🔄 Milestone 2

- AI Skin Assessment
- Recommendation System
- Progress Tracking

 📄 License

This project is developed for educational and academic purposes.