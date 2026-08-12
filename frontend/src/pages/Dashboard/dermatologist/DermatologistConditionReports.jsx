import { useEffect, useState } from "react";
import { TbTrendingUp, TbTrendingDown } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { DERM_NAV_ITEMS } from "./dermNav";
import { getDermatologistPatients } from "../../../services/profile";
import { getClientScore } from "../../../services/assessment";
import { getInitials } from "../../../utils/initials";
import { SkeletonCard } from "../../../components/Skeleton";

const BREAKDOWN_CONFIG = [
  { key: "condition_score", label: "Condition", weight: 35 },
  { key: "lifestyle_score", label: "Lifestyle", weight: 20 },
  { key: "consistency_score", label: "Consistency", weight: 20 },
  { key: "sleep_score", label: "Sleep", weight: 15 },
  { key: "hydration_score", label: "Hydration", weight: 10 },
];

function scoreTone(score) {
  if (score >= 85) return "text-sage-600 bg-sage-50";
  if (score >= 70) return "text-ocean-600 bg-ocean-50";
  if (score >= 50) return "text-clay-600 bg-clay-50";
  return "text-danger-500 bg-danger-50";
}

export default function DermatologistConditionReports() {
  const [patients, setPatients] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getDermatologistPatients();
      setPatients(res.data);

      const results = await Promise.allSettled(res.data.map((p) => getClientScore(p.id)));
      const scoreMap = {};
      results.forEach((r, i) => {
        scoreMap[res.data[i].id] = r.status === "fulfilled" ? r.value.data : "none";
      });
      setScores(scoreMap);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout navItems={DERM_NAV_ITEMS} brandLabel="Skin AI · Dermatologist">
      <header>
        <h1 className="text-xl font-semibold">Condition reports</h1>
        <p className="text-sm text-ink-secondary">
          Real skin health scores and clinical breakdown from each patient's latest assessment.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : patients.map((p) => {
              const score = scores[p.id];
              const hasScore = score && score !== "none";
              const delta = hasScore && score.previous_score != null
                ? score.overall_score - score.previous_score
                : null;

              return (
                <div key={p.id} className="glass p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar bg-ocean-100 text-ocean-600 w-10 h-10 text-sm">
                        {getInitials(p.name)}
                      </div>
                      <div>
                        <p className="font-medium text-ink-primary">{p.name}</p>
                        <p className="text-xs text-ink-secondary">Age {p.age} · {p.skin_type} skin</p>
                      </div>
                    </div>
                    {hasScore ? (
                      <div className="text-right">
                        <span className={`inline-block text-sm font-semibold px-2.5 py-1 rounded-full ${scoreTone(score.overall_score)}`}>
                          {Math.round(score.overall_score)}
                        </span>
                        {delta !== null && (
                          <div className={`flex items-center gap-1 justify-end text-xs mt-1 ${delta >= 0 ? "text-sage-600" : "text-danger-500"}`}>
                            {delta >= 0 ? <TbTrendingUp size={12} /> : <TbTrendingDown size={12} />}
                            {delta >= 0 ? "+" : ""}{Math.round(delta)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-ink-secondary bg-white/60 px-2 py-1 rounded-full">
                        No assessment yet
                      </span>
                    )}
                  </div>

                  {hasScore && (
                    <div className="space-y-2 mb-3">
                      {BREAKDOWN_CONFIG.map((b) => (
                        <div key={b.key}>
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-xs text-ink-secondary">{b.label}</span>
                            <span className="text-[11px] text-ink-secondary/70">{Math.round(score[b.key])} · {b.weight}%</span>
                          </div>
                          <div className="h-1.5 rounded-pill bg-white/60 overflow-hidden">
                            <div className="h-full rounded-pill bg-ocean-500" style={{ width: `${Math.min(score[b.key], 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {hasScore && score.detected_concerns?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/60">
                      {score.detected_concerns.map((c) => (
                        <span key={c.name} className="pill pill-flagged text-xs">
                          {c.name} · {c.level}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        {!loading && patients.length === 0 && (
          <p className="text-ink-secondary col-span-2 text-center py-8">No patients yet.</p>
        )}
      </div>
    </MainLayout>
  );
}
