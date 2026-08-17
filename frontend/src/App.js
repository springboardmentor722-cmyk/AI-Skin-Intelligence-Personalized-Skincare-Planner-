import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import RoleAuth from './pages/RoleAuth';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import DermatologistDashboard from './pages/DermatologistDashboard';
import './styles/Dashboard.css';
import './styles/Auth.css';
import './styles/Landing.css';

// ============================================
// PROTECTED ROUTE COMPONENT
// ============================================
function ProtectedRoute({ children, requiredRole = null }) {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (requiredRole && user.role_id !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  const { user } = useContext(AuthContext);

  const roleRedirects = {
    1: '/user/dashboard',
    2: '/dermatologist/dashboard',
    3: '/consultant/dashboard',
    4: '/admin/dashboard'
  };

  return (
    <Router>
      <Routes>
        {/* LANDING PAGE - DEFAULT ROUTE */}
        <Route 
          path="/" 
          element={user ? <Navigate to={roleRedirects[user.role_id] || '/user/dashboard'} /> : <Landing />} 
        />

        {/* LOGIN/REGISTER PAGE */}
        <Route path="/auth" element={<RoleAuth />} />

        {/* USER ROUTES (role_id = 1) */}
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute requiredRole={1}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* DERMATOLOGIST ROUTES (role_id = 2) */}
        <Route
          path="/dermatologist/dashboard"
          element={
            <ProtectedRoute requiredRole={2}>
              <DermatologistDashboard />
            </ProtectedRoute>
          }
        />

        {/* CONSULTANT ROUTES (role_id = 3) */}
        <Route
          path="/consultant/dashboard"
          element={
            <ProtectedRoute requiredRole={3}>
              <ConsultantDashboard />
            </ProtectedRoute>
          }
        />

        {/* ADMIN ROUTES (role_id = 4) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole={4}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;