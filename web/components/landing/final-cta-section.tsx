"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_HOME } from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";

export function FinalCtaSection() {
  // Same session hook the header/hero use (lib/use-current-user.ts) — an already
  // signed-in visitor gets sent back to their own dashboard instead of "Start
  // assessment," which would just re-run the signup flow they've already completed.
  const { role, isPending } = useCurrentUser();

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {/* primary-container (not primary) — a fixed dark navy accent band in both
          themes, unlike `primary` which inverts per theme (docs/DESIGN.md). */}
      <div className="bg-primary-container text-on-primary-container relative overflow-hidden rounded-[3rem] p-16 text-center">
        {/* Local depth texture only — not the global .aurora (layout.tsx), scoped to
            this one high-impact CTA band, static (no WebGL/animation), matches
            wireframe's locally-layered shader wash at equivalent low opacity. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(circle at 20% 20%, var(--tertiary), transparent 55%), radial-gradient(circle at 80% 80%, var(--secondary), transparent 55%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-2xl">
          <h2 className="font-heading mb-6 text-3xl leading-tight font-bold lg:text-5xl">
            Begin your skin&apos;s digital transformation.
          </h2>
          <p className="mb-10 font-sans text-lg opacity-80">
            AI-powered skin analysis, weighted scoring, and a routine built around your
            own data.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            {isPending ? (
              <Skeleton className="h-14 w-44 rounded-full bg-on-primary-container/20" />
            ) : role ? (
              <Button
                size="lg"
                className="h-auto bg-white px-10 py-4 text-base text-black shadow-xl transition-transform hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
                nativeButton={false}
                render={<Link href={ROLE_HOME[role]}>Go to Dashboard</Link>}
              />
            ) : (
              <Button
                size="lg"
                className="h-auto bg-white px-10 py-4 text-base text-black shadow-xl transition-transform hover:scale-[1.02] hover:bg-white/90 active:scale-[0.98]"
                nativeButton={false}
                render={<Link href="/signup">Start assessment</Link>}
              />
            )}
            <Button
              size="lg"
              variant="outline"
              className="border-on-primary-container/20 hover:bg-on-primary-container/10 h-auto bg-transparent px-10 py-4 text-base text-on-primary-container"
              nativeButton={false}
              render={<Link href="#pricing">View pricing</Link>}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
