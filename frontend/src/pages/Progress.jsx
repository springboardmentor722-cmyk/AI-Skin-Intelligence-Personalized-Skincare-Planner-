import { useEffect, useState } from "react";

import DashboardLayout from "../layouts/DashboardLayout";
import ProgressCard from "../components/progress/ProgressCard";
import RoutineProgressChart from "../components/progress/RoutineProgressChart";

import {
  getProgressHistory,
  getProgressSummary,
  getProgressDashboard,
} from "../services/dashboardService";
function Progress() {
  const [progressList, setProgressList] = useState([]);
  const [summary, setSummary] = useState(null);

  const [loading, setLoading] = useState(false);
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);

        const historyData = await getProgressHistory();
        const summaryData = await getProgressSummary();
        const dashboardData = await getProgressDashboard();
        setSummary(summaryData.progress);
        setDashboard(dashboardData);

        setProgressList(historyData);
        setSummary(summaryData.progress);
      } catch (error) {
        console.error(error);
        alert("Failed to load AI Progress History.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">

<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-green-700 via-emerald-600 to-green-500 p-10 mb-10 shadow-xl">

<div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10"></div>

<div className="flex justify-between items-center">

<div>

<p className="text-green-100 text-lg">

AI Progress Tracker

</p>

<h1 className="text-5xl font-bold text-white mt-2">

Skin Progress Dashboard

</h1>

<p className="text-green-50 mt-5 text-lg max-w-2xl leading-8">

Monitor your skin health journey with AI-powered insights,
track improvements over time, and celebrate your skincare milestones.

</p>

</div>

<div className="hidden lg:flex">

<div className="w-32 h-32 rounded-full bg-white/15 flex items-center justify-center text-6xl">

📈

</div>

</div>

</div>
</div>

</div>

      {loading ? (
        <div className="text-center py-20 text-xl font-semibold">
          Loading Progress...
        </div>
      ) : progressList.length === 0 ? (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-gray-600">
            No AI Assessments Found
          </h2>

          <p className="text-gray-500 mt-2">
            Complete your first AI Skin Assessment to start tracking your progress.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}


        {dashboard && (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">

    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-gray-500">Today's Completion</p>
      <h2 className="text-4xl font-bold text-green-600 mt-3">
        {dashboard.today_completion}%
      </h2>
    </div>

    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-gray-500">Current Streak</p>
      <h2 className="text-4xl font-bold text-orange-500 mt-3">
        🔥 {dashboard.current_streak}
      </h2>
    </div>

    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-gray-500">Products Used</p>
      <h2 className="text-4xl font-bold text-blue-600 mt-3">
        {dashboard.products_used}
      </h2>
    </div>

    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-gray-500">Weekly Completion</p>
      <h2 className="text-4xl font-bold text-purple-600 mt-3">
        {dashboard.weekly_completion}%
      </h2>
    </div>

  </div>
)}

{dashboard && (
  <div className="grid md:grid-cols-2 gap-8 mb-10">

    {/* Morning */}

    <div className="bg-white rounded-3xl shadow-lg p-6">

      <div className="flex justify-between mb-3">

        <h2 className="text-xl font-semibold">
           Morning Routine
        </h2>

        <span className="font-bold text-green-600">
          {dashboard.morning_completion}%
        </span>

      </div>

      <div className="w-full bg-gray-200 rounded-full h-4">

        <div
          className="bg-green-500 h-4 rounded-full transition-all duration-500"
          style={{
            width: `${dashboard.morning_completion}%`,
          }}
        />

      </div>

    </div>

    {/* Night */}

    <div className="bg-white rounded-3xl shadow-lg p-6">

      <div className="flex justify-between mb-3">

        <h2 className="text-xl font-semibold">
           Night Routine
        </h2>

        <span className="font-bold text-indigo-600">
          {dashboard.night_completion}%
        </span>

      </div>

      <div className="w-full bg-gray-200 rounded-full h-4">

        <div
          className="bg-indigo-500 h-4 rounded-full transition-all duration-500"
          style={{
            width: `${dashboard.night_completion}%`,
          }}
        />

      </div>

    </div>

  </div>
)}

{dashboard && (
  <RoutineProgressChart
    data={dashboard.daily_progress}
  />
)}

          {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">

              <div className="bg-white rounded-[28px] shadow-xl border border-gray-100 p-8 hover:-translate-y-2 transition-all">
                <h2 className="text-lg font-semibold text-gray-700">
                  Overall Improvement
                </h2>

               <p className="text-5xl font-bold text-green-600 mt-6">
                  +{summary.overall}
                </p>

                <p className="text-gray-500 mt-2">
                  Since your previous assessment
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700">
                  Acne Improvement
                </h2>

                <p className="text-4xl font-bold text-blue-600 mt-4">
                  +{summary.acne}
                </p>

                <p className="text-gray-500 mt-2">
                  Acne severity reduced
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-700">
                  Pigmentation Improvement
                </h2>

                <p className="text-4xl font-bold text-purple-600 mt-4">
                  +{summary.pigmentation}
                </p>

                <p className="text-gray-500 mt-2">
                  Pigmentation reduced
                </p>
              </div>

            </div>
          )}

          {/* Assessment History */}

          <div className="flex justify-between items-center mb-8">

<div>

<h2 className="text-4xl font-bold">

Assessment History

</h2>

<p className="text-gray-500 mt-2">

Every AI skin assessment you've completed.

</p>

</div>

<div className="text-5xl">

📅

</div>

</div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

            {progressList.map((progress) => (
              <ProgressCard
                key={progress.id}
                progress={progress}
              />
            ))}

          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default Progress;