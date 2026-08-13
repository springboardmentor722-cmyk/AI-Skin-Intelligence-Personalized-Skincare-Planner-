# AI Skin Intelligence & Personalized Skincare Planner

An AI-powered skincare platform offering personalized skin assessments, weighted health scoring, ingredient clash intelligence, product recommendations, and multi-role dashboards (User, Consultant, Dermatologist, Admin).

> **Note on Visual Design**: Strictly vector illustrated UI — **No photographs of human faces or dermatologists** are included. All skin classifications use clean vector SVG icons, dynamic gauge meters, and structured cards.

---

## 🛠️ Step-by-Step Instructions to Run in Visual Studio Code (VS Code)

### Prerequisites
- Install **Node.js** (version 18.0 or higher) on your machine.
- Install **Visual Studio Code** (VS Code).

---

### Step 1: Open Project in VS Code
1. Open Visual Studio Code.
2. Click **File > Open Folder...** and select the root directory of this project (`skin-intelligence-planner`).

---

### Step 2: Open Terminal in VS Code
1. In VS Code, open the integrated terminal by pressing `Ctrl + ~` (or `Cmd + ~` on macOS).
2. Alternatively, go to **Terminal > New Terminal** from the top menu bar.

---

### Step 3: Install Project Dependencies
In the VS Code terminal, run:
```bash
npm install
```
*This installs React, Tailwind CSS, Lucide Icons, and build tooling.*

---

### Step 4: Run Development Server
In the VS Code terminal, run:
```bash
npm run dev
```
- Open your browser and navigate to: **`http://localhost:3000`**
- You will see the application running live with full interactivity!

---

### Step 5: Production Build (Optional)
To test the production build:
```bash
npm run build
```

---

## 🚀 Key Modules & Capabilities

1. **Role-Based Portals**:
   - 👤 **User Portal**: Multi-step Assessment Wizard, Weighted Health Gauge (0-100), AM/PM Daily Checklist with live task toggles, Progress Trajectory Timeline, Report Export.
   - 🩺 **Consultant Portal**: Searchable Client Roster, Adherence Tracking, Recommendation Override Controls.
   - 🔬 **Dermatologist Portal**: Clinical Patient Insights, Severity Trends, Prescription Overwrites.
   - ⚙️ **Admin Portal**: System Health, RBAC Management, Recommendation Engine Audit Logs.

2. **Core Technical Engines**:
   - **Weighted Scoring Engine**: Calculates score via $Score = 0.35(C) + 0.20(L) + 0.15(S) + 0.20(A) + 0.10(H)$.
   - **Ingredient Intelligence Engine**: INCI text parser, chemical conflict matrix, allergen matching, and educational active database.
   - **Product Recommendation Engine**: Hard-filter safety gate, 3-stage suitability scoring (50% Concern Match, 35% Skin Type Fit, 15% Rating), budget dupe finder, and side-by-side comparison modal.
   - **Safety Guardrails**: Auto-swaps harsh exfoliants/retinoids for gentle soothing actives (Centella Asiatica / Azelaic Acid) on sensitive profiles.
