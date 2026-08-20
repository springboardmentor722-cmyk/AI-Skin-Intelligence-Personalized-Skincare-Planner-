# AI Skin Intelligence & Personalized Skincare Planner
## 🎥 Project Demo

Watch the complete application workflow:

👉 [Click here to watch the project demonstration](https://drive.google.com/file/d/1zzlzVfoYGho7oaVARqlxZtUo8gk7773M/view?usp=sharing)
## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- Tailwind CSS
- JavaScript

### Backend
- Python
- FastAPI
- Uvicorn
- SQLAlchemy

### Database
- MySQL

### AI
- Google Gemini API
- Generative AI
- AI-assisted skin assessment
- AI-assisted professional report generation

### Authentication & Security
- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)
- Environment-based secrets

### Development Tools
- Git
- GitHub
- VS Code
- Postman
## ✨ Key Features

### 👤 User Features
- Secure registration and login
- Password visibility toggle
- Personalized skin profile
- Lifestyle tracking
- AI-powered skin assessment
- Personalized skincare recommendations
- Product and ingredient information
- Progress tracking
- Consultation requests
- Notifications
- View professional reports

### 🤖 AI Features
- AI-powered skin assessment
- AI-generated skincare guidance
- AI-assisted professional report generation
- Editable AI-generated reports
- Gemini API integration

### 👨‍⚕️ Consultant & Dermatologist Features
- View assigned users
- View user skin profiles
- View lifestyle and assessment information
- Review consultation cases
- Create reports manually
- Generate reports using AI
- Edit AI-generated drafts
- Save reports
- Send reports to users
- Generate PDF reports

### 👨‍💼 Admin Features
- User management
- Consultant/dermatologist approval
- Product management
- Ingredient management
- Catalog management
- Dashboard statistics
                ┌──────────────────────┐
                │      React + Vite    │
                │      Frontend        │
                └──────────┬───────────┘
                           │ REST API
                           ▼
                ┌──────────────────────┐
                │       FastAPI        │
                │       Backend        │
                └───────┬───────┬──────┘
                        │       │
              ┌─────────┘       └──────────┐
              ▼                            ▼
       ┌──────────────┐            ┌──────────────┐
       │    MySQL     │            │ Gemini API   │
       │   Database   │            │ AI Services  │
       └──────────────┘            └──────────────┘

## 🔄 Application Workflow

1. User registers and logs into the platform.
2. User completes their skin profile and lifestyle information.
3. The AI analyzes the available profile information.
4. The system generates skincare guidance and routines.
5. Users can explore personalized products and ingredients.
6. Users can request a consultation.
7. Consultants or dermatologists review assigned users.
8. Professionals can create reports manually or generate AI-assisted drafts.
9. AI-generated drafts can be reviewed and edited before saving.
10. The professional sends the finalized report to the user.
11. Users receive the report through the application.
12. Administrators manage users, products, ingredients, and approvals.

## 🔐 Security

- JWT-based authentication
- Role-Based Access Control (RBAC)
- Password hashing
- Environment-based database credentials
- Environment-based JWT secret
- Environment-based Gemini API key
- Safe user response DTOs
- Password hashes excluded from API responses
- Assignment-based consultant/dermatologist access
- User-isolated notifications
- Protected report access
- Protected uploaded skin-image access

## 🚀 Installation

### 1. Clone the repository

git clone <your-repository-url>

cd AI_Skin_Intelligence

### 2. Backend setup

cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

### 3. Configure environment variables

Create:

backend/.env

Add:

DATABASE_URL=your_database_url
JWT_SECRET=your_secret
GEMINI_API_KEY=your_gemini_api_key

### 4. Start the backend

uvicorn main:app --reload

### 5. Frontend setup

cd frontend

npm install

npm run dev

## 🔮 Future Enhancements

- Advanced skin-image analysis
- Secure cloud-based image storage
- Improved AI personalization
- Mobile application
- Automated progress insights
- Advanced analytics dashboard
- Performance optimization and frontend bundle splitting

