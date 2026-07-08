import { Info } from "lucide-react";

// Real Skin Health Score weights (docs/AGENTS.md §4 / docs/AI_ML.md) — not the
// wireframe's invented "Hydration/Texture/Elasticity/Tone/Barrier" figures, which
// don't match the actual scoring engine used everywhere else in the app.
const SCORE_COMPONENTS = [
  { label: "Skin Condition", weight: 35 },
  { label: "Lifestyle Habits", weight: 20 },
  { label: "Routine Consistency", weight: 20 },
  { label: "Sleep Quality", weight: 15 },
  { label: "Hydration", weight: 10 },
];

export function ScoreExplainerBand() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-16">
      <div className="glass flex flex-wrap items-center justify-between gap-8 rounded-full px-8 py-6 sm:px-12">
        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-geist text-xs font-semibold tracking-[0.05em] uppercase">
            Weighted formula
          </span>
          <Info className="text-on-surface/30 size-4" strokeWidth={1.5} />
        </div>
        <div className="flex h-1.5 flex-1 gap-2">
          {SCORE_COMPONENTS.map((component, i) => (
            <div
              key={component.label}
              className="bg-secondary rounded-full"
              style={{ width: `${component.weight}%`, opacity: 1 - i * 0.18 }}
              title={`${component.label}: ${component.weight}%`}
            />
          ))}
        </div>
        <div className="hidden flex-wrap gap-x-6 gap-y-2 lg:flex">
          {SCORE_COMPONENTS.map((component, i) => (
            <div key={component.label} className="flex items-center gap-2">
              <div className="bg-secondary size-2 rounded-full" style={{ opacity: 1 - i * 0.18 }} />
              <span className="font-geist text-on-surface text-[11px] font-semibold">
                {component.weight}% {component.label.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
