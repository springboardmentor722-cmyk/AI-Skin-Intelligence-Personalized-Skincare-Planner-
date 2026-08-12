import { useEffect, useMemo, useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { getAllUsers } from "../../../services/admin";
import { getAdminScoreOverview } from "../../../services/assessment";

function TrendChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 560;
  const height = 160;
  const barWidth = width / data.length - 12;

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full h-auto">
      {data.map((d, i) => {
        const barHeight = (d.value / max) * height;
        const x = i * (width / data.length) + 6;
        const y = height - barHeight;
        return (
          <g key={d.label}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="var(--color-ocean-500)" opacity={0.85} />
            <text x={x + barWidth / 2} y={height + 18} textAnchor="middle" fontSize="11" fill="var(--color-ink-secondary)">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function RoleBar({ label, count, total, color }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="capitalize text-ink-primary">{label}</span>
        <span className="text-ink-secondary font-mono text-xs">{count} · {pct}%</span>
      </div>
      <div className="h-2 rounded-pill bg-white/50 overflow-hidden">
        <div className="h-full rounded-pill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [users, setUsers] = useState([]);
  const [scoreOverview, setScoreOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([getAllUsers(), getAdminScoreOverview()]).then(([usersRes, scoreRes]) => {
      if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
      else setError("Couldn't load analytics data.");
      if (scoreRes.status === "fulfilled") setScoreOverview(scoreRes.value.data);
    }).finally(() => setLoading(false));
  }, []);

  // Real signup trend — last 7 days, counted from actual created_at values.
  const signupTrend = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
    return days.map((d) => {
      const label = d.toLocaleDateString(undefined, { weekday: "short" });
      const count = users.filter((u) => {
        const created = new Date(u.created_at);
        return created.toDateString() === d.toDateString();
      }).length;
      return { label, value: count };
    });
  }, [users]);

  const total = users.length;
  const roleColors = {
    user: "var(--color-ocean-500)",
    consultant: "var(--color-sage-500)",
    dermatologist: "var(--color-clay-500)",
    admin: "var(--color-danger-500)",
  };
  const roleCounts = ["user", "consultant", "dermatologist", "admin"].map((role) => ({
    role,
    count: users.filter((u) => u.role === role).length,
  }));

  const maxConcernCount = scoreOverview?.concern_frequency?.length
    ? Math.max(...scoreOverview.concern_frequency.map((c) => c.count))
    : 1;

  return (
    <MainLayout navItems={ADMIN_NAV_ITEMS} brandLabel="Skin AI · Admin">
      <header>
        <h1 className="text-xl font-semibold">Analytics</h1>
        <p className="text-sm text-ink-secondary">Real counts from Postgres — no mock numbers</p>
      </header>

      {error && <p className="pill pill-flagged py-2 px-4 w-fit">{error}</p>}

      <div className="glass p-5">
        <h2 className="text-base font-semibold mb-4">Signups, last 7 days</h2>
        {loading ? <p className="text-ink-secondary">Loading...</p> : <TrendChart data={signupTrend} />}
      </div>

      <div className="glass p-5">
        <h2 className="text-base font-semibold mb-4">Role distribution</h2>
        {loading ? (
          <p className="text-ink-secondary">Loading...</p>
        ) : (
          <div className="flex flex-col gap-4">
            {roleCounts.map((r) => (
              <RoleBar key={r.role} label={r.role} count={r.count} total={total} color={roleColors[r.role]} />
            ))}
          </div>
        )}
      </div>

      <div className="glass p-5">
        <h2 className="text-base font-semibold mb-1">Skin health, platform-wide</h2>
        <p className="text-xs text-ink-secondary mb-4">
          Computed live from every user's latest assessment — not a stored aggregate.
        </p>
        {loading ? (
          <p className="text-ink-secondary">Loading...</p>
        ) : !scoreOverview || scoreOverview.users_assessed === 0 ? (
          <p className="text-ink-secondary text-center py-6">No assessments completed yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <div className="glass metric-card">
                <span className="metric-label">Users assessed</span>
                <span className="metric-value">{scoreOverview.users_assessed}</span>
              </div>
              <div className="glass metric-card">
                <span className="metric-label">Avg. skin health score</span>
                <span className="metric-value">{scoreOverview.avg_overall_score}</span>
              </div>
              <div className="glass metric-card">
                <span className="metric-label">Avg. routine consistency</span>
                <span className="metric-value">{scoreOverview.avg_consistency_score}</span>
              </div>
            </div>

            {scoreOverview.concern_frequency.length > 0 && (
              <>
                <h3 className="text-sm font-medium text-ink-primary mb-3">Most common concerns</h3>
                <div className="flex flex-col gap-3">
                  {scoreOverview.concern_frequency.map((c) => (
                    <RoleBar
                      key={c.name}
                      label={c.name}
                      count={c.count}
                      total={maxConcernCount}
                      color="var(--color-clay-500)"
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
