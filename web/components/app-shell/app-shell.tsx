import type { ReactNode } from "react";

import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { GlassTopbar } from "@/components/app-shell/glass-topbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { Role } from "@/lib/nav-config";

interface AppShellProps {
  role: Role;
  userName: string;
  /** Override for routes with no static nav match (e.g. a product detail page). */
  title?: string;
  children: ReactNode;
}

// Composes the authenticated app shell — docs/WIREFRAMES.md "App shell": glass sidebar +
// glass topbar + solid content canvas over the ambient aurora (rendered once, globally,
// in app/layout.tsx). Data renders on solid Diagnostic Module cards, never on glass —
// that's enforced per-screen, not by this shell.
//
// SidebarProvider now owns collapse state (cookie-persisted, ⌘/Ctrl+B shortcut, mobile
// Sheet fallback) — this component no longer lifts `collapsed` itself; SidebarInset's
// own layout handles the content offset instead of a manual margin-left class.
export function AppShell({ role, userName, title, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} userName={userName} />
      <SidebarInset>
        <GlassTopbar title={title} role={role} userName={userName} />
        <main className="flex-1 p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
