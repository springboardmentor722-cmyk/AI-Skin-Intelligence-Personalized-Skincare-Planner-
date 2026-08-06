import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function RoutineProgressChart({ data }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 mb-10">

      <div className="flex justify-between items-center mb-6">

        <div>
          <h2 className="text-2xl font-bold">
            Routine Completion
          </h2>

          <p className="text-gray-500">
            Last 7 Days
          </p>
        </div>

        <div className="text-4xl">
          
        </div>

      </div>

      <ResponsiveContainer width="100%" height={320}>

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis
            domain={[0, 100]}
          />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="completion"
            stroke="#22c55e"
            strokeWidth={4}
            dot={{ r: 5 }}
          />

        </LineChart>

      </ResponsiveContainer>

    </div>
  );
}

export default RoutineProgressChart;