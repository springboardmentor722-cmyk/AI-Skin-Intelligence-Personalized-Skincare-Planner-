import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Landing from './pages/Landing';
import RoleAuth from './pages/RoleAuth';
import UserAssessment from './pages/UserAssessment';
import UserDashboard from './pages/UserDashboard';
import DermatologistApplication from './pages/DermatologistApplication';
import ConsultantApplication from './pages/ConsultantApplication';
import AdminApplication from './pages/AdminApplication';
import DermatologistDashboard from './pages/DermatologistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ConsultantDashboard from './pages/ConsultantDashboard';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Lifestyle from './pages/Lifestyle';
import './App.css';
import './styles/theme.css';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = React.useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  if (requiredRole && user.role_id !== requiredRole) {
    return <Navigate to="/" />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<RoleAuth />} />

          {/* USER ROUTES */}
          <Route
            path="/user/assessment"
            element={
              <ProtectedRoute requiredRole={1}>
                <UserAssessment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute requiredRole={1}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/profile"
            element={
              <ProtectedRoute requiredRole={1}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user/lifestyle"
            element={
              <ProtectedRoute requiredRole={1}>
                <Lifestyle />
              </ProtectedRoute>
            }
          />

          {/* DERMATOLOGIST ROUTES */}
          <Route
            path="/dermatologist/application"
            element={
              <ProtectedRoute requiredRole={2}>
                <DermatologistApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dermatologist/dashboard"
            element={
              <ProtectedRoute requiredRole={2}>
                <DermatologistDashboard />
              </ProtectedRoute>
            }
          />

          {/* CONSULTANT ROUTES */}
          <Route
            path="/consultant/application"
            element={
              <ProtectedRoute requiredRole={3}>
                <ConsultantApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consultant/dashboard"
            element={
              <ProtectedRoute requiredRole={3}>
                <ConsultantDashboard />
              </ProtectedRoute>
            }
          />

          {/* ADMIN ROUTES */}
          <Route
            path="/admin/application"
            element={
              <ProtectedRoute requiredRole={4}>
                <AdminApplication />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole={4}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;