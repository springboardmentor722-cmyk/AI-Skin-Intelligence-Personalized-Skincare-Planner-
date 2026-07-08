import type { ReactNode } from "react";

import { AssessmentProvider } from "@/lib/assessment/context";

// Wraps every /assessment/* route so wizard state survives step-to-step client-side
// navigation (lib/assessment/context.tsx) — mirrors the standalone-route pattern
// already used by /login, /signup (no app shell sidebar/topbar).
export default function AssessmentLayout({ children }: { children: ReactNode }) {
  return <AssessmentProvider>{children}</AssessmentProvider>;
}
