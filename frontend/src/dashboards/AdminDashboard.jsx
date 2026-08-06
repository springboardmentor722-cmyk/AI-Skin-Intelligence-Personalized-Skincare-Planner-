import AdminLayout from "../layouts/AdminLayout";
import DashboardCard from "../components/common/DashboardCard";


import {
  FaUser,
  FaBoxOpen,
  FaLeaf,
 
} from "react-icons/fa";

import { useEffect, useState } from "react";
import { getDashboardStats } from "../services/dashboardService";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const [stats, setStats] = useState({
   users: 0,
   products: 0,
   ingredients: 0,
   progress: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    
  const fetchDashboard = async () => {
    try {
      const data = await getDashboardStats();
      
      console.log(data);
      setStats(data);
    } catch (error) {
      console.error("Dashboard Error:", error);
    }
  };

  fetchDashboard();
}, []);

  return (
    <AdminLayout>
      

      {/* Welcome Banner */}

<div className="bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 rounded-3xl shadow-xl p-8 text-white mb-10">

  <div className="flex justify-between items-center flex-wrap gap-6">

    <div>

      <h2 className="text-3xl font-bold">
        Welcome Administrator 👋
      </h2>

      <p className="mt-3 text-cyan-100 text-lg">

        Manage users, products, ingredients and monitor your AI Skin Intelligence platform from one place.

      </p>

    </div>

    <div className="grid grid-cols-2 gap-4">

      <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center">

        <h3 className="text-3xl font-bold">
          {stats.users}
        </h3>

        <p className="text-sm mt-1">
          Total Users
        </p>

      </div>

      <div className="bg-white/20 backdrop-blur rounded-2xl px-6 py-4 text-center">

        <h3 className="text-3xl font-bold">
          {stats.products}
        </h3>

        <p className="text-sm mt-1">
          Products
        </p>

      </div>

    </div>

  </div>

</div>
      

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10">

  <DashboardCard
    title="Users"
    value={stats.users}
    icon={<FaUser className="text-4xl" />}
    color="bg-gradient-to-r from-cyan-500 to-blue-600"
  />

  <DashboardCard
    title="Products"
    value={stats.products}
    icon={<FaBoxOpen className="text-4xl" />}
    color="bg-gradient-to-r from-green-500 to-emerald-600"
  />

  <DashboardCard
    title="Ingredients"
    value={stats.ingredients}
    icon={<FaLeaf className="text-4xl" />}
    color="bg-gradient-to-r from-purple-500 to-indigo-600"
  />

  

</div>

<div className="grid lg:grid-cols-2 gap-8 mt-10">

  {/* Platform Overview */}

  <div className="bg-white rounded-3xl shadow-lg p-8">

    <h2 className="text-2xl font-bold text-gray-800 mb-6">
      Platform Overview
    </h2>

    <div className="space-y-4">

      <div className="flex justify-between border-b pb-3">
        <span>Authentication System</span>
        <span className="text-green-600 font-semibold">Active</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>AI Assessment Engine</span>
        <span className="text-green-600 font-semibold">Active</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Recommendation Engine</span>
        <span className="text-green-600 font-semibold">Active</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Consultant Module</span>
        <span className="text-green-600 font-semibold">Running</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Dermatologist Module</span>
        <span className="text-green-600 font-semibold">Running</span>
      </div>

      <div className="flex justify-between">
        <span>Admin Panel</span>
        <span className="text-green-600 font-semibold">Online</span>
      </div>

    </div>

  </div>

  {/* System Information */}

  <div className="bg-white rounded-3xl shadow-lg p-8">

    <h2 className="text-2xl font-bold text-gray-800 mb-6">
      System Information
    </h2>

    <div className="space-y-4">

      <div className="flex justify-between border-b pb-3">
        <span>Backend</span>
        <span className="font-semibold">FastAPI</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Frontend</span>
        <span className="font-semibold">React</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Database</span>
        <span className="font-semibold">PostgreSQL</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Authentication</span>
        <span className="font-semibold">JWT</span>
      </div>

      <div className="flex justify-between border-b pb-3">
        <span>Environment</span>
        <span className="text-green-600 font-semibold">Production</span>
      </div>

      <div className="flex justify-between">
        <span>Server Status</span>
        <span className="text-green-600 font-semibold">
          ● Online
        </span>
      </div>

    </div>

  </div>

</div>

{/* Quick Actions */}

<div className="mt-10">

  <h2 className="text-2xl font-bold text-gray-800 mb-5">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">

    <button
      onClick={() => navigate("/admin/users")}
      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 shadow-lg transition-all"
    >
      👥
      <p className="mt-3 font-semibold">
        Manage Users
      </p>
    </button>

    <button
      onClick={() => navigate("/admin/role-requests")}
      className="bg-green-600 hover:bg-green-700 text-white rounded-xl p-5 shadow-lg transition-all"
    >
      🛡️
      <p className="mt-3 font-semibold">
        Review Roles
      </p>
    </button>

    <button
      onClick={() => navigate("/admin/products")}
      className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl p-5 shadow-lg transition-all"
    >
      📦
      <p className="mt-3 font-semibold">
        Manage Products
      </p>
    </button>

    <button
      onClick={() => navigate("/admin/ingredients")}
      className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl p-5 shadow-lg transition-all"
    >
      🧪
      <p className="mt-3 font-semibold">
        Manage Ingredients
      </p>
    </button>

  </div>

</div>
      
      

    </AdminLayout>
  );
}

export default AdminDashboard;