import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Droplets, Sparkles, Stethoscope, Camera } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import ScoreRing from "../components/ScoreRing";
import DonutChartCard from "../components/DonutChartCard";
import ProductImage from "../components/ProductImage";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { USER_SIDEBAR } from "../config/sidebarConfig";
import "./Dashboard.css";
import "./RichDashboard.css";
import "./UserDashboard.css";

function hydrationLabel(score) {
  if (score == null) return "Unknown";
  if (score >= 80) return "Good";
  if (score >= 50) return "Fair";
  return "Low";
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [skinProfile, setSkinProfile] = useState(null);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [routine, setRoutine] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.get("/skin-profile"),
      api.get("/v1/assessment/score"),
      api.get("/v1/assessment/history"),
      api.get("/v1/routine"),
      api.get("/products"),
    ]).then(([profileRes, scoreRes, historyRes, routineRes, productsRes]) => {
      if (profileRes.status === "fulfilled") setSkinProfile(profileRes.value.data);
      if (scoreRes.status === "fulfilled") setScore(scoreRes.value.data);
      if (historyRes.status === "fulfilled") setHistory(historyRes.value.data.slice().reverse());
      if (routineRes.status === "fulfilled") setRoutine(routineRes.value.data);
      if (productsRes.status === "fulfilled") setRecommended(productsRes.value.data.filter((p) => p.is_recommended_for_you));
      setLoading(false);
    });
  }, []);

  const concernsDonut = (score?.detected_concerns || []).map((c) => ({ label: c.name, count: 1 }));
  const todaySteps = routine ? [...routine.am, ...routine.pm] : [];

  const tips = [];
  if (score) {
    if (score.breakdown.hydration_score < 60) tips.push("Your hydration is low — try drinking more water today.");
    if (score.breakdown.sleep_score < 60) tips.push("Your sleep score is low — aim closer to 8 hours tonight.");
    if (score.breakdown.consistency_score < 60) tips.push("You've missed some routine steps this week — try to stay consistent.");
    if (score.breakdown.lifestyle_score < 60) tips.push("Consider more sun protection — your lifestyle score dipped from UV exposure.");
  }

  return (
    <DashboardLayout items={USER_SIDEBAR} roleLabel="User">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.full_name?.split(" ")[0] || "there"} 👋</h1>
        <p>Here's your skin summary and personalized recommendations.</p>
      </div>

      {loading ? (
        <Loading label="Loading your dashboard" />
      ) : !score ? (
        <div className="glass-card empty-state">
          <p>You haven't taken your skin assessment yet.</p>
          <Link to="/assessment" className="btn btn-primary">
            Take the assessment
          </Link>
        </div>
      ) : (
        <>
          <div className="user-summary-row">
            <div className="glass-card user-summary-card">
              <ScoreRing score={score.overall_score} size={64} showLabel />
              <span className="user-summary-label">Skin Health Score</span>
            </div>
            <div className="glass-card user-summary-card">
              <span className="user-summary-value">{skinProfile?.skin_type || score.skin_type || "—"}</span>
              <span className="user-summary-label">Skin Type</span>
            </div>
            <div className="glass-card user-summary-card">
              <span className="user-summary-value">{score.primary_concern || "—"}</span>
              <span className="user-summary-label">Top Concern</span>
            </div>
            <div className="glass-card user-summary-card">
              <span className="user-summary-value">{hydrationLabel(score.breakdown.hydration_score)}</span>
              <span className="user-summary-label">Hydration Level</span>
            </div>
          </div>

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <h3>Today's Routine</h3>
              {todaySteps.length === 0 ? (
                <p className="donut-empty">
                  No routine yet — <Link to="/assessment">take the assessment</Link> to generate one.
                </p>
              ) : (
                <ul className="today-routine-list">
                  {todaySteps.map((s) => (
                    <li key={s.id} className={s.completed_today ? "done" : ""}>
                      <span>
                        {s.time_of_day} · Step {s.step_number}: {s.step_category}
                      </span>
                      <span>{s.completed_today ? "✅" : "⬜️"}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link to="/planner" className="btn btn-ghost" style={{ marginTop: 14 }}>
                Open Daily Planner
              </Link>
            </div>

            <DonutChartCard title="Skin Concerns Overview" data={concernsDonut} centerLabel="Concerns" />
          </div>

          <div className="rich-grid rich-grid-2-1">
            <div className="glass-card rich-table-card">
              <h3>Skin Health Progress</h3>
              {history.length < 2 ? (
                <p className="donut-empty">Take a few more assessments to see your trend.</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="created_at"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} />
                    <Line type="monotone" dataKey="overall_score" stroke="#4f46e5" strokeWidth={2.5} dot />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass-card rich-table-card">
              <h3>Insights</h3>
              {tips.length === 0 ? (
                <p className="donut-empty">Everything looks solid — keep it up!</p>
              ) : (
                <ul className="insight-list">
                  {tips.map((t, i) => (
                    <li key={i}>💡 {t}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {recommended.length > 0 && (
            <div className="glass-card rich-table-card">
              <div className="rich-table-header">
                <h3>Recommended For You</h3>
                <Link to="/store" className="link-button">
                  View Store →
                </Link>
              </div>
              <div className="mini-product-row">
                {recommended.map((p) => (
                  <div key={p.id} className="mini-product-card">
                    <ProductImage category={p.category} size={64} />
                    <span className="mini-product-name">{p.name}</span>
                    <span className="mini-product-price">₹{p.price.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="quick-actions" style={{ marginTop: 20 }}>
            <Link to="/skin-profile" className="btn btn-ghost">
              <Camera size={16} /> Update Skin Photo
            </Link>
            <Link to="/lifestyle" className="btn btn-ghost">
              <Droplets size={16} /> Log Today's Lifestyle
            </Link>
            <Link to="/assessment" className="btn btn-ghost">
              <Sparkles size={16} /> Retake Assessment
            </Link>
            <Link to="/bookings" className="btn btn-ghost">
              <Stethoscope size={16} /> Book a Consultant
            </Link>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
