import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

// userName is a stub — see app/(user)/layout.tsx for why.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="admin" userName="Jordan Lee">
      {children}
    </AppShell>
  );
}
