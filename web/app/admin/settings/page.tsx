import { Bot, Settings2, Shield } from "lucide-react";

import { ComingSoonPanel } from "@/components/app-shell/coming-soon-panel";
import { AppearanceSettings } from "@/components/settings/appearance-settings";

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
          Your account preferences and platform configuration.
        </p>
      </div>

      <AppearanceSettings />

      <div className="flex flex-col gap-3">
        <span className="font-geist text-on-surface-variant text-xs font-semibold tracking-[0.05em] uppercase">
          Platform (coming in a later milestone)
        </span>
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
    </div>
  );
}
