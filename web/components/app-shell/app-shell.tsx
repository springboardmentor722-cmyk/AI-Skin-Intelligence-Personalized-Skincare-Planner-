"use client";

import { useState, type ReactNode } from "react";

import { GlassSidebar } from "@/components/app-shell/glass-sidebar";
import { GlassTopbar } from "@/components/app-shell/glass-topbar";
import { cn } from "@/lib/utils";
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
export function AppShell({ role, userName, title, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen">
      <GlassSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin-left] duration-200",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        <GlassTopbar title={title} role={role} userName={userName} />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
