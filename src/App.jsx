import { Routes, Route } from "react-router-dom";

import PublicLayout from "./components/PublicLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import SkinProfile from "./pages/SkinProfile";
import Lifestyle from "./pages/Lifestyle";
import Assessment from "./pages/Assessment";
import DailyPlanner from "./pages/DailyPlanner";
import Bookings from "./pages/Bookings";
import Store from "./pages/Store";
import Progress from "./pages/Progress";
import NotFound from "./pages/NotFound";

import UserDashboard from "./pages/UserDashboard";
import ConsultantDashboard from "./pages/ConsultantDashboard";
import DermatologistDashboard from "./pages/DermatologistDashboard";
import ClientsList from "./pages/ClientsList";
import ClientProfile from "./pages/ClientProfile";
import Recommendations from "./pages/Recommendations";
import PatientsList from "./pages/PatientsList";
import PatientRecord from "./pages/PatientRecord";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminSystemStatus from "./pages/AdminSystemStatus";
import AdminRecommendations from "./pages/AdminRecommendations";
import AdminActivityLogs from "./pages/AdminActivityLogs";
import PlaceholderPage from "./pages/PlaceholderPage";
import { ADMIN_SIDEBAR, CONSULTANT_SIDEBAR, DERMATOLOGIST_SIDEBAR, USER_SIDEBAR } from "./config/sidebarConfig";

const ROLE_USER = "User";
const ROLE_CONSULTANT = "Skincare Consultant";
const ROLE_DERMATOLOGIST = "Dermatologist";
const ROLE_ADMIN = "Administrator";

/** Wraps a page in the User dashboard shell (sidebar + main content area). */
function UserPageShell({ children }) {
  return (
    <DashboardLayout items={USER_SIDEBAR} roleLabel="User">
      {children}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <Routes>
      {/* ---------------- Public routes ---------------- */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* ---------------- User routes ---------------- */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assessment"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <Assessment />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/planner"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <DailyPlanner />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserPageShell>
              <Profile />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/skin-profile"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <SkinProfile />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lifestyle"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <Lifestyle />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <Bookings />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/store"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <Store />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/progress"
        element={
          <ProtectedRoute allowedRoles={[ROLE_USER]}>
            <UserPageShell>
              <Progress />
            </UserPageShell>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PlaceholderPage
              items={USER_SIDEBAR}
              roleLabel="Account"
              title="Settings"
              description="Account and notification settings ship in a future milestone."
            />
          </ProtectedRoute>
        }
      />

      {/* ---------------- Consultant routes ---------------- */}
      <Route
        path="/consultant/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_CONSULTANT]}>
            <ConsultantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultant/clients"
        element={
          <ProtectedRoute allowedRoles={[ROLE_CONSULTANT]}>
            <ClientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultant/clients/:clientId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_CONSULTANT]}>
            <ClientProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultant/recommendations"
        element={
          <ProtectedRoute allowedRoles={[ROLE_CONSULTANT]}>
            <Recommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/consultant/analytics"
        element={
          <ProtectedRoute allowedRoles={[ROLE_CONSULTANT]}>
            <PlaceholderPage items={CONSULTANT_SIDEBAR} roleLabel="Skincare Consultant" title="Analytics" />
          </ProtectedRoute>
        }
      />

      {/* ---------------- Dermatologist routes ---------------- */}
      <Route
        path="/dermatologist/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_DERMATOLOGIST]}>
            <DermatologistDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dermatologist/patients"
        element={
          <ProtectedRoute allowedRoles={[ROLE_DERMATOLOGIST]}>
            <PatientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dermatologist/patients/:patientId"
        element={
          <ProtectedRoute allowedRoles={[ROLE_DERMATOLOGIST]}>
            <PatientRecord />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dermatologist/reports"
        element={
          <ProtectedRoute allowedRoles={[ROLE_DERMATOLOGIST]}>
            <PlaceholderPage items={DERMATOLOGIST_SIDEBAR} roleLabel="Dermatologist" title="Reports" />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dermatologist/ai-diagnosis"
        element={
          <ProtectedRoute allowedRoles={[ROLE_DERMATOLOGIST]}>
            <PlaceholderPage items={DERMATOLOGIST_SIDEBAR} roleLabel="Dermatologist" title="AI Diagnosis" />
          </ProtectedRoute>
        }
      />

      {/* ---------------- Administrator routes ---------------- */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/recommendations"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <AdminRecommendations />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <PlaceholderPage
              items={ADMIN_SIDEBAR}
              roleLabel="Administrator"
              title="Role Management"
              description="Fine-grained role and permission management ships in a future milestone."
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/system-status"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <AdminSystemStatus />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/activity-logs"
        element={
          <ProtectedRoute allowedRoles={[ROLE_ADMIN]}>
            <AdminActivityLogs />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
