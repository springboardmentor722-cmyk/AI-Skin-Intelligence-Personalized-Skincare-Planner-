"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@/lib/auth-client";
import { NAV_ITEMS, ROLE_LABELS, type Role } from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";

interface NavUserProps {
  role: Role;
  fallbackName: string;
}

// Sidebar-07's own footer pattern (avatar + name + email, dropdown for account actions)
// — same content as GlassTopbar's account menu (Settings, Sign out, real session via
// useCurrentUser), just in the sidebar-07 layout position instead of the topbar. Both
// surfaces exist: the topbar's account menu already shipped and removing it wasn't
// asked for, this adds the sidebar-07 pattern alongside it. Collapses to just the
// avatar when the sidebar is collapsed to icons — SidebarMenuButton's own
// `overflow-hidden` + icon-size classes handle that, no extra markup needed here (same
// mechanism sidebar-07's own NavUser relies on).
export function NavUser({ role, fallbackName }: NavUserProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const user = useCurrentUser(fallbackName);
  const settingsHref = NAV_ITEMS[role].find((item) => item.label === "Settings")?.href;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              >
                <Avatar className="size-8 rounded-lg">
                  {user.image && <AvatarImage src={user.image} alt={user.name} />}
                  <AvatarFallback className="font-geist rounded-lg text-xs">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-on-surface-variant truncate text-xs">
                    {user.email ?? ROLE_LABELS[role]}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" strokeWidth={1.5} />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-on-surface font-sans text-sm font-medium">
                    {user.name}
                  </span>
                  <span className="font-geist text-on-surface-variant text-xs">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {settingsHref && (
              <DropdownMenuItem render={<Link href={settingsHref} />}>
                <Settings className="size-4" strokeWidth={1.5} />
                Settings
              </DropdownMenuItem>
            )}
            <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
              <LogOut className="size-4" strokeWidth={1.5} />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
