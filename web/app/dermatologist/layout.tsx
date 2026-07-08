import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

// userName is a stub — see app/(user)/layout.tsx for why.
export default function DermatologistLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AppShell role="dermatologist" userName="Dr. Marcus Webb">
      {children}
    </AppShell>
  );
}
