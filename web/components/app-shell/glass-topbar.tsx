"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  SunMedium,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Command,
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { NAV_ITEMS, ROLE_LABELS, type Role } from "@/lib/nav-config";

interface GlassTopbarProps {
  role: Role;
  userName: string;
  /** Override for routes with no static nav match (e.g. a product detail page). */
  title?: string;
}

// Glass topbar: page title, ⌘K search, weather/UV chip, notification bell, theme
// toggle, account menu — docs/WIREFRAMES.md "App shell". Weather/UV and notification
// count are stubs (no adapter/service wired yet, ADR-007-style placeholder) — never
// invented data, just an explicit "—" until the real endpoint exists.
export function GlassTopbar({ role, userName, title }: GlassTopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const pageTitle =
    title ??
    NAV_ITEMS[role].find((item) => pathname.startsWith(item.href))?.label ??
    "";

  // Standard next-themes hydration guard: resolvedTheme is unknown on the server, so
  // the theme icon can't render correctly until after the client mounts.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between rounded-none border-x-0 border-t-0 px-6">
        <h1 className="font-heading text-on-surface text-lg font-semibold">
          {pageTitle}
        </h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="border-border bg-card/60 text-on-surface-variant hover:text-on-surface flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-sm transition-colors"
          >
            <Search className="size-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">Search…</span>
            <kbd className="font-geist border-border bg-muted hidden rounded-md border px-1.5 py-0.5 text-[11px] tabular-nums sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* Weather/UV stub — real data via OpenWeather/OpenUV adapters, docs/DATASETS_AND_APIS.md */}
          <div className="bg-tertiary-container font-geist text-on-tertiary-container hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium md:flex">
            <SunMedium className="size-3.5" strokeWidth={1.5} />
            <span>UV —</span>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant hover:bg-muted hover:text-on-surface relative flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Bell className="size-[18px]" strokeWidth={1.5} />
            <span className="bg-destructive absolute top-2 right-2 size-2 rounded-full" />
          </button>

          <button
            type="button"
            aria-label="Toggle theme"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="text-on-surface-variant hover:bg-muted hover:text-on-surface flex size-9 items-center justify-center rounded-full transition-colors"
          >
            {mounted && resolvedTheme === "dark" ? (
              <Sun className="size-[18px]" strokeWidth={1.5} />
            ) : (
              <Moon className="size-[18px]" strokeWidth={1.5} />
            )}
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="hover:bg-muted flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors"
                >
                  <Avatar className="size-7">
                    <AvatarFallback className="font-geist text-xs">
                      {userName
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              }
            />

            <DropdownMenuContent align="end" className="w-56">
              {/* Base UI requires GroupLabel/Item inside a Group — unlike Radix, a bare
                  DropdownMenuLabel throws "MenuGroupContext is missing" at runtime. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-on-surface font-sans text-sm font-medium">
                      {userName}
                    </span>
                    <span className="font-geist text-on-surface-variant text-xs">
                      {ROLE_LABELS[role]}
                    </span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="size-4" strokeWidth={1.5} />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                <LogOut className="size-4" strokeWidth={1.5} />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        {/* Unlike older shadcn versions, this CommandDialog doesn't auto-wrap children
            in the cmdk root — omitting <Command> throws "Cannot read properties of
            undefined (reading 'subscribe')" from CommandInput. */}
        <Command>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>
              Search isn&apos;t wired to a real endpoint yet.
            </CommandEmpty>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
