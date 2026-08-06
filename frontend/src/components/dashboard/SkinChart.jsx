import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

const data = [
  { week: "Mon", score: 62 },
  { week: "Tue", score: 68 },
  { week: "Wed", score: 73 },
  { week: "Thu", score: 79 },
  { week: "Fri", score: 84 },
  { week: "Sat", score: 88 },
  { week: "Sun", score: 92 },
];

export default function SkinChart() {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">

      <div className="mb-6">

        <h2 className="text-2xl font-bold">
          Skin Health Progress
        </h2>

        <p className="text-gray-500">
          Weekly AI Skin Score
        </p>

      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid strokeDasharray="4 4" />

            <XAxis dataKey="week" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="score"
              stroke="#10b981"
              strokeWidth={4}
              dot={{ r: 5 }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}