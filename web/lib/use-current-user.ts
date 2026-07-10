"use client";

import { useSyncExternalStore } from "react";

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
// Shared by GlassTopbar's account menu, the sidebar's NavUser footer, and the landing
// page's header/hero/final-CTA so all consumers always agree.
export function useCurrentUser(fallbackName = ""): CurrentUser {
  const { data, isPending } = authClient.useSession();
  // "/" (and every other page this hook is used on) is statically prerendered —
  // frozen forever at build time with isPending permanently `true` (no real request
  // context exists at build time to ever resolve it). A real browser's very first
  // client render can, depending on exactly when useSession's underlying store
  // resolves relative to React's hydration pass, already see a *different*
  // (resolved) value on that first render — a genuine, if narrow, hydration-mismatch
  // race (found live: multiple independent session-reading components mounting
  // together with no outer loading gate, unlike every authenticated role layout,
  // which already gates its whole subtree on its own isPending check before ever
  // rendering a GlassTopbar/NavUser). `useSyncExternalStore`'s server-snapshot
  // argument is the primitive React ships specifically for "must render the frozen
  // build-time value on the very first client pass" — it forces that first render to
  // match the static build (loading state) regardless of how fast the real session
  // resolves, only reporting `true` once React itself confirms hydration is done and
  // re-renders, with no manual effect/setState cascade required.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const resolvedData = mounted ? data : undefined;
  const name = resolvedData?.user.name ?? fallbackName;
  return {
    name,
    email: resolvedData?.user.email ?? null,
    image: resolvedData?.user.image ?? null,
    initials: initialsOf(name),
    role: (resolvedData?.user.role as Role | undefined) ?? null,
    isPending: !mounted || isPending,
  };
}
