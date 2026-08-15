// frontend/src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfessionalRegister from './pages/ProfessionalRegister';
import ForgotPassword from './pages/ForgotPassword';
import MyProfile from './pages/MyProfile';
import SkinAssessment from './pages/SkinAssessment';
import MyDashboard from './pages/MyDashboard';
import MyRoutine from './pages/MyRoutine';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Progress from './pages/Progress';
import PhotoUpload from './pages/PhotoUpload';
import IngredientAnalyzer from './pages/IngredientAnalyzer';
import AiAnalysis from './pages/AiAnalysis';
import SimpleCamera from './pages/SimpleCamera';
import Professionals from './pages/Professionals';
import ConsultantDashboard from './pages/ConsultantDashboard';
import ConsultantProfile from './pages/ConsultantProfile';
import ConsultantClients from './pages/ConsultantClients';
import ConsultantAssessments from './pages/ConsultantAssessments';
import ConsultantRoutines from './pages/ConsultantRoutines';
import ConsultantRecommend from './pages/ConsultantRecommend';
import ConsultantProgress from './pages/ConsultantProgress';
import ConsultantReports from './pages/ConsultantReports';
import ConsultantFollowups from './pages/ConsultantFollowups';
import ConsultantReminders from './pages/ConsultantReminders';
import ConsultantSkinConcernsGuide from './pages/ConsultantSkinConcernsGuide';
import DermatologistDashboard from './pages/DermatologistDashboard';
import DermatologistProfile from './pages/DermatologistProfile';
import DermatologistPrescriptions from './pages/DermatologistPrescriptions';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';
import AdminRolePermissions from './pages/AdminRolePermissions';
import AdminAssessments from './pages/AdminAssessments';
import AdminRoutines from './pages/AdminRoutines';
import AdminProducts from './pages/AdminProducts';
import AdminReports from './pages/AdminReports';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/register/professional" element={<ProfessionalRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Camera Test Route */}
        <Route path="/simple-camera" element={<SimpleCamera />} />
        
        {/* User Routes */}
        <Route path="/profile" element={<MyProfile />} />
        <Route path="/assessment" element={<SkinAssessment />} />
        <Route path="/dashboard" element={<MyDashboard />} />
        <Route path="/routine" element={<MyRoutine />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/photo-upload" element={<PhotoUpload />} />
        <Route path="/ingredient-analyzer" element={<IngredientAnalyzer />} />
        <Route path="/ai-analysis" element={<AiAnalysis />} />
        <Route path="/professionals" element={<Professionals />} />
        
        {/* Consultant Routes */}
        <Route path="/dashboard/consultant" element={<ConsultantDashboard />} />
        <Route path="/consultant/profile" element={<ConsultantProfile />} />
        <Route path="/consultant/clients" element={<ConsultantClients />} />
        <Route path="/consultant/assessments" element={<ConsultantAssessments />} />
        <Route path="/consultant/routines" element={<ConsultantRoutines />} />
        <Route path="/consultant/recommend" element={<ConsultantRecommend />} />
        <Route path="/consultant/progress" element={<ConsultantProgress />} />
        <Route path="/consultant/reports" element={<ConsultantReports />} />
        <Route path="/consultant/followups" element={<ConsultantFollowups />} />
        <Route path="/consultant/reminders" element={<ConsultantReminders />} />
        <Route path="/consultant/skin-concerns-guide" element={<ConsultantSkinConcernsGuide />} />
        
        {/* Dermatologist Routes */}
        <Route path="/dashboard/dermatologist" element={<DermatologistDashboard />} />
        <Route path="/dermatologist/profile" element={<DermatologistProfile />} />
        <Route path="/dermatologist/prescriptions" element={<DermatologistPrescriptions />} />
        
        {/* Dermatologist Routes - Reused from Consultant */}
        <Route path="/dermatologist/patients" element={<ConsultantClients />} />
        <Route path="/dermatologist/assessments" element={<ConsultantAssessments />} />
        <Route path="/dermatologist/treatment-plans" element={<ConsultantRoutines />} />
        <Route path="/dermatologist/progress" element={<ConsultantProgress />} />
        <Route path="/dermatologist/clinical-insights" element={<ConsultantReports />} />
        <Route path="/dermatologist/reports" element={<ConsultantReports />} />
        <Route path="/dermatologist/consultations" element={<ConsultantFollowups />} />
        <Route path="/dermatologist/followups" element={<ConsultantFollowups />} />
        <Route path="/dermatologist/reminders" element={<ConsultantReminders />} />
        <Route path="/dermatologist/skin-conditions-guide" element={<ConsultantSkinConcernsGuide />} />
        
        {/* Admin Routes */}
        <Route path="/dashboard/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/role-permissions" element={<AdminRolePermissions />} />
        <Route path="/admin/assessments" element={<AdminAssessments />} />
        <Route path="/admin/routines" element={<AdminRoutines />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;