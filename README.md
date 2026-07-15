<<<<<<< HEAD
# Pravallika-AI-SkinCarePlanner
=======
# AI Skin Intelligence & Personalized Skincare Planner

An enterprise-grade, highly scalable platform providing personalized skincare routines utilizing AI algorithms.

## What's Included (Features Developed)

### 🎨 Frontend
- **Framework:** React 19 + Vite + TypeScript for a fast, modern Single Page Application (SPA).
- **Styling & UI:** Tailwind CSS, shadcn/ui, and Framer Motion for a premium, responsive, and accessible user interface with smooth animations.
- **Routing & State:** React Router for seamless navigation (public and protected routes).
- **Form Handling & Validation:** Zod for robust client-side input validation.
- **Core Pages:** Includes a modern Landing Page, AI Routine Generator dashboard, and user authentication flows.

### ⚙️ Backend
- **Framework:** Built on **FastAPI** for high performance, asynchronous execution, and automatic OpenAPI documentation.
- **Architecture:** Clean, decoupled Layered Architecture (API Routers -> Service Layer -> Repository Layer) to ensure maintainability and separation of concerns.
- **Security & Auth:** Secure JWT-based Authentication with Role-Based Access Control (RBAC).
- **Roles:** Support for multiple user roles including User, Consultant, Dermatologist, and Administrator.

### 💾 Database
- **Engine:** PostgreSQL for reliable, relational data storage.
- **ORM & Migrations:** SQLAlchemy 2.0 for object-relational mapping and Alembic for version-controlled schema migrations.
- **Seeding:** Includes database seed scripts for initializing default roles, lifestyle data, and test users.

### 🤖 AI Integration
- **Personalized Planning:** Features an AI Routine Generator that utilizes user inputs (e.g., skin type, lifestyle factors, goals) to dynamically construct customized, intelligent skincare regimens.

## Project Structure
- `/frontend`: React 19 + Vite + Tailwind CSS SPA.
- `/backend`: FastAPI + SQLAlchemy + PostgreSQL REST API.
- `/docs`: Architecture, API, and Git documentation.
- `/database`: Database seed scripts and configurations (Future).

## Documentation
- [System Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [API Documentation](docs/api.md)
- [Git & Branching Strategy](docs/git_strategy.md)
- [Installation Guide](docs/installation.md)

## Quick Start
The fastest way to run this project is via Docker. See the [Installation Guide](docs/installation.md) for full instructions.

```bash
cp .env.example .env
docker-compose up -d --build
```
>>>>>>> e4df2c9 (Initial commit - AI Skincare Planner)
