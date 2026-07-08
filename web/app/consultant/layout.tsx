import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

// userName is a stub — see app/(user)/layout.tsx for why.
export default function ConsultantLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppShell role="consultant" userName="Priya Nandan">
      {children}
    </AppShell>
  );
}
