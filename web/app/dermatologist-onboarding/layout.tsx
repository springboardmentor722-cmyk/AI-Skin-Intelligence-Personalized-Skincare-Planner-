import type { ReactNode } from "react";

import { DermatologistOnboardingProvider } from "@/lib/dermatologist-onboarding/context";

// Standalone flow (no app-shell sidebar/topbar) — same reasoning as
// app/consultant-onboarding/layout.tsx.
export default function DermatologistOnboardingLayout({ children }: { children: ReactNode }) {
  return <DermatologistOnboardingProvider>{children}</DermatologistOnboardingProvider>;
}
