"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavUser } from "@/components/app-shell/nav-user";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  NAV_SECTIONS,
  ROLE_ACTIVE_VARIANT,
  ROLE_BRAND_SUBTITLE,
  ROLE_FOOTER,
  type Role,
} from "@/lib/nav-config";

interface AppSidebarProps {
  role: Role;
  userName: string;
}

// Solid (user/dermatologist/admin) vs soft-tint (consultant) active nav treatment —
// MILESTONE_2_UI_SPEC.md §2.2, both variants deliberately preserved. tailwind-merge
// (lib/utils.ts's cn()) resolves these against sidebarMenuButtonVariants' base
// `data-active:bg-sidebar-accent` since className is merged last.
const ACTIVE_VARIANT_CLASSES: Record<"solid" | "soft", string> = {
  solid: "data-active:bg-primary data-active:text-primary-foreground",
  soft: "data-active:bg-secondary-container data-active:text-on-secondary-container",
};

// Built on shadcn's sidebar-07 block primitives (components/ui/sidebar.tsx —
// SidebarProvider/Sidebar/SidebarMenuButton own the collapse-to-icon state, the
// keyboard shortcut, cookie persistence, and the mobile Sheet fallback). Content is
// Milestone 2's role-driven config: sectioned nav with two-line items (label +
// subtitle, MILESTONE_2_UI_SPEC.md §2.2), a per-role active-state variant, and a
// per-role footer card — one component, four configs, per master prompt P2
// ("four sidebar components is a phase failure").
export function AppSidebar({ role, userName }: AppSidebarProps) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS[role];
  const activeVariant = ROLE_ACTIVE_VARIANT[role];
  const footer = ROLE_FOOTER[role];
  const FooterIcon = footer.icon;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          href="/"
          className="flex flex-col px-2 py-1 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0"
        >
          <span className="font-heading text-on-surface text-lg font-bold group-data-[collapsible=icon]:hidden">
            Skinlytics
          </span>
          <span className="font-heading text-on-surface hidden text-lg font-bold group-data-[collapsible=icon]:inline">
            S
          </span>
          <span className="text-primary font-sans text-xs font-medium group-data-[collapsible=icon]:hidden">
            {ROLE_BRAND_SUBTITLE[role]}
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup
            key={section.id}
            // Quick Actions is its own bordered/tinted panel in the source
            // screenshot (UI_SPEC.md §3.1), not a plain labelled list like Main
            // Menu — a real structural difference, not colour, so it's in scope.
            className={
              section.id === "quick-actions"
                ? "bg-sidebar-accent/30 border-sidebar-border mx-2 w-auto rounded-lg border p-1"
                : undefined
            }
          >
            {section.label && (
              <SidebarGroupLabel className="text-[11px] font-semibold tracking-[0.08em] uppercase">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.label}
                        size="lg"
                        className={`h-auto py-1.5 ${item.built ? "" : "pr-14"} ${ACTIVE_VARIANT_CLASSES[activeVariant]}`}
                        render={<Link href={item.href} />}
                      >
                        <item.icon strokeWidth={1.75} className="size-[18px]!" />
                        <span className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
                          <span className="truncate">{item.label}</span>
                          {item.subtitle && (
                            <span className="truncate text-xs font-normal opacity-70">
                              {item.subtitle}
                            </span>
                          )}
                        </span>
                      </SidebarMenuButton>
                      {!item.built && (
                        <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden">
                          Soon
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="gap-3">
        <div className="bg-primary-container group-data-[collapsible=icon]:hidden flex flex-col gap-2 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FooterIcon className="text-primary size-4" strokeWidth={1.75} />
            <span className="text-on-primary-container text-sm font-semibold">
              {footer.title}
            </span>
          </div>
          <p className="text-on-primary-container text-xs opacity-80">{footer.description}</p>
          {footer.actionLabel && (
            <Button size="sm" className="w-full" nativeButton={false} render={<Link href={footer.actionHref} />}>
              {footer.actionLabel}
            </Button>
          )}
        </div>
        <NavUser role={role} fallbackName={userName} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
