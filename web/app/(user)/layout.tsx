import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell/app-shell";

// userName is a stub — Better Auth session wiring (Authentication task, PROGRESS.md)
// replaces this with authClient.getSession(). Role is fixed per route group; RBAC
// enforcement itself happens on the backend (require_role), not by this layout.
export default function UserLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell role="user" userName="Alex Rivera">
      {children}
    </AppShell>
  );
}
