import { FileBarChart, LineChart, TrendingUp } from "lucide-react";

import { ComingSoonPanel } from "@/components/app-shell/coming-soon-panel";

// Honest "coming soon" — same pattern as Progress Tracking's before/after-photos
// card (docs/WIREFRAMES.md screen 7) and Content & Data's Lifestyle Dataset card.
// System-wide analytics/reports need real usage data across every role, which this
// milestone doesn't generate yet — no fake charts.
const PANELS = [
  {
    icon: FileBarChart,
    title: "Custom reports",
    body: "Scheduled and on-demand exports across the platform.",
  },
  {
    icon: TrendingUp,
    title: "System analytics",
    body: "Usage, engagement, and growth trends.",
  },
  {
    icon: LineChart,
    title: "Database health",
    body: "Query performance and storage monitoring.",
  },
];

export default function AdminSystemReportsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">System reports</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Platform-wide analytics and reporting — coming in a later milestone.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PANELS.map((panel) => (
          <ComingSoonPanel
            key={panel.title}
            icon={panel.icon}
            title={panel.title}
            description={panel.body}
          />
        ))}
      </div>
    </div>
  );
}
