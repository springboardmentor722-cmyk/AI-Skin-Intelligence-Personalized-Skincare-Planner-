import { Bot, Settings2, Shield } from "lucide-react";

// Honest "coming soon" — same reasoning as system-reports/page.tsx. System
// configuration and AI configuration have no real backing endpoints yet
// (AI is out of scope entirely this milestone, ADR-007); a real permission-matrix
// editor was deliberately scoped down to Users' role-assignment view (ADR-014's
// consequences note) rather than built here.
const PANELS = [
  {
    icon: Settings2,
    title: "System configuration",
    body: "Platform-wide feature flags and environment settings.",
  },
  {
    icon: Bot,
    title: "AI configuration",
    body: "Model versions and inference settings — no AI surface exists yet (ADR-007).",
  },
  {
    icon: Shield,
    title: "Permission management",
    body: "Fine-grained per-permission editing beyond role assignment (see Users).",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-on-surface text-2xl font-bold">Settings</h1>
        <p className="text-on-surface-variant mt-1 font-sans text-sm">
          Platform configuration — coming in a later milestone.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {PANELS.map((panel) => (
          <div
            key={panel.title}
            className="border-border bg-card rounded-2xl border border-dashed p-6 text-center"
          >
            <panel.icon
              className="text-on-surface-variant/40 mx-auto mb-3 size-7"
              strokeWidth={1.5}
            />
            <h3 className="font-heading text-on-surface text-sm font-semibold">{panel.title}</h3>
            <p className="text-on-surface-variant mt-1 font-sans text-xs">Coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
