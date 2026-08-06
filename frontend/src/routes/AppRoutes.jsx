import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Profile from "../pages/Profile";
import SkinProfile from "../pages/SkinProfile";
import Lifestyle from "../pages/Lifestyle";
import Products from "../pages/Products";
import ProductDetails from "../pages/ProductDetails";
import Ingredients from "../pages/Ingredients";
import IngredientDetails from "../pages/IngredientDetails";
import Progress from "../pages/Progress";
import AdminUsers from "../pages/AdminUsers";
import ApplyRole from "../pages/ApplyRole";
import MyRoleRequests from "../pages/MyRoleRequests";
import AdminRoleRequests from "../pages/AdminRoleRequests";
import SkinAssessment from "../pages/SkinAssessment";
import AssessmentHistory from "../pages/AssessmentHistory";
import Recommendations from "../pages/Recommendations";
import BookAppointment from "../pages/BookAppointment";
import MyAppointments from "../pages/MyAppointments";
import ConsultantDashboard from "../dashboards/ConsultantDashboard";
import ConsultantAppointments from "../pages/ConsultantAppointments";
import ConsultantPatientDetails from "../pages/ConsultantPatientDetails";
import Notifications from "../pages/Notifications";
import ConsultantMonitoring from "../pages/ConsultantMonitoring";
import ConsultantMonitoringDetails from "../pages/ConsultantMonitoringDetails";
import DermatologistDashboard from "../dashboards/DermatologistDashboard";
import DermatologistAppointments from "../pages/DermatologistAppointments";
import DermatologistPatientDetails from "../pages/DermatologistPatientDetails";
import TreatmentPlan from "../pages/TreatmentPlan";
import DermatologistPatients from "../pages/DermatologistPatients";
import AdminDashboard from "../dashboards/AdminDashboard";
import Routine from "../pages/Routine";


function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
<Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/skin-profile" element={<SkinProfile />} />
        <Route path="/lifestyle" element={<Lifestyle />} />
        <Route path="/products" element={<Products />} />
        <Route
  path="/products/:id"
  element={<ProductDetails />}
/>
        <Route path="/ingredients" element={<Ingredients />} />
        <Route
          path="/ingredients/:id"
          element={<IngredientDetails />}
        />
        <Route path="/progress" element={<Progress />} />
        



<Route path="/admin/users" element={<AdminUsers />} />
<Route
  path="/apply-role"
  element={<ApplyRole />}
/>

<Route
  path="/my-role-requests"
  element={<MyRoleRequests />}
/>

<Route
  path="/admin/role-requests"
  element={<AdminRoleRequests />}
/>

<Route path="/skin-assessment" element={<SkinAssessment />} />

<Route
    path="/assessment-history"
    element={<AssessmentHistory />}
/>

<Route
    path="/recommendations"
    element={<Recommendations />}
/>
<Route path="/book-appointment" element={<BookAppointment />} />

<Route path="/appointments" element={<MyAppointments />} />

<Route
  path="/consultant/dashboard"
  element={<ConsultantDashboard />}
/>

<Route
    path="/consultant/appointments"
    element={<ConsultantAppointments />}
/>

<Route
  path="/consultant/patient/:appointmentId"
  element={<ConsultantPatientDetails />}
/>

<Route
    path="/consultant/monitoring/:userId"
    element={<ConsultantMonitoringDetails />}
/>

<Route
    path="/consultant/notifications"
    element={<Notifications />}
/>

<Route
    path="/notifications"
    element={<Notifications />}
 />

<Route
    path="/consultant/monitoring"
    element={<ConsultantMonitoring />}
/>

<Route
  path="/dermatologist/dashboard"
  element={<DermatologistDashboard />}
/>

<Route
  path="/dermatologist/appointments"
  element={<DermatologistAppointments />}
/>

<Route
  path="/dermatologist/patient/:appointmentId"
  element={<DermatologistPatientDetails />}
/>

<Route
  path="/treatment-plan"
  element={<TreatmentPlan />}
/>

<Route
  path="/dermatologist/patients"
  element={<DermatologistPatients />}
/>

<Route
    path="/dermatologist/notifications"
    element={<Notifications />}
/>

<Route
    path="/admin/dashboard"
    element={<AdminDashboard />}
/>

<Route
    path="/admin/products"
    element={<Products />}
/>

<Route
    path="/admin/ingredients"
    element={<Ingredients />}
/>

<Route path="/routine" element={<Routine />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;