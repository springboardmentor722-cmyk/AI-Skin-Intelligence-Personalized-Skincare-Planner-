# AI-Skin-Intelligence-Personalized-Skincare-Planner-
AI Skin Intelligence &amp; Personalized Skincare Planner Group 2
## 🎥 Project Demo

Click below to view the complete project demonstration:

[▶️ Watch Project Demo](https://drive.google.com/file/d/1WiQnzV4NXlQ_AU6FIjKKQDJj7pO2sKM2/view?usp=drive_link)
# Dermat - AI Skin Intelligence & Clinical Dermatology Platform

> **A full-stack, AI-powered dermatological assessment and skincare intelligence ecosystem connecting patients, skincare consultants, certified dermatologists, and administrators.**

---

## 🌟 Overview

**Dermat** is an intelligent, multi-role skincare and tele-dermatology web application. Powered by Google Gemini Vision models and clinical dermatological heuristics, it analyzes skin health from photos, identifies top dermatological concerns, formulates personalized AM/PM regimens, scans cosmetic ingredients for allergens and comedogenicity, and provides seamless tele-dermatology consultations with medical specialists.

---

## 👑 4-Role Architecture & Feature Matrix

The platform provides dedicated, custom-tailored dashboards and workflows for four distinct user roles:

```
                          ┌────────────────────────┐
                          │   Dermat Platform Hub  │
                          └───────────┬────────────┘
                                      │
       ┌──────────────────┬───────────┴───────────┬──────────────────┐
       │                  │                       │                  │
┌──────▼──────┐    ┌──────▼──────┐         ┌──────▼──────┐    ┌──────▼──────┐
│   Patient   │    │  Consultant │         │Dermatologist│    │ Super Admin │
│  Dashboard  │    │    Panel    │         │    Suite    │    │    Panel    │
└─────────────┘    └─────────────┘         └─────────────┘    └─────────────┘
```

### 1. 👤 Patient / User Dashboard
* **AI Skin Health Index**: Overall skin health score (0–100) with multidimensional metrics (Hydration, Texture, Even Tone, Elasticity, Oil Balance).
* **Interactive AM/PM Daily Ritual**: Step-by-step checklist with real-time completion status for morning protection and evening skin repair.
* **Hydration & Lifestyle Tracker**: Interactive water logger (`+` / `-` 250ml glasses) tracking towards the 2.5L daily target, plus UV index advisories.
* **Appointment Tracking**: Live status updates for pending, accepted, or confirmed doctor consultations.
* **Quick Feature Hub**: Instant access to AI Photo Scan, Personalized Routine, Dermatologist Directory, Ingredient Scanner, and Progress Timeline.

### 2. 🩺 Dermatologist (Doctor) Dashboard
* **Practice Overview**: Real-time patient volume, pending consultation triage, confirmed tele-dermatology sessions, and patient satisfaction ratings.
* **Patient Registry & Case Details**: Clinical records, photo histories, diagnosed conditions, and custom prescription notes.
* **Consultation Request Triage**: Review patient photos and requested time slots with 1-click **Accept** or **Decline**.
* **Virtual Telehealth Suite**: Integrated tele-consultation session launcher and digital prescription management.
* **Practice Availability & Slot Manager**: Toggle **Available Today** (Online/Offline), customize working days, daily hours, and slot lengths (15m, 30m, 45m, 60m).
* **Doctor Profile Management**: Customizable MD qualifications, clinic location, consultation fees, specialties, and bio.

### 3. 🌿 Skincare Consultant Dashboard
* **Client Intake Metrics**: Key performance indicators including registered clients, pending requests, and average skin improvement metrics.
* **Client Database**: Filterable client registry by skin type, concerns, and health scores.
* **Consultation Triage & Routing**: Review intake requests to provide cosmetic guidance or escalate/forward to certified Dermatologists.
* **Custom Routine Builder Studio**: Select any client, configure custom AM and PM product steps, and publish targeted routines directly to the client's dashboard.
* **Ingredient Safety Watcher**: Verify active ingredient combinations before assigning regimens to clients.

### 4. 🛡️ Super Admin Dashboard
* **Platform Operations & Health**: High-level platform telemetry: total user count, assessments conducted, active routines, platform revenue, and 99.9% uptime monitoring.
* **User & Access Management**: Search, filter, add new users with custom roles (User, Consultant, Dermatologist, Admin), and toggle active/suspended status.
* **Platform Analytics**: Graphical charts representing monthly user growth, skin type distributions, and common dermatological concerns.
* **AI Recommendation Monitoring**: Live telemetry for Google Gemini Vision inference, fallback rate, and model confidence scores.
* **System Audit & Export Logs**: Download system activity logs (CSV/JSON), review security audit trails, and manage feature flags.

---

## 🔍 AI Vision & Clinical Assessment Engine

1. **Multimodal Photo Analysis**: Powered by Google's Gemini Vision SDK (`@google/genai`) using models (`gemini-2.5-flash`, `gemini-1.5-flash`, `gemini-3.6-flash`).
2. **Clinical Concern Classification**: Evaluates Acne, Hyperpigmentation, Dehydration, Fine Lines, Texture Irregularities, and Barrier Damage.
3. **Resilient Heuristic Fallback**: Includes an in-browser pixel preprocessor and deterministic clinical fallback engine when offline or if an API key is unconfigured.

---

## 🧪 Ingredient & Safety Analyzer

* **Comedogenic Rating**: Rates pore-clogging likelihood on a scale of 0 to 5.
* **Allergen & Irritant Detection**: Flags sulfates, drying alcohols, synthetic fragrances, and essential oils.
* **Active Conflict Matrix**: Highlights conflicting ingredients (e.g., Retinol + AHA/BHA, Vitamin C + High Niacinamide concentrations) to prevent skin barrier irritation.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Lucide React |
| **Backend** | Node.js, Express, `dotenv`, esbuild |
| **AI / Vision** | Google Gen AI SDK (`@google/genai`), Gemini Vision Models |
| **Data & State** | Reactive LocalStorage / In-Memory State Sync, Custom Event Subscriptions |
| **Build Tools** | Vite 6, TSX, TypeScript Compiler |

---

## 📁 Directory Structure

```
├── server.ts                   # Express server & Gemini Vision API endpoints
├── metadata.json               # Application metadata & capabilities
├── src/
│   ├── main.tsx                # Client application entry point
│   ├── App.tsx                 # Root router & multi-role orchestration
│   ├── types.ts                # TypeScript data models & interfaces
│   ├── index.css               # Tailwind CSS v4 styling entry
│   ├── components/
│   │   ├── Navbar.tsx          # Main navigation with instant 4-dashboard switcher
│   │   ├── Footer.tsx          # Application footer
│   │   ├── BrandMark.tsx       # Vector brand logo mark
│   │   ├── UserSidebar.tsx     # Navigation sidebar for Patient portal
│   │   ├── ConsultantSidebar.tsx # Navigation sidebar for Consultant portal
│   │   └── DermatologistSidebar.tsx # Navigation sidebar for Doctor portal
│   ├── views/
│   │   ├── UserDashboard.tsx   # Patient portal (Rituals, Metrics, Hydration)
│   │   ├── DermatologistDashboardView.tsx # Doctor clinical suite
│   │   ├── ConsultantDashboardView.tsx # Skincare consultant panel
│   │   ├── AdminDashboardView.tsx # Platform administration & analytics
│   │   ├── AssessmentView.tsx  # AI Camera & Photo skin scanner
│   │   ├── RoutinePlannerView.tsx # Comprehensive AM/PM routine planner
│   │   ├── DermatologistsView.tsx # Specialist booking directory
│   │   ├── AppointmentsView.tsx # User appointment management
│   │   ├── IngredientAnalyzerView.tsx # Chemical & safety ingredient scanner
│   │   ├── ScoreView.tsx       # Detailed skin health score metrics
│   │   ├── ProgressView.tsx    # Skin progress photo timeline
│   │   ├── LoginView.tsx       # Multi-role authentication view
│   │   └── SignupView.tsx      # Member registration view
│   └── services/
│       └── db.ts               # Database service, reactive store, and event bus
```

---

## 🔑 Demo Accounts & Role Switching

You can switch between any dashboard at any time using the **"4 Dashboards"** dropdown in the navigation bar, or log in with the following default credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@gmail.com` | `****` | Full platform & user management |
| **Dermatologist** | `dr.sarah@dermat.com` | **** | Clinical appointments, patients, schedule |
| **Consultant** | `priya.consultant@dermat.com` | **** | Client intake, routine builder studio |
| **Patient / User** | `ananya@dermat.com` | **** | Personal skin scores, daily routine, appointments |

---

## 🚀 Getting Started

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Installation
```bash
# Clone repository
git clone <repository-url>
cd dermat

# Install dependencies
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
Add your **Google Gemini API Key**:
```env
GEMINI_API_KEY="YOUR-API-KEY"
```

### 4. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📋 Medical Disclaimer

*Disclaimer: This platform provides AI-assisted skincare analysis and educational recommendations. It is not intended to replace professional clinical diagnosis, prescription, or medical treatment by a licensed physician or healthcare provider.*
