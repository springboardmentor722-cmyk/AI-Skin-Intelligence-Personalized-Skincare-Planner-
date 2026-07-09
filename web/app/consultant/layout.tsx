"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { authClient } from "@/lib/auth-client";

// Milestone 1 foundation expansion (Branch 4): this was a hardcoded-role, hardcoded-
// name smoke test — the first real per-role session gate in the app. A "user" (never
// applied) or any other role has no business under /consultant/*; redirected to their
// own dashboard rather than shown someone else's chrome. RBAC enforcement on the data
// itself still happens on the backend (require_role/require_verified_professional,
// core/security.py) — this is a UX guard, not the security boundary.
export default function ConsultantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "consultant") {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if (isPending || !session || session.user.role !== "consultant") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-on-surface-variant size-6 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <AppShell role="consultant" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
