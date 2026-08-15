import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import ErrorBanner from "../components/ErrorBanner";
import Loading from "../components/Loading";
import "./DailyPlanner.css";

export default function DailyPlanner() {
  const [routine, setRoutine] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingIds, setPendingIds] = useState(new Set());

  const loadRoutine = () => {
    return api
      .get("/v1/routine")
      .then((res) => setRoutine(res.data))
      .catch((err) => {
        if (err?.response?.status === 404) {
          setRoutine({ am: [], pm: [], weekly: [] });
        } else {
          setError("Could not load your routine.");
        }
      });
  };

  useEffect(() => {
    Promise.allSettled([
      loadRoutine(),
      api.get("/v1/assessment/score").then((res) => setScore(res.data)),
    ]).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (step) => {
    const nextCompleted = !step.completed_today;
    setPendingIds((prev) => new Set(prev).add(step.id));

    // Optimistic update so the checkbox responds immediately.
    setRoutine((prev) => ({
      ...prev,
      [step.time_of_day.toLowerCase()]: prev[step.time_of_day.toLowerCase()].map((s) =>
        s.id === step.id ? { ...s, completed_today: nextCompleted } : s
      ),
    }));

    try {
      await api.post("/v1/routine/log", {
        routine_step_id: step.id,
        completed: nextCompleted,
      });
    } catch {
      // Roll back on failure.
      setRoutine((prev) => ({
        ...prev,
        [step.time_of_day.toLowerCase()]: prev[step.time_of_day.toLowerCase()].map((s) =>
          s.id === step.id ? { ...s, completed_today: !nextCompleted } : s
        ),
      }));
      setError("Could not save that update. Please try again.");
    } finally {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(step.id);
        return next;
      });
    }
  };

  if (loading) return <Loading label="Loading your daily planner" />;

  const hasRoutine = routine && (routine.am.length || routine.pm.length || routine.weekly.length);

  return (
    <div className="daily-planner">
      <div className="daily-planner-header">
        <span className="eyebrow">Daily Planner</span>
        <h1>Your skincare routine</h1>
        {routine?.seasonal_tip && <p className="seasonal-tip">💡 {routine.seasonal_tip}</p>}
      </div>

      <ErrorBanner message={error} />

      {score && (
        <div className="glass-card score-summary">
          <div>
            <span className="score-summary-label">Skin Health Score</span>
            <span className="score-summary-value">{score.overall_score}</span>
          </div>
          <div className="score-summary-breakdown">
            <BreakdownItem label="Condition" value={score.breakdown.skin_condition_score} />
            <BreakdownItem label="Lifestyle" value={score.breakdown.lifestyle_score} />
            <BreakdownItem label="Sleep" value={score.breakdown.sleep_score} />
            <BreakdownItem label="Consistency" value={score.breakdown.consistency_score} />
            <BreakdownItem label="Hydration" value={score.breakdown.hydration_score} />
          </div>
        </div>
      )}

      {!hasRoutine ? (
        <div className="glass-card empty-state">
          <p>You don't have a routine yet.</p>
          <Link to="/assessment" className="btn btn-primary">
            Take the skin assessment
          </Link>
        </div>
      ) : (
        <div className="planner-grid">
          <RoutineCard title="Morning Plan (AM)" steps={routine.am} pendingIds={pendingIds} onToggle={handleToggle} />
          <RoutineCard title="Evening Plan (PM)" steps={routine.pm} pendingIds={pendingIds} onToggle={handleToggle} />
          <RoutineCard
            title="Weekly Highlights"
            steps={routine.weekly}
            pendingIds={pendingIds}
            onToggle={handleToggle}
          />
        </div>
      )}
    </div>
  );
}

function BreakdownItem({ label, value }) {
  return (
    <div className="breakdown-item">
      <span className="breakdown-item-value">{Math.round(value)}</span>
      <span className="breakdown-item-label">{label}</span>
    </div>
  );
}

function RoutineCard({ title, steps, pendingIds, onToggle }) {
  return (
    <div className="glass-card planner-card">
      <h3>{title}</h3>
      {steps.length === 0 ? (
        <p className="planner-card-empty">No steps yet.</p>
      ) : (
        <ul className="planner-step-list">
          {steps.map((step) => (
            <li key={step.id} className="planner-step">
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={step.completed_today}
                  disabled={pendingIds.has(step.id)}
                  onChange={() => onToggle(step)}
                />
                <span>
                  Step {step.step_number}: {step.step_category}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
