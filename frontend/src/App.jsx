import { Routes, Route } from "react-router-dom";
import "./styles/theme.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import SkinProfile from "./pages/SkinProfile";
import Lifestyle from "./pages/Lifestyle";
import Products from "./pages/Products";
import Ingredients from "./pages/Ingredients";
import Progress from "./pages/Progress";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminApproval from "./pages/AdminApproval";
import ManageUsers from "./pages/ManageUsers";
import PendingApprovals from "./pages/PendingApprovals";
import PendingUsers from "./pages/PendingUsers";
import Profile from "./pages/Profile";
import ConsultExperts from "./pages/ConsultExperts";
import PendingRequests from "./pages/PendingRequests";
import CaseDetails from "./pages/CaseDetails";
import MyConsultation from "./pages/MyConsultation";
import Landing from "./pages/Landing";
import Reports from "./pages/Reports";
import ConsultantClients from "./pages/ConsultantClients";
import ConsultantCase from "./pages/ConsultantCase";
import ManageCatalog from "./pages/ManageCatalog";
function App() {

  return (

    <Routes>
    <Route path="/" element={<Landing />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route
    path="/dashboard"
    element={
        <ProtectedRoute>
            <Dashboard />
        </ProtectedRoute>
    }
/>

<Route
    path="/skin-profile"
    element={
        <ProtectedRoute>
            <SkinProfile />
        </ProtectedRoute>
    }
/>

<Route
    path="/lifestyle"
    element={
        <ProtectedRoute>
            <Lifestyle />
        </ProtectedRoute>
    }
/>

<Route
    path="/products"
    element={
        <ProtectedRoute>
            <Products />
        </ProtectedRoute>
    }
/>

<Route
    path="/ingredients"
    element={
        <ProtectedRoute>
            <Ingredients />
        </ProtectedRoute>
    }
/>

<Route
    path="/progress"
    element={
        <ProtectedRoute allowedRoles={["USER"]}>
            <Progress />
        </ProtectedRoute>
    }
/>
      <Route path="/manage-users" element={<ManageUsers />} />
      <Route
    path="/admin-approval"
    element={<PendingApprovals/>}
/>
<Route
    path="/pending-users"
    element={<PendingUsers />}
/>
<Route path="/profile" element={<Profile />} />
<Route path="/manage-products" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageCatalog type="products" /></ProtectedRoute>} />
<Route path="/manage-ingredients" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ManageCatalog type="ingredients" /></ProtectedRoute>} />
<Route path="/reports" element={<ProtectedRoute allowedRoles={["USER", "DERMATOLOGIST"]}><Reports /></ProtectedRoute>} />
<Route
    path="/consult-experts"
    element={
        <ProtectedRoute>
            <ConsultExperts/>
        </ProtectedRoute>
    }
/>
<Route
    path="/pending-requests"
    element={
        <ProtectedRoute>
            <PendingRequests/>
        </ProtectedRoute>
    }
/>
<Route
    path="/case/:id"
    element={
        <ProtectedRoute allowedRoles={["DERMATOLOGIST"]}>
            <CaseDetails />
        </ProtectedRoute>
    }
/>
<Route path="/consultant/clients" element={<ProtectedRoute allowedRoles={["CONSULTANT"]}><ConsultantClients /></ProtectedRoute>} />
<Route path="/consultant/case/:id" element={<ProtectedRoute allowedRoles={["CONSULTANT"]}><ConsultantCase /></ProtectedRoute>} />
<Route
    path="/my-consultation"
    element={
        <ProtectedRoute>
            <MyConsultation/>
        </ProtectedRoute>
    }
/>


    </Routes>

  );

}

export default App;
