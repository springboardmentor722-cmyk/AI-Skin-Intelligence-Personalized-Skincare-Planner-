import {
  ScanFace,
  CalendarClock,
  Database,
  BadgeCheck,
  Activity,
  AlarmClock,
  ArrowUpRight,
} from "lucide-react";

const FEATURES = [
  {
    icon: ScanFace,
    title: "AI Skin Assessment",
    body: "Deep-learning analysis of pores, texture, and pigmentation at high resolution.",
  },
  {
    icon: CalendarClock,
    title: "Personalized Routines",
    body: "Dynamic daily schedules that adapt to your wake-up time and local UV levels.",
  },
  {
    icon: Database,
    title: "Ingredient Intelligence",
    body: "Cross-referencing thousands of cosmetic ingredients for allergens and efficacy.",
  },
  {
    icon: BadgeCheck,
    title: "Product Match Scoring",
    body: "Know exactly how a specific product will react with your skin before buying.",
  },
  {
    icon: Activity,
    title: "Progress Tracking",
    body: "Visual time-lapses and data overlays showing your journey to optimal skin health.",
  },
  {
    icon: AlarmClock,
    title: "Smart Reminders",
    body: "Intelligent notifications for hydration, sunscreen, and step-by-step routine guidance.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="glass group cursor-pointer rounded-3xl p-8 transition-colors hover:bg-card"
          >
            <div className="mb-6 flex items-start justify-between">
              <feature.icon className="text-secondary size-8" strokeWidth={1.5} />
              <ArrowUpRight className="text-on-surface/20 group-hover:text-on-surface size-5 transition-colors" strokeWidth={1.5} />
            </div>
            <h3 className="font-heading text-on-surface mb-2 text-lg font-bold">
              {feature.title}
            </h3>
            <p className="text-on-surface-variant font-sans text-sm">{feature.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
