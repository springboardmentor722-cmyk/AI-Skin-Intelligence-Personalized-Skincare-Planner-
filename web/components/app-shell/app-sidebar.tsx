"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/app-shell/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NAV_ITEMS, type Role } from "@/lib/nav-config";

interface AppSidebarProps {
  role: Role;
  userName: string;
}

// Built on shadcn's sidebar-07 block primitives (components/ui/sidebar.tsx —
// SidebarProvider/Sidebar/SidebarMenuButton own the collapse-to-icon state, the
// keyboard shortcut, cookie persistence, and the mobile Sheet fallback, replacing the
// hand-rolled collapsed/onToggleCollapsed state this component used to take as props).
// The *content* is still ours: role-based nav from `lib/nav-config.ts` (AGENTS.md §3,
// fixed per-role sets — not sidebar-07's demo Team Switcher / Projects / nested
// collapsible groups, none of which apply here), Skinlytics branding, and the same
// active-link logic GlassSidebar used to own. Glass styling lives in ui/sidebar.tsx
// itself (patched once, so every consumer gets it, not just this one).
export function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex h-10 items-center px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <span className="font-heading text-on-surface text-lg font-bold group-data-[collapsible=icon]:hidden">
            Skinlytics
          </span>
          <span className="font-heading text-on-surface hidden text-lg font-bold group-data-[collapsible=icon]:inline">
            S
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                if (!item.built) {
                  // No page exists yet (Milestone 1 audit) — stays visible per
                  // AGENTS.md §3's fixed nav list, but doesn't navigate to a 404.
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        aria-disabled="true"
                        tooltip={`${item.label} — coming soon`}
                      >
                        <item.icon strokeWidth={1.5} />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} />}
                    >
                      <item.icon strokeWidth={1.5} />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser role={role} fallbackName={userName} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
