import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Onboarding from './pages/Onboarding'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import UserProfile from './pages/UserProfile'
import SkinProfile from './pages/SkinProfile'
import SkinScreening from './pages/SkinScreening'
import SkinScreeningHistory from './pages/SkinScreeningHistory'
import LifestyleTracking from './pages/LifestyleTracking'
import ProductRecommendation from './pages/ProductRecommendation'
import RoutineGenerator from './pages/RoutineGenerator'
import IngredientIntelligence from './pages/IngredientIntelligence'
import ProgressTracking from './pages/ProgressTracking'
import ProfessionalsDirectory from './pages/ProfessionalsDirectory'

import AdminDashboard from './pages/AdminDashboard'
import ConsultantDashboard from './pages/ConsultantDashboard'
import DermatologistDashboard from './pages/DermatologistDashboard'

import AdminLayout from './layouts/AdminLayout'
import ConsultantLayout from './layouts/ConsultantLayout'
import DermatologistLayout from './layouts/DermatologistLayout'

function App() {
  return (
    <div className="font-sans text-slate-900">
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Role-Specific Dashboards */}
        <Route path="/admin-dashboard" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
        </Route>
        
        <Route path="/dermatologist-dashboard" element={<DermatologistLayout />}>
          <Route index element={<DermatologistDashboard />} />
        </Route>
        
        <Route path="/consultant-dashboard" element={<ConsultantLayout />}>
          <Route index element={<ConsultantDashboard />} />
        </Route>

        {/* Protected User Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="user-profile" element={<UserProfile />} />
          <Route path="profile" element={<UserProfile />} />
          <Route path="screening" element={<SkinScreening />} />
          <Route path="screening/history" element={<SkinScreeningHistory />} />
          <Route path="lifestyle" element={<LifestyleTracking />} />
          <Route path="routines" element={<RoutineGenerator />} />
          <Route path="products" element={<ProductRecommendation />} />
          <Route path="ingredients" element={<IngredientIntelligence />} />
          <Route path="tracking" element={<ProgressTracking />} />
          <Route path="professionals" element={<ProfessionalsDirectory />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  )
}

export default App
