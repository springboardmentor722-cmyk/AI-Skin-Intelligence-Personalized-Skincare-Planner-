"use client";

import Link from "next/link";
import Image from "next/image";
import { Sparkles, Droplet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkinScoreRing } from "@/components/skin-score-ring";
import { ROLE_HOME } from "@/lib/nav-config";
import { useCurrentUser } from "@/lib/use-current-user";

// Placeholder photography carried over from the approved Stitch wireframe
// (web/designs/wireframes/landing-page.html) — not licensed production imagery;
// swapping in real photography is a content task, not a coding one.
const TRUST_AVATARS = [
  { src: "/images/landing/img_000_9dd255b7.jpg", alt: "Skinlytics user with clear, radiant skin" },
  { src: "/images/landing/img_001_27e8a2ed.jpg", alt: "Skinlytics user with healthy skin texture" },
  { src: "/images/landing/img_002_7ea95f17.jpg", alt: "Skinlytics user with glowing, hydrated skin" },
];

export function HeroSection() {
  // Same session hook the header uses (lib/use-current-user.ts) — an already
  // signed-in visitor scrolling past the (now session-aware) header shouldn't hit
  // "Get started free" a moment later; it's sent to their own dashboard instead.
  const { role, isPending } = useCurrentUser();

  return (
    <section className="mx-auto max-w-7xl px-6 pt-40 pb-16">
      <div className="glass flex flex-col items-center gap-16 overflow-hidden rounded-[2rem] p-10 lg:flex-row lg:p-16">
        <div className="z-10 w-full flex flex-col gap-8 lg:w-3/5">
          <div className="bg-secondary/10 border-secondary/20 text-secondary inline-flex items-center gap-2 rounded-full border px-4 py-1.5">
            <Sparkles className="size-4" strokeWidth={1.5} />
            <span className="font-geist text-xs font-semibold tracking-[0.05em] uppercase">
              Clinical Grade AI
            </span>
          </div>
          <h1 className="font-heading text-on-surface text-[40px] leading-[1.1] font-bold tracking-tight lg:text-[56px]">
            Skincare intelligence, personalized to your skin.
          </h1>
          <p className="text-on-surface-variant font-sans text-lg leading-relaxed">
            Skinlytics analyzes your unique skin biology, lifestyle habits, sleep quality, and
            environmental stressors to build your optimal regimen.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            {isPending ? (
              <Skeleton className="h-14 w-44 rounded-full" />
            ) : role ? (
              <Button
                size="lg"
                className="h-auto px-8 py-4 text-base"
                nativeButton={false}
                render={<Link href={ROLE_HOME[role]}>Go to Dashboard</Link>}
              />
            ) : (
              <Button
                size="lg"
                className="h-auto px-8 py-4 text-base"
                nativeButton={false}
                render={<Link href="/signup">Get started free</Link>}
              />
            )}
            <Button
              size="lg"
              variant="outline"
              className="h-auto px-8 py-4 text-base"
              nativeButton={false}
              render={<Link href="#how-it-works">See how it works</Link>}
            />
          </div>
          <div className="border-on-surface/8 flex flex-col gap-3 border-t pt-8">
            <p className="text-on-surface-variant font-geist text-xs font-semibold tracking-[0.05em] uppercase">
              Trust platform
            </p>
            <div className="text-on-surface flex items-center gap-4">
              <div className="flex -space-x-2">
                {TRUST_AVATARS.map((avatar) => (
                  <div
                    key={avatar.src}
                    className="border-background relative size-8 overflow-hidden rounded-full border-2"
                  >
                    <Image src={avatar.src} alt={avatar.alt} fill sizes="32px" className="object-cover" />
                  </div>
                ))}
              </div>
              <span className="font-sans text-sm font-medium">
                12,000+ skin profiles analyzed ·{" "}
                <span className="text-secondary">Dermatologist-informed</span>
              </span>
            </div>
          </div>
        </div>
        <div className="relative flex w-full justify-center lg:w-2/5">
          <div className="relative flex h-80 w-80 items-center justify-center">
            <SkinScoreRing score={82} size={256} />
            <div className="border-on-surface/8 bg-card absolute -top-4 -right-4 flex size-20 flex-col items-center justify-center gap-1 rounded-2xl border p-3 shadow-xl">
              <Droplet className="text-secondary size-5" strokeWidth={1.5} />
              <span className="font-geist text-on-surface-variant text-[10px] font-semibold tracking-[0.05em] uppercase">
                Hydration
              </span>
            </div>
            <div className="glass-strong border-background/20 absolute -bottom-8 -left-4 size-24 overflow-hidden rounded-full border shadow-2xl">
              <Image
                src="/images/landing/img_003_54a62171.jpg"
                alt="Serum droplet, clinical render"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
