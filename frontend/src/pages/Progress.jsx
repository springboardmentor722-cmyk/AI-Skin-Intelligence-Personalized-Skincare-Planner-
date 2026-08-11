import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import "../styles/progress.css";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

function Progress() {
  const [records, setRecords] = useState([]); const [error, setError] = useState("");
  useEffect(() => { api.get("/progress/").then(({ data }) => setRecords(data)).catch(() => setError("Unable to load your progress records.")); }, []);
  const latest = records.at(-1);
  const chartData = useMemo(() => ({ labels: records.map((r) => r.assessment_date), datasets: [{ label: "Skin score", data: records.map((r) => r.skin_score), borderColor: "#d96c95", backgroundColor: "#d96c95", tension: 0.35 }, { label: "Hydration", data: records.map((r) => r.hydration_score), borderColor: "#f2a7c7", backgroundColor: "#f2a7c7", tension: 0.35 }, { label: "Acne level", data: records.map((r) => r.acne_level), borderColor: "#8d7ac8", backgroundColor: "#8d7ac8", tension: 0.35, yAxisID: "acne" }] }), [records]);
  const options = { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100 }, acne: { position: "right", min: 0, max: 10, grid: { drawOnChartArea: false } } } };
  const value = (item, suffix = "") => item === null || item === undefined ? "—" : `${item}${suffix}`;
  return <DashboardLayout><div className="progress-hero"><h2>Skin Progress Analytics</h2><p>Track your skin assessment history over time.</p></div>{error && <div className="alert alert-danger">{error}</div>}{!error && records.length === 0 && <div className="progress-empty">No skin assessments yet. Please update your Skin Profile first.</div>}{!error && records.length > 0 && <><div className="row mt-4"><Summary title="Total Assessments" value={records.length} /><Summary title="Latest Skin Score" value={value(latest?.skin_score, "%")} /><Summary title="Latest Hydration" value={value(latest?.hydration_score, "%")} /><Summary title="Latest Acne Level" value={value(latest?.acne_level, "/10")} /></div><div className="chart-card"><Line data={chartData} options={options} /></div><div className="row">{[...records].reverse().map((item) => <div className="col-lg-6 mb-4" key={item.progress_id}><article className="progress-record"><div className="progress-record-header"><h4>Assessment</h4><time>{item.assessment_date}</time></div><Metric label="Skin Score" value={item.skin_score} max={100} color="#d96c95" suffix="%" /><Metric label="Hydration" value={item.hydration_score} max={100} color="#f4a6c4" suffix="%" /><Metric label="Acne Level" value={item.acne_level} max={10} color="#8d7ac8" suffix="/10" />{item.notes && <p className="progress-notes"><strong>Notes:</strong> {item.notes}</p>}</article></div>)}</div></>}</DashboardLayout>;
}
function Summary({ title, value }) { return <div className="col-lg-3 col-md-6 mb-3"><div className="summary-card"><h3>{value}</h3><p>{title}</p></div></div>; }
function Metric({ label, value, max, color, suffix }) { const hasValue = value !== null && value !== undefined; return <div className="metric"><div><span>{label}</span><strong>{hasValue ? `${value}${suffix}` : "Not assessed"}</strong></div>{hasValue && <div className="progress"><div className="progress-bar" style={{ background: color, width: `${Math.min((value / max) * 100, 100)}%` }} /></div>}</div>; }
export default Progress;
