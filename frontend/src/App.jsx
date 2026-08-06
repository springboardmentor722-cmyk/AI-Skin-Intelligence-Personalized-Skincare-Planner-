import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/Authcontext";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Landing from "./pages/Landing/Landing";
import Dashboard from "./pages/Dashboard/Dashboard";
import SkinProfileWizard from "./pages/SkinProfile/SkinProfileWizard";
import SkinAssessment from "./pages/SkinAssessment/SkinAssessment";
import ImageAnalysis from "./pages/SkinAssessment/ImageAnalysis";
import Lifestyle from "./pages/Lifestyle/Lifestyle";
import Routine from "./pages/Routine/Routine";
import ProductRecommendation from "./pages/ProductRecommendations/ProductRecommendations";
import Ingredients from "./pages/Ingredients/Ingredients";
import Progress from "./pages/Progress/Progress";
import BeforeAfterPage from "./pages/BeforeAfter/BeforeAfterPage";
import AnalysisHistory from "./pages/AnalysisHistory/AnalysisHistory";
import AnalyticsPage from "./pages/Analytics/AnalyticsPage";
import Reports from "./pages/Reports/Reports";
import Settings from "./pages/Settings/Settings";
import Profile from "./pages/Profile/Profile";
import Notifications from "./pages/Notifications/Notifications";
import About from "./pages/About/About";
import Contact from "./pages/Contact/Contact";
import ConsultantDashboard from "./pages/Consultant/ConsultantDashboard";
import DermatologistDashboard from "./pages/Dermatologist/DermatologistDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ConsultantsPublic from "./pages/Consultant/ConsultantsPublic";
import ConsultantRegister from "./pages/Consultant/ConsultantRegister";
import DermatologistsPublic from "./pages/Dermatologist/DermatologistsPublic";
import DermatologistRegister from "./pages/Dermatologist/DermatologistRegister";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

// Wrapper to render layouts conditionally
function DashboardPageWrapper({ children }) {
  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Enterprise Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/consultants" element={<ConsultantsPublic />} />
          <Route path="/consultant-register" element={<ConsultantRegister />} />
          <Route path="/dermatologists" element={<DermatologistsPublic />} />
          <Route path="/dermatologist-register" element={<DermatologistRegister />} />

          {/* Protected Dashboard / SaaS Action Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["user", "consultant", "dermatologist", "admin"]}>
                <DashboardPageWrapper>
                  <Dashboard />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skin-profile"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <SkinProfileWizard />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skin-assessment"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <SkinAssessment />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/assessment"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <SkinAssessment />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/image-analysis"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <ImageAnalysis />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lifestyle"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <Lifestyle />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/routine"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <Routine />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/product-recommendation"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <ProductRecommendation />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ingredients"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <Ingredients />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={["user", "admin"]}>
                <DashboardPageWrapper>
                  <Progress />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/before-after"
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "consultant", "dermatologist"]}>
                <DashboardPageWrapper>
                  <BeforeAfterPage />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis-history"
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "consultant", "dermatologist"]}>
                <DashboardPageWrapper>
                  <AnalysisHistory />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "consultant", "dermatologist"]}>
                <DashboardPageWrapper>
                  <AnalyticsPage />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={["user", "admin", "consultant", "dermatologist"]}>
                <DashboardPageWrapper>
                  <Reports />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={["user", "consultant", "dermatologist", "admin"]}>
                <DashboardPageWrapper>
                  <Profile />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute allowedRoles={["user", "consultant", "dermatologist", "admin"]}>
                <DashboardPageWrapper>
                  <Notifications />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute allowedRoles={["user", "consultant", "dermatologist", "admin"]}>
                <DashboardPageWrapper>
                  <Settings />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Specialist Workspaces */}
          <Route
            path="/consultant-dashboard"
            element={
              <ProtectedRoute allowedRoles={["user", "consultant", "admin"]}>
                <DashboardPageWrapper>
                  <ConsultantDashboard />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist-dashboard"
            element={
              <ProtectedRoute allowedRoles={["user", "dermatologist", "admin"]}>
                <DashboardPageWrapper>
                  <DermatologistDashboard />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Admin Panel */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DashboardPageWrapper>
                  <AdminDashboard />
                </DashboardPageWrapper>
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;