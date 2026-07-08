"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS, type Role } from "@/lib/nav-config";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GlassSidebarProps {
  role: Role;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

// Glass sidebar, role-dependent nav, collapsible to icons — docs/WIREFRAMES.md "App
// shell". Glass is level-4 elevation (chrome only, ADR-008) — never used for the nav
// items' own hover/active fill, which stays a flat tonal tint (DESIGN.md §6).
//
// `collapsed` is owned by AppShell, not this component — the content canvas's
// margin-left has to stay in sync with the sidebar's width, so a single source of
// truth is required rather than two components independently tracking it.
export function GlassSidebar({
  role,
  collapsed,
  onToggleCollapsed,
}: GlassSidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <aside
      className={cn(
        "glass fixed top-0 left-0 z-40 flex h-screen flex-col rounded-none border-y-0 border-l-0 py-6 transition-[width] duration-200",
        collapsed ? "w-20" : "w-64"
      )}
    >
      <div className={cn("mb-8 px-6", collapsed && "px-0 text-center")}>
        <span className="font-heading text-on-surface text-lg font-bold">
          {collapsed ? "S" : "Skinlytics"}
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3" aria-label="Primary">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const link = (
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-full px-3 py-2.5 font-sans text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-secondary/10 text-secondary"
                  : "text-on-surface-variant hover:bg-muted hover:text-on-surface"
              )}
            >
              <item.icon className="size-[18px] shrink-0" strokeWidth={1.5} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          if (!collapsed) return <div key={item.href}>{link}</div>;

          return (
            <Tooltip key={item.href}>
              <TooltipTrigger render={link} />
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      <div className={cn("px-3 pt-4", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="border-border text-on-surface-variant hover:bg-muted hover:text-on-surface flex size-9 items-center justify-center rounded-full border transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="size-4" strokeWidth={1.5} />
          ) : (
            <ChevronLeft className="size-4" strokeWidth={1.5} />
          )}
        </button>
      </div>
    </aside>
  );
}
