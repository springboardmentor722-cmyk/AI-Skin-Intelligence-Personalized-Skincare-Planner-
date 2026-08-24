# AI-Skin-Intelligence-Personalized-Skincare-Planner-
AI Skin Intelligence &amp; Personalized Skincare Planner Group 2

# AI Skin Intelligence & Personalized Skincare Planner

An AI-powered skincare platform that analyzes a user's skin profile, lifestyle, and uploaded photos to generate personalized routines, ingredient-safe product recommendations, and progress tracking — with dedicated portals for consultants, dermatologists, and admins.

Built as the primary deliverable for an Infosys Springboard internship.

## ✨ Features

For Users
- Secure registration/login with JWT authentication
- Multi-step skin assessment (skin type, concerns, lifestyle, hydration, sleep)
- AI Skin Analysis — upload or capture a photo; a trained model detects skin concerns (acne, pigmentation, wrinkles, pores, etc.)
- Personalized AM/PM/Weekly routine with a daily checklist
- Skin Health Score (0–100) from a weighted scoring model
- Ingredient Intelligence Engine — flags allergy matches and unsafe ingredient combinations
- Product Recommendation Engine — ranks products by concern match, skin type fit, and rating
- Progress tracking: routine adherence, score history, before/after photos
- Connect with verified Consultants/Dermatologists
- PDF export of dashboard summary

For Consultants & Dermatologists
- Credential-based registration, approved by Admin before activation
- Client/patient roster with real assessment history
- Review workflow: view profile, assessment, AI results, submit recommendations
- Routine/treatment plan editor
- Dermatologist-only prescriptions module

For Admins
- Platform-wide dashboard (real user, assessment, and product counts)
- Pending professional approval queue
- User and product management

## 🏗️ Tech Stack

 Frontend : React.js 
 
 Backend : Python, FastAPI 
 
 Database : PostgreSQL 
 
 Auth : JWT, role-based access control 
 
 AI/ML : EfficientNet-B0 (transfer learning) for skin concern classification 
 
 Charts : Chart.js 


## 🧠 How the AI Analysis Works

1. User uploads or captures a photo
2. An EfficientNet-B0 model, fine-tuned on a labeled skin-concern image dataset (~86% validation accuracy), classifies the detected skin concern
3. Results feed into the same Ingredient Intelligence + Product Recommendation engines used for self-reported concerns
4. Results are saved and shown on the user's dashboard, tagged as AI-sourced

This is an AI-assisted estimator meant to support — not replace — professional dermatological advice, hence the built-in pathway to a verified Consultant or Dermatologist.

## 📊 Core Scoring Models

Skin Health Score: Skin Condition 35% · Lifestyle 20% · Routine Consistency 20% · Sleep Quality 15% · Hydration 10%

Product Match: Target Concern Match 50% · Skin Type Fit 35% · Rating 15%


Watch the Project Screen Recording : https://drive.google.com/file/d/16qm_Ra9vbL_NyTel3xZZa2c09YDc2sQr/view?usp=sharing
