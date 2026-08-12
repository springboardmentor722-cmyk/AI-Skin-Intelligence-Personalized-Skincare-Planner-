import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbSun, TbMoon, TbCalendarWeek } from "react-icons/tb";
import MainLayout from "../../layouts/MainLayout";
import SkinHealthRing from "../../components/SkinHealthRing";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";
import { getRoutine, getLatestScore, toggleRoutineStep } from "../../services/assessment";
import { useToast } from "../../context/ToastContext";

const SECTIONS = [
  { key: "AM", label: "Morning Plan", icon: <TbSun /> },
  { key: "PM", label: "Evening Plan", icon: <TbMoon /> },
  { key: "Weekly", label: "Weekly Highlights", icon: <TbCalendarWeek /> },
];

export default function Planner() {
  const { showToast } = useToast();
  const [steps, setSteps] = useState([]);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noRoutineYet, setNoRoutineYet] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [routineRes, scoreRes] = await Promise.allSettled([getRoutine(), getLatestScore()]);
      if (routineRes.status === "fulfilled") {
        setSteps(routineRes.value.data);
        setNoRoutineYet(routineRes.value.data.length === 0);
      }
      if (scoreRes.status === "fulfilled") {
        setScore(scoreRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (step) => {
    const next = !step.completed_today;
    // Optimistic UI update, then confirm with the backend.
    setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, completed_today: next } : s)));
    try {
      await toggleRoutineStep(step.id, next);
    } catch {
      showToast("Couldn't save that — try again", "error");
      setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, completed_today: !next } : s)));
    }
  };

  if (loading) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="grid sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </MainLayout>
    );
  }

  if (noRoutineYet) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="glass p-12 flex flex-col items-center text-center gap-3">
          <img src="/images/empty-state-default.png" alt="" className="w-32 h-32 object-contain" />
          <h2 className="text-base font-medium">No routine yet</h2>
          <p className="text-sm text-ink-secondary max-w-sm">
            Complete the skin assessment first — your personalized AM/PM routine
            gets generated from it.
          </p>
          <Link to="/assessment" className="btn-primary mt-2">Take the assessment</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold">Your daily planner</h1>
          {score?.primary_concern && (
            <p className="text-sm text-ink-secondary">Primary focus: {score.primary_concern}</p>
          )}
        </div>
        {score && (
          <SkinHealthRing value={score.overall_score} tone="sage" size={72} label="Skin health score" />
        )}
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        {SECTIONS.map((section) => {
          const sectionSteps = steps.filter((s) => s.time_of_day === section.key);
          return (
            <div key={section.key} className="glass p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-ocean-600">
                <span className="text-lg">{section.icon}</span>
                <h2 className="font-semibold text-ink-primary">{section.label}</h2>
              </div>
              {sectionSteps.length === 0 && (
                <p className="text-sm text-ink-secondary">No steps here.</p>
              )}
              {sectionSteps.map((step) => (
                <label
                  key={step.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/40 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={step.completed_today}
                    onChange={() => handleToggle(step)}
                    className="mt-1 accent-ocean-500 w-4 h-4"
                  />
                  <div>
                    <p className={`text-sm font-medium ${step.completed_today ? "line-through text-ink-secondary" : "text-ink-primary"}`}>
                      {step.step_name}
                    </p>
                    <p className="text-xs text-ink-secondary">{step.step_category}</p>
                  </div>
                </label>
              ))}
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
