"use client";

import { authClient } from "@/lib/auth-client";
import type { Role } from "@/lib/nav-config";

export interface CurrentUser {
  name: string;
  email: string | null;
  image: string | null;
  initials: string;
  // Added for LandingNavbar (the public "/" page has no parent role-layout to hand
  // `role` down as a prop the way every authenticated shell does) — additive, existing
  // callers (GlassTopbar, NavUser) that only destructure name/email/image/initials are
  // unaffected.
  role: Role | null;
  isPending: boolean;
}

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Real Better Auth session (web/lib/auth-client.ts) — falls back to the stub name each
// role layout still passes (app/(user)/layout.tsx etc.) while the session is loading or
// genuinely absent, rather than rendering blank. `fallbackName` is optional (defaults to
// "") for callers with no sensible fallback at all — an anonymous landing-page visitor
// has no name to fall back to; that's the "not signed in" branch, not a blank-name one.
// Shared by GlassTopbar's account menu, the sidebar's NavUser footer, and
// LandingNavbar's authenticated header so all three always agree.
export function useCurrentUser(fallbackName = ""): CurrentUser {
  const { data, isPending } = authClient.useSession();
  const name = data?.user.name ?? fallbackName;
  return {
    name,
    email: data?.user.email ?? null,
    image: data?.user.image ?? null,
    initials: initialsOf(name),
    role: (data?.user.role as Role | undefined) ?? null,
    isPending,
  };
}
