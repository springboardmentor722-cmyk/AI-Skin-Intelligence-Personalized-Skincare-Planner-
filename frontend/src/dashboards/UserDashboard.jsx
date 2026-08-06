import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../layouts/DashboardLayout";
import DashboardCard from "../components/common/DashboardCard";
import RecommendationPreview from "../components/dashboard/RecommendationPreview";

import { getUserDashboardStats } from "../services/userDashboardService";
import LatestAssessmentCard from "../components/dashboard/LatestAssessmentCard";
import { getRoutine } from "../services/recommendationService";
import RoutineCard from "../components/dashboard/RoutineCard";
import WelcomeHero from "../components/dashboard/WelcomeHero";

import {
  FaLeaf,
  FaRobot,
  FaClipboardCheck,
  FaChartLine,
  FaArrowRight,
  FaUser,
  FaCamera,
  FaCalendarAlt,
} from "react-icons/fa";

function UserDashboard() {

  const [stats, setStats] = useState({
    skin_type: "",
    recommendations: 0,
    assessments: 0,
    progress: 0,
  });

const [morningRoutine, setMorningRoutine] = useState([]);
const [nightRoutine, setNightRoutine] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchDashboard = async () => {

      try {

        const data = await getUserDashboardStats();
        

        setStats(data);
        const routine = await getRoutine();

        setMorningRoutine(routine.morning);
        setNightRoutine(routine.night);

      } catch (error) {

        console.error("Dashboard Error:", error);

      } finally {

        setLoading(false);

      }

    };

    fetchDashboard();

  }, []);

  return (

    <DashboardLayout>

      <WelcomeHero />

      {loading ? (

        <div className="text-center text-xl font-semibold py-20">
          Loading Dashboard...
        </div>

      ) : (

        <>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <DashboardCard
              title="Skin Type"
              value={stats.skin_type || "Not Set"}
              icon={<FaLeaf />}
             color="bg-gradient-to-r from-green-600 to-emerald-500"
            />

            <DashboardCard
  title="AI Recommendations"
  value={stats.recommendations}
  icon={<FaRobot />}
  color="bg-gradient-to-r from-blue-600 to-cyan-500"
/>

            <DashboardCard
              title="Assessments"
              value={stats.assessments}
              icon={<FaClipboardCheck />}
              color="bg-gradient-to-r from-purple-600 to-pink-500"
            />

            <DashboardCard
  title="Overall Skin Score"
  value={stats.overall_score ?? "--"}
  icon={<FaChartLine />}
  color="bg-gradient-to-r from-orange-500 to-amber-400"
/>

          </div>

          <div className="mt-10">

  <div className="flex items-center justify-between mb-6">

    <div>

      <h2 className="text-3xl font-bold text-gray-800">
        Quick Actions
      </h2>

      <p className="text-gray-500 mt-1">
        Access your most-used features quickly.
      </p>

    </div>

  </div>

  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

    {/* Skin Profile */}

    <Link
      to="/skin-profile"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">

          <FaUser className="text-green-700 text-2xl"/>

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-green-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        Skin Profile
      </h3>

      <p className="text-gray-500 mt-2">
        Manage your skin profile information.
      </p>

    </Link>

    {/* Assessment */}

    <Link
      to="/skin-assessment"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">

          <FaCamera className="text-blue-700 text-2xl"/>

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-blue-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        AI Assessment
      </h3>

      <p className="text-gray-500 mt-2">
        Analyze your skin with AI technology.
      </p>

    </Link>

    {/* Recommendations */}

    <Link
      to="/recommendations"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">

          <FaRobot className="text-purple-700 text-2xl"/>

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-purple-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        Recommendations
      </h3>

      <p className="text-gray-500 mt-2">
        View personalized skincare suggestions.
      </p>

    </Link>

    {/* Progress */}

    <Link
      to="/progress"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-orange-100 flex items-center justify-center">

          <FaChartLine className="text-orange-600 text-2xl"/>

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-orange-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        Track Progress
      </h3>

      <p className="text-gray-500 mt-2">
        Monitor your skincare improvement.
      </p>

    </Link>

    {/* Book */}

    <Link
      to="/book-appointment"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center">

          <FaCalendarAlt className="text-indigo-700 text-2xl"/>

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-indigo-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        Book Appointment
      </h3>

      <p className="text-gray-500 mt-2">
        Schedule consultation with dermatologist.
      </p>

    </Link>

    {/* Appointments */}

    <Link
      to="/appointments"
      className="group bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-2xl p-6 transition-all duration-300 hover:-translate-y-1"
    >

      <div className="flex justify-between items-center">

        <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center">

          📋

        </div>

        <FaArrowRight className="text-gray-400 group-hover:text-cyan-600"/>

      </div>

      <h3 className="text-xl font-bold mt-6">
        My Appointments
      </h3>

      <p className="text-gray-500 mt-2">
        View upcoming and previous appointments.
      </p>

    </Link>

  </div>

</div>
          

          <RecommendationPreview />

<LatestAssessmentCard />

<div className="grid md:grid-cols-2 gap-6 mt-8">

  <RoutineCard
    title="Morning Routine"
    icon="🌞"
    items={morningRoutine}
  />

  <RoutineCard
    title="Night Routine"
    icon="🌙"
    items={nightRoutine}
  />

</div>
          

        </>

      )}

    </DashboardLayout>

  );

}

export default UserDashboard;