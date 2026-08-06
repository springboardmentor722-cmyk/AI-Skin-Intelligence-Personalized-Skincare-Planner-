import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import { useEffect, useState } from "react";
import { getWeeklyTrend } from "../../services/consultantService";



function ConsultantAnalytics({ stats }) {

    const [weeklyData, setWeeklyData] = useState([]);

useEffect(() => {

    const loadTrend = async () => {

        try {

            const data = await getWeeklyTrend();

            setWeeklyData(data);

        } catch (err) {

            console.error(err);

        }

    };

    loadTrend();

}, []);
  

  const statusData = [
  {
    name: "Approved",
    value: stats.approved,
  },
  {
    name: "Pending",
    value: stats.pending,
  },
  {
    name: "Rejected",
    value: stats.rejected,
  },
];

  const COLORS = [
    "#10B981",
    "#F59E0B",
    "#EF4444",
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-10">

      {/* Weekly Consultation Trend */}

      <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8">

        <h2 className="text-2xl font-bold">
          Weekly Consultation Trend
        </h2>

        <p className="text-gray-500 mt-2 mb-6">
          Patient consultations completed during the last 7 days.
        </p>

        <ResponsiveContainer width="100%" height={340}>

          <LineChart data={weeklyData}>

            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

            <XAxis
              dataKey="day"
              tick={{ fill: "#6B7280" }}
            />

            <YAxis
              tick={{ fill: "#6B7280" }}
            />

            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            />

            <Legend />

            <Line
              type="monotone"
              dataKey="patients"
              stroke="#2563EB"
              strokeWidth={4}
              dot={{
                r: 5,
                fill: "#2563EB",
              }}
              activeDot={{
                r: 8,
              }}
              animationDuration={1200}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* Consultation Outcome */}

      <div className="bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 p-8">

        <h2 className="text-2xl font-bold">
          Consultation Outcome
        </h2>

        <p className="text-gray-500 mt-2 mb-6">
          Distribution of reviewed patient cases.
        </p>

        <ResponsiveContainer width="100%" height={340}>

          <PieChart>

            <Pie
              data={statusData}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
              animationDuration={1200}
              label={({ name, value }) => `${name} (${value}%)`}
            >

              {statusData.map((entry, index) => (

                <Cell
                  key={index}
                  fill={COLORS[index]}
                />

              ))}

            </Pie>

            <Tooltip
              formatter={(value) => `${value}%`}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
              }}
            />

            <Legend />

          </PieChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default ConsultantAnalytics;