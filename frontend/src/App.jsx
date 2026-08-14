import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import SkinProfile from './pages/SkinProfile'
import Assessment from './pages/Assessment'
import Routines from './pages/Routines'
import Products from './pages/Products'
import Ingredients from './pages/Ingredients'
import Progress from './pages/Progress'
import Notifications from './pages/Notifications'
import PhotoAnalysis from './pages/PhotoAnalysis'
import Verification from './pages/Verification'
import VerificationQueue from './pages/VerificationQueue'

import UserDashboard from './pages/UserDashboard'
import ConsultantDashboard from './pages/ConsultantDashboard'
import DermatologistDashboard from './pages/DermatologistDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'

function RoleDashboard() {
  const { user } = useAuth()
  if (user.role === 'consultant') return <ConsultantDashboard />
  if (user.role === 'dermatologist') return <DermatologistDashboard />
  if (user.role === 'admin') return <AdminDashboard />
  return <UserDashboard />
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return <div className="flex items-center justify-center h-screen text-ink-faint">Loading...</div>

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><RoleDashboard /></ProtectedRoute>} />

        {/* End-user (skincare consumer) routes */}
        <Route path="/profile" element={<ProtectedRoute allowedRoles={['user']}><SkinProfile /></ProtectedRoute>} />
        <Route path="/assessment" element={<ProtectedRoute allowedRoles={['user']}><Assessment /></ProtectedRoute>} />
        <Route path="/photo-analysis" element={<ProtectedRoute allowedRoles={['user']}><PhotoAnalysis /></ProtectedRoute>} />
        <Route path="/routines" element={<ProtectedRoute allowedRoles={['user']}><Routines /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute allowedRoles={['user']}><Products /></ProtectedRoute>} />
        <Route path="/ingredients" element={<ProtectedRoute allowedRoles={['user']}><Ingredients /></ProtectedRoute>} />
        <Route path="/progress" element={<ProtectedRoute allowedRoles={['user']}><Progress /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute allowedRoles={['user']}><Notifications /></ProtectedRoute>} />

        {/* Consultant / dermatologist / admin routes */}
        <Route path="/clients" element={<ProtectedRoute allowedRoles={['consultant', 'admin']}><ConsultantDashboard /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute allowedRoles={['dermatologist', 'admin']}><DermatologistDashboard /></ProtectedRoute>} />
        <Route path="/verification" element={<ProtectedRoute allowedRoles={['consultant', 'dermatologist']}><Verification /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/verification" element={<ProtectedRoute allowedRoles={['admin']}><VerificationQueue /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to={user ? '/dashboard' : '/'} replace />} />
      </Routes>
    </>
  )
}
