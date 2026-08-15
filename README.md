# AI Skin Intelligence & Personalized Skincare Planner

An AI-powered skincare platform offering personalized skin assessments, weighted health scoring, ingredient clash intelligence, product recommendations, and multi-role dashboards (User, Consultant, Dermatologist, Admin).

The project demo link :https://drive.google.com/file/d/14NClfa2xkwBnyzyJHPj8ppjPs3c_YH_f/view?usp=sharing

---
# 🧴 AI Skin Intelligence & Personalized Skincare Planner

## 📌 About the Project

**AI Skin Intelligence & Personalized Skincare Planner** is an AI-powered skincare platform designed to provide personalized skincare recommendations based on an individual's **skin profile, lifestyle habits, sleep patterns, hydration, environmental exposure, and specific skin concerns**.

Unlike generic skincare recommendations, this platform analyzes multiple personal factors to understand the user's skin needs and generate a **customized skincare plan**.

The system helps users understand their skin health, identify potential skin concerns, select suitable skincare ingredients and products, build personalized skincare routines, and track their skin progress over time.

## 🎯 Objective

The main objective of this project is to develop an intelligent skincare platform that combines **Artificial Intelligence, Machine Learning, and recommendation systems** to provide personalized skincare guidance.

The platform focuses on:

* Understanding the user's individual skin profile
* Identifying and prioritizing skin concerns
* Evaluating overall skin health
* Generating personalized morning and evening skincare routines
* Analyzing skincare ingredients and their suitability
* Recommending suitable skincare products
* Tracking skincare routine adherence and progress
* Providing personalized insights through analytics and dashboards

## ✨ Key Features

### 👤 Personalized Skin Profile

Users can create a skin profile containing information such as:

* Skin type
* Age group
* Skin concerns
* Allergies and sensitivities
* Lifestyle habits
* Sleep quality
* Water intake
* Environmental exposure

This information forms the foundation for personalized recommendations.

### 🔬 AI Skin Assessment

The system analyzes the user's profile and identifies common skin concerns such as:

* Acne
* Hyperpigmentation
* Dark spots
* Dryness
* Oiliness
* Sensitivity
* Wrinkles
* Fine lines
* Redness
* Uneven skin tone

The identified concerns are prioritized to help generate more relevant skincare recommendations.

### 🧴 Personalized Skincare Routine

Based on the user's skin profile and concerns, the platform generates personalized skincare routines.

The routines can include:

* Cleansing
* Exfoliation
* Treatment
* Moisturizing
* Sun protection
* Night care

The system can provide separate **morning and evening routines**, along with weekly and seasonal skincare recommendations.

### 🧪 Ingredient Intelligence

The platform analyzes skincare ingredients and determines their suitability for different skin profiles.

It provides information about ingredients such as:

* Retinoids
* Niacinamide
* Vitamin C
* Hyaluronic Acid
* Salicylic Acid
* Ceramides
* Peptides
* AHAs and BHAs

The system can also consider allergies, sensitivities, and possible ingredient interactions when generating recommendations.

### 🛍️ Product Recommendations

The platform recommends skincare products based on the user's:

* Skin type
* Skin concerns
* Ingredient requirements
* Product suitability
* Budget preferences

It can recommend products from categories such as **face washes, moisturizers, sunscreens, serums, toners, treatments, and face masks**.

### 📊 Skin Health Score

The platform calculates an overall skin health score by considering multiple factors, including:

* Skin condition
* Lifestyle habits
* Sleep quality
* Skincare routine consistency
* Hydration

This score helps users understand their current skin health and monitor changes over time.

### 📈 Progress Tracking

Users can track their skincare journey by monitoring:

* Skin health score
* Routine adherence
* Skin improvement
* Progress trends
* Before-and-after results

The collected information can be used to provide updated and more personalized skincare recommendations.

## 👥 User Roles

The platform supports multiple types of users:

**User** – Manages their skin profile, skincare routine, products, and progress.

**Skincare Consultant** – Can view client profiles, assessments, recommendations, and progress.

**Dermatologist** – Can access patient insights, skin reports, and treatment-related recommendations.

**Administrator** – Manages users, platform analytics, recommendations, and system operations.

## 🤖 AI & Recommendation System

The intelligence layer of the platform uses **Machine Learning and recommendation techniques** to analyze user data and generate personalized insights.

The system can combine:

**User Profile + Skin Concerns + Lifestyle + Sleep + Hydration + Environment + Ingredient Information**

to generate:

**Skin Assessment → Skin Health Score → Ingredient Analysis → Product Recommendations → Personalized Skincare Routine**

## 🛠️ Technology Used

* **Frontend:** React.js, JavaScript, Next.js, Tailwind CSS
* **Backend:** Python, FastAPI
* **Database:** PostgreSQL, MongoDB
* **AI/ML:** Scikit-learn, TensorFlow, PyTorch
* **Data Processing:** Pandas, NumPy
* **Recommendation & Analytics:** XGBoost, LightGBM
* **Deployment:** Docker, AWS / Azure
* **Development Tools:** Git, GitHub, VS Code, Postman

## 🌟 Expected Outcome

The final system provides an end-to-end personalized skincare experience where users can:

**Create Profile → Assess Skin → Understand Skin Health → Get Ingredient Insights → Discover Suitable Products → Generate Personalized Routine → Track Progress**

The goal is to make skincare recommendations more **personalized, data-driven, intelligent, and adaptable** to each user's individual needs.

> **Note:** This platform is intended for skincare guidance and educational purposes and should not be considered a replacement for professional medical diagnosis or treatment.


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
