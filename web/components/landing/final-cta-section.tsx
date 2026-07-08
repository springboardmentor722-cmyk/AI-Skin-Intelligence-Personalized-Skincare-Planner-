import Link from "next/link";

import { Button } from "@/components/ui/button";

export function FinalCtaSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      {/* primary-container (not primary) — a fixed dark navy accent band in both
          themes, unlike `primary` which inverts per theme (docs/DESIGN.md). */}
      <div className="bg-primary-container text-on-primary-container rounded-[3rem] p-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-heading mb-6 text-3xl leading-tight font-bold lg:text-5xl">
            Begin your skin&apos;s digital transformation.
          </h2>
          <p className="mb-10 font-sans text-lg opacity-80">
            Join 12,000+ users who have optimized their skin health with clinical-grade
            intelligence.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="h-auto bg-white px-10 py-4 text-base text-black hover:bg-white/90"
              nativeButton={false}
              render={<Link href="/signup">Start assessment</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="h-auto border-white/20 bg-transparent px-10 py-4 text-base text-white hover:bg-white/10"
              nativeButton={false}
              render={<Link href="#pricing">View pricing</Link>}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
