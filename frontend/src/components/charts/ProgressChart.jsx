import { useEffect, useState } from "react";

import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { getProgressChart } from "../../services/dashboardService";

function ProgressChart() {

  const [data, setData] = useState([]);

  useEffect(() => {

    const fetchChart = async () => {

      try {

        const response = await getProgressChart();

        setData(response);

      } catch (error) {

        console.error(error);

      }

    };

    fetchChart();

  }, []);

  return (

    <div className="bg-white p-6 rounded-xl shadow-md">

      <h2 className="text-xl font-semibold mb-4">

        Skin Progress

      </h2>

      <ResponsiveContainer width="100%" height={350}>

        <LineChart data={data}>

          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis domain={[0, 100]} />

          <Tooltip />

          <Legend />

          <Line
  type="monotone"
  dataKey="acne"
  stroke="#ef4444"
  strokeWidth={3}
/>

<Line
  type="monotone"
  dataKey="pigmentation"
  stroke="#f59e0b"
  strokeWidth={3}
/>

<Line
  type="monotone"
  dataKey="redness"
  stroke="#10b981"
  strokeWidth={3}
/>

<Line
  type="monotone"
  dataKey="wrinkles"
  stroke="#3b82f6"
  strokeWidth={3}
/>

        </LineChart>

      </ResponsiveContainer>

    </div>

  );

}

export default ProgressChart;