"use client";

import { authClient } from "@/lib/auth-client";

export interface CurrentUser {
  name: string;
  email: string | null;
  image: string | null;
  initials: string;
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
// genuinely absent, rather than rendering blank. Shared by GlassTopbar's account menu
// and the sidebar's NavUser footer so both always agree.
export function useCurrentUser(fallbackName: string): CurrentUser {
  const { data } = authClient.useSession();
  const name = data?.user.name ?? fallbackName;
  return {
    name,
    email: data?.user.email ?? null,
    image: data?.user.image ?? null,
    initials: initialsOf(name),
  };
}
