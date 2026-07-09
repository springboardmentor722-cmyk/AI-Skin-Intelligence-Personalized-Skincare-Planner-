"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AppShell } from "@/components/app-shell/app-shell";
import { authClient } from "@/lib/auth-client";

// Same real per-role session gate as app/consultant/layout.tsx — see that file's
// comment for the full reasoning.
export default function DermatologistLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.user.role !== "dermatologist") {
      router.replace("/dashboard");
    }
  }, [isPending, session, router]);

  if (isPending || !session || session.user.role !== "dermatologist") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-on-surface-variant size-6 animate-spin" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <AppShell role="dermatologist" userName={session.user.name}>
      {children}
    </AppShell>
  );
}
