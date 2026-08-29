import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TbFlame, TbTrendingUp, TbTrendingDown, TbChartLine } from "react-icons/tb";
import MainLayout from "../../layouts/MainLayout";
import { SkeletonCard } from "../../components/Skeleton";
import { USER_NAV_ITEMS } from "../shared/userNav";
import { getScoreHistory, getConsistencyHistory } from "../../services/assessment";

function formatShortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ScoreTrendChart({ history }) {
  const w = 640;
  const h = 160;
  const padding = 24;
  const scores = history.map((h) => h.overall_score);
  const max = Math.max(...scores, 100);
  const min = Math.min(...scores, 0);
  const range = max - min || 1;
  const stepX = (w - padding * 2) / Math.max(history.length - 1, 1);

  const coords = history.map((point, i) => {
    const x = padding + i * stepX;
    const y = h - padding - ((point.overall_score - min) / range) * (h - padding * 2);
    return { x, y, ...point };
  });

  const linePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <polyline points={linePoints} fill="none" stroke="#2F6FA8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill="#2F6FA8" />
      ))}
      {coords.length > 0 && (
        <>
          <text x={coords[0].x} y={h - 4} fontSize="10" fill="#7a8a99" textAnchor="start">
            {formatShortDate(coords[0].created_at)}
          </text>
          <text x={coords[coords.length - 1].x} y={h - 4} fontSize="10" fill="#7a8a99" textAnchor="end">
            {formatShortDate(coords[coords.length - 1].created_at)}
          </text>
        </>
      )}
    </svg>
  );
}

function ConsistencyBars({ daily }) {
  return (
    <div className="flex items-end gap-[3px] h-24">
      {daily.map((d) => (
        <div
          key={d.date}
          className="flex-1 rounded-t-sm bg-sage-200 relative group"
          style={{ height: `${Math.max(d.pct_complete, 3)}%` }}
          title={`${d.date}: ${d.pct_complete}%`}
        >
          <div
            className="absolute bottom-0 left-0 right-0 rounded-t-sm bg-sage-500"
            style={{ height: d.pct_complete > 0 ? "100%" : "0%" }}
          />
        </div>
      ))}
    </div>
  );
}

function ConcernComparison({ latest, previous }) {
  const latestMap = Object.fromEntries((latest || []).map((c) => [c.name, c.severity]));
  const prevMap = Object.fromEntries((previous || []).map((c) => [c.name, c.severity]));
  const names = [...new Set([...Object.keys(latestMap), ...Object.keys(prevMap)])];

  if (names.length === 0) {
    return <p className="text-sm text-ink-secondary">No concerns detected — keep it up.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {names.map((name) => {
        const now = latestMap[name] ?? 0;
        const before = prevMap[name] ?? now;
        const delta = now - before;
        return (
          <div key={name} className="flex items-center justify-between text-sm">
            <span className="text-ink-primary">{name}</span>
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                delta < 0 ? "text-sage-600" : delta > 0 ? "text-danger-500" : "text-ink-secondary"
              }`}
            >
              {delta < 0 && <TbTrendingDown size={14} />}
              {delta > 0 && <TbTrendingUp size={14} />}
              {delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta} severity`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Progress() {
  const [scoreHistory, setScoreHistory] = useState([]);
  const [consistency, setConsistency] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noHistory, setNoHistory] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [scoreRes, consistencyRes] = await Promise.allSettled([
        getScoreHistory(30),
        getConsistencyHistory(30),
      ]);
      if (scoreRes.status === "fulfilled") {
        setScoreHistory(scoreRes.value.data);
        setNoHistory(scoreRes.value.data.length === 0);
      }
      if (consistencyRes.status === "fulfilled") {
        setConsistency(consistencyRes.value.data);
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

  if (noHistory) {
    return (
      <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
        <div className="glass p-12 flex flex-col items-center text-center gap-3">
          <img src="/images/empty-state-progress.png" alt="" className="w-32 h-32 object-contain" />
          <h2 className="text-base font-medium">Nothing to track yet</h2>
          <p className="text-sm text-ink-secondary max-w-sm">
            Progress builds up after your first assessment — complete one to start your history.
          </p>
          <Link to="/assessment" className="btn-primary mt-2">Take the assessment</Link>
        </div>
      </MainLayout>
    );
  }

  const latestConcerns = scoreHistory[scoreHistory.length - 1]?.detected_concerns;
  const previousConcerns = scoreHistory.length >= 2 ? scoreHistory[scoreHistory.length - 2]?.detected_concerns : null;
  const scoreDelta = scoreHistory.length >= 2
    ? scoreHistory[scoreHistory.length - 1].overall_score - scoreHistory[0].overall_score
    : 0;

  return (
    <MainLayout navItems={USER_NAV_ITEMS} brandLabel="Skin AI">
      <header className="animate-in">
        <div className="flex items-center gap-2">
          <TbChartLine className="text-ocean-600" />
          <h1 className="text-xl font-semibold">Your progress</h1>
        </div>
        <p className="text-sm text-ink-secondary">
          Score history, routine consistency, and how your concerns are trending.
        </p>
      </header>

      <div className="glass p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="metric-label">Skin health score — last {scoreHistory.length} assessments</p>
          {scoreHistory.length >= 2 && (
            <span className={`flex items-center gap-1 text-xs font-medium ${scoreDelta >= 0 ? "text-sage-600" : "text-danger-500"}`}>
              {scoreDelta >= 0 ? <TbTrendingUp size={14} /> : <TbTrendingDown size={14} />}
              {scoreDelta >= 0 ? "+" : ""}{Math.round(scoreDelta)} overall
            </span>
          )}
        </div>
        <ScoreTrendChart history={scoreHistory} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="metric-label">Routine consistency — last 30 days</p>
            {consistency && (
              <span className="flex items-center gap-1 text-xs font-medium text-clay-600">
                <TbFlame size={14} />
                {consistency.current_streak}-day streak
              </span>
            )}
          </div>
          {consistency ? (
            <ConsistencyBars daily={consistency.daily} />
          ) : (
            <p className="text-sm text-ink-secondary">Consistency data unavailable right now.</p>
          )}
        </div>

        <div className="glass p-5 flex flex-col gap-3">
          <p className="metric-label">Concern trend vs previous assessment</p>
          <ConcernComparison latest={latestConcerns} previous={previousConcerns} />
          {!previousConcerns && (
            <p className="text-xs text-ink-secondary/70">
              Complete another assessment to see how concerns are trending.
            </p>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
