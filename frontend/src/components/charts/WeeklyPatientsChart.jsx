import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function WeeklyPatientsChart({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          Weekly Patients
        </h2>

        <p className="text-sm text-gray-500">
          Patients handled during the last 7 days
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" />

          <XAxis dataKey="day" />

          <YAxis />

          <Tooltip />

          <Bar
            dataKey="patients"
            radius={[10, 10, 0, 0]}
            fill="#4F46E5"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default WeeklyPatientsChart;