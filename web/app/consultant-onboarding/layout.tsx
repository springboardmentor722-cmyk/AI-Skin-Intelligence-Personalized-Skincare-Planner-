import type { ReactNode } from "react";

import { ConsultantOnboardingProvider } from "@/lib/consultant-onboarding/context";

// Standalone flow (no app-shell sidebar/topbar) — same reasoning as
// app/assessment/layout.tsx: reachable by a plain "user" account applying for the
// first time, or a "consultant" account resubmitting after rejection, neither of
// which necessarily has anywhere else in the app shell to be yet.
export default function ConsultantOnboardingLayout({ children }: { children: ReactNode }) {
  return <ConsultantOnboardingProvider>{children}</ConsultantOnboardingProvider>;
}
