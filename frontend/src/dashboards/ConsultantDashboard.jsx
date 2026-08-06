import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ConsultantLayout from "../layouts/ConsultantLayout";
import DashboardCard from "../components/common/DashboardCard";

import { getConsultantDashboard } from "../services/consultantService";
import ConsultantAnalytics from "../components/charts/ConsultantAnalytics";
import DashboardPatientTable from "../components/charts/DashboardPatientTable";


import {
  FaClipboardList,
  FaCheckCircle,
  FaTimesCircle,
  FaUserMd,
} from "react-icons/fa";

function ConsultantDashboard() {

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    assigned: 0,
  });

  

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);

  useEffect(() => {

    const loadDashboard = async () => {

      try {

        setLoading(true);

       const data = await getConsultantDashboard();

setStats({
  pending: data.pending,
  approved: data.approved,
  rejected: data.rejected,
  assigned: data.assigned,
});



setActivities(data.recent_activity || []);
      } catch (error) {

        console.error(error);

      } finally {

        setLoading(false);

      }

    };

    loadDashboard();

  }, []);

       
  return (

    <ConsultantLayout>

     <div className="relative overflow-hidden rounded-[36px] bg-gradient-to-r from-indigo-700 via-blue-700 to-cyan-500 p-12 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-blue-100 text-lg">
AI Skin Intelligence
</p>

<h1 className="text-5xl font-bold text-white mt-2">
Welcome Back, Consultant 👋
</h1>

<p className="text-blue-50 mt-5 text-lg max-w-2xl leading-8">
Monitor appointments, review AI skin assessments, recommend treatments, and refer patients to dermatologists from one unified workspace.
</p>

<div className="mt-8 flex items-center gap-3">

    <div className="bg-white/20 px-5 py-2 rounded-full text-white">

        Today

    </div>

    <div className="text-blue-100">

        {new Date().toLocaleDateString()}

    </div>

</div>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center">

<div className="flex flex-col items-center">
    <FaUserMd className="text-white text-6xl" />
    <span className="text-white text-sm mt-3">
        Consultant Portal
    </span>
</div>

</div>

</div>

</div>

</div>



      {loading ? (

        <div className="text-center py-20">
          Loading Dashboard...
        </div>

      ) : (
        <div>

       <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">

          <DashboardCard
title="Pending Requests"
value={stats.pending}
icon={<FaClipboardList />}
color="bg-yellow-500"
growth="+18%"
subtitle="New appointments"
/>

<DashboardCard
title="Approved"
value={stats.approved}
icon={<FaCheckCircle />}
color="bg-green-600"
growth="+10%"
subtitle="Consultations"
/>

<DashboardCard
title="Rejected"
value={stats.rejected}
icon={<FaTimesCircle />}
color="bg-red-600"
growth="-3%"
subtitle="Declined requests"
/>

<DashboardCard
title="Referrals"
value={stats.assigned}
icon={<FaUserMd />}
color="bg-blue-600"
growth="+15%"
subtitle="Dermatologist"
/>


        </div>
        <ConsultantAnalytics stats={stats} />
        <DashboardPatientTable />

        <div className="grid lg:grid-cols-2 gap-8 mt-10">

<div className="bg-white rounded-3xl shadow-xl p-8">

  <h2 className="text-2xl font-bold mb-6">
    Quick Actions
  </h2>

  <div className="grid grid-cols-2 gap-5">

    {/* Appointment Requests */}

    <button
      onClick={() => navigate("/consultant/appointments")}
      className="rounded-2xl bg-blue-50 hover:bg-blue-100 p-6 transition"
    >
      📋

      <p className="font-semibold mt-3">
        Appointment Requests
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Review new appointments
      </p>

    </button>

    {/* Patient Monitoring */}

    <button
      onClick={() => navigate("/consultant/monitoring")}
      className="rounded-2xl bg-green-50 hover:bg-green-100 p-6 transition"
    >
      👨‍⚕️

      <p className="font-semibold mt-3">
        Patient Monitoring
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Track patient progress
      </p>

    </button>

    {/* Notifications */}

    <button
      onClick={() => navigate("/consultant/notifications")}
      className="rounded-2xl bg-yellow-50 hover:bg-yellow-100 p-6 transition"
    >
      🔔

      <p className="font-semibold mt-3">
        Notifications
      </p>

      <p className="text-sm text-gray-500 mt-1">
        View latest updates
      </p>

    </button>

    {/* Dashboard */}

    <button
      onClick={() => navigate("/consultant/dashboard")}
      className="rounded-2xl bg-purple-50 hover:bg-purple-100 p-6 transition"
    >
      📊

      <p className="font-semibold mt-3">
        Dashboard
      </p>

      <p className="text-sm text-gray-500 mt-1">
        View statistics
      </p>

    </button>

  </div>

</div>

<div className="bg-white rounded-3xl shadow-xl p-8">

  <h2 className="text-2xl font-bold mb-6">
    Recent Activity
  </h2>

  {activities.length === 0 ? (

    <div className="text-center py-10 text-gray-500">
      No recent activity available.
    </div>

  ) : (

    <div className="space-y-5">

      {activities.map((activity, index) => (

        <div
          key={index}
          className="flex items-center gap-4"
        >

          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center text-xl

              ${
                activity.type === "approved"
                  ? "bg-green-100"

                  : activity.type === "rejected"
                  ? "bg-red-100"

                  : activity.type === "referred"
                  ? "bg-blue-100"

                  : "bg-yellow-100"
              }
            `}
          >

            {activity.type === "approved" && "✅"}

            {activity.type === "rejected" && "❌"}

            {activity.type === "referred" && "👨‍⚕️"}

            {activity.type === "pending" && "📋"}

          </div>

          <div className="flex-1">

            <h3 className="font-semibold">
              {activity.title}
            </h3>

            <p className="text-gray-500 text-sm">
              {activity.message}
            </p>

          </div>

          <div className="text-xs text-gray-400 whitespace-nowrap">
            {activity.time}
          </div>

        </div>

      ))}

    </div>

  )}

</div>

</div>

<div className="bg-white rounded-3xl shadow-xl p-8 mt-10">

<h2 className="text-2xl font-bold mb-8">

Performance Summary

</h2>

<div className="grid md:grid-cols-4 gap-6">

<div className="bg-blue-50 rounded-2xl p-6">

<h3 className="text-gray-500">

Success Rate

</h3>

<p className="text-4xl font-bold text-blue-700 mt-3">

98%

</p>

</div>

<div className="bg-green-50 rounded-2xl p-6">

<h3 className="text-gray-500">

Patients Assisted

</h3>

<p className="text-4xl font-bold text-green-700 mt-3">

154

</p>

</div>

<div className="bg-purple-50 rounded-2xl p-6">

<h3 className="text-gray-500">

Recommendations

</h3>

<p className="text-4xl font-bold text-purple-700 mt-3">

287

</p>

</div>

<div className="bg-yellow-50 rounded-2xl p-6">

<h3 className="text-gray-500">

Average Rating

</h3>

<p className="text-4xl font-bold text-yellow-600 mt-3">

4.9★

</p>

</div>

</div>

</div>
</div>

      )}
      

    </ConsultantLayout>

  );

}

export default ConsultantDashboard;