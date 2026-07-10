"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { authClient } from "@/lib/auth-client";
import { ROLE_HOME, type Role } from "@/lib/nav-config";

// Same real per-role session gate as app/consultant/layout.tsx — see that file's
// comment for the full reasoning. Admin has no onboarding wizard (accounts become
// admin only via another admin's Role Management action, never self-service). A
// mismatched role goes to *its own* home (ROLE_HOME), not a hardcoded "/dashboard" —
// that hardcoding was the bug that made a stray admin/consultant/dermatologist session
// land on the User dashboard (see (user)/layout.tsx's comment).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "admin") {
      router.replace(ROLE_HOME[session.user.role as Role] ?? "/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session || session.user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-on-surface-variant size-6 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <AppShell role="admin" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
