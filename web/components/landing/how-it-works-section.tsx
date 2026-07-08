import { FlaskConical, Microscope, TrendingUp } from "lucide-react";

const STEPS = [
  {
    icon: Microscope,
    title: "1. Assess",
    body: "Our AI scans your skin using high-resolution computer vision and correlates it with 50+ lifestyle data points.",
  },
  {
    icon: FlaskConical,
    title: "2. AI routine",
    body: "Receive a custom regimen matched perfectly to your skin score and environmental exposure.",
  },
  {
    icon: TrendingUp,
    title: "3. Track",
    body: "Monitor changes in real time. Adjust your routine as your skin evolves with the seasons.",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <h2 className="font-heading text-on-surface mb-4 text-3xl font-bold">
          Precision path to clarity.
        </h2>
        <p className="text-on-surface-variant mx-auto max-w-2xl font-sans">
          Science-driven diagnostics meets daily care. Three steps to your healthiest skin ever.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="border-border bg-card rounded-3xl border p-8 shadow-sm transition-transform duration-300 hover:-translate-y-2"
          >
            <div className="bg-muted text-on-surface mb-6 flex size-12 items-center justify-center rounded-xl">
              <step.icon className="size-6" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-on-surface mb-3 text-xl font-semibold">
              {step.title}
            </h3>
            <p className="text-on-surface-variant font-sans">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
