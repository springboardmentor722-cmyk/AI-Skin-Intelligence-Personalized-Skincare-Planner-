# AI-Skin-Intelligence-Personalized-Skincare-Planner-
AI Skin Intelligence &amp; Personalized Skincare Planner Group 2

# AI Skin Intelligence

An AI-powered skin health platform that combines **artificial intelligence, dermatologist consultation, lifestyle tracking, and personalized skincare recommendations** to help users monitor and improve their skin health.

The platform provides a complete ecosystem that allows users to analyze skin conditions, connect with healthcare professionals, track daily activities, and follow personalized treatment plans through a single web application.

---

## Features

### AI-Based Skin Analysis

* Upload and analyze skin images
* AI-assisted skin condition detection
* Personalized skincare recommendations
* Skin assessment and reporting

### User Management

* Secure user registration and authentication
* Role-based access control
* User profile management
* Protected routes and session management

### Consultant Module

* Dedicated consultant dashboard
* Client progress monitoring
* Daily activity tracking
* Lifestyle assessment review

### Dermatologist Module

* Separate dermatologist dashboard
* Patient management
* Skin assessment review
* Treatment recommendation management

### Daily Planner

* Daily skincare routine tracking
* Activity monitoring
* Lifestyle logging
* Progress visualization

### Administrative Dashboard

* User management
* System monitoring
* Platform administration
* Service management

---

## Technology Stack

### Frontend

* React
* Vite
* JavaScript
* HTML5
* CSS3
* Axios
* React Router

### Backend

* Python
* REST API
* Authentication and authorization
* Middleware-based request handling

### Database

* PostgreSQL
* MongoDB
---

## Project Structure

```text
AI_Skin_Intelligence
│
├── backend/
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   └── styles/
│
├── database/
│   └── schema.sql
│
├── .env.example
├── .gitignore
└── README.md
```

## Installation

### Clone the repository

```bash
git clone <repository-url>
cd AI_Skin_Intelligence
```

### Backend Setup

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate the virtual environment:

**Windows**

```bash
.venv\Scripts\activate
```

**Linux/macOS**

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Configure the environment variables:

```bash
cp .env.example .env
```

Start the backend server:

```bash
python main.py
```

---

### Database Setup

Create a PostgreSQL database.

Execute the SQL script:

```bash
psql -U postgres -d ai_skin_intelligence -f database/schema.sql
```

---

### Frontend Setup

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

---

## User Roles

| Role          | Access                                           |
| ------------- | ------------------------------------------------ |
| User          | Skin analysis, profile management, daily planner |
| Consultant    | Client monitoring and lifestyle tracking         |
| Dermatologist | Patient assessment and treatment management      |
| Administrator | User and system management                       |

---

## Contributors

Developed as part of the Infosys Springboard's Virtual Internship **AI Skin Intelligence & Personalized Skincare Planner** project.

---

## License

This project is intended for educational and research purposes.
