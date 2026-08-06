import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Auth/Login";
import Register from "../pages/Auth/Register";
import Dashboard from "../pages/Dashboard/Dashboard";
import Lifestyle from "../pages/Lifestyle/Lifestyle";
import SleepTracking from "../pages/Lifestyle/SleepTracking";
import SkinProfile from "../pages/Skin/SkinProfile";
import ProtectedRoute from "./ProtectedRoute";



function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>


        <Route path="/lifestyle" element={<Lifestyle />} />
        <Route path="/sleep-tracking" element={<SleepTracking />} />
        <Route
  path="/skin-profile"
  element={
    <ProtectedRoute>
      <SkinProfile />
    </ProtectedRoute>
  }
/>

      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;