import { useEffect, useState } from "react";
import { TbDownload, TbFileReport } from "react-icons/tb";
import MainLayout from "../../../layouts/MainLayout";
import { ADMIN_NAV_ITEMS } from "./adminNav";
import { getAllUsers } from "../../../services/admin";
import { getAdminScoreOverview } from "../../../services/assessment";
import { getAdminRecommendationOverview } from "../../../services/recommendations";

function downloadCsv(filename, headers, rows) {
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [users, setUsers] = useState([]);
  const [scoreOverview, setScoreOverview] = useState(null);
  const [recOverview, setRecOverview] = useState(null);

  useEffect(() => {
    getAllUsers().then((res) => setUsers(res.data)).catch(() => {});
    getAdminScoreOverview().then((res) => setScoreOverview(res.data)).catch(() => {});
    getAdminRecommendationOverview().then((res) => setRecOverview(res.data)).catch(() => {});
  }, []);

  const exportUsersCsv = () => {
    const headers = ["Name", "Email", "Role", "Joined"];
    const rows = users.map((u) => [
      u.full_name, u.email, u.role, new Date(u.created_at).toLocaleDateString(),
    ]);
    downloadCsv("users-report.csv", headers, rows);
  };

  const exportAssessmentsCsv = () => {
    const headers = ["User ID", "Overall Score", "Primary Concern", "Assessed On"];
    const rows = scoreOverview.per_user_scores.map((s) => [
      s.user_id, s.overall_score, s.primary_concern || "", new Date(s.created_at).toLocaleDateString(),
    ]);
    downloadCsv("skin-assessment-report.csv", headers, rows);
  };

  const exportProgressCsv = () => {
    const headers = ["User ID", "Routine Consistency Score", "Overall Score", "Latest Assessment"];
    const rows = scoreOverview.per_user_scores.map((s) => [
      s.user_id, s.consistency_score, s.overall_score, new Date(s.created_at).toLocaleDateString(),
    ]);
    downloadCsv("progress-report.csv", headers, rows);
  };

  const exportRecommendationsCsv = () => {
    const headers = ["Product", "Brand", "Category", "Recommended To (users)"];
    const rows = recOverview.top_recommended.map((p) => [p.name, p.brand, p.category, p.count]);
    downloadCsv("recommendation-report.csv", headers, rows);
  };

  const REPORT_TYPES = [
    {
      title: "User report",
      desc: "Full user list with role and join date",
      action: exportUsersCsv,
      available: true,
    },
    {
      title: "Skin assessment reports",
      desc: "Per-user skin health score and primary concern",
      action: exportAssessmentsCsv,
      available: scoreOverview && scoreOverview.users_assessed > 0,
    },
    {
      title: "Progress reports",
      desc: "Routine adherence and score per user",
      action: exportProgressCsv,
      available: scoreOverview && scoreOverview.users_assessed > 0,
    },
    {
      title: "Recommendation reports",
      desc: "What the engine recommended, and to how many users",
      action: exportRecommendationsCsv,
      available: recOverview && recOverview.top_recommended.length > 0,
    },
  ];

  return (
    <MainLayout navItems={ADMIN_NAV_ITEMS} brandLabel="Skin AI · Admin">
      <header>
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-ink-secondary">Export platform data</p>
      </header>

      <div className="grid sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map((r) => (
          <div key={r.title} className="glass p-5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-ocean-100 text-ocean-600 flex items-center justify-center text-lg">
              <TbFileReport />
            </div>
            <div>
              <h3 className="font-medium text-ink-primary">{r.title}</h3>
              <p className="text-sm text-ink-secondary">{r.desc}</p>
            </div>
            {r.available ? (
              <button onClick={r.action} className="btn-outline text-sm flex items-center gap-2 w-fit">
                <TbDownload /> Export CSV
              </button>
            ) : (
              <span className="pill pill-pending w-fit">No data yet</span>
            )}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}
