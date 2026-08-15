import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import "./DonutChartCard.css";

const PALETTE = ["#4f46e5", "#3b82f6", "#f59e0b", "#ec4899", "#10b981", "#8b5cf6", "#94a3b8"];

export default function DonutChartCard({ title, data, centerLabel }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="glass-card donut-card">
      <h3>{title}</h3>
      {total === 0 ? (
        <p className="donut-empty">Not enough data yet.</p>
      ) : (
        <div className="donut-body">
          <div className="donut-chart-wrap">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="count"
                  nameKey="label"
                  innerRadius={44}
                  outerRadius={64}
                  paddingAngle={2}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <span className="donut-center-value">{total}</span>
              {centerLabel && <span className="donut-center-label">{centerLabel}</span>}
            </div>
          </div>
          <div className="donut-legend">
            {data.map((d, i) => (
              <div key={d.label} className="donut-legend-row">
                <span className="donut-legend-dot" style={{ background: PALETTE[i % PALETTE.length] }} />
                <span className="donut-legend-label">{d.label}</span>
                <span className="donut-legend-value">
                  {d.count} ({Math.round((d.count / total) * 100)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
