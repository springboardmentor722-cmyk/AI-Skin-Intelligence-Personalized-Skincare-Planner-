import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  TbSun, TbMoon, TbCalendarWeek, TbSparkles, TbDroplet,
  TbFlask, TbLeaf, TbRefresh,
} from "react-icons/tb";
import MainLayout from "../../layouts/MainLayout";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";
import { getRoutine, generateRoutine } from "../../services/assessment";
import { useToast } from "../../context/ToastContext";

const SECTIONS = [
  { key: "AM", label: "Morning routine", icon: <TbSun /> },
  { key: "PM", label: "Evening routine", icon: <TbMoon /> },
  { key: "Weekly", label: "Weekly treatments", icon: <TbCalendarWeek /> },
];

// Purely cosmetic per-category icon, falls back to a generic sparkle.
const CATEGORY_ICON = {
  Cleansing: <TbDroplet />,
  Treatment: <TbFlask />,
  Moisturizing: <TbDroplet />,
  "Sun Protection": <TbSun />,
  "Night Care": <TbMoon />,
  Exfoliation: <TbLeaf />,
};

export default function Routine() {
  const { showToast } = useToast();
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [noRoutineYet, setNoRoutineYet] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getRoutine();
      setSteps(res.data);
      setNoRoutineYet(res.data.length === 0);
    } catch {
      setNoRoutineYet(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await generateRoutine();
      await load();
      showToast("Your routine has been refreshed", "success");
    } catch {
      showToast("Couldn't regenerate your routine — try again", "error");
    } finally {
      setRegenerating(false);
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
            Complete the skin assessment first — your personalized AM/PM/Weekly
            routine gets generated from it.
          </p>
          <Link to="/assessment" className="btn-primary mt-2">Take the assessment</Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="flex items-center justify-between flex-wrap gap-3 animate-in">
        <div>
          <h1 className="text-xl font-semibold">Your personalized routine</h1>
          <p className="text-sm text-ink-secondary">
            Generated from your latest assessment, with safety guardrails applied automatically.
          </p>
        </div>
        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="btn-outline flex items-center gap-2 h-fit disabled:opacity-60"
        >
          <TbRefresh className={regenerating ? "animate-spin" : ""} />
          {regenerating ? "Regenerating..." : "Regenerate routine"}
        </button>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        {SECTIONS.map((section) => {
          const sectionSteps = steps
            .filter((s) => s.time_of_day === section.key)
            .sort((a, b) => a.step_number - b.step_number);

          return (
            <div key={section.key} className="glass p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-ocean-600">
                <span className="text-lg">{section.icon}</span>
                <h2 className="font-semibold text-ink-primary">{section.label}</h2>
              </div>

              {sectionSteps.length === 0 && (
                <p className="text-sm text-ink-secondary">No steps here.</p>
              )}

              <ol className="flex flex-col gap-2">
                {sectionSteps.map((step) => (
                  <li key={step.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/40">
                    <div className="w-7 h-7 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {CATEGORY_ICON[step.step_category] || <TbSparkles />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-primary">
                        {step.step_number}. {step.step_name}
                      </p>
                      <p className="text-xs text-ink-secondary">{step.step_category}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <Link to="/planner" className="glass lift p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-sage-100 text-sage-600 flex items-center justify-center text-lg">
          <TbCalendarWeek />
        </div>
        <div>
          <p className="font-medium text-ink-primary">Go to your daily checklist</p>
          <p className="text-xs text-ink-secondary">Check off today's steps and track completion</p>
        </div>
      </Link>
    </MainLayout>
  );
}
