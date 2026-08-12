import { useEffect, useState } from "react";
import { TbTrendingUp, TbTrendingDown } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { CONSULTANT_NAV_ITEMS } from "./consultantNav";
import { getConsultantClients } from "../../../services/profile";
import { getClientScore } from "../../../services/assessment";
import { getInitials } from "../../../utils/initials";
import { SkeletonCard } from "../../../components/Skeleton";

function scoreTone(score) {
  if (score >= 85) return "text-sage-600 bg-sage-50";
  if (score >= 70) return "text-ocean-600 bg-ocean-50";
  if (score >= 50) return "text-clay-600 bg-clay-50";
  return "text-danger-500 bg-danger-50";
}

export default function ConsultantAssessments() {
  const [clients, setClients] = useState([]);
  const [scores, setScores] = useState({}); // { [clientId]: scoreData | "none" }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getConsultantClients();
      setClients(res.data);

      const results = await Promise.allSettled(
        res.data.map((c) => getClientScore(c.id))
      );
      const scoreMap = {};
      results.forEach((r, i) => {
        const clientId = res.data[i].id;
        scoreMap[clientId] = r.status === "fulfilled" ? r.value.data : "none";
      });
      setScores(scoreMap);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout navItems={CONSULTANT_NAV_ITEMS} brandLabel="Skin AI · Consultant">
      <header>
        <h1 className="text-xl font-semibold">Assessments</h1>
        <p className="text-sm text-ink-secondary">
          Real skin health scores and detected concerns from each client's latest assessment.
        </p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : clients.map((c) => {
              const score = scores[c.id];
              const hasScore = score && score !== "none";
              const delta = hasScore && score.previous_score != null
                ? score.overall_score - score.previous_score
                : null;

              return (
                <div key={c.id} className="glass p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="avatar bg-ocean-100 text-ocean-600 w-10 h-10 text-sm">
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <p className="font-medium text-ink-primary">{c.name}</p>
                        <p className="text-xs text-ink-secondary">Age {c.age} · {c.skin_type} skin</p>
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

                  <div className="space-y-1.5 text-sm mb-3">
                    <p><span className="text-ink-secondary">Goals: </span>{c.goals}</p>
                  </div>

                  {hasScore && score.detected_concerns?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/60">
                      {score.detected_concerns.map((concern) => (
                        <span key={concern.name} className="pill pill-flagged text-xs">
                          {concern.name} · {concern.level}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        {!loading && clients.length === 0 && (
          <p className="text-ink-secondary col-span-2 text-center py-8">No clients yet.</p>
        )}
      </div>
    </MainLayout>
  );
}
