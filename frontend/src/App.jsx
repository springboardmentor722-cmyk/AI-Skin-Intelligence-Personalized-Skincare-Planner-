import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing/Landing";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Profile from "./pages/Profile/Profile";
import EditProfile from "./pages/EditProfile/EditProfile";
import CreateProfile from "./pages/CreateProfile/CreateProfile";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";
import ResetPassword from "./pages/ResetPassword/ResetPassword";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound/NotFound";

import AssessmentWizard from "./pages/Assessment/AssessmentWizard";
import Planner from "./pages/Planner/Planner";
import UserDashboard from "./pages/Dashboard/UserDashboard";
import Routine from "./pages/Routine/Routine";
import Recommendations from "./pages/Recommendations/Recommendations";
import Progress from "./pages/Progress/Progress";

import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import AdminUsers from "./pages/Dashboard/admin/AdminUsers";
import AdminAnalytics from "./pages/Dashboard/admin/AdminAnalytics";
import AdminRecommendations from "./pages/Dashboard/admin/AdminRecommendations";
import AdminReports from "./pages/Dashboard/admin/AdminReports";

import ConsultantDashboard from "./pages/Dashboard/ConsultantDashboard";
import ConsultantClients from "./pages/Dashboard/consultant/ConsultantClients";
import ConsultantAssessments from "./pages/Dashboard/consultant/ConsultantAssessments";
import ConsultantRecommendations from "./pages/Dashboard/consultant/ConsultantRecommendations";

import DermatologistDashboard from "./pages/Dashboard/DermatologistDashboard";
import DermatologistPatients from "./pages/Dashboard/dermatologist/DermatologistPatients";
import DermatologistConditionReports from "./pages/Dashboard/dermatologist/DermatologistConditionReports";
import DermatologistProgress from "./pages/Dashboard/dermatologist/DermatologistProgress";
import DermatologistTreatmentNotes from "./pages/Dashboard/dermatologist/DermatologistTreatmentNotes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Authenticated — any role */}
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/create-profile" element={<ProtectedRoute roles={["user"]}><CreateProfile /></ProtectedRoute>} />

            {/* Milestone 2 — user role */}
            <Route path="/dashboard" element={<ProtectedRoute roles={["user"]}><UserDashboard /></ProtectedRoute>} />
            <Route path="/routine" element={<ProtectedRoute roles={["user"]}><Routine /></ProtectedRoute>} />
            <Route path="/recommendations" element={<ProtectedRoute roles={["user"]}><Recommendations /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute roles={["user"]}><Progress /></ProtectedRoute>} />
            <Route path="/assessment" element={<ProtectedRoute roles={["user"]}><AssessmentWizard /></ProtectedRoute>} />
            <Route path="/planner" element={<ProtectedRoute roles={["user"]}><Planner /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute roles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute roles={["admin"]}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute roles={["admin"]}><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin/recommendations" element={<ProtectedRoute roles={["admin"]}><AdminRecommendations /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute roles={["admin"]}><AdminReports /></ProtectedRoute>} />

            {/* Consultant */}
            <Route path="/consultant" element={<ProtectedRoute roles={["consultant"]}><ConsultantDashboard /></ProtectedRoute>} />
            <Route path="/consultant/clients" element={<ProtectedRoute roles={["consultant"]}><ConsultantClients /></ProtectedRoute>} />
            <Route path="/consultant/assessments" element={<ProtectedRoute roles={["consultant"]}><ConsultantAssessments /></ProtectedRoute>} />
            <Route path="/consultant/recommendations" element={<ProtectedRoute roles={["consultant"]}><ConsultantRecommendations /></ProtectedRoute>} />

            {/* Dermatologist */}
            <Route path="/dermatologist" element={<ProtectedRoute roles={["dermatologist"]}><DermatologistDashboard /></ProtectedRoute>} />
            <Route path="/dermatologist/patients" element={<ProtectedRoute roles={["dermatologist"]}><DermatologistPatients /></ProtectedRoute>} />
            <Route path="/dermatologist/reports" element={<ProtectedRoute roles={["dermatologist"]}><DermatologistConditionReports /></ProtectedRoute>} />
            <Route path="/dermatologist/progress" element={<ProtectedRoute roles={["dermatologist"]}><DermatologistProgress /></ProtectedRoute>} />
            <Route path="/dermatologist/notes" element={<ProtectedRoute roles={["dermatologist"]}><DermatologistTreatmentNotes /></ProtectedRoute>} />

            {/* 404 — must stay last */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
