"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  CalendarDays,
  FlaskConical,
  LogOut,
  type LucideIcon,
  Search,
  Settings,
  SunMedium,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { useWeatherUV } from "@/lib/hooks/use-weather-uv";
import {
  EXTRA_TITLES,
  getSettingsHref,
  NAV_ITEMS,
  ROLE_LABELS,
  ROLE_TOPBAR,
  type Role,
} from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

// Real GET /api/v1/notifications/me (bugs_report.md 2026-07-26, bug #4 — this used to
// be a hardcoded per-role `bellCount` fixture with a button that had no onClick at
// all). Still an honest "No notifications yet" for every account today: nothing in the
// app writes a row into `notifications` yet, so the list is genuinely always empty —
// this is the real read path a producer will show up in later, not a mark-as-read UI
// with nothing to mark (YAGNI until one exists).
function NotificationBell() {
  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "me"],
    queryFn: async () => {
      const { data } = await api.GET("/api/v1/notifications/me");
      return data ?? [];
    },
  });
  const unread = (data ?? []).filter((n) => !n.is_read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Notifications"
            className="text-on-surface-variant hover:bg-muted hover:text-on-surface relative flex size-9 items-center justify-center rounded-full transition-colors"
          >
            <Bell className="size-[18px]" strokeWidth={1.5} />
            {unread > 0 && (
              <span className="bg-destructive text-on-error absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
                {unread}
              </span>
            )}
          </button>
        }
      />
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex flex-col gap-2 p-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (data ?? []).length === 0 ? (
          <p className="text-on-surface-variant px-2 py-6 text-center font-sans text-sm">
            No notifications yet.
          </p>
        ) : (
          (data ?? []).map((n) => (
            <div key={n.notification_id} className="flex flex-col gap-0.5 px-2 py-2">
              <div className="flex items-center gap-2">
                {!n.is_read && <span className="bg-secondary size-1.5 shrink-0 rounded-full" />}
                <span className="text-on-surface font-sans text-sm font-medium">{n.title}</span>
              </div>
              {n.message && (
                <p className="text-on-surface-variant font-sans text-xs">{n.message}</p>
              )}
              <span className="text-on-surface-variant font-geist text-[11px]">
                {timeAgo(n.created_at)}
              </span>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface GlassTopbarProps {
  role: Role;
  userName: string;
  /** Override for routes with no static nav match (e.g. a product detail page). */
  title?: string;
}

// Existing /api/admin/users route.ts passthrough to Better Auth's list-users
// action — no per-user detail page exists, so a topbar hit only needs enough to
// link back into the filterable /admin/users list.
interface AdminUserHit {
  id: string;
  name: string;
  email: string;
}

interface SearchHit {
  key: string;
  icon: LucideIcon;
  label: string;
  sub?: string;
  href: string;
}

// Glass topbar: page title, ⌘K search, weather/UV chip, notification bell, theme
// toggle, account menu — docs/WIREFRAMES.md "App shell". The weather/UV chip is now
// real (GET /api/v1/weather-uv, real OpenWeather/OpenUV adapters,
// docs/DATASETS_AND_APIS.md) — still renders the same honest "UV —" whenever
// location isn't granted or the backend's API keys aren't configured, never a
// fabricated number. Notification bell is real too now (NotificationBell above).
export function GlassTopbar({ role, userName, title }: GlassTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [rawSearch, setRawSearch] = useState("");
  const debouncedSearch = useDebouncedValue(rawSearch, 300);
  const trimmedSearch = debouncedSearch.trim();
  const closeSearch = () => {
    setSearchOpen(false);
    setRawSearch("");
  };
  const user = useCurrentUser(userName);
  const weatherQuery = useWeatherUV();
  const uvLabel =
    weatherQuery.data?.available && weatherQuery.data.uv_index != null
      ? Math.round(weatherQuery.data.uv_index * 10) / 10
      : "—";

  // ⌘K search — one real endpoint per role, no shared "search everything" index
  // exists. Hooks are always called (rules of hooks); `enabled` gates the one
  // matching the current role.
  const ingredientsQuery = useQuery({
    queryKey: ["topbar-search", "ingredients", trimmedSearch],
    enabled: role === "user" && trimmedSearch.length > 0,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/ingredients", {
        params: { query: { page: 1, page_size: 8, q: trimmedSearch, category: null } },
      });
      if (error) throw new Error("Search failed");
      return data.items;
    },
  });

  const clientsQuery = useQuery({
    queryKey: ["topbar-search", "clients", trimmedSearch],
    enabled: (role === "consultant" || role === "dermatologist") && trimmedSearch.length > 0,
    queryFn: async () => {
      const { data, error } = await api.GET("/api/v1/clients/me", {
        params: { query: { page: 1, page_size: 8, q: trimmedSearch } },
      });
      if (error) throw new Error("Search failed");
      return data.items;
    },
  });

  const adminUsersQuery = useQuery({
    queryKey: ["topbar-search", "admin-users", trimmedSearch],
    enabled: role === "admin" && trimmedSearch.length > 0,
    queryFn: async (): Promise<AdminUserHit[]> => {
      const params = new URLSearchParams({ search: trimmedSearch, limit: "8" });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error("Search failed");
      const json: { users: AdminUserHit[] } = await res.json();
      return json.users;
    },
  });

  // Normalizes whichever of the three queries above is active for this role into
  // one shape, so the dialog below renders a single list instead of three
  // duplicated branches.
  let searchHits: SearchHit[] = [];
  let searchLoading = false;
  let searchErrored = false;
  let searchGroupLabel = "Results";

  if (role === "user") {
    searchGroupLabel = "Ingredients";
    searchLoading = ingredientsQuery.isLoading;
    searchErrored = ingredientsQuery.isError;
    searchHits = (ingredientsQuery.data ?? []).map((ing) => ({
      key: String(ing.ingredient_id),
      icon: FlaskConical,
      label: ing.ingredient_name,
      sub: ing.category ?? undefined,
      href: `/ingredients/${ing.ingredient_id}`,
    }));
  } else if (role === "consultant" || role === "dermatologist") {
    searchGroupLabel = role === "consultant" ? "Clients" : "Patients";
    searchLoading = clientsQuery.isLoading;
    searchErrored = clientsQuery.isError;
    const base = role === "consultant" ? "/consultant/clients" : "/dermatologist/patients";
    searchHits = (clientsQuery.data ?? []).map((c) => ({
      key: c.user_id,
      icon: Users,
      label: c.name || c.email,
      sub: c.name ? c.email : undefined,
      href: `${base}/${c.user_id}`,
    }));
  } else if (role === "admin") {
    searchGroupLabel = "Users";
    searchLoading = adminUsersQuery.isLoading;
    searchErrored = adminUsersQuery.isError;
    searchHits = (adminUsersQuery.data ?? []).map((u) => ({
      key: u.id,
      icon: UserRound,
      label: u.name || u.email,
      sub: u.name ? u.email : undefined,
      href: `/admin/users?search=${encodeURIComponent(u.email)}`,
    }));
  }

  const pageTitle =
    title ??
    NAV_ITEMS[role].find((item) => pathname.startsWith(item.href))?.label ??
    EXTRA_TITLES[pathname] ??
    "";

  const settingsHref = getSettingsHref(role);
  const topbar = ROLE_TOPBAR[role];
  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        // Routes through closeSearch (not a bare toggle) so ⌘K-to-dismiss clears
        // rawSearch same as Escape/outside-click/selecting a result do.
        if (searchOpen) {
          closeSearch();
        } else {
          setSearchOpen(true);
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [searchOpen]);

  return (
    <>
      <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between rounded-none border-x-0 border-t-0 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <h1 className="font-heading text-on-surface truncate text-lg font-semibold">
            {pageTitle}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {topbar.primaryActionLabel && topbar.primaryActionHref && (
            <Button
              size="sm"
              className="hidden sm:inline-flex"
              nativeButton={false}
              render={<Link href={topbar.primaryActionHref} />}
            >
              <UserPlus data-icon="inline-start" />
              {topbar.primaryActionLabel}
            </Button>
          )}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="border-border bg-card/60 text-on-surface-variant hover:text-on-surface flex items-center gap-2 rounded-full border px-3 py-1.5 font-sans text-sm transition-colors"
          >
            <Search className="size-4" strokeWidth={1.5} />
            <span className="hidden sm:inline">{topbar.searchPlaceholder ?? "Search…"}</span>
            <kbd className="font-geist border-border bg-muted hidden rounded-md border px-1.5 py-0.5 text-[11px] tabular-nums sm:inline">
              ⌘K
            </kbd>
          </button>

          {/* Real OpenWeather/OpenUV adapters, docs/DATASETS_AND_APIS.md — "—" is an
              honest "not available" (no location permission or no API key configured),
              never a fabricated reading. */}
          <div className="bg-tertiary-container font-geist text-on-tertiary-container hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium lg:flex">
            <SunMedium className="size-3.5" strokeWidth={1.5} />
            <span>UV {uvLabel}</span>
          </div>

          <div className="border-border bg-card/60 text-on-surface-variant font-geist hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs tabular-nums lg:flex">
            <CalendarDays className="size-3.5" strokeWidth={1.5} />
            <span>{today}</span>
          </div>

          <NotificationBell />

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="hover:bg-muted flex items-center gap-2 rounded-full py-1 pr-2 pl-1 transition-colors"
                >
                  <Avatar className="size-7">
                    {user.image && <AvatarImage src={user.image} alt={user.name} />}
                    <AvatarFallback className="font-geist text-xs">
                      {user.initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden flex-col items-start lg:flex">
                    <span className="text-on-surface font-sans text-xs leading-tight font-medium">
                      {user.name}
                    </span>
                    <span className="text-on-surface-variant text-[11px] leading-tight">
                      {topbar.avatarCaption}
                    </span>
                  </span>
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
        </div>
      </header>

      <CommandDialog
        open={searchOpen}
        onOpenChange={(open) => (open ? setSearchOpen(true) : closeSearch())}
      >
        {/* Unlike older shadcn versions, this CommandDialog doesn't auto-wrap children
            in the cmdk root — omitting <Command> throws "Cannot read properties of
            undefined (reading 'subscribe')" from CommandInput. shouldFilter={false}:
            results are already server-filtered by the search endpoint, cmdk's own
            client-side fuzzy filter would just re-hide them (e.g. "niacinamide" typed
            while the list still holds the previous, now-stale set during a refetch). */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={topbar.searchPlaceholder ?? "Search…"}
            value={rawSearch}
            onValueChange={setRawSearch}
          />
          <CommandList>
            {trimmedSearch === "" ? (
              <CommandEmpty>Start typing to search.</CommandEmpty>
            ) : searchLoading ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : searchErrored ? (
              <CommandEmpty>Search failed. Try again.</CommandEmpty>
            ) : searchHits.length === 0 ? (
              <CommandEmpty>No results for &quot;{trimmedSearch}&quot;.</CommandEmpty>
            ) : (
              <CommandGroup heading={searchGroupLabel}>
                {searchHits.map((hit) => {
                  const Icon = hit.icon;
                  return (
                    <CommandItem
                      key={hit.key}
                      value={hit.key}
                      onSelect={() => {
                        closeSearch();
                        router.push(hit.href);
                      }}
                    >
                      <Icon className="size-4" strokeWidth={1.5} />
                      <span>{hit.label}</span>
                      {hit.sub && <CommandShortcut>{hit.sub}</CommandShortcut>}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
