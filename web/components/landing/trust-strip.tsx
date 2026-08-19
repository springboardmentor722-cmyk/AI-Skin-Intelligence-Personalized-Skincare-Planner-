import { Activity, Database, ShieldCheck, Target } from "lucide-react";

// Replaces fabricated Sarah Chen / Marcus Reed testimonials (removed per
// docs/superpowers/specs/2026-08-19-landing-page-redesign-design.md §5) with
// capability statements already claimed elsewhere on this page — nothing here is a
// new claim: dimensions match score-explainer-band.tsx, the data-point count matches
// how-it-works-section.tsx, product scoring matches features-grid.tsx, and the
// advisory framing matches faq-section.tsx.
const PROOF_POINTS = [
  {
    icon: Target,
    title: "Skin Score weighted across 5 clinical dimensions",
    body: "Skin condition, lifestyle, routine adherence, sleep quality, and hydration — not a single guess.",
  },
  {
    icon: Activity,
    title: "50+ lifestyle and environmental data points",
    body: "Correlates your skin scan with sleep, hydration, UV exposure, and daily habits.",
  },
  {
    icon: Database,
    title: "Ingredient-level product match scoring",
    body: "Cross-references your profile against ingredient interactions before you buy.",
  },
  {
    icon: ShieldCheck,
    title: "Advisory AI, never a diagnosis",
    body: "Every result carries a confidence score. Skinlytics complements, never replaces, professional care.",
  },
];

export function TrustStrip() {
  return (
    // primary-container (not primary) — a fixed dark navy accent band in both themes,
    // unlike `primary` which inverts per theme (docs/DESIGN.md's colors-dark tokens).
    <section className="bg-primary-container text-on-primary-container py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="font-heading mb-12 text-3xl font-bold">Real skin. Real data.</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PROOF_POINTS.map((point) => (
            <div
              key={point.title}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-8"
            >
              <point.icon className="text-secondary mb-6 size-8" strokeWidth={1.5} />
              <h3 className="mb-2 font-sans text-lg leading-snug font-bold">{point.title}</h3>
              <p className="text-on-primary-container/60 font-sans text-sm">{point.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
