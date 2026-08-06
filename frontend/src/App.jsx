import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import LoadingState from "./components/LoadingState";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import ConsultantProfile from "./pages/ConsultantProfile";
import DermatologistDashboard from "./pages/DermatologistDashboard";
import DermatologistAppointments from "./pages/DermatologistAppointments";
import DermatologistPatients from "./pages/DermatologistPatients";
import DermatologistProfile from "./pages/DermatologistProfile";
import SkinProfile from "./pages/SkinProfile";
import SkinAssessment from "./pages/SkinAssessment";
import ProductRecommendation from "./pages/ProductRecommendation";
import ProgressTracking from "./pages/ProgressTracking";
import DermatologistContact from "./pages/DermatologistContact";
import DermatologistConsultants from "./pages/DermatologistConsultants";
import ConsultantCustomers from "./pages/ConsultantCustomers";
import ConsultantDermatologists from "./pages/ConsultantDermatologists";
import AdminDashboard from "./pages/AdminDashboard";
import ConsultantRecommendations from "./pages/ConsultantRecommendations";

function Layout({ children }) {
  const location = useLocation();
  const isFullWidthPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/forgot-password";

  if (isFullWidthPage) return children;

  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">{children}</main>
    </div>
  );
}

function HomeRedirect() {
  const { token, user, authLoading } = useAuth();

  if (authLoading) return <LoadingState label="Loading your workspace…" />;
  if (!token) return <Landing />;
  if (user?.role === "administrator") return <Navigate to="/admin" replace />;
  if (user?.role === "dermatologist") return <Navigate to="/dermatologist/dashboard" replace />;
  if (user?.role === "skincare_consultant") return <Navigate to="/consultant/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Layout>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute allowedRoles={["user"]}><Dashboard /></ProtectedRoute>}
            />
            <Route
              path="/consultant/dashboard"
              element={<ProtectedRoute allowedRoles={["skincare_consultant"]}><ConsultantDashboard /></ProtectedRoute>}
            />
            <Route
              path="/consultant/profile"
              element={<ProtectedRoute allowedRoles={["skincare_consultant"]}><ConsultantProfile /></ProtectedRoute>}
            />
            <Route
              path="/consultant/customers"
              element={<ProtectedRoute allowedRoles={["skincare_consultant"]}><ConsultantCustomers /></ProtectedRoute>}
            />
            <Route
              path="/consultant/dermatologists"
              element={<ProtectedRoute allowedRoles={["skincare_consultant"]}><ConsultantDermatologists /></ProtectedRoute>}
            />
            <Route
              path="/consultant/recommendations"
              element={<ProtectedRoute allowedRoles={["skincare_consultant"]}><ConsultantRecommendations /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist/dashboard"
              element={<ProtectedRoute allowedRoles={["dermatologist"]}><DermatologistDashboard /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist/profile"
              element={<ProtectedRoute allowedRoles={["dermatologist"]}><DermatologistProfile /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist/patients"
              element={<ProtectedRoute allowedRoles={["dermatologist"]}><DermatologistPatients /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist/appointments"
              element={<ProtectedRoute allowedRoles={["dermatologist"]}><DermatologistAppointments /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist/consultants"
              element={<ProtectedRoute allowedRoles={["dermatologist"]}><DermatologistConsultants /></ProtectedRoute>}
            />
            <Route
              path="/skin-profile"
              element={<ProtectedRoute allowedRoles={["user"]}><SkinProfile /></ProtectedRoute>}
            />
            <Route
              path="/skin-assessment"
              element={<ProtectedRoute allowedRoles={["user"]}><SkinAssessment /></ProtectedRoute>}
            />
            <Route
              path="/dermatologist"
              element={<ProtectedRoute allowedRoles={["user"]}><DermatologistContact /></ProtectedRoute>}
            />
            <Route
              path="/recommendations"
              element={<ProtectedRoute allowedRoles={["user"]}><ProductRecommendation /></ProtectedRoute>}
            />
            <Route
              path="/progress"
              element={<ProtectedRoute allowedRoles={["user"]}><ProgressTracking /></ProtectedRoute>}
            />
            <Route
              path="/admin"
              element={<ProtectedRoute allowedRoles={["administrator"]}><AdminDashboard /></ProtectedRoute>}
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}
