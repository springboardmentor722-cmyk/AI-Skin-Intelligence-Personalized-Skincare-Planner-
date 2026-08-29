import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbSparkles, TbTrendingUp, TbTrendingDown, TbFlask } from "react-icons/tb";
import MainLayout from "../../layouts/MainLayout";
import SkinHealthRing from "../../components/SkinHealthRing";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";
import { getLatestScore, getScoreHistory } from "../../services/assessment";

// Matches scoring_engine.py weights exactly.
const BREAKDOWN_CONFIG = [
  { key: "condition_score", label: "Skin condition", weight: 35 },
  { key: "lifestyle_score", label: "Lifestyle", weight: 20 },
  { key: "consistency_score", label: "Routine consistency", weight: 20 },
  { key: "sleep_score", label: "Sleep quality", weight: 15 },
  { key: "hydration_score", label: "Hydration", weight: 10 },
];

function scoreTone(score) {
  if (score >= 85) return { tone: "sage", text: "Excellent" };
  if (score >= 70) return { tone: "ocean", text: "Good" };
  if (score >= 50) return { tone: "clay", text: "Needs work" };
  return { tone: "danger", text: "At risk" };
}

function Sparkline({ points }) {
  if (points.length < 2) return null;
  const w = 260;
  const h = 64;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = h - ((p - min) / range) * (h - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const [lastX, lastY] = coords[coords.length - 1].split(",");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="#7C3AED"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="4" fill="#7C3AED" />
    </svg>
  );
}

function BreakdownBar({ label, value, weight }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-xs text-purple-900/80 font-medium">{label}</span>
        <span className="text-[11px] text-purple-700/70">{weight}%</span>
      </div>
      <div className="h-2 rounded-full bg-purple-200/50 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-600" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function UserDashboard() {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noAssessmentYet, setNoAssessmentYet] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [scoreRes, historyRes] = await Promise.allSettled([
        getLatestScore(),
        getScoreHistory(30),
      ]);

      if (scoreRes.status === "fulfilled") {
        setScore(scoreRes.value.data);
      } else if (scoreRes.reason?.response?.status === 404) {
        setNoAssessmentYet(true);
      }

      if (historyRes.status === "fulfilled") {
        setHistory(historyRes.value.data);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="grid sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </MainLayout>
    );
  }

  if (noAssessmentYet) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="glass p-12 flex flex-col items-center text-center gap-3">
          <img src="/images/empty-state-default.png" alt="" className="w-32 h-32 object-contain" />
          <h2 className="text-base font-semibold text-purple-950">No skin health score yet</h2>
          <p className="text-sm text-purple-800/70 max-w-sm">
            Complete your skin assessment to get your Skin Health Score and a personalized routine.
          </p>
          <Link to="/assessment" className="btn-primary mt-2">Take the assessment</Link>
        </div>
      </MainLayout>
    );
  }

  const { tone, text } = scoreTone(score.overall_score);
  const points = history.map((h) => h.overall_score);
  const delta = points.length >= 2 ? points[points.length - 1] - points[0] : 0;

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="flex items-center justify-between flex-wrap gap-3 animate-in">
        <div>
          <h1 className="text-2xl font-bold text-purple-950 font-display">Your skin health score</h1>
          {score.primary_concern && (
            <p className="text-sm text-purple-700/80 font-medium">Primary focus: {score.primary_concern}</p>
          )}
        </div>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass p-6 flex flex-col gap-4 border border-purple-200/70">
          <div className="flex items-center gap-5">
            <SkinHealthRing value={score.overall_score} tone={tone} size={92} label={text} />
            <div className="flex-1 flex flex-col gap-3">
              {BREAKDOWN_CONFIG.map((b) => (
                <BreakdownBar
                  key={b.key}
                  label={b.label}
                  weight={b.weight}
                  value={score[b.key] ?? 0}
                />
              ))}
            </div>
          </div>

          {score.detected_concerns?.length > 0 && (
            <div className="border-t border-purple-200/60 pt-3">
              <p className="text-xs font-semibold text-purple-900/80 mb-2 uppercase tracking-wider">Detected concerns</p>
              <div className="flex flex-wrap gap-1.5">
                {score.detected_concerns.map((c) => (
                  <span key={c.name} className="pill bg-purple-100 text-purple-800 border border-purple-200 text-xs">
                    {c.name} · {c.level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="glass p-6 flex flex-col gap-2 border border-purple-200/70">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-purple-900/80 uppercase tracking-wider">Trend History</p>
            {points.length >= 2 && (
              <span
                className={`flex items-center gap-1 text-xs font-bold ${
                  delta >= 0 ? "text-purple-700" : "text-rose-600"
                }`}
              >
                {delta >= 0 ? <TbTrendingUp /> : <TbTrendingDown />}
                {delta >= 0 ? "+" : ""}
                {Math.round(delta)} over last {points.length} assessments
              </span>
            )}
          </div>
          {points.length >= 2 ? (
            <Sparkline points={points} />
          ) : (
            <p className="text-sm text-purple-800/70 py-4">
              Complete another assessment to start tracking your trend.
            </p>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Link to="/routine" className="glass lift p-4 flex items-center gap-3 border border-purple-200/60">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl font-bold">
            <TbSparkles />
          </div>
          <div>
            <p className="font-semibold text-purple-950">Personalized routine</p>
            <p className="text-xs text-purple-700/70">Your AM/PM/Weekly steps</p>
          </div>
        </Link>
        <Link to="/recommendations" className="glass lift p-4 flex items-center gap-3 border border-purple-200/60">
          <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-xl font-bold">
            <TbFlask />
          </div>
          <div>
            <p className="font-semibold text-purple-950">Recommended products</p>
            <p className="text-xs text-purple-700/70">Matched to concerns and allergies</p>
          </div>
        </Link>
        <Link to="/progress" className="glass lift p-4 flex items-center gap-3 border border-purple-200/60">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold">
            <TbTrendingUp />
          </div>
          <div>
            <p className="font-semibold text-purple-950">Progress tracking</p>
            <p className="text-xs text-purple-700/70">Score history and consistency</p>
          </div>
        </Link>
        <Link to="/assessment" className="glass lift p-4 flex items-center gap-3 border border-purple-200/60">
          <div className="w-10 h-10 rounded-xl bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center text-xl font-bold">
            <TbSparkles />
          </div>
          <div>
            <p className="font-semibold text-purple-950">Retake assessment</p>
            <p className="text-xs text-purple-700/70">Update your score as things change</p>
          </div>
        </Link>
      </div>
    </MainLayout>
  );
}

