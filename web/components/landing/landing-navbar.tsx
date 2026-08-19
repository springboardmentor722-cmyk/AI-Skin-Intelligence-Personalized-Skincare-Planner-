"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, TrendingUp, UserRound } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeToggle } from "@/components/theme-toggle";
import { authClient } from "@/lib/auth-client";
import { getSettingsHref, ROLE_HOME } from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#professionals", label: "For Professionals" },
  { href: "#pricing", label: "Pricing" },
];

// A real, already-valid session (Better Auth cookie + JWT) means Login/"Start free
// assessment" are actively wrong CTAs — they'd ask a signed-in visitor to authenticate
// again. useCurrentUser (lib/use-current-user.ts) is the same session hook
// GlassTopbar's and NavUser's account menus already use, extended (not duplicated)
// with `role`/`isPending` — this page has no parent role-layout to hand `role` down as
// a prop the way every authenticated shell does, so it reads the session directly.
export function LandingNavbar() {
  const router = useRouter();
  const { name, email, image, initials, role, isPending } = useCurrentUser();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
  };

  const settingsHref = role
    ? getSettingsHref(role)
    : undefined;

  return (
    <header className="glass fixed top-0 z-50 w-full rounded-none border-x-0 border-t-0">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-10">
          <Link href="/" className="font-heading text-on-surface text-xl font-bold">
            Skinlytics
          </Link>
          {/* lg not md: measured via Playwright at 768px (the exact `md` breakpoint,
              also this task's tablet-check width) — all four links plus the logo and
              right-side controls don't fit on one line at 768px, so "How it works" and
              "For Professionals" wrap to 2-3 lines. Nav overflow-hidden clips it silently
              (no page-level scrollbar), so it reads as fine until you actually look. */}
          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-on-surface-variant hover:text-on-surface font-sans text-sm transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isPending ? (
            // Session restore in flight (cookie round trip on a hard refresh/new tab —
            // Better Auth's client shares state across same-app client-side
            // navigations, so this almost never shows on an in-app Link click). A
            // neutral skeleton, never a guess at either Login or an avatar, so there's
            // no flash/flip between the two once it resolves.
            <Skeleton className="ml-2 size-9 rounded-full" />
          ) : role ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="hover:bg-muted flex items-center gap-2 rounded-full py-1 pr-3 pl-1 transition-colors"
                  >
                    <Avatar className="size-8">
                      {image && <AvatarImage src={image} alt={name} />}
                      <AvatarFallback className="font-geist text-xs">{initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-on-surface hidden font-sans text-sm font-medium sm:inline">
                      {name}
                    </span>
                  </button>
                }
              />
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-on-surface font-sans text-sm font-medium">{name}</span>
                      {email && (
                        <span className="font-geist text-on-surface-variant text-xs">{email}</span>
                      )}
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={ROLE_HOME[role]} />}>
                  <LayoutDashboard className="size-4" strokeWidth={1.5} />
                  Dashboard
                </DropdownMenuItem>
                {/* Skin Profile/Progress Tracking are User-role concepts only — a
                    Consultant/Dermatologist/Admin session gets Dashboard + Settings
                    here, matching what their own sidebar actually offers, not links
                    to pages their role can't reach. Skin Profile also finally gives
                    /profile a real entry point (PROGRESS.md's Pending: it's existed
                    since Milestone 1 with no nav path to it beyond the post-signup
                    redirect). */}
                {role === "user" && (
                  <>
                    <DropdownMenuItem render={<Link href="/profile" />}>
                      <UserRound className="size-4" strokeWidth={1.5} />
                      Skin Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem render={<Link href="/progress" />}>
                      <TrendingUp className="size-4" strokeWidth={1.5} />
                      Progress Tracking
                    </DropdownMenuItem>
                  </>
                )}
                {settingsHref && (
                  <DropdownMenuItem render={<Link href={settingsHref} />}>
                    <Settings className="size-4" strokeWidth={1.5} />
                    Settings
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
                  <LogOut className="size-4" strokeWidth={1.5} />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              {/* Hidden below sm: the ghost Login button plus the full-width primary
                  CTA overflow the 375px viewport (measured via Playwright — the CTA's
                  right edge landed 31px past the screen edge with no page-level
                  scrollbar to reveal it, since the header is `fixed`). Login stays
                  reachable via the signup page's own link at that width; nav feature
                  links already accept the same "hidden below a breakpoint, no mobile
                  menu" trade-off (`hidden ... lg:flex` above). */}
              <Button
                variant="ghost"
                nativeButton={false}
                className="hidden sm:inline-flex"
                render={<Link href="/login">Login</Link>}
              />
              <Button
                nativeButton={false}
                render={<Link href="/signup">Start free assessment</Link>}
              />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
