"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { authClient } from "@/lib/auth-client";
import { ROLE_HOME, type Role } from "@/lib/nav-config";

// Same real per-role session gate as app/{consultant,dermatologist,admin}/layout.tsx
// (Branch 4's pattern) — this route group was the one left behind: it predated Better
// Auth session wiring entirely (hardcoded "Alex Rivera", no role check at all), so any
// non-"user" session landing on /dashboard — which login's default post-sign-in
// redirect and every other layout's mismatched-role fallback all pointed at — rendered
// as a plain user instead of being sent home. That's why an admin account saw "complete
// your skin profile."
export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "user") {
      router.replace(ROLE_HOME[session.user.role as Role] ?? "/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session || session.user.role !== "user") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-on-surface-variant size-6 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <AppShell role="user" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
