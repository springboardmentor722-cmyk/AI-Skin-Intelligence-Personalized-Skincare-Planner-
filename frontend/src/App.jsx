import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout, { Protected } from './components/Layout'

import Login from './pages/Login'
import Register from './pages/Register'
import Notifications from './pages/Notifications'

import UserDashboard from './pages/user/Dashboard'
import SkinProfile from './pages/user/SkinProfile'
import AssessmentWizard from './pages/user/AssessmentWizard'
import DailyPlanner from './pages/user/DailyPlanner'
import Lifestyle from './pages/user/Lifestyle'
import Routines from './pages/user/Routines'
import Dermatologists from './pages/user/Dermatologists'
import UserAppointments from './pages/user/Appointments'
import Consultants from './pages/user/Consultants'
import Products from './pages/user/Products'
import Progress from './pages/user/Progress'

import DermDashboard from './pages/derm/Dashboard'
import DermAppointments from './pages/derm/Appointments'
import Availability from './pages/derm/Availability'
import DermProfile from './pages/derm/Profile'

import ConsultantDashboard from './pages/consultant/Dashboard'
import ConsultantRequests from './pages/consultant/RequestsPage'
import RoutineBuilder from './pages/consultant/RoutineBuilder'

import AdminDashboard from './pages/admin/Dashboard'
import AdminUsers from './pages/admin/Users'
import AdminAppointments from './pages/admin/AppointmentsAdmin'
import AdminProducts from './pages/admin/ProductsAdmin'
import Broadcast from './pages/admin/Broadcast'
import AuditLogs from './pages/admin/AuditLogs'

/* The dashboard is unique per role: patients get their skin overview, while
   dermatologists and consultants share the same layout with different
   permissions, and the admin sees the whole platform. */
function RoleDashboard() {
  const { user } = useAuth()
  switch (user.role) {
    case 'dermatologist': return <DermDashboard />
    case 'consultant': return <ConsultantDashboard />
    case 'admin': return <AdminDashboard />
    default: return <UserDashboard />
  }
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={<Protected><Layout /></Protected>}>
        <Route index element={<RoleDashboard />} />
        <Route path="notifications" element={<Notifications />} />

        {/* Patient pages */}
        <Route path="skin-profile" element={<Protected roles={['user']}><SkinProfile /></Protected>} />
        {/* Milestone 2 */}
        <Route path="assessment" element={<Protected roles={['user']}><AssessmentWizard /></Protected>} />
        <Route path="planner" element={<Protected roles={['user']}><DailyPlanner /></Protected>} />
        <Route path="lifestyle" element={<Protected roles={['user']}><Lifestyle /></Protected>} />
        <Route path="routines" element={<Protected roles={['user']}><Routines /></Protected>} />
        <Route path="dermatologists" element={<Protected roles={['user']}><Dermatologists /></Protected>} />
        <Route path="appointments" element={<Protected roles={['user']}><UserAppointments /></Protected>} />
        <Route path="consultants" element={<Protected roles={['user']}><Consultants /></Protected>} />
        <Route path="products" element={<Protected roles={['user', 'dermatologist', 'consultant']}><Products /></Protected>} />
        <Route path="progress" element={<Protected roles={['user']}><Progress /></Protected>} />

        {/* Dermatologist pages */}
        <Route path="derm/appointments" element={<Protected roles={['dermatologist']}><DermAppointments /></Protected>} />
        <Route path="derm/availability" element={<Protected roles={['dermatologist']}><Availability /></Protected>} />
        <Route path="derm/profile" element={<Protected roles={['dermatologist']}><DermProfile /></Protected>} />

        {/* Consultant pages */}
        <Route path="consultant/requests" element={<Protected roles={['consultant']}><ConsultantRequests /></Protected>} />
        <Route path="consultant/routine-builder" element={<Protected roles={['consultant']}><RoutineBuilder /></Protected>} />

        {/* Administrator pages — full platform control */}
        <Route path="admin/users" element={<Protected roles={['admin']}><AdminUsers /></Protected>} />
        <Route path="admin/appointments" element={<Protected roles={['admin']}><AdminAppointments /></Protected>} />
        <Route path="admin/products" element={<Protected roles={['admin']}><AdminProducts /></Protected>} />
        <Route path="admin/broadcast" element={<Protected roles={['admin']}><Broadcast /></Protected>} />
        <Route path="admin/audit-logs" element={<Protected roles={['admin']}><AuditLogs /></Protected>} />
      </Route>

      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
