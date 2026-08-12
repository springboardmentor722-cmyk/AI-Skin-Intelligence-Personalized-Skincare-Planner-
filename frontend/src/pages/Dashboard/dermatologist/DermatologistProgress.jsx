import { useEffect, useState } from "react";
import { TbTrendingUp, TbTrendingDown } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { DERM_NAV_ITEMS } from "./dermNav";
import { getDermatologistPatients } from "../../../services/profile";
import { getClientHistory } from "../../../services/assessment";
import { getInitials } from "../../../utils/initials";
import { SkeletonCard } from "../../../components/Skeleton";

function formatShortDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function ScoreTrendChart({ history }) {
  const w = 560;
  const h = 140;
  const padding = 20;
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
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
      <polyline points={linePoints} fill="none" stroke="#2F6FA8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r="3" fill="#2F6FA8" />)}
      {coords.length > 0 && (
        <>
          <text x={coords[0].x} y={h - 2} fontSize="10" fill="#7a8a99" textAnchor="start">
            {formatShortDate(coords[0].created_at)}
          </text>
          <text x={coords[coords.length - 1].x} y={h - 2} fontSize="10" fill="#7a8a99" textAnchor="end">
            {formatShortDate(coords[coords.length - 1].created_at)}
          </text>
        </>
      )}
    </svg>
  );
}

export default function DermatologistProgress() {
  const [patients, setPatients] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [noHistory, setNoHistory] = useState(false);

  useEffect(() => {
    getDermatologistPatients().then((res) => {
      setPatients(res.data);
      if (res.data.length > 0) setSelectedId(res.data[0].id);
    }).finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (selectedId == null) return;
    setLoadingHistory(true);
    getClientHistory(selectedId, 30)
      .then((res) => {
        setHistory(res.data);
        setNoHistory(res.data.length === 0);
      })
      .catch(() => setNoHistory(true))
      .finally(() => setLoadingHistory(false));
  }, [selectedId]);

  const scoreDelta = history.length >= 2
    ? history[history.length - 1].overall_score - history[0].overall_score
    : 0;

  return (
    <MainLayout navItems={DERM_NAV_ITEMS} brandLabel="Skin AI · Dermatologist">
      <header>
        <h1 className="text-xl font-semibold">Progress analytics</h1>
        <p className="text-sm text-ink-secondary">
          Skin health score history across each patient's assessments.
        </p>
      </header>

      {loadingPatients ? (
        <SkeletonCard />
      ) : patients.length === 0 ? (
        <div className="glass p-8 text-center text-sm text-ink-secondary">No patients yet.</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {patients.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border transition ${
                  selectedId === p.id
                    ? "bg-ocean-500 text-white border-ocean-500"
                    : "bg-white/60 text-ink-primary border-white/60 hover:bg-white/80"
                }`}
              >
                <span className="avatar w-5 h-5 text-[10px] bg-white/30">{getInitials(p.name)}</span>
                {p.name}
              </button>
            ))}
          </div>

          {loadingHistory ? (
            <SkeletonCard />
          ) : noHistory ? (
            <div className="glass p-8 text-center text-sm text-ink-secondary">
              This patient hasn't completed an assessment yet.
            </div>
          ) : (
            <div className="glass p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="metric-label">Score history — last {history.length} assessments</p>
                {history.length >= 2 && (
                  <span className={`flex items-center gap-1 text-xs font-medium ${scoreDelta >= 0 ? "text-sage-600" : "text-danger-500"}`}>
                    {scoreDelta >= 0 ? <TbTrendingUp size={14} /> : <TbTrendingDown size={14} />}
                    {scoreDelta >= 0 ? "+" : ""}{Math.round(scoreDelta)} overall
                  </span>
                )}
              </div>
              {history.length >= 2 ? (
                <ScoreTrendChart history={history} />
              ) : (
                <p className="text-sm text-ink-secondary py-4">
                  Only one assessment on record — trend appears after a retake.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </MainLayout>
  );
}
