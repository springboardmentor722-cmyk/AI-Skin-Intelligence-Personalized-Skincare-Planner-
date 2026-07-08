import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-16 text-center">
        <h2 className="font-heading text-on-surface text-3xl font-bold">Transparent by design.</h2>
      </div>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        <div className="border-border bg-card flex flex-col rounded-[2.5rem] border p-10">
          <h3 className="font-heading text-on-surface mb-2 text-xl font-semibold">Standard</h3>
          <p className="text-on-surface-variant mb-6 font-sans">
            Core diagnostic features for everyone.
          </p>
          <div className="mb-8">
            <span className="font-geist text-on-surface text-5xl font-semibold">₹0</span>
            <span className="text-on-surface-variant font-sans"> /month</span>
          </div>
          <ul className="mb-10 flex-1 space-y-4">
            {["Weekly skin scan", "Basic routine builder", "Ingredient scanner"].map((item) => (
              <li key={item} className="flex items-center gap-3 font-sans">
                <CheckCircle2 className="text-secondary size-5" strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="lg" className="h-auto py-4">
            Start free
          </Button>
        </div>
        {/* primary-container (not primary) — fixed dark navy in both themes,
            unlike `primary` which inverts per theme (docs/DESIGN.md). */}
        <div className="bg-primary-container text-on-primary-container relative flex flex-col overflow-hidden rounded-[2.5rem] p-10 shadow-2xl">
          <div className="bg-secondary text-secondary-foreground font-geist absolute top-6 right-6 rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.05em] uppercase">
            Popular
          </div>
          <h3 className="font-heading mb-2 text-xl font-semibold">Intelligence Pro</h3>
          <p className="text-on-primary-container/60 mb-6 font-sans">
            Full biometric tracking &amp; clinical support.
          </p>
          <div className="mb-8">
            <span className="font-geist text-5xl font-semibold">₹499</span>
            <span className="text-on-primary-container/60 font-sans"> /month</span>
          </div>
          <ul className="mb-10 flex-1 space-y-4">
            {[
              "Daily AI monitoring",
              "Environmental UV/pollution sync",
              "Dermatologist chat access",
              "Early access to new features",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 font-sans">
                <CheckCircle2 className="text-secondary size-5" strokeWidth={1.5} />
                {item}
              </li>
            ))}
          </ul>
          <Button size="lg" className="h-auto bg-white py-4 text-black hover:bg-white/90">
            Get Pro now
          </Button>
        </div>
      </div>
    </section>
  );
}
