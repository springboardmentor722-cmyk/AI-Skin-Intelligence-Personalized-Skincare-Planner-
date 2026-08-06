import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DermatologistLayout from "../layouts/DermatologistLayout";

import {
  getDermatologistDashboard,
  getDermatologistAppointments,
  getRecentActivity,
} from "../services/dermatologistService";
import {
  FaUsers,
  FaClock,
  FaCheckCircle,
  FaBell,
  FaUserMd
  
} from "react-icons/fa";

function DermatologistDashboard() {

  const [stats, setStats] = useState({});
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {

    Promise.all([
  getDermatologistDashboard(),
  getDermatologistAppointments(),
  getRecentActivity(),
])
.then(([dashboardData, patientData, activityData]) => {

  setStats(dashboardData);
  setPatients(patientData);
  setActivities(activityData);

})
      .catch((error) => {

        console.error(error);
        alert("Failed to load dashboard.");

      })
      .finally(() => {

        setLoading(false);

      });

  }, []);

  if (loading) {

    return (

      <DermatologistLayout>

        <div className="text-center py-20">
          Loading Dashboard...
        </div>

      </DermatologistLayout>

    );

  }

  return (

    <DermatologistLayout>

      {/* Hero Section */}

<div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-500 rounded-3xl shadow-2xl p-10 mb-10 text-white">

  <div className="flex flex-col lg:flex-row justify-between items-center">

    <div>

      <p className="uppercase tracking-widest text-emerald-100 text-sm font-semibold">
        Dermatology Specialist Portal
      </p>

      <h1 className="text-5xl font-extrabold mt-3">
        Welcome Back, Doctor 👨‍⚕️
      </h1>

      <p className="mt-5 text-emerald-100 text-lg max-w-2xl leading-relaxed">
        Review consultant referrals, diagnose complex skin conditions,
        prepare personalized treatment plans, and monitor patient recovery
        from one centralized dashboard.
      </p>

    </div>

    {/* Right Card */}

    <div className="mt-8 lg:mt-0">

      <div className="bg-white/20 backdrop-blur-lg rounded-3xl px-10 py-8 shadow-xl text-center">

        <p className="text-emerald-100 text-sm uppercase tracking-wide">
          Pending Reviews
        </p>

        <h2 className="text-6xl font-bold mt-3">
          {stats.pending_cases}
        </h2>

        <div className="mt-5 flex justify-center">

          <span className="bg-white/20 px-5 py-2 rounded-full text-sm">
            🩺 Active Specialist
          </span>

        </div>

      </div>

    </div>

  </div>

</div>

      {/* Dashboard Cards */}

      {/* Premium Statistics */}
      <div>

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

  {/* Total Patients */}

  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 p-6 border-t-4 border-emerald-600">

    <div className="flex justify-between items-center">

      <div>

        <p className="text-gray-500 text-sm font-medium">
          Total Patients
        </p>

        <h2 className="text-4xl font-bold mt-3 text-gray-800">
          {stats.total_cases}
        </h2>

        <p className="text-emerald-600 text-sm mt-3">
          Referred Cases
        </p>

      </div>

      <div className="bg-emerald-100 p-4 rounded-2xl">

        <FaUsers className="text-4xl text-emerald-700" />

      </div>

    </div>

  </div>

  {/* Pending Reviews */}

  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 p-6 border-t-4 border-amber-500">

    <div className="flex justify-between items-center">

      <div>

        <p className="text-gray-500 text-sm font-medium">
          Pending Reviews
        </p>

        <h2 className="text-4xl font-bold mt-3 text-gray-800">
          {stats.pending_cases}
        </h2>

        <p className="text-amber-600 text-sm mt-3">
          Awaiting Diagnosis
        </p>

      </div>

      <div className="bg-amber-100 p-4 rounded-2xl">

        <FaClock className="text-4xl text-amber-600" />

      </div>

    </div>

  </div>
  

  {/* Treatments */}

  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 p-6 border-t-4 border-cyan-600">

    <div className="flex justify-between items-center">

      <div>

        <p className="text-gray-500 text-sm font-medium">
          Treatments
        </p>

        <h2 className="text-4xl font-bold mt-3 text-gray-800">
          {stats.completed_cases}
        </h2>

        <p className="text-cyan-600 text-sm mt-3">
          Plans Created
        </p>

      </div>

      <div className="bg-cyan-100 p-4 rounded-2xl">

        💊

      </div>

    </div>

  </div>

  {/* Notifications */}

  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 p-6 border-t-4 border-rose-500">

    <div className="flex justify-between items-center">

      <div>

        <p className="text-gray-500 text-sm font-medium">
          Notifications
        </p>

        <h2 className="text-4xl font-bold mt-3 text-gray-800">
          {stats.notifications}
        </h2>

        <p className="text-rose-600 text-sm mt-3">
          Unread Updates
        </p>

      </div>

      <div className="bg-rose-100 p-4 rounded-2xl">

        <FaBell className="text-4xl text-rose-600" />

      </div>

    </div>

  </div>

</div>
</div>

{/* Today's Schedule */}

<div className="bg-white rounded-3xl shadow-lg p-8 mb-10">

  <div className="flex justify-between items-center mb-6">

    <div>

      <h2 className="text-2xl font-bold">
        Today's Schedule
      </h2>

      <p className="text-gray-500">
        Upcoming dermatologist consultations
      </p>

    </div>

    <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full font-semibold">
      {patients.length} Patients
    </span>

  </div>

  {patients.length === 0 ? (

    <div className="text-center py-8 text-gray-500">
      No appointments scheduled for today.
    </div>

  ) : (

    <div className="space-y-4">

      {patients.slice(0, 5).map((patient) => (

        <div
          key={patient.appointment_id}
          className="flex justify-between items-center border rounded-2xl p-4 hover:bg-gray-50 transition"
        >

          <div className="flex items-center gap-4">

            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-lg">

              {patient.patient_name.charAt(0)}

            </div>

            <div>

              <h3 className="font-semibold text-gray-800">
                {patient.patient_name}
              </h3>

              <p className="text-gray-500 text-sm">
                {new Date(patient.appointment_date).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>

            </div>

          </div>

          <button
            onClick={() =>
              navigate(`/dermatologist/patient/${patient.appointment_id}`)
            }
            className="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl"
          >
            Review
          </button>

        </div>

      ))}

    </div>

  )}

</div>

{/* Recent Activity */}

<div className="bg-white rounded-2xl shadow-lg p-6 mt-8">

  <h2 className="text-2xl font-bold mb-6">
    Recent Activity
  </h2>

  {activities.length === 0 ? (

    <p className="text-gray-500">
      No recent activity.
    </p>

  ) : (

    <div className="space-y-5">

      {activities.map((activity, index) => (

        <div
          key={index}
          className="flex justify-between items-center border-b pb-4"
        >

          <div className="flex items-start gap-4">

            <div>

              {activity.title === "New Patient Assigned" ? (

                <div className="bg-blue-100 p-3 rounded-full">

                  <FaUserMd className="text-blue-600 text-lg" />

                </div>

              ) : activity.title === "Treatment Plan Ready" ? (

                <div className="bg-green-100 p-3 rounded-full">

                  <FaCheckCircle className="text-green-600 text-lg" />

                </div>

              ) : (

                <div className="bg-orange-100 p-3 rounded-full">

                  <FaBell className="text-orange-600 text-lg" />

                </div>

              )}

            </div>

            <div>

              <h3 className="font-semibold">

                {activity.title}

              </h3>

              <p className="text-gray-700">

                {activity.patient_name}

              </p>

              <p className="text-gray-500 text-sm">

                {activity.description}

              </p>

            </div>

          </div>

          <span className="text-sm text-gray-500">

            {new Date(activity.time).toLocaleString()}

          </span>

        </div>

      ))}

    </div>

  )}

</div>
<br></br>

{/* Quick Actions */}

<div className="grid md:grid-cols-3 gap-6 mb-10">

  <button
    onClick={() => navigate("/dermatologist/appointments")}
    className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-3xl p-6 shadow-lg hover:scale-105 transition text-left"
  >

    <h2 className="text-xl font-bold mb-2">
      Review Patients
    </h2>

    <p className="text-emerald-100">
      Open all referred patients awaiting diagnosis.
    </p>

  </button>

  <button
    onClick={() => navigate("/notifications")}
    className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl p-6 shadow-lg hover:scale-105 transition text-left"
  >

    <h2 className="text-xl font-bold mb-2">
      Notifications
    </h2>

    <p className="text-blue-100">
      View appointment updates and referrals.
    </p>

  </button>

  <button
    onClick={() => navigate("/dermatologist/patients")}
    className="bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-3xl p-6 shadow-lg hover:scale-105 transition text-left"
  >

    <h2 className="text-xl font-bold mb-2">
      Patients
    </h2>

    <p className="text-purple-100">
      To view the patients list and status
    </p>

  </button>

</div>

      {/* Recent Patients */}

      {/* Recent Referred Patients */}

<div className="flex justify-between items-center mb-6">

  <div>

    <h2 className="text-3xl font-bold text-gray-800">
      Recent Referred Patients
    </h2>

    <p className="text-gray-500 mt-1">
      Consultant referrals awaiting specialist review
    </p>

  </div>

  <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-semibold">
    {patients.length} Active Cases
  </span>

</div>

<div className="grid lg:grid-cols-2 gap-8">

  {patients.map((patient) => (

    <div
      key={patient.appointment_id}
      className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition duration-300 overflow-hidden"
    >

      {/* Header */}

      <div className="bg-gradient-to-r from-emerald-600 to-teal-500 p-5 flex justify-between items-center">

        <div className="flex items-center gap-4">

          <div className="w-14 h-14 rounded-full bg-white text-emerald-700 flex items-center justify-center text-2xl font-bold">

            {patient.patient_name.charAt(0)}

          </div>

          <div>

            <h3 className="text-white text-xl font-bold">

              {patient.patient_name}

            </h3>

            <p className="text-emerald-100">

              {patient.email}

            </p>

          </div>

        </div>

        <span className="bg-white text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold">

          New Referral

        </span>

      </div>

      {/* Body */}

      <div className="p-6 space-y-4">

        <div>

          <p className="text-sm text-gray-500">
            Appointment Date
          </p>

          <p className="font-semibold text-gray-800">

            {new Date(patient.appointment_date).toLocaleString()}

          </p>

        </div>

        <div>

          <p className="text-sm text-gray-500 mb-2">
            Consultant Recommendation
          </p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">

            <p className="text-gray-700">

              {patient.consultant_recommendation}

            </p>

          </div>

        </div>

        <button
          onClick={() =>
            navigate(`/dermatologist/patient/${patient.appointment_id}`)
          }
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white py-3 rounded-xl font-semibold transition"
        >

          Review Patient →

        </button>

      </div>

    </div>

  ))}

</div>

        

    </DermatologistLayout>

  );

}

export default DermatologistDashboard;