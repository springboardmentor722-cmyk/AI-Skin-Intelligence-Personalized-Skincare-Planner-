import { useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import WelcomePage from "./pages/WelcomePage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RoleSelectionPage from "./pages/RoleSelectionPage";
import RegisterPage from "./pages/RegisterPage";
import SkinAssessmentPage from "./pages/SkinAssessmentPage";
import UserDashboard from "./pages/UserDashboard";
import SkinProfilePage from "./pages/SkinProfilePage";
import ProductRecommendationPage from "./pages/ProductRecommendationPage";
import ProgressTrackingPage from "./pages/ProgressTrackingPage";
import PendingApprovalPage from "./pages/PendingApprovalPage";
import DermatologistApplicationPage from "./pages/DermatologistApplicationPage";
import ConsultantApplicationPage from "./pages/ConsultantApplicationPage";
import { loginUser, registerUser, logout as apiLogout } from "./api/auth";
import { getSkinProfile, updateSkinProfile } from "./api/profile";

import ExpertDashboardPage from "./pages/ExpertDashboardPage";
import ExpertPatientsPage from "./pages/ExpertPatientsPage";
import ExpertAssessmentsPage from "./pages/ExpertAssessmentsPage";
import ExpertConsultationsPage from "./pages/ExpertConsultationsPage";
import ExpertTreatmentsPage from "./pages/ExpertTreatmentsPage";
import ExpertPrescriptionsPage from "./pages/ExpertPrescriptionsPage";
import ExpertInsightsPage from "./pages/ExpertInsightsPage";
import ExpertMessagesPage from "./pages/ExpertMessagesPage";
import ExpertReportsPage from "./pages/ExpertReportsPage";

import AdminDashboardPage from "./pages/AdminDashboardPage";
import ConsultantDashboardPage from "./pages/ConsultantDashboardPage";
import ConsultantClientsPage from "./pages/ConsultantClientsPage";
import ConsultantAppointmentsPage from "./pages/ConsultantAppointmentsPage";
import ConsultantAssessmentsPage from "./pages/ConsultantAssessmentsPage";
import ConsultantRoutinesPage from "./pages/ConsultantRoutinesPage";
import ConsultantRoutineEditPage from "./pages/ConsultantRoutineEditPage";
import ConsultantProductsPage from "./pages/ConsultantProductsPage";
import ConsultantProductRecommendPage from "./pages/ConsultantProductRecommendPage";
import ConsultantMessagesPage from "./pages/ConsultantMessagesPage";
import ConsultantReportsPage from "./pages/ConsultantReportsPage";
import ConsultantFollowUpsPage from "./pages/ConsultantFollowUpsPage";
import ConsultantRemindersPage from "./pages/ConsultantRemindersPage";

import DailyPlannerDashboard from "./pages/DailyPlannerDashboard";
import IngredientAnalyzerPage from "./pages/IngredientAnalyzerPage";
import LifestyleHabitsPage from "./pages/LifestyleHabitsPage";
import ReportsPage from "./pages/ReportsPage";
import RemindersPage from "./pages/RemindersPage";

import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";
import ConsultantLayout from "./components/layouts/ConsultantLayout";
import ExpertLayout from "./components/layouts/ExpertLayout";
import DashboardPlaceholder from "./components/DashboardPlaceholder";

import AdminUsersPage from "./pages/AdminUsersPage";
import AdminProductsPage from "./pages/AdminProductsPage";
import AdminRulesPage from "./pages/AdminRulesPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminSecurityPage from "./pages/AdminSecurityPage";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import AdminApiPage from "./pages/AdminApiPage";
import AdminSettingsPage from "./pages/AdminSettingsPage";
import SettingsPage from "./pages/SettingsPage";
import ExpertSettingsPage from "./pages/ExpertSettingsPage";

const queryClient = new QueryClient();

const ROLE_DASHBOARD_ROUTES = {
  user: "/user/dashboard",
  admin: "/admin/dashboard",
  consultant: "/consultant/dashboard",
  dermatologist: "/expert/dashboard",
};

function getDashboardPathForRole(role) {
  const key = (role || "user").toLowerCase();
  return ROLE_DASHBOARD_ROUTES[key] || "/dashboard";
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (e) {
    return null;
  }
}

function ProtectedRoute({ children, requiredRole }) {
  const user = getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  const role = (user.role || "").toLowerCase();
  if (requiredRole && role !== requiredRole.toLowerCase()) {
    return <Navigate to={getDashboardPathForRole(role)} replace />;
  }
  return children;
}

function WelcomeRoute() {
  const navigate = useNavigate();
  return <WelcomePage onGetStarted={() => navigate("/login")} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  return (
    <LoginPage
      onSignIn={async ({ email, password }) => {
        const u = await loginUser({ email, password });
        navigate(getDashboardPathForRole(u.role));
      }}
      onNavigateRegister={() => navigate("/role-select")}
    />
  );
}

function RoleSelectRoute({ onSelectRole }) {
  const navigate = useNavigate();
  return (
    <RoleSelectionPage
      onSelectRole={(role) => {
        onSelectRole(role);
        navigate("/register");
      }}
      onBack={() => navigate("/login")}
    />
  );
}

function RegisterRoute({ selectedRole }) {
  const navigate = useNavigate();
  return (
    <RegisterPage
      role={selectedRole}
      onRegister={async (data) => {
        await registerUser(data);
        const u = await loginUser({ email: data.email, password: data.password });
        if (u.role === 'user') navigate("/assessment");
        else navigate("/pending-approval");
      }}
      onNavigateLogin={() => navigate("/login")}
      onChangeRole={() => navigate("/role-select")}
    />
  );
}

function AssessmentRoute() {
  const navigate = useNavigate();
  return (
    <SkinAssessmentPage
      onComplete={() => navigate("/user/dashboard")}
      onSkip={() => navigate("/user/dashboard")}
    />
  );
}

export default function App() {
  const [selectedRole, setSelectedRole] = useState("user");

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomeRoute />} />
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/role-select" element={<RoleSelectRoute onSelectRole={setSelectedRole} />} />
          <Route path="/register" element={<RegisterRoute selectedRole={selectedRole} />} />
          
          <Route path="/pending-approval" element={<PendingApprovalPage />} />
          <Route path="/apply/dermatologist" element={<DermatologistApplicationPage />} />
          <Route path="/apply/consultant" element={<ConsultantApplicationPage />} />
          <Route path="/assessment" element={<AssessmentRoute />} />

          {/* User Routes */}
          <Route path="/user" element={<ProtectedRoute requiredRole="user"><UserLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="profile" element={<SkinProfilePage fetchProfile={getSkinProfile} updateProfile={updateSkinProfile} />} />
            <Route path="products" element={<ProductRecommendationPage />} />
            <Route path="progress" element={<ProgressTrackingPage />} />
            <Route path="daily-planner" element={<DailyPlannerDashboard />} />
            <Route path="analyzer" element={<IngredientAnalyzerPage />} />
            <Route path="lifestyle" element={<LifestyleHabitsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reminders" element={<RemindersPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<AdminDashboardPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="rules" element={<AdminRulesPage />} />
            <Route path="analytics" element={<AdminAnalyticsPage />} />
            <Route path="security" element={<AdminSecurityPage />} />
            <Route path="verification" element={<AdminVerificationPage />} />
            <Route path="api" element={<AdminApiPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>

          {/* Consultant Routes */}
          <Route path="/consultant" element={<ProtectedRoute requiredRole="consultant"><ConsultantLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<ConsultantDashboardPage />} />
            <Route path="clients" element={<ConsultantClientsPage />} />
            <Route path="appointments" element={<ConsultantAppointmentsPage />} />
            <Route path="assessments" element={<ConsultantAssessmentsPage />} />
            <Route path="routines" element={<ConsultantRoutinesPage />} />
            <Route path="routines/edit/:routineId" element={<ConsultantRoutineEditPage />} />
            <Route path="products" element={<ConsultantProductsPage />} />
            <Route path="products/recommend/:clientId" element={<ConsultantProductRecommendPage />} />
            <Route path="messages" element={<ConsultantMessagesPage />} />
            <Route path="reports" element={<ConsultantReportsPage />} />
            <Route path="follow-ups" element={<ConsultantFollowUpsPage />} />
            <Route path="reminders" element={<ConsultantRemindersPage />} />
            <Route path="settings" element={<DashboardPlaceholder title="Consultant Settings" />} />
          </Route>

          {/* Expert (Dermatologist) Routes */}
          <Route path="/expert" element={<ProtectedRoute requiredRole="dermatologist"><ExpertLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<ExpertDashboardPage />} />
            <Route path="patients" element={<ExpertPatientsPage />} />
            <Route path="assessments" element={<ExpertAssessmentsPage />} />
            <Route path="consultations" element={<ExpertConsultationsPage />} />
            <Route path="treatments" element={<ExpertTreatmentsPage />} />
            <Route path="prescriptions" element={<ExpertPrescriptionsPage />} />
            <Route path="insights" element={<ExpertInsightsPage />} />
            <Route path="messages" element={<ExpertMessagesPage />} />
            <Route path="reports" element={<ExpertReportsPage />} />
            <Route path="settings" element={<ExpertSettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}