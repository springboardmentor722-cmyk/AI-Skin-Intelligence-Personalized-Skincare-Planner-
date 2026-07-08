import { Button } from "@/components/ui/button";

// Scaffold smoke-test only — not a designed screen. Real screens are built
// screen-by-screen against web/designs/wireframes/ + docs/WIREFRAMES.md
// (see PROGRESS.md). This page exists to prove the token system renders.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-24">
      <div className="glass flex max-w-xl flex-col items-center gap-3 px-10 py-12 text-center">
        <span className="font-geist text-on-tertiary-container text-xs font-semibold tracking-[0.05em] uppercase">
          Frontend scaffold
        </span>
        <h1 className="font-heading text-on-surface text-4xl font-bold">
          Skinlytics
        </h1>
        <p className="text-on-surface-variant font-sans text-base">
          AI Skin Intelligence &amp; Personalized Skincare Planner — design
          tokens, glass, and typography wired from docs/DESIGN.md.
        </p>
      </div>

      <div className="border-border bg-card flex w-full max-w-xl flex-col gap-4 rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-card-foreground text-lg font-semibold">
            Skin Health Score
          </h2>
          <span className="font-geist bg-tertiary-container text-on-tertiary-container rounded-full px-2.5 py-0.5 text-xs font-semibold">
            Confidence 92%
          </span>
        </div>
        <p className="font-geist text-score-teal text-5xl font-semibold tabular-nums">
          82
        </p>
        <p className="text-muted-foreground font-sans text-sm">
          Stub value — Skin Health Scoring service lands M2 (ADR-007).
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Button>Primary action</Button>
          <Button variant="secondary">AI action</Button>
          <Button variant="outline">Secondary action</Button>
        </div>
      </div>
    </div>
  );
}
